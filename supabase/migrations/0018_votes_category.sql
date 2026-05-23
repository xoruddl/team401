-- 투표에 카테고리 추가. 'riding' (라이딩) | 'mt' (엠티/모임).
-- 라이딩일 때만 개인보드 토글 노출.

alter table public.votes
  add column if not exists category text not null default 'riding';

alter table public.votes drop constraint if exists votes_category_check;
alter table public.votes
  add constraint votes_category_check check (category in ('riding', 'mt'));
