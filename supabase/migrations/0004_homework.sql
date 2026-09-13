-- =============================================================================
-- Neshat Learning Center — homework + submissions + grading
-- Run after 0001–0003.
-- =============================================================================

create table if not exists public.homeworks (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.classes(id) on delete cascade,
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  file_url    text,                -- optional teacher-attached brief/handout
  due_date    date,
  created_at  timestamptz not null default now()
);

create table if not exists public.homework_submissions (
  id           uuid primary key default gen_random_uuid(),
  homework_id  uuid not null references public.homeworks(id) on delete cascade,
  student_id   uuid not null references public.profiles(id) on delete cascade,
  file_url     text,
  submitted_at timestamptz,
  grade        numeric,
  feedback     text,
  graded_at    timestamptz,
  graded_by    uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (homework_id, student_id)
);

create index if not exists homeworks_class_id_idx on public.homeworks(class_id);
create index if not exists homework_submissions_homework_id_idx on public.homework_submissions(homework_id);
create index if not exists homework_submissions_student_id_idx on public.homework_submissions(student_id);

alter table public.homeworks            enable row level security;
alter table public.homework_submissions enable row level security;

-- homeworks: enrolled students / class teacher / admin read; class teacher + admin write
create policy "homeworks read" on public.homeworks for select
  using (public.is_admin()
    or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
    or exists (select 1 from public.enrollments e where e.class_id = homeworks.class_id and e.student_id = auth.uid()));
create policy "homeworks teacher write" on public.homeworks for all
  using (public.is_admin()
    or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()))
  with check (public.is_admin()
    or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));

-- submissions: the student who owns it, that class's teacher, or admin can read;
-- an enrolled student can create their own; owner/teacher/admin can update (the
-- app only ever sends the fields relevant to who's saving — student's file/note,
-- or the teacher's grade/feedback); only the student or admin can delete.
create policy "submissions read" on public.homework_submissions for select
  using (public.is_admin()
    or student_id = auth.uid()
    or exists (
      select 1 from public.homeworks h join public.classes c on c.id = h.class_id
      where h.id = homework_id and c.teacher_id = auth.uid()));
create policy "submissions student insert" on public.homework_submissions for insert
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.homeworks h join public.enrollments e on e.class_id = h.class_id
      where h.id = homework_id and e.student_id = auth.uid()));
-- lets a teacher grade a student who never uploaded anything (e.g. handed in
-- on paper) by creating the submission row themselves at grading time
create policy "submissions teacher insert" on public.homework_submissions for insert
  with check (public.is_admin()
    or exists (
      select 1 from public.homeworks h join public.classes c on c.id = h.class_id
      where h.id = homework_id and c.teacher_id = auth.uid()));
create policy "submissions update" on public.homework_submissions for update
  using (public.is_admin()
    or student_id = auth.uid()
    or exists (
      select 1 from public.homeworks h join public.classes c on c.id = h.class_id
      where h.id = homework_id and c.teacher_id = auth.uid()))
  with check (public.is_admin()
    or student_id = auth.uid()
    or exists (
      select 1 from public.homeworks h join public.classes c on c.id = h.class_id
      where h.id = homework_id and c.teacher_id = auth.uid()));
create policy "submissions delete" on public.homework_submissions for delete
  using (public.is_admin() or student_id = auth.uid());

-- storage: private bucket. Path convention: homework/{class_id}/{filename} —
-- keyed on class, not homework, so a teacher can attach a file while still
-- filling out the "new homework" form, before that row even exists yet.
-- Readable/writable by that class's teacher, its enrolled students, or admin.
insert into storage.buckets (id, name, public)
values ('homework', 'homework', false)
on conflict (id) do nothing;

create policy "homework storage read" on storage.objects for select
  using (bucket_id = 'homework' and (
    public.is_admin()
    or exists (
      select 1 from public.classes c
      where c.id::text = (storage.foldername(name))[1] and c.teacher_id = auth.uid())
    or exists (
      select 1 from public.enrollments e
      where e.class_id::text = (storage.foldername(name))[1] and e.student_id = auth.uid())
  ));
create policy "homework storage write" on storage.objects for insert
  with check (bucket_id = 'homework' and (
    public.is_admin()
    or exists (
      select 1 from public.classes c
      where c.id::text = (storage.foldername(name))[1] and c.teacher_id = auth.uid())
    or exists (
      select 1 from public.enrollments e
      where e.class_id::text = (storage.foldername(name))[1] and e.student_id = auth.uid())
  ));
create policy "homework storage delete" on storage.objects for delete
  using (bucket_id = 'homework' and (
    public.is_admin()
    or exists (
      select 1 from public.classes c
      where c.id::text = (storage.foldername(name))[1] and c.teacher_id = auth.uid())
    or exists (
      select 1 from public.enrollments e
      where e.class_id::text = (storage.foldername(name))[1] and e.student_id = auth.uid())
  ));
