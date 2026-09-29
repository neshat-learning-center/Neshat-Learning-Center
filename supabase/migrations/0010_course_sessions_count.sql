-- =============================================================================
-- Neshat Learning Center — a course's "duration" is really a session count
-- (e.g. "20 sessions"), not a free-text duration description.
--
-- Run after 0001–0009.
-- =============================================================================

alter table public.courses add column if not exists sessions_count integer;

-- best-effort backfill: the old free-text `duration` column already held a
-- plain number for courses entered since this was (mis)used as a count
update public.courses
set sessions_count = duration::integer
where sessions_count is null and duration ~ '^[0-9]+$';

alter table public.courses drop column if exists duration;
