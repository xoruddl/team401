-- vote_entries에서 한 명이 취소(=DELETE)되면 같은 vote의 남은 사람들의
-- queue_number를 created_at 순으로 1부터 다시 부여하고 status도 capacity 기준으로 재계산.
-- 결과: 1번 취소 → 2번이 1번이 되고, 마지막 대기자가 확정으로 승격될 수 있음.

create or replace function public.renumber_vote_entries()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity int;
begin
  select capacity into v_capacity
  from public.votes
  where id = OLD.vote_id;

  -- 부모 vote가 cascade로 같이 삭제되는 경우 재계산 불필요
  if v_capacity is null then
    return null;
  end if;

  with ordered as (
    select id, row_number() over (order by created_at, id) as new_q
    from public.vote_entries
    where vote_id = OLD.vote_id
  )
  update public.vote_entries v
  set
    queue_number = o.new_q,
    status = case when o.new_q <= v_capacity then 'confirmed' else 'waiting' end
  from ordered o
  where v.id = o.id
    and (v.queue_number is distinct from o.new_q
         or v.status is distinct from
            (case when o.new_q <= v_capacity then 'confirmed' else 'waiting' end));

  return null;
end;
$$;

drop trigger if exists vote_entries_renumber_after_delete on public.vote_entries;
create trigger vote_entries_renumber_after_delete
  after delete on public.vote_entries
  for each row execute function public.renumber_vote_entries();
