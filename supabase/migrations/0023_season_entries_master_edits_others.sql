-- master 가 다른 사용자의 season_entries 를 편집할 수 있도록 RPC 확장.
-- 기존 시그니처는 caller 의 entry 만 다룰 수 있었음.
-- p_target_user_id (default null) 추가:
--   - null → caller 본인 (기존 동작 유지)
--   - 다른 사용자 → master 만 허용
-- DELETE 는 RLS 가 master 우회를 이미 허용하므로 별도 작업 불필요.

drop function if exists public.upsert_season_entry(uuid, date, date);

create or replace function public.upsert_season_entry(
  p_entry_id uuid,
  p_in_date date,
  p_out_date date,
  p_target_user_id uuid default null
)
returns public.season_entries
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_caller_id uuid := auth.uid();
  v_is_master boolean := public.is_master(v_caller_id);
  v_user_id uuid := coalesce(p_target_user_id, v_caller_id);
  v_today date := public.today_kst();
  v_target_in date;
  v_merged_in date;
  v_merged_out date;
  v_result public.season_entries;
begin
  if v_caller_id is null then
    raise exception 'not authenticated';
  end if;

  -- 비-master 는 본인 외 사용자의 entry 를 다룰 수 없다
  if not v_is_master and v_user_id <> v_caller_id then
    raise exception 'not authorized';
  end if;

  -- 호출자 권한 검증 (master 이거나 active member)
  if not v_is_master and not public.is_active_member(v_caller_id) then
    raise exception 'not an active member';
  end if;

  if p_in_date > p_out_date then
    raise exception 'in_date must be <= out_date';
  end if;

  -- 편집 대상 entry 검증 (대상 사용자 소유)
  if p_entry_id is not null then
    select in_date into v_target_in
    from public.season_entries
    where id = p_entry_id and user_id = v_user_id;
    if not found then
      raise exception 'entry not found or not owned';
    end if;
  end if;

  -- 비-master 가드:
  --   - 신규: p_in_date >= 오늘
  --   - 지난 entry 편집: p_in_date 가 기존 in_date 와 정확히 같아야 함 (out_date 만 수정 가능)
  --   - 미래 entry 편집: p_in_date >= 오늘
  if not v_is_master then
    if p_entry_id is null then
      if p_in_date < v_today then
        raise exception '지난 날짜로 일정을 등록할 수 없습니다.';
      end if;
    elsif v_target_in < v_today then
      if p_in_date <> v_target_in then
        raise exception '지난 일정의 인 날짜는 수정할 수 없습니다.';
      end if;
    else
      if p_in_date < v_today then
        raise exception '인 날짜는 오늘 이후여야 합니다.';
      end if;
    end if;
  end if;

  perform 1 from public.season_entries
    where user_id = v_user_id
      and (p_entry_id is null or id <> p_entry_id)
      and in_date <= p_out_date
      and out_date >= p_in_date
    for update;

  select
    least(coalesce(min(in_date), p_in_date), p_in_date),
    greatest(coalesce(max(out_date), p_out_date), p_out_date)
  into v_merged_in, v_merged_out
  from public.season_entries
  where user_id = v_user_id
    and (p_entry_id is null or id <> p_entry_id)
    and in_date <= p_out_date
    and out_date >= p_in_date;

  delete from public.season_entries
  where user_id = v_user_id
    and (p_entry_id is null or id <> p_entry_id)
    and in_date <= p_out_date
    and out_date >= p_in_date;

  if p_entry_id is not null then
    delete from public.season_entries
    where id = p_entry_id and user_id = v_user_id;
  end if;

  insert into public.season_entries (user_id, in_date, out_date)
  values (v_user_id, v_merged_in, v_merged_out)
  returning * into v_result;

  return v_result;
end;
$$;

grant execute on function public.upsert_season_entry(uuid, date, date, uuid) to authenticated;
