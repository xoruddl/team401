-- 'pending' (준회원) role 추가.
-- 신규 가입 default는 'member' 유지. 운영자가 회원을 'pending'으로 강등 가능.
-- pending은 모든 활동 INSERT/UPDATE/DELETE 차단.

-- ============================================================================
-- 1. role CHECK 확장
-- ============================================================================
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('master', 'admin', 'member', 'pending'));

-- ============================================================================
-- 2. is_active_member 헬퍼 (master / admin / member 만 활동 가능)
-- ============================================================================
create or replace function public.is_active_member(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('master', 'admin', 'member')
  );
$$;

grant execute on function public.is_active_member(uuid) to authenticated;

-- ============================================================================
-- 3. season_entries policies — pending 차단
-- ============================================================================
drop policy if exists season_insert on public.season_entries;
create policy season_insert on public.season_entries
  for insert
  with check (auth.uid() = user_id and public.is_active_member(auth.uid()));

drop policy if exists season_update on public.season_entries;
create policy season_update on public.season_entries
  for update
  using (auth.uid() = user_id and public.is_active_member(auth.uid()));

drop policy if exists season_delete on public.season_entries;
create policy season_delete on public.season_entries
  for delete
  using (auth.uid() = user_id and public.is_active_member(auth.uid()));

-- ============================================================================
-- 4. vote_entries policies — pending 차단 (admin은 다른 사람 entry 삭제 가능 유지)
-- ============================================================================
drop policy if exists vote_entries_insert on public.vote_entries;
create policy vote_entries_insert on public.vote_entries
  for insert
  with check (auth.uid() = user_id and public.is_active_member(auth.uid()));

drop policy if exists vote_entries_delete on public.vote_entries;
create policy vote_entries_delete on public.vote_entries
  for delete to authenticated
  using (
    (auth.uid() = user_id and public.is_active_member(auth.uid()))
    or public.is_admin(auth.uid())
  );

-- ============================================================================
-- 5. posts policies — pending 차단 (admin은 삭제 가능 유지)
-- ============================================================================
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts
  for insert to authenticated
  with check (auth.uid() = author_id and public.is_active_member(auth.uid()));

drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts
  for update to authenticated
  using (auth.uid() = author_id and public.is_active_member(auth.uid()))
  with check (auth.uid() = author_id and public.is_active_member(auth.uid()));

drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts
  for delete to authenticated
  using (
    (auth.uid() = author_id and public.is_active_member(auth.uid()))
    or public.is_admin(auth.uid())
  );

-- ============================================================================
-- 6. skateboard_rentals policies — pending 차단
-- ============================================================================
drop policy if exists skateboard_rentals_insert on public.skateboard_rentals;
create policy skateboard_rentals_insert on public.skateboard_rentals
  for insert to authenticated
  with check (auth.uid() = user_id and public.is_active_member(auth.uid()));

drop policy if exists skateboard_rentals_update on public.skateboard_rentals;
create policy skateboard_rentals_update on public.skateboard_rentals
  for update to authenticated
  using (
    (auth.uid() = user_id and public.is_active_member(auth.uid()))
    or public.is_admin(auth.uid())
  )
  with check (
    (auth.uid() = user_id and public.is_active_member(auth.uid()))
    or public.is_admin(auth.uid())
  );

-- ============================================================================
-- 7. RPC 가드 추가
-- ============================================================================

-- join_vote: pending 차단
create or replace function public.join_vote(p_vote_id uuid)
returns public.vote_entries
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_queue_number int;
  v_capacity int;
  v_status text;
  v_entry public.vote_entries;
begin
  if not public.is_active_member(auth.uid()) then
    raise exception 'not an active member';
  end if;

  select capacity into v_capacity
  from public.votes
  where id = p_vote_id
    and opens_at <= now()
    and (closes_at is null or closes_at > now())
  for update;

  if not found then
    raise exception 'Vote is not open';
  end if;

  select coalesce(max(queue_number), 0) + 1 into v_queue_number
  from public.vote_entries where vote_id = p_vote_id;

  v_status := case when v_queue_number <= v_capacity then 'confirmed' else 'waiting' end;

  insert into public.vote_entries (vote_id, user_id, queue_number, status)
  values (p_vote_id, auth.uid(), v_queue_number, v_status)
  returning * into v_entry;

  return v_entry;
end;
$$;

-- upsert_season_entry: pending 차단
create or replace function public.upsert_season_entry(
  p_entry_id uuid,
  p_in_date date,
  p_out_date date
)
returns public.season_entries
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid := auth.uid();
  v_merged_in date;
  v_merged_out date;
  v_result public.season_entries;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if not public.is_active_member(v_user_id) then
    raise exception 'not an active member';
  end if;

  if p_in_date > p_out_date then
    raise exception 'in_date must be <= out_date';
  end if;

  if p_entry_id is not null then
    perform 1 from public.season_entries
      where id = p_entry_id and user_id = v_user_id;
    if not found then
      raise exception 'entry not found or not owned';
    end if;
  end if;

  perform 1 from public.season_entries
    where user_id = v_user_id
      and (p_entry_id is null or id <> p_entry_id)
      and in_date <= p_out_date
      and out_date >= p_in_date
    for update;

  select
    least(coalesce(min(in_date), p_in_date), p_in_date),
    greatest(coalesce(max(out_date), p_out_date), p_out_date)
  into v_merged_in, v_merged_out
  from public.season_entries
  where user_id = v_user_id
    and (p_entry_id is null or id <> p_entry_id)
    and in_date <= p_out_date
    and out_date >= p_in_date;

  delete from public.season_entries
  where user_id = v_user_id
    and (p_entry_id is null or id <> p_entry_id)
    and in_date <= p_out_date
    and out_date >= p_in_date;

  if p_entry_id is not null then
    delete from public.season_entries
    where id = p_entry_id and user_id = v_user_id;
  end if;

  insert into public.season_entries (user_id, in_date, out_date)
  values (v_user_id, v_merged_in, v_merged_out)
  returning * into v_result;

  return v_result;
end;
$$;

-- set_own_board: pending 차단
create or replace function public.set_own_board(
  p_entry_id uuid,
  p_uses_own_board boolean
)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if not public.is_active_member(auth.uid()) then
    raise exception 'not an active member';
  end if;

  update public.vote_entries
  set uses_own_board = p_uses_own_board
  where id = p_entry_id and user_id = auth.uid();
  if not found then
    raise exception 'entry not found or not owned';
  end if;
end;
$$;
