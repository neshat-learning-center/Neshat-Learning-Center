-- Run after 0001-0011.
-- The classes.title column is auto-derived from the course's title plus the
-- schedule text (see buildClassTitle in lib/actions/admin/classes.ts) — it
-- was always built from the Persian variant only, so it stayed in Persian on
-- the dashboard even after switching the site to English. Add an English
-- sibling column, following the same _en convention as profiles.full_name_en
-- and classes.schedule_en.
alter table public.classes add column if not exists title_en text;
