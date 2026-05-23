-- 투표 확장:
-- (1) vote_entries.uses_own_board: 참여자가 개인보드 사용 여부 토글
-- (2) votes.capacity 변경 시 모든 entries status 자동 재계산
--     (운영자가 정원 늘리면 대기 → 확정 자동 승격, 줄이면 확정 → 대기 강등)

-- ============================================================================
-- 1. uses_own_board 컬럼
-- ============================================================================
alter table public.vote_entries
  add column if not exists uses_own_board boolean not null default false;

-- ============================================================================
-- 2. capacity 변경 시 status 재계산 트리거
-- ============================================================================
create or replace function public.recompute_vote_statuses()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if old.capacity is not distinct from new.capacity then
    return new;
  end if;

  update public.vote_entries
  set status = case when queue_number <= new.capacity then 'confirmed' else 'waiting' end
  where vote_id = new.id
    and status is distinct from
        (case when queue_number <= new.capacity then 'confirmed' else 'waiting' end);

  return new;
end;
$$;

drop trigger if exists votes_recompute_statuses on public.votes;
create trigger votes_recompute_statuses
  after update on public.votes
  for each row execute function public.recompute_vote_statuses();

-- ============================================================================
-- 3. uses_own_board 토글 RPC (본인 entry만)
-- vote_entries에는 일반 UPDATE policy를 만들지 않음 → 사용자가 raw UPDATE로
-- status/queue_number를 직접 못 바꾸도록 차단. 토글은 이 RPC를 통해서만.
-- ============================================================================
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
  update public.vote_entries
  set uses_own_board = p_uses_own_board
  where id = p_entry_id and user_id = auth.uid();
  if not found then
    raise exception 'entry not found or not owned';
  end if;
end;
$$;

grant execute on function public.set_own_board(uuid, boolean) to authenticated;
