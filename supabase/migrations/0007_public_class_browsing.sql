-- =============================================================================
-- Neshat Learning Center — let anonymous visitors browse a course's open
-- classes (schedule, teacher, mode, seats) on the public course page.
--
-- 0001_init.sql's "classes read" policy only allowed authenticated users
-- (`auth.uid() is not null`), so a logged-out visitor's SELECT on `classes`
-- returned zero rows — the course page silently showed "no classes
-- scheduled" no matter how many classes actually existed. Enrollment counts
-- are computed server-side with the service-role client instead (see
-- lib/data/enrollment.ts), so this policy doesn't need to touch
-- `enrollments` — that table stays fully private.
--
-- Run after 0001–0006.
-- =============================================================================

create policy "classes public read for open enrollment" on public.classes
  for select using (status in ('upcoming', 'active'));
