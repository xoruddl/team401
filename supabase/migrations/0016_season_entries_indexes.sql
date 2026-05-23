-- season_entries 쿼리 가속용 인덱스.
-- 회원 수 × 시즌별 일정 늘면 풀스캔 비용이 빠르게 증가하므로 미리 추가.

-- fetchMyEntries: WHERE user_id = X ORDER BY in_date
create index if not exists season_entries_user_in_date_idx
  on public.season_entries (user_id, in_date);

-- fetchEntriesOnDate: WHERE in_date <= X AND out_date >= X
-- 단일 컬럼 인덱스 두 개 → PG가 선택성 좋은 쪽으로 스캔
create index if not exists season_entries_in_date_idx
  on public.season_entries (in_date);

create index if not exists season_entries_out_date_idx
  on public.season_entries (out_date);
