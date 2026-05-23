-- 클라이언트-서버 시계 동기화용 정확한 서버 시각 RPC.
-- 선착순 투표가 정시에 활성화되도록 클라이언트 폰의 시계 오차를 보정하는 데 사용.
-- now() 는 트랜잭션 시작 시점이라 RPC 호출 순간의 wall clock 이 아니므로 clock_timestamp() 사용.

create or replace function public.server_now()
returns timestamptz
language sql
volatile
as $$
  select clock_timestamp();
$$;

grant execute on function public.server_now() to authenticated;
