-- 공지사항 보관 기간을 365일로 연장. 게시판은 90일 유지.

create or replace function public.cleanup_old_posts_and_notices()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.posts where created_at < now() - interval '90 days';
  delete from public.notices where created_at < now() - interval '365 days';
end;
$$;
