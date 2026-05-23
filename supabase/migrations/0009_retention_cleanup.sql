-- 게시판/공지사항 90일 보관 후 자동 삭제.
-- pg_cron으로 매일 한 번 실행.

create extension if not exists pg_cron;

create or replace function public.cleanup_old_posts_and_notices()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.posts where created_at < now() - interval '90 days';
  delete from public.notices where created_at < now() - interval '90 days';
end;
$$;

-- 동일 이름의 잡이 있으면 갱신 (재적용 가능). 매일 18:00 UTC = 한국시간 03:00에 실행.
select cron.schedule(
  'cleanup-old-posts-and-notices',
  '0 18 * * *',
  $$select public.cleanup_old_posts_and_notices();$$
);
