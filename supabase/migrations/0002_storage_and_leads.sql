-- =============================================================================
-- Neshat Learning Center — storage buckets + leads table
-- Run after 0001_init.sql (and 0001's seed.sql if you haven't already).
-- =============================================================================

-- =============================================================================
-- Storage buckets
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('books', 'books', true)
on conflict (id) do nothing;

-- materials is NOT public — files are only reachable via a signed URL
-- generated server-side for an authorized reader (see lib/data/materials.ts).
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do nothing;

-- avatars: public read; a user can only write inside their own folder
-- (path convention: avatars/{user_id}/filename), admin can write anywhere.
create policy "avatars public read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars owner write" on storage.objects for insert
  with check (bucket_id = 'avatars' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));
create policy "avatars owner update" on storage.objects for update
  using (bucket_id = 'avatars' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));
create policy "avatars owner delete" on storage.objects for delete
  using (bucket_id = 'avatars' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));

-- books: public read (covers + downloadable files are public marketing content); admin write
create policy "books storage public read" on storage.objects for select
  using (bucket_id = 'books');
create policy "books storage admin write" on storage.objects for all
  using (bucket_id = 'books' and public.is_admin())
  with check (bucket_id = 'books' and public.is_admin());

-- materials: private. Path convention: materials/{class_id}/filename.
-- Readable by that class's enrolled students, its teacher, or an admin;
-- writable by that class's teacher or an admin.
create policy "materials read" on storage.objects for select
  using (
    bucket_id = 'materials' and (
      public.is_admin()
      or exists (
        select 1 from public.classes c
        where c.id::text = (storage.foldername(name))[1] and c.teacher_id = auth.uid()
      )
      or exists (
        select 1 from public.enrollments e
        where e.class_id::text = (storage.foldername(name))[1] and e.student_id = auth.uid()
      )
    )
  );
create policy "materials write" on storage.objects for insert
  with check (
    bucket_id = 'materials' and (
      public.is_admin()
      or exists (
        select 1 from public.classes c
        where c.id::text = (storage.foldername(name))[1] and c.teacher_id = auth.uid()
      )
    )
  );
create policy "materials delete" on storage.objects for delete
  using (
    bucket_id = 'materials' and (
      public.is_admin()
      or exists (
        select 1 from public.classes c
        where c.id::text = (storage.foldername(name))[1] and c.teacher_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- Leads — placement test + contact form submissions
-- =============================================================================
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null,        -- 'placement' | 'contact'
  name        text not null,
  phone       text not null,
  email       text,
  language    text,                 -- interest, for placement requests
  level       text,                 -- self-reported current level, optional
  message     text,
  contacted   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.leads enable row level security;

-- anyone (including anonymous visitors) can submit a lead; only admins can read them
create policy "leads public insert" on public.leads for insert
  with check (true);
create policy "leads admin read" on public.leads for select
  using (public.is_admin());
create policy "leads admin write" on public.leads for update
  using (public.is_admin()) with check (public.is_admin());
create policy "leads admin delete" on public.leads for delete
  using (public.is_admin());
