-- =============================================================================
-- HOTFIX for 0018. If 0018 was already applied with the old `revoke ... from anon`,
-- the profiles policy "profiles teacher reads own students" made every signed-out
-- read of `profiles` fail with "permission denied for function teaches_student",
-- so the public teacher pages showed no teachers. Safe to run any number of times.
-- =============================================================================
grant execute on function public.teaches_student(uuid) to anon, authenticated;
