-- 공지사항 고정 기능.
-- pinned_order: NULL이면 비고정, 정수면 고정 + 순서 (오름차순으로 표시).
-- 운영자가 임의 고정/해제, 순서 변경 가능.

alter table public.notices
  add column if not exists pinned_order integer;

-- 고정 공지만 빠르게 조회하기 위한 부분 인덱스
create index if not exists notices_pinned_order_idx
  on public.notices (pinned_order)
  where pinned_order is not null;
