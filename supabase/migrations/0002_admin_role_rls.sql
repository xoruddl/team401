-- votes / vote_entries RLS를 is_admin() 헬퍼로 통일.
-- 기존 정책은 role='admin'만 체크해 master가 제외되던 문제를 수정.

drop policy if exists votes_insert on public.votes;
create policy votes_insert
  on public.votes for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists votes_update on public.votes;
create policy votes_update
  on public.votes for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists votes_delete on public.votes;
create policy votes_delete
  on public.votes for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- vote_entries: 본인 또는 운영자가 삭제 가능 (master 포함)
drop policy if exists vote_entries_delete on public.vote_entries;
create policy vote_entries_delete
  on public.vote_entries for delete
  to authenticated
  using (auth.uid() = user_id or public.is_admin(auth.uid()));
