-- =============================================================================
-- Neshat Learning Center — a class's time is a range (e.g. 16:00–17:30), not
-- just a single start time.
--
-- Run after 0001–0008.
-- =============================================================================

alter table public.classes add column if not exists end_time time;
