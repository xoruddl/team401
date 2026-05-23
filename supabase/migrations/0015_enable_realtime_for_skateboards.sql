-- skateboards / skateboard_rentals 테이블 변경을 Realtime이 클라이언트에 push.
-- 동시 대여 시도 시 진 사람이 미리 빨간색 보고 못 누르도록.

do $$
begin
  alter publication supabase_realtime add table public.skateboards;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.skateboard_rentals;
exception
  when duplicate_object then null;
end $$;
