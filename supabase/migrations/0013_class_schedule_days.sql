-- Run after 0001-0012.
-- The class schedule was admin-typed free text in one language, which is why
-- it needed a separate hand-entered English copy (schedule_en). Replace that
-- with a structured list of weekdays the class meets on — the Persian and
-- English display text is now generated from this on every read (see
-- lib/schedule.ts), so there's nothing left to translate by hand.
-- `schedule`/`schedule_en` are kept (now written from the days on every
-- save) so nothing that reads them needs to change.
alter table public.classes add column if not exists schedule_days text[];
