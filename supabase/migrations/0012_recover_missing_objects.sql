-- 원격 DB에 SQL editor로 직접 만들어졌으나 로컬 마이그레이션에 빠져있던 객체 복원.
-- 모두 idempotent (IF NOT EXISTS / DROP+CREATE) — 원격엔 no-op, 새 환경 셋업용.
--
-- 주의: 이 파일은 0001~0011보다 뒤에 위치하지만, 실제로는 0002가 votes/vote_entries
-- 정책을 잡으려면 이 테이블들이 먼저 존재해야 함. 따라서 신규 환경 부트스트랩을 하려면
-- (a) 0002 이전에 옮기거나 (b) 0001~0011 + 0012를 squash 해야 함. 별도 작업 예정.
-- 현 시점 목적은 "원격 스키마를 git에 기록"하는 것.

-- ============================================================================
-- 1. votes
-- ============================================================================
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  capacity integer not null,
  opens_at timestamptz not null,
  closes_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.votes enable row level security;

drop policy if exists votes_select on public.votes;
create policy votes_select on public.votes
  for select using (true);

drop policy if exists votes_insert on public.votes;
create policy votes_insert on public.votes
  for insert to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists votes_update on public.votes;
create policy votes_update on public.votes
  for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists votes_delete on public.votes;
create policy votes_delete on public.votes
  for delete to authenticated
  using (public.is_admin(auth.uid()));

-- ============================================================================
-- 2. vote_entries
-- ============================================================================
create table if not exists public.vote_entries (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references public.votes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  queue_number integer not null,
  status text not null default 'confirmed',
  created_at timestamptz default now(),
  unique (vote_id, user_id)
);

alter table public.vote_entries enable row level security;

drop policy if exists vote_entries_select on public.vote_entries;
create policy vote_entries_select on public.vote_entries
  for select using (true);

drop policy if exists vote_entries_insert on public.vote_entries;
create policy vote_entries_insert on public.vote_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists vote_entries_delete on public.vote_entries;
create policy vote_entries_delete on public.vote_entries
  for delete to authenticated
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- ============================================================================
-- 3. join_vote RPC: 선착순 큐 번호 배정 (race condition 방지를 위해 FOR UPDATE)
-- ============================================================================
create or replace function public.join_vote(p_vote_id uuid)
returns public.vote_entries
language plpgsql
security definer
as $$
declare
  v_queue_number int;
  v_capacity int;
  v_status text;
  v_entry public.vote_entries;
begin
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

-- ============================================================================
-- 4. season_entries
-- ============================================================================
create table if not exists public.season_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  in_date date not null,
  out_date date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.season_entries enable row level security;

drop policy if exists season_select on public.season_entries;
create policy season_select on public.season_entries
  for select using (true);

drop policy if exists season_insert on public.season_entries;
create policy season_insert on public.season_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists season_update on public.season_entries;
create policy season_update on public.season_entries
  for update using (auth.uid() = user_id);

drop policy if exists season_delete on public.season_entries;
create policy season_delete on public.season_entries
  for delete using (auth.uid() = user_id);
