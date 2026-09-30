-- Run after 0001-0013.
-- Turns the placement "leave your info, we'll call you" form into a real
-- self-scored English placement test, with results visible in the admin
-- dashboard.

-- Optional CEFR tag on a course, so the test's result page can suggest
-- courses at the level the visitor just tested into. Independent of the
-- existing free-text `level` column, which is just display copy.
alter table public.courses add column if not exists level_code text;

create table if not exists public.placement_attempts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  email       text,
  locale      text not null default 'fa',
  -- null until the quiz step finishes — a row from just the info step is
  -- still a usable lead if the visitor drops off before finishing.
  score       integer,
  total       integer,
  level_code  text,
  answers     jsonb,
  student_id  uuid references public.profiles(id) on delete set null,
  reviewed    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.placement_attempts enable row level security;

-- Same "anyone can submit, only admins can read" shape as `leads`, plus one
-- narrow addition: the quiz-submission step needs to attach the score to
-- the row the info step created. It can only touch a row that hasn't been
-- scored yet (`score is null`) — once scored it's immutable to anonymous
-- clients — and there's still no public select policy, so even a guessed
-- id can't be read back, only (once) written to.
create policy "placement_attempts public insert" on public.placement_attempts for insert
  with check (true);
create policy "placement_attempts public submit" on public.placement_attempts for update
  using (score is null)
  with check (true);
create policy "placement_attempts admin read" on public.placement_attempts for select
  using (public.is_admin());
create policy "placement_attempts admin update" on public.placement_attempts for update
  using (public.is_admin()) with check (public.is_admin());
create policy "placement_attempts admin delete" on public.placement_attempts for delete
  using (public.is_admin());
