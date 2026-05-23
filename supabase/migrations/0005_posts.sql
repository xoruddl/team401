-- 게시판: 모든 회원이 글 작성, 본인 글 수정/삭제, 운영자도 삭제 가능.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_author_idx on public.posts (author_id);

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

alter table public.posts enable row level security;

drop policy if exists posts_select on public.posts;
create policy posts_select
  on public.posts for select
  to authenticated
  using (true);

drop policy if exists posts_insert on public.posts;
create policy posts_insert
  on public.posts for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists posts_update on public.posts;
create policy posts_update
  on public.posts for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists posts_delete on public.posts;
create policy posts_delete
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id or public.is_admin(auth.uid()));
