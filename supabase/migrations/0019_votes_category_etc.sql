-- 투표 카테고리에 'etc' (기타) 추가.

alter table public.votes drop constraint if exists votes_category_check;
alter table public.votes
  add constraint votes_category_check check (category in ('riding', 'mt', 'etc'));
