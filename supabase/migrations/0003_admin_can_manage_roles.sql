-- 운영자도 역할 관리 가능하게 확장.
-- 단 master 행을 건드리는 것(=master로 승격하거나, master를 강등)은 여전히 master만 가능.

-- RLS: "master updates any profile" → "admin updates any profile"
drop policy if exists "master updates any profile" on public.profiles;

drop policy if exists "admin updates any profile" on public.profiles;
create policy "admin updates any profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- role 변경 가드: master 행이 관여되면 master만, 그 외는 admin/master 가능
create or replace function public.guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is not distinct from new.role then
    return new;
  end if;

  -- master로 승격하거나 master를 다른 역할로 바꾸는 경우 → master만 허용
  if old.role = 'master' or new.role = 'master' then
    if not public.is_master(auth.uid()) then
      raise exception 'only master can change master role';
    end if;
    return new;
  end if;

  -- 그 외 (member ↔ admin) → admin/master 모두 허용
  if not public.is_admin(auth.uid()) then
    raise exception 'only admins can change roles';
  end if;
  return new;
end;
$$;
