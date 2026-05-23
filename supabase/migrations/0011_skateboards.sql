-- 스케이트보드 대여 관리.
-- skateboards: 보드 인벤토리 (관리자만 추가/수정/삭제)
-- skateboard_rentals: 대여 기록. returned_at IS NULL 이면 현재 대여 중.

create table if not exists public.skateboards (
  id uuid primary key default gen_random_uuid(),
  number int not null unique,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists skateboards_number_idx on public.skateboards (number);

create table if not exists public.skateboard_rentals (
  id uuid primary key default gen_random_uuid(),
  skateboard_id uuid not null references public.skateboards(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rented_at timestamptz not null default now(),
  returned_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- 한 보드는 동시에 한 명만 대여 가능 (반납 안 된 row는 보드당 1개 제한)
create unique index if not exists skateboard_rentals_active_unique
  on public.skateboard_rentals (skateboard_id)
  where returned_at is null;

create index if not exists skateboard_rentals_user_idx on public.skateboard_rentals (user_id);
create index if not exists skateboard_rentals_skateboard_idx on public.skateboard_rentals (skateboard_id);
create index if not exists skateboard_rentals_active_idx
  on public.skateboard_rentals (skateboard_id) where returned_at is null;

-- RLS
alter table public.skateboards enable row level security;
alter table public.skateboard_rentals enable row level security;

drop policy if exists skateboards_select on public.skateboards;
create policy skateboards_select on public.skateboards
  for select to authenticated using (true);

drop policy if exists skateboards_insert on public.skateboards;
create policy skateboards_insert on public.skateboards
  for insert to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists skateboards_update on public.skateboards;
create policy skateboards_update on public.skateboards
  for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists skateboards_delete on public.skateboards;
create policy skateboards_delete on public.skateboards
  for delete to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists skateboard_rentals_select on public.skateboard_rentals;
create policy skateboard_rentals_select on public.skateboard_rentals
  for select to authenticated using (true);

drop policy if exists skateboard_rentals_insert on public.skateboard_rentals;
create policy skateboard_rentals_insert on public.skateboard_rentals
  for insert to authenticated
  with check (auth.uid() = user_id);

-- 본인 대여 row의 반납(returned_at 갱신)은 본인이 가능, 운영자는 누구의 것이든 강제 반납 가능
drop policy if exists skateboard_rentals_update on public.skateboard_rentals;
create policy skateboard_rentals_update on public.skateboard_rentals
  for update to authenticated
  using (auth.uid() = user_id or public.is_admin(auth.uid()))
  with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists skateboard_rentals_delete on public.skateboard_rentals;
create policy skateboard_rentals_delete on public.skateboard_rentals
  for delete to authenticated
  using (public.is_admin(auth.uid()));
