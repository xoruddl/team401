-- admin이 다른 회원의 row를 업데이트할 때 role 외 컬럼은 변경 불가하도록 가드.
-- 본인 row를 업데이트할 때는 자유 (닉네임/아바타 등 본인 정보 수정).

create or replace function public.guard_profile_field_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 본인 row 업데이트는 통과 (role 변경은 별도 트리거가 가드)
  if old.id = auth.uid() then
    return new;
  end if;

  -- 다른 사람 row 업데이트: role 외 변경 금지
  if old.id is distinct from new.id
     or old.nickname is distinct from new.nickname
     or old.avatar_url is distinct from new.avatar_url
     or old.created_at is distinct from new.created_at then
    raise exception 'admins can only change role on other members';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_field_update on public.profiles;
create trigger profiles_guard_field_update
  before update on public.profiles
  for each row execute function public.guard_profile_field_update();
