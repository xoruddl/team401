-- season_entries 지난 날짜 부분 잠금:
--   일반 회원(member) + 운영자(admin) 는
--     - 지난 entry (in_date < 오늘 KST) 의 in_date 를 변경할 수 없다 (out_date 는 가능)
--     - 지난 entry 를 삭제할 수 없다
--     - in_date 가 과거인 entry 를 새로 생성할 수 없다
--   master 만 모든 제한을 우회한다.
-- 의도: 정산 시 사용자가 트립 시작일을 임의로 늦춰 박수를 줄이는 조작 방지.
--       out_date 는 트립 연장/조기복귀 반영 위해 수정 허용.
--       운영자도 우회를 허용하지 않아 정산 책임을 마스터에게 일원화.

-- ============================================================================
-- 0. KST 오늘 헬퍼 (서버 timezone 영향 제거)
-- ============================================================================
create or replace function public.today_kst()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Seoul')::date;
$$;

grant execute on function public.today_kst() to authenticated;

-- ============================================================================
-- 1. season_entries RLS 정책 — master 우회 + 비-master 는 미래 entry 만 가능
-- ============================================================================
drop policy if exists season_insert on public.season_entries;
create policy season_insert on public.season_entries
  for insert
  with check (
    public.is_master(auth.uid())
    or (
      auth.uid() = user_id
      and public.is_active_member(auth.uid())
      and in_date >= public.today_kst()
    )
  );

drop policy if exists season_update on public.season_entries;
create policy season_update on public.season_entries
  for update
  using (
    public.is_master(auth.uid())
    or (
      auth.uid() = user_id
      and public.is_active_member(auth.uid())
      and in_date >= public.today_kst()
    )
  )
  with check (
    public.is_master(auth.uid())
    or (
      auth.uid() = user_id
      and public.is_active_member(auth.uid())
      and in_date >= public.today_kst()
    )
  );

drop policy if exists season_delete on public.season_entries;
create policy season_delete on public.season_entries
  for delete
  using (
    public.is_master(auth.uid())
    or (
      auth.uid() = user_id
      and public.is_active_member(auth.uid())
      and in_date >= public.today_kst()
    )
  );

-- ============================================================================
-- 2. upsert_season_entry — 비-master 지난 날짜 가드
-- ============================================================================
create or replace function public.upsert_season_entry(
  p_entry_id uuid,
  p_in_date date,
  p_out_date date
)
returns public.season_entries
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_master boolean := public.is_master(v_user_id);
  v_today date := public.today_kst();
  v_target_in date;
  v_merged_in date;
  v_merged_out date;
  v_result public.season_entries;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if not v_is_master and not public.is_active_member(v_user_id) then
    raise exception 'not an active member';
  end if;

  if p_in_date > p_out_date then
    raise exception 'in_date must be <= out_date';
  end if;

  -- 편집 대상 본인 소유 검증 + 기존 in_date 조회
  if p_entry_id is not null then
    select in_date into v_target_in
    from public.season_entries
    where id = p_entry_id and user_id = v_user_id;
    if not found then
      raise exception 'entry not found or not owned';
    end if;
  end if;

  -- 비-master 가드 (운영자도 적용):
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
