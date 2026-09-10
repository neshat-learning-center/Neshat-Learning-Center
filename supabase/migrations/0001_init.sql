-- =============================================================================
-- Neshat Learning Center — initial schema
-- Roles: admin · teacher · student
-- Run with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
--
-- Bilingual content (things a visitor reads) is stored as jsonb shaped like
-- { "fa": "...", "en": "..." } — matching the app's Localized<T> type, so a
-- DB row maps directly onto the same shape the UI already expects. Structural
-- fields (language key, enums, ids, numbers) stay plain columns.
-- =============================================================================

create extension if not exists "pgcrypto";

-- enums -----------------------------------------------------------------------
do $$ begin
  create type role as enum ('admin', 'teacher', 'student');
exception when duplicate_object then null; end $$;

do $$ begin
  create type class_mode as enum ('offline', 'online', 'both');
exception when duplicate_object then null; end $$;

do $$ begin
  create type class_status as enum ('upcoming', 'active', 'finished', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_status as enum ('present', 'absent', 'late', 'excused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type material_kind as enum ('pdf', 'document', 'audio', 'video', 'link');
exception when duplicate_object then null; end $$;

-- profiles (1:1 with auth.users) ----------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       role not null default 'student',
  slug       text unique,           -- friendly URL for teacher public profiles
  full_name  text,
  avatar_url text,
  phone      text,
  bio        jsonb,                 -- { fa, en }
  languages  jsonb,                 -- { fa, en } — display string, e.g. "انگلیسی · آیلتس"
  specialty  jsonb,                 -- { fa, en }
  created_at timestamptz not null default now()
);

-- courses ---------------------------------------------------------------------
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       jsonb not null,       -- { fa, en }
  language    text not null,        -- category key: english/german/turkish/ielts/...
  level       jsonb,                -- { fa, en }
  age_group   text,                 -- kids/teens/adults
  mode        class_mode not null default 'both',
  summary     jsonb,                -- { fa, en } short editorial description
  schedule    jsonb,                -- { fa, en } display text, e.g. "شنبه و دوشنبه"
  capacity    integer,
  teacher_id  uuid references public.profiles(id) on delete set null,
  price       integer,
  duration    text,
  created_at  timestamptz not null default now()
);

-- classes ---------------------------------------------------------------------
create table if not exists public.classes (
  id                 uuid primary key default gen_random_uuid(),
  course_id          uuid references public.courses(id) on delete set null,
  teacher_id         uuid references public.profiles(id) on delete set null,
  title              text not null,
  classroom          text,
  schedule           text,
  status             class_status not null default 'upcoming',
  online_meeting_url text,               -- configurable Adobe Connect (or any) URL
  created_at         timestamptz not null default now()
);

-- enrollments -----------------------------------------------------------------
create table if not exists public.enrollments (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_id   uuid not null references public.classes(id) on delete cascade,
  level      text,
  progress   integer default 0,
  created_at timestamptz not null default now(),
  unique (student_id, class_id)
);

-- attendance ------------------------------------------------------------------
create table if not exists public.attendance (
  id            uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  session_date  date not null,
  status        attendance_status not null default 'present'
);

-- materials (files, videos, audio, docs) --------------------------------------
create table if not exists public.materials (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid references public.classes(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  title       text not null,
  kind        material_kind not null default 'pdf',
  url         text not null,
  created_at  timestamptz not null default now()
);

-- announcements ---------------------------------------------------------------
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid references public.classes(id) on delete cascade,
  author_id  uuid references public.profiles(id) on delete set null,
  title      text not null,
  body       text,
  audience   text not null default 'all',   -- 'all' | 'student' | 'teacher'
  created_at timestamptz not null default now()
);

-- books / library -------------------------------------------------------------
create table if not exists public.books (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       jsonb not null,       -- { fa, en }
  language    text,                 -- category key
  level       jsonb,                -- { fa, en }
  kind        jsonb,                -- { fa, en } e.g. "کتاب کار" / "Workbook"
  description jsonb,                -- { fa, en }
  cover_url   text,
  file_url    text,
  created_at  timestamptz not null default now()
);

-- blog / journal --------------------------------------------------------------
create table if not exists public.blog_posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       jsonb not null,       -- { fa, en }
  category    jsonb,                -- { fa, en }
  excerpt     jsonb,                -- { fa, en }
  body        jsonb,                -- { fa, en } plain text, paragraphs separated by blank lines
  min_read    integer,
  cover_url   text,
  published   boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists courses_teacher_id_idx on public.courses(teacher_id);
create index if not exists profiles_role_idx on public.profiles(role);

-- helpers (SECURITY DEFINER to avoid RLS recursion) ---------------------------
create or replace function public.current_role()
returns role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- auto-create a profile on signup ---------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles      enable row level security;
alter table public.courses       enable row level security;
alter table public.classes       enable row level security;
alter table public.enrollments   enable row level security;
alter table public.attendance    enable row level security;
alter table public.materials     enable row level security;
alter table public.announcements enable row level security;
alter table public.books         enable row level security;
alter table public.blog_posts    enable row level security;

-- profiles: teacher rows are public (for the public teacher directory); a
-- student/admin row is only readable by its owner or an admin — otherwise
-- anyone could read every student's phone number via the public API.
create policy "profiles read" on public.profiles for select
  using (role = 'teacher' or id = auth.uid() or public.is_admin());
create policy "profiles self update" on public.profiles for update using (id = auth.uid());
create policy "profiles admin write" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- courses / books / published posts: public read; admin write
create policy "courses public read" on public.courses for select using (true);
create policy "courses admin write" on public.courses for all using (public.is_admin()) with check (public.is_admin());

create policy "books public read"   on public.books for select using (true);
create policy "books admin write"   on public.books for all using (public.is_admin()) with check (public.is_admin());

create policy "posts public read"   on public.blog_posts for select using (published or public.is_admin());
create policy "posts admin write"   on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());

-- classes: authenticated read; teacher manages own; admin full
create policy "classes read"        on public.classes for select using (auth.uid() is not null);
create policy "classes teacher"     on public.classes for update using (teacher_id = auth.uid());
create policy "classes admin write" on public.classes for all using (public.is_admin()) with check (public.is_admin());

-- enrollments: student sees own; teacher sees own classes'; admin full
create policy "enroll student read" on public.enrollments for select
  using (student_id = auth.uid()
    or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
    or public.is_admin());
create policy "enroll admin write"  on public.enrollments for all using (public.is_admin()) with check (public.is_admin());

-- attendance: student reads own; teacher manages own classes'; admin full
create policy "attendance read" on public.attendance for select
  using (exists (
    select 1 from public.enrollments e
    join public.classes c on c.id = e.class_id
    where e.id = enrollment_id
      and (e.student_id = auth.uid() or c.teacher_id = auth.uid() or public.is_admin())));
create policy "attendance teacher write" on public.attendance for all
  using (exists (
    select 1 from public.enrollments e
    join public.classes c on c.id = e.class_id
    where e.id = enrollment_id and (c.teacher_id = auth.uid() or public.is_admin())))
  with check (true);

-- materials: enrolled students / class teacher / admin read; teacher+admin write
create policy "materials read" on public.materials for select
  using (public.is_admin()
    or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
    or exists (select 1 from public.enrollments e where e.class_id = class_id and e.student_id = auth.uid()));
create policy "materials teacher write" on public.materials for all
  using (public.is_admin()
    or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()))
  with check (public.is_admin()
    or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));

-- announcements: authenticated read; teacher+admin write
create policy "ann read"  on public.announcements for select using (auth.uid() is not null);
create policy "ann write" on public.announcements for all
  using (public.is_admin() or public.current_role() = 'teacher')
  with check (public.is_admin() or public.current_role() = 'teacher');
