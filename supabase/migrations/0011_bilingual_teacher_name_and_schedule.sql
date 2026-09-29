-- =============================================================================
-- Neshat Learning Center — an English visitor saw a teacher's Persian name
-- and a class's Persian schedule text verbatim, because neither had an
-- English variant at all (unlike course/book titles, which already had
-- separate _fa/_en columns). Add the missing English columns; both stay
-- optional and fall back to the Persian text when left blank.
--
-- Run after 0001–0010.
-- =============================================================================

alter table public.profiles add column if not exists full_name_en text;
alter table public.classes add column if not exists schedule_en text;
