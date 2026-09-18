-- =============================================================================
-- Neshat Learning Center — cleanly separate "course" (catalog/marketing) from
-- "class" (a specific scheduled section with its own teacher/time/mode).
--
-- Before: courses carried mode/schedule/capacity/teacher_id directly, which
-- only made sense for a course with exactly one section. After: those fields
-- live on classes only, and a course can have any number of classes.
--
-- Also splits the old conflated `courses.language` (which held real languages
-- AND pseudo-languages like 'ielts'/'kids'/'teacher-training') into a real
-- `language` + a separate `category`, and adds a course cover image plus a
-- many-to-many link to recommended books.
--
-- Run after 0001–0005.
-- =============================================================================

alter table public.courses add column if not exists category text not null default 'general';
alter table public.courses add column if not exists cover_url text;
alter table public.classes add column if not exists capacity integer;

-- backfill the known seed courses with a correct (language, category) split
update public.courses set language = 'english', category = 'conversation' where slug = 'english-conversation-adults';
update public.courses set language = 'english', category = 'ielts'        where slug = 'ielts-intensive';
update public.courses set language = 'german',  category = 'general'      where slug = 'german-a1';
update public.courses set language = 'turkish', category = 'conversation' where slug = 'turkish-conversation';
update public.courses set language = 'english', category = 'kids'         where slug = 'kids-english';
update public.courses set language = 'english', category = 'kids'         where slug = 'teens-english';

-- any other existing course whose language isn't a real language got tagged
-- with that same value as its category, and reset to a safe default language
-- so nothing is left in a broken state — review these in the admin afterward
update public.courses
set category = language, language = 'english'
where language not in ('english', 'german', 'turkish');

-- give each class a starting capacity/schedule/teacher from its course, for
-- any class that doesn't already have its own value set
update public.classes c
set capacity = co.capacity
from public.courses co
where c.course_id = co.id and c.capacity is null and co.capacity is not null;

update public.classes c
set schedule = coalesce(co.schedule->>'fa', co.schedule->>'en')
from public.courses co
where c.course_id = co.id and c.schedule is null and co.schedule is not null;

update public.classes c
set teacher_id = co.teacher_id
from public.courses co
where c.course_id = co.id and c.teacher_id is null and co.teacher_id is not null;

-- these are now class-only concerns
alter table public.courses drop column if exists mode;
alter table public.courses drop column if exists schedule;
alter table public.courses drop column if exists capacity;
alter table public.courses drop column if exists teacher_id;

-- a course can recommend more than one book
create table if not exists public.course_books (
  course_id uuid not null references public.courses(id) on delete cascade,
  book_id   uuid not null references public.books(id) on delete cascade,
  primary key (course_id, book_id)
);

alter table public.course_books enable row level security;

create policy "course_books public read" on public.course_books for select
  using (true);
create policy "course_books admin write" on public.course_books for all
  using (public.is_admin()) with check (public.is_admin());
