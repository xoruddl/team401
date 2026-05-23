-- 공지사항: admin/master만 작성/수정/삭제, 모든 인증 사용자가 읽기.

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notices_created_at_idx on public.notices (created_at desc);

drop trigger if exists notices_touch_updated_at on public.notices;
create trigger notices_touch_updated_at
  before update on public.notices
  for each row execute function public.touch_updated_at();

alter table public.notices enable row level security;

drop policy if exists notices_select on public.notices;
create policy notices_select
  on public.notices for select
  to authenticated
  using (true);

drop policy if exists notices_insert on public.notices;
create policy notices_insert
  on public.notices for insert
  to authenticated
  with check (auth.uid() = author_id and public.is_admin(auth.uid()));

drop policy if exists notices_update on public.notices;
create policy notices_update
  on public.notices for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists notices_delete on public.notices;
create policy notices_delete
  on public.notices for delete
  to authenticated
  using (public.is_admin(auth.uid()));
