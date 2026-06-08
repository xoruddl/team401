-- season_entries 과거 날짜 제한 해제.
-- 0022 에서 추가된 in_date >= today_kst() 조건을 RLS 및 RPC 에서 제거.
-- 일반 회원도 과거 날짜로 일정 등록/수정/삭제 가능.

-- ============================================================================
-- 1. RLS 정책 — in_date 날짜 제한 제거
-- ============================================================================
drop policy if exists season_insert on public.season_entries;
create policy season_insert on public.season_entries
  for insert
  with check (
    public.is_master(auth.uid())
    or (auth.uid() = user_id and public.is_active_member(auth.uid()))
  );

drop policy if exists season_update on public.season_entries;
create policy season_update on public.season_entries
  for update
  using (
    public.is_master(auth.uid())
    or (auth.uid() = user_id and public.is_active_member(auth.uid()))
  )
  with check (
    public.is_master(auth.uid())
    or (auth.uid() = user_id and public.is_active_member(auth.uid()))
  );

drop policy if exists season_delete on public.season_entries;
create policy season_delete on public.season_entries
  for delete
  using (
    public.is_master(auth.uid())
    or (auth.uid() = user_id and public.is_active_member(auth.uid()))
  );

-- ============================================================================
-- 2. upsert_season_entry — 과거 날짜 가드 제거
-- ============================================================================
create or replace function public.upsert_season_entry(
  p_entry_id uuid,
  p_in_date date,
  p_out_date date,
  p_target_user_id uuid default null
)
returns public.season_entries
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_caller_id uuid := auth.uid();
  v_is_master boolean := public.is_master(v_caller_id);
  v_user_id uuid := coalesce(p_target_user_id, v_caller_id);
  v_merged_in date;
  v_merged_out date;
  v_result public.season_entries;
begin
  if v_caller_id is null then
    raise exception 'not authenticated';
  end if;

  if not v_is_master and v_user_id <> v_caller_id then
    raise exception 'not authorized';
  end if;

  if not v_is_master and not public.is_active_member(v_caller_id) then
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
