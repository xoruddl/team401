-- season_entries 저장을 단일 RPC로 원자화.
-- 기존 클라이언트는 (overlap 조회 → 다중 DELETE → INSERT) 4단계를 별도 호출로 처리해
-- 중간 실패 시 데이터 손실 + 두 클라이언트 동시 실행 시 race condition 발생.
-- 이 함수는 모든 단계를 한 트랜잭션으로 묶고 FOR UPDATE 로 행 잠금.

create or replace function public.upsert_season_entry(
  p_entry_id uuid,   -- null이면 신규
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
  v_merged_in date;
  v_merged_out date;
  v_result public.season_entries;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if p_in_date > p_out_date then
    raise exception 'in_date must be <= out_date';
  end if;

  -- 편집 대상 본인 소유 검증
  if p_entry_id is not null then
    perform 1 from public.season_entries
      where id = p_entry_id and user_id = v_user_id;
    if not found then
      raise exception 'entry not found or not owned';
    end if;
  end if;

  -- 본인의 겹치는 entries 잠금 (편집 대상 자체는 별도 처리)
  perform 1 from public.season_entries
    where user_id = v_user_id
      and (p_entry_id is null or id <> p_entry_id)
      and in_date <= p_out_date
      and out_date >= p_in_date
    for update;

  -- 머지된 범위 계산 (overlap 없으면 입력값 그대로)
  select
    least(coalesce(min(in_date), p_in_date), p_in_date),
    greatest(coalesce(max(out_date), p_out_date), p_out_date)
  into v_merged_in, v_merged_out
  from public.season_entries
  where user_id = v_user_id
    and (p_entry_id is null or id <> p_entry_id)
    and in_date <= p_out_date
    and out_date >= p_in_date;

  -- 겹친 것들 삭제
  delete from public.season_entries
  where user_id = v_user_id
    and (p_entry_id is null or id <> p_entry_id)
    and in_date <= p_out_date
    and out_date >= p_in_date;

  -- 편집 대상 삭제 (있으면)
  if p_entry_id is not null then
    delete from public.season_entries
    where id = p_entry_id and user_id = v_user_id;
  end if;

  -- 통합된 새 row 삽입
  insert into public.season_entries (user_id, in_date, out_date)
  values (v_user_id, v_merged_in, v_merged_out)
  returning * into v_result;

  return v_result;
end;
$$;

grant execute on function public.upsert_season_entry(uuid, date, date) to authenticated;
