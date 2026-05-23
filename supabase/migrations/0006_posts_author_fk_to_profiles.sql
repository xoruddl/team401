-- posts.author_id의 FK 대상을 auth.users → public.profiles로 변경.
-- PostgREST 임베드(`posts.select('*, profiles(...)')`)를 위해 필요.
-- profiles.id가 이미 auth.users(id)를 참조하므로 의미상 동일하다.

alter table public.posts drop constraint if exists posts_author_id_fkey;

alter table public.posts
  add constraint posts_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete cascade;
