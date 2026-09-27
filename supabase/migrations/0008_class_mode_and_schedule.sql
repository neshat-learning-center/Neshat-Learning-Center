-- =============================================================================
-- Neshat Learning Center — explicit online/in-person choice + a real start
-- date/time for a class, instead of guessing "mode" from whether a meeting
-- link happens to be filled in and cramming everything into one free-text
-- `schedule` field.
--
-- `schedule` is kept as-is (the recurring-days summary, e.g. "Sat/Mon/Wed")
-- — start_date/start_time are additional, specific fields.
--
-- Run after 0001–0007.
-- =============================================================================

alter table public.classes add column if not exists mode text not null default 'offline';
alter table public.classes add column if not exists start_date date;
alter table public.classes add column if not exists start_time time;

-- best-effort backfill: a class that already has a meeting link was almost
-- certainly meant to be online
update public.classes
set mode = 'online'
where mode = 'offline' and online_meeting_url is not null and online_meeting_url <> '';
