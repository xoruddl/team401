-- votes / vote_entries 테이블 변경을 Supabase Realtime이 클라이언트에 push하도록 활성화.
-- supabase_realtime publication에 두 테이블 추가.
-- 이미 추가돼 있으면 duplicate_object 예외가 떠서 do 블록으로 흡수.

do $$
begin
  alter publication supabase_realtime add table public.votes;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.vote_entries;
exception
  when duplicate_object then null;
end $$;
