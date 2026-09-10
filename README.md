# دانش‌سرای نشاط — Neshat Learning Center

An art-directed, Persian-first (RTL) website for the Neshat Learning Center, Shiraz.
Editorial design · strong Persian typography · restrained yellow accents · subtle motion.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (CSS-first `@theme` tokens — see `app/globals.css`)
- **next/font**: Vazirmatn (Persian) + Inter (English)
- Genuine **i18n / RTL** via `app/[locale]/` + `proxy.ts` (locale detection & redirect)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000  (redirects / → /fa)
npm run build    # production build
```

Locales: `/fa` (default, RTL) and `/en` (LTR). The language toggle swaps the
locale segment of the current path — no duplicated pages.

## Architecture

```
app/
  globals.css              design tokens + editorial utilities + motion primitives
  [locale]/
    layout.tsx             sets <html lang dir>, fonts, Header + Footer
    page.tsx               composes the landing sections
proxy.ts                   locale detection + redirect (Next 16 "proxy" convention)
lib/
  fonts.ts                 Vazirmatn / Inter
  i18n/
    config.ts              locales, dir map, pick() helper for {fa,en} fields
    dictionaries/          fa.ts (source of truth) · en.ts · index.ts
  utils.ts                 cn(), locale-aware href()
content/                   MODULAR, CMS-ready data — nothing invented
  types.ts  site.ts  categories.ts  courses.ts  teachers.ts  books.ts  journal.ts
components/
  layout/                  Header, Footer
  sections/                Hero, CourseDiscovery, WhyNeshat, Courses, Teachers,
                           LearningModes, Books, Journal, TeacherTraining,
                           StudentExperience, CallToAction
  ui/                      Logo, Button, LangToggle, Reveal, SectionIntro
```

## Design system

Tokens live in `app/globals.css` under `@theme`:

- **Surfaces**: `canvas` (warm white), `paper`, `sand` / `sand-deep`, `slate`
- **Ink**: `ink`, `ink-soft`, `muted`, `line` / `line-strong`
- **Brand yellow**: `accent`, `accent-deep`, `accent-tint`, `accent-wash`
- Fluid type scale via `clamp()`; `.eyebrow`, `.numeral`, `.mark-underline`,
  `.hair` editorial utilities.

Motion is intentional and light: an IntersectionObserver `<Reveal>` primitive
toggles CSS transitions; `prefers-reduced-motion` is fully respected. No heavy
animation library.

## Content & i18n rules

- All translatable content is stored as `{ fa, en }` and read with `pick(field, locale)`.
- **Nothing is invented**: no fake stats, testimonials, counts, or founding year.
  `content/site.ts` leaves unknown facts `undefined`; the UI hides them.
- Teacher/course/book/post entries are clearly-marked **seed data** to be replaced
  via the future admin dashboard.

## Auth & dashboards (Supabase)

Backend is **Supabase (Postgres + Auth)**. Roles: `admin` · `teacher` · `student`.

- Schema + RLS + signup trigger: [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
  (profiles, courses, classes, enrollments, attendance, materials, announcements,
  books, blog_posts). Bilingual content columns are `jsonb` shaped like
  `{ "fa": "...", "en": "..." }` — matching the app's `Localized<T>` type exactly,
  so a DB row maps directly onto what the UI already expects.
  `classes.online_meeting_url` drives the configurable "ورود به کلاس" /
  Join-class button (set any Adobe Connect URL per class).
- Seed data: [`supabase/seed.sql`](supabase/seed.sql) mirrors `content/*.ts` as real
  rows (courses, books, journal posts). Teachers can't be seeded by SQL — see the
  comment at the bottom of that file.
- Clients: `lib/supabase/{server,client,middleware}.ts`; hand-authored types in
  `lib/supabase/types.ts`.
- **Public content layer** (`lib/data/public.ts`): `getCourses`, `getTeachers`,
  `getBooks`, `getPosts`, and their by-slug variants. Reads from Supabase when
  it's configured *and has rows*; otherwise falls back to the static seed content
  in `content/`. This is what every public page now calls — nothing imports
  `content/*.ts` directly anymore except this fallback layer.
- Auth flow: `/[locale]/login` and `/[locale]/signup` → `lib/actions/auth.ts`
  (sign in / sign up / sign out). Self-signup always creates a `student` account
  (see the `handle_new_user` trigger); promote to `teacher`/`admin` by hand until
  the admin CRUD UI ships. Session read in `lib/auth.ts`;
  route protection in `app/[locale]/dashboard/layout.tsx`.
- Dashboards (`app/[locale]/dashboard`): role-dispatched overview —
  Student (classes, schedule, attendance, materials, announcements, join-class),
  Teacher (classes, students, materials, announcements),
  Admin (stats + live snapshots of teachers/courses/books, with links into full
  management pages for every entity).
- Profile pages (`/dashboard/profile`, `lib/actions/profile.ts`): every role can
  edit name/phone/avatar URL; teachers additionally edit their public slug, bio,
  specialty, and languages (in both fa/en) — this is what feeds their public
  `/teachers/[slug]` page.

### Admin CRUD (`/dashboard/admin/*`)

Full create/edit/delete for all 7 entities — students, teachers, courses, classes
(with student enrollment management), books, announcements, and journal posts.
Every list/new/edit page lives under `app/[locale]/dashboard/admin/<entity>/`;
server actions are in `lib/actions/admin/<entity>.ts`; admin-only reads (full
rows, not the public-mapped types) are in `lib/data/admin.ts`. Guarded by
`lib/admin-guard.ts` (must be signed in **and** `role === 'admin'`).

**Two things need the service-role key specifically** (creating/deleting a
teacher's login) — everything else works with just the anon key:
- `lib/supabase/admin.ts` — a `server-only` client using
  `SUPABASE_SERVICE_ROLE_KEY`. It's never imported by a client component; the
  `server-only` package makes that a build error rather than a leaked secret.
- Without it, the Students/Teachers pages still list/edit fine — the delete
  button and "add teacher" flow just show a "set the service_role key" notice
  instead of breaking.

### File uploads (Supabase Storage)

Three buckets, created and secured by `supabase/migrations/0002_storage_and_leads.sql`:
- `avatars` (public) — profile photos. A user may only write inside their own
  `avatars/{user_id}/…` folder; admin can write anywhere.
- `books` (public) — cover images + downloadable files, admin-only write.
- `materials` (private) — class files. Readable by that class's enrolled
  students/teacher/admin; writable by that class's teacher/admin. Since the
  bucket is private, `lib/data/materials.ts` generates a short-lived signed URL
  server-side for every authorized read instead of a public link.

`components/admin/FileUploadField.tsx` does the actual browser → Storage
upload (via the anon-key browser client, respecting the RLS policies above)
and exposes the result through a hidden form field — it's dropped into the
profile form, the admin teacher/student edit forms, the book form, and the
class edit page's materials manager without changing how those forms submit.

### Attendance

Teachers (and admins) mark attendance per class at `/dashboard/attendance/[classId]`,
linked from each class card on the teacher overview. One submit records today's
status for every enrolled student (`lib/actions/attendance.ts`, upserted on
`(enrollment_id, session_date)` — see `supabase/migrations/0003_attendance_constraint.sql`).
The student dashboard's attendance tile reads the real aggregated counts.

### Leads (placement + contact forms)

Both public forms (`components/forms/LeadForm.tsx`) write to a `leads` table
(public insert, admin-only read — see migration 0002) via `lib/actions/leads.ts`.
Admins review and mark them contacted at `/dashboard/admin/leads`.

### SEO

- Per-page `generateMetadata` on every list/detail page (courses, teachers,
  books, journal, placement, contact, teacher-training) plus a `title.template`
  in the root locale layout so nested titles read "صفحه — دانش‌سرای نشاط".
- `app/sitemap.ts` — built from the same `lib/data/public.ts` fetchers real
  pages use, so it's automatically accurate whether it's reading Supabase or
  the seed-content fallback.
- `app/robots.ts` — disallows `/*/dashboard`, `/*/login`, `/*/signup`.
- The whole `/dashboard/*` tree, `/login`, and `/signup` are also marked
  `robots: noindex` directly in their own metadata, belt-and-suspenders.
- Custom `not-found.tsx` (inside the `(site)` route group, so it keeps the
  Header/Footer) — reads the locale from the URL client-side, since Next.js
  doesn't reliably pass route params into not-found boundaries.

### Connecting Supabase

1. Create a Supabase project.
2. Run, in order, in the SQL editor (or `supabase db push`):
   `0001_init.sql` → `0002_storage_and_leads.sql` → `0003_attendance_constraint.sql`
   → `seed.sql` (populates courses/books/journal).
3. Copy `.env.example` → `.env.local` and fill in all three Supabase keys
   (Settings → API in the Supabase dashboard):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — the **secret** `service_role` key. Needed only
     for admin-created/deleted teacher logins; keep it out of any client code.
   Restart the dev server after adding these.
4. Sign up a real account at `/signup` (creates a `student`), then promote it in
   the SQL editor to test the other roles:
   ```sql
   update public.profiles set role = 'admin' where id = '<your-user-uuid>';
   ```
   (Find the uuid under Authentication → Users in the Supabase dashboard.)
5. From the admin dashboard, use "افزودن مدرس" (Add teacher) under
   `/dashboard/admin/teachers` to create real teacher accounts, then assign them
   to courses/classes from the course or class edit page.

### Demo mode

**Without** the env vars, auth-gated areas run in a clearly-labelled DEMO mode:
`/login` offers "enter as Student / Teacher / Admin" (sets a short-lived cookie)
so all three dashboards are fully reviewable before a backend is connected. The
banner reads «نمایش نمونه». Public pages and the demo dashboards read from the
seed data in `content/`; the profile page and every `/dashboard/admin/*` page
show a "connect Supabase" notice instead of a form, since there's no real
database to read or write. Placement/contact forms still show a success
message in demo mode, but nothing is persisted (there's nowhere to persist it to).

## Deploying

This is a standard Next.js app — Vercel is the path of least resistance:

1. Push the repo to GitHub, then import it in Vercel ("Add New… → Project").
2. Add the environment variables from `.env.local` (all four:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` — set the last one to
   your real production domain, e.g. `https://neshat.example.com`) in the
   Vercel project's Settings → Environment Variables. Vercel builds with these
   automatically; no config file is needed.
3. Deploy. Vercel gives you a `*.vercel.app` URL immediately; add your own
   domain under Settings → Domains once you have one.
4. In Supabase, go to Authentication → URL Configuration and add your Vercel/
   custom domain to "Site URL" and "Redirect URLs" — otherwise auth email
   links (password reset, email confirmation) will point at `localhost`.
5. Re-run `npm run build` locally first to catch anything environment-specific
   before pushing — the exact same command runs on Vercel.

Nothing above requires touching this codebase again; it's already reading
every one of those env vars through `lib/supabase/config.ts`.

## Still open (intentionally not built yet)

- Teacher self-service material uploads (admin can upload per class today from
  `/dashboard/admin/classes/[id]/edit`; teachers only have a read-only list on
  their own dashboard — extending the same `MaterialsManager` to a teacher-scoped
  page is a small follow-up, not a redesign).
- Teacher-authored announcements (RLS already allows it; no compose UI yet on
  the teacher dashboard, only admin's).
- Real photography — every image is either real Neshat brand assets you've
  supplied (logo, hero character) or an intentionally-designed placeholder
  (book spines, portrait initials) swappable via the `cover`/`avatar_url`/`image`
  fields already wired end-to-end.
```
