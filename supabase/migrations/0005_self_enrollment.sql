-- =============================================================================
-- Neshat Learning Center — let students enroll themselves in a class
-- Run after 0001–0004. The `enrollments` table already has a unique
-- (student_id, class_id) constraint from 0001, so a double-click just hits
-- that constraint harmlessly rather than creating a duplicate row.
-- =============================================================================

create policy "enroll self insert" on public.enrollments for insert
  with check (student_id = auth.uid());

create policy "enroll self delete" on public.enrollments for delete
  using (student_id = auth.uid());
