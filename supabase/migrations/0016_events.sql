-- =============================================================================
-- Neshat Learning Center — Events & Experiences
-- Run after 0001-0015.
--
--   * Public (anonymous) visitors can READ published events + galleries and can
--     REGISTER through event_register(). They can never read other people's
--     registrations: registrations/payments/attendance are admin-only (RLS).
--   * Capacity, waiting list, duplicate prevention and the registration
--     deadline are enforced inside event_register() under a row lock on the
--     event, so two people can never take the last seat at the same time.
--   * Event payments are admin-confirmed (there is no payment gateway). Payment
--     rows are append-only: they can only be voided, never edited or deleted.
--   * Money is integer Toman, same as the accounting module.
-- =============================================================================

do $$ begin create type event_status as enum ('draft', 'published', 'completed', 'cancelled', 'archived');
exception when duplicate_object then null; end $$;
do $$ begin create type event_reg_status as enum ('pending', 'confirmed', 'waitlisted', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

-- categories ------------------------------------------------------------------
create table if not exists public.event_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  title      jsonb not null,            -- { fa, en }
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.event_categories (slug, title, sort_order) values
  ('language-workshops',   '{"fa":"کارگاه‌های زبان","en":"Language Workshops"}', 10),
  ('speaking-clubs',       '{"fa":"باشگاه‌های مکالمه","en":"Speaking Clubs"}', 20),
  ('cultural-events',      '{"fa":"رویدادهای فرهنگی","en":"Cultural Events"}', 30),
  ('movie-nights',         '{"fa":"شب‌های فیلم","en":"Movie Nights"}', 40),
  ('book-clubs',           '{"fa":"باشگاه کتاب","en":"Book Clubs"}', 50),
  ('educational-seminars', '{"fa":"سمینارهای آموزشی","en":"Educational Seminars"}', 60),
  ('teacher-training',     '{"fa":"تربیت مدرس","en":"Teacher Training"}', 70),
  ('social-gatherings',    '{"fa":"دورهمی‌ها","en":"Social Gatherings"}', 80),
  ('special-celebrations', '{"fa":"جشن‌های ویژه","en":"Special Celebrations"}', 90)
on conflict (slug) do nothing;

-- events ----------------------------------------------------------------------
create table if not exists public.events (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  category_id           uuid references public.event_categories(id) on delete set null,
  title                 jsonb not null,           -- { fa, en }
  summary               jsonb,                    -- short blurb { fa, en }
  description           jsonb,                    -- long text { fa, en }, blank line = paragraph
  venue                 jsonb,                    -- { fa, en }
  address               text,
  map_url               text,
  organizer             jsonb,                    -- { fa, en }
  program               jsonb not null default '[]'::jsonb,  -- [{ time, fa, en }]
  requirements          jsonb,                    -- { fa: [..], en: [..] }
  cover_url             text,
  starts_at             timestamptz not null,
  ends_at               timestamptz,
  registration_deadline timestamptz,
  capacity              integer check (capacity is null or capacity > 0),
  allow_waitlist        boolean not null default true,
  auto_confirm          boolean not null default true,    -- free events only; paid always start pending
  max_per_registration  integer not null default 5 check (max_per_registration >= 1),
  is_paid               boolean not null default false,
  price                 bigint not null default 0 check (price >= 0),   -- Toman, per participant
  is_featured           boolean not null default false,
  status                event_status not null default 'draft',
  created_by            uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  check (not is_paid or price > 0),
  check (ends_at is null or ends_at > starts_at),
  check (registration_deadline is null or registration_deadline <= coalesce(ends_at, starts_at))
);
create index if not exists events_starts_idx on public.events (starts_at);
create index if not exists events_status_idx on public.events (status);

create table if not exists public.event_gallery (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  url        text not null,
  caption    text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists event_gallery_event_idx on public.event_gallery (event_id, sort_order);

-- registrations -----------------------------------------------------------------
create table if not exists public.event_registrations (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events(id) on delete restrict,
  code              text unique not null,
  full_name         text not null check (char_length(full_name) between 2 and 120),
  phone             text not null,                  -- normalised: 9123456789
  email             text,
  is_student        boolean not null default false,
  participants      integer not null default 1 check (participants >= 1),
  notes             text check (notes is null or char_length(notes) <= 1000),
  status            event_reg_status not null default 'pending',
  user_id           uuid,
  admin_note        text,
  status_changed_at timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
-- one ACTIVE registration per phone per event (cancelled/rejected ones don't block a re-try)
create unique index if not exists event_reg_unique_phone
  on public.event_registrations (event_id, phone) where status in ('pending', 'confirmed', 'waitlisted');
create unique index if not exists event_reg_unique_user
  on public.event_registrations (event_id, user_id) where user_id is not null and status in ('pending', 'confirmed', 'waitlisted');
create index if not exists event_reg_event_idx on public.event_registrations (event_id, status);

create table if not exists public.event_payments (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.event_registrations(id) on delete restrict,
  kind            text not null default 'payment' check (kind in ('payment', 'refund')),
  amount          bigint not null check (amount > 0),
  method          text not null default 'cash' check (method in ('cash', 'card', 'bank_transfer', 'online', 'other')),
  reference       text,
  paid_at         date not null default current_date,
  note            text,
  client_key      text unique,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  voided_at       timestamptz,
  void_reason     text
);
create index if not exists event_payments_reg_idx on public.event_payments (registration_id);

create table if not exists public.event_attendance (
  registration_id       uuid primary key references public.event_registrations(id) on delete restrict,
  attended_participants integer not null default 0 check (attended_participants >= 0),
  checked_in_at         timestamptz not null default now(),
  checked_by            uuid
);

-- triggers -----------------------------------------------------------------------
create or replace function public.event_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists events_touch on public.events;
create trigger events_touch before update on public.events for each row execute function public.event_touch();
drop trigger if exists event_reg_touch on public.event_registrations;
create trigger event_reg_touch before update on public.event_registrations for each row execute function public.event_touch();

create or replace function public.event_no_delete() returns trigger language plpgsql as $$
begin raise exception 'records cannot be deleted; cancel, void or archive them instead'; end $$;
drop trigger if exists event_reg_nodelete on public.event_registrations;
create trigger event_reg_nodelete before delete on public.event_registrations for each row execute function public.event_no_delete();
drop trigger if exists event_pay_nodelete on public.event_payments;
create trigger event_pay_nodelete before delete on public.event_payments for each row execute function public.event_no_delete();

create or replace function public.event_guard_payment() returns trigger language plpgsql as $$
begin
  if (to_jsonb(new) - array['voided_at', 'void_reason']) is distinct from (to_jsonb(old) - array['voided_at', 'void_reason']) then
    raise exception 'event payments are immutable; void the record instead';
  end if;
  return new;
end $$;
drop trigger if exists event_pay_guard on public.event_payments;
create trigger event_pay_guard before update on public.event_payments for each row execute function public.event_guard_payment();

-- RLS ------------------------------------------------------------------------------
alter table public.event_categories    enable row level security;
alter table public.events              enable row level security;
alter table public.event_gallery       enable row level security;
alter table public.event_registrations enable row level security;
alter table public.event_payments      enable row level security;
alter table public.event_attendance    enable row level security;

drop policy if exists "event_categories public read" on public.event_categories;
create policy "event_categories public read" on public.event_categories for select using (true);
drop policy if exists "event_categories admin write" on public.event_categories;
create policy "event_categories admin write" on public.event_categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "events public read" on public.events;
create policy "events public read" on public.events for select
  using (status in ('published', 'completed', 'cancelled') or public.is_admin());
drop policy if exists "events admin write" on public.events;
create policy "events admin write" on public.events for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "event_gallery public read" on public.event_gallery;
create policy "event_gallery public read" on public.event_gallery for select
  using (public.is_admin() or exists (select 1 from public.events e where e.id = event_id and e.status in ('published', 'completed', 'cancelled')));
drop policy if exists "event_gallery admin write" on public.event_gallery;
create policy "event_gallery admin write" on public.event_gallery for all using (public.is_admin()) with check (public.is_admin());

-- registrations / payments / attendance: admin only. Visitors write ONLY via event_register().
drop policy if exists "event_registrations admin read" on public.event_registrations;
create policy "event_registrations admin read" on public.event_registrations for select using (public.is_admin());
drop policy if exists "event_payments admin read" on public.event_payments;
create policy "event_payments admin read" on public.event_payments for select using (public.is_admin());
drop policy if exists "event_attendance admin read" on public.event_attendance;
create policy "event_attendance admin read" on public.event_attendance for select using (public.is_admin());

-- helpers ----------------------------------------------------------------------------
create or replace function public.event_require_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden: administrators only' using errcode = '42501';
  end if;
end $$;

-- "+98 912 345 6789", "۰۹۱۲۳۴۵۶۷۸۹", "00989123456789" → "9123456789"
create or replace function public.event_norm_phone(p text) returns text
language sql immutable as $$
  with d as (
    select regexp_replace(
             translate(coalesce(p, ''), '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789'),
             '\D', '', 'g') as v)
  select case
    when v ~ '^0098\d{10}$' then substr(v, 5)
    when v ~ '^98\d{10}$'   then substr(v, 3)
    when v ~ '^0\d{10}$'    then substr(v, 2)
    else v end
  from d;
$$;

create or replace function public.event_new_code() returns text
language plpgsql volatile as $$
declare alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text; i int;
begin
  loop
    c := 'NSH-';
    for i in 1..6 loop
      c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.event_registrations r where r.code = c);
  end loop;
  return c;
end $$;

-- seats currently held (pending + confirmed) — public, returns counts only
create or replace function public.event_availability(p_ids uuid[])
returns table (out_event uuid, out_taken integer, out_waitlisted integer)
language sql stable security definer set search_path = public as $$
  select e.id,
         coalesce(sum(r.participants) filter (where r.status in ('pending', 'confirmed')), 0)::int,
         coalesce(sum(r.participants) filter (where r.status = 'waitlisted'), 0)::int
    from public.events e
    left join public.event_registrations r on r.event_id = e.id
   where e.id = any (p_ids) and e.status in ('published', 'completed', 'cancelled')
   group by e.id;
$$;

-- fill free seats from the waiting list, oldest first (skips groups that don't fit)
create or replace function public.event_promote_waitlist(p_event uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare ev record; r record; taken integer; moved integer := 0; next_status event_reg_status;
begin
  select * into ev from public.events where id = p_event;
  if not found or ev.status <> 'published' or ev.capacity is null then return 0; end if;
  next_status := case when not ev.is_paid and ev.auto_confirm then 'confirmed' else 'pending' end;
  for r in select * from public.event_registrations
            where event_id = p_event and status = 'waitlisted' order by created_at, id loop
    select coalesce(sum(participants), 0) into taken from public.event_registrations
     where event_id = p_event and status in ('pending', 'confirmed');
    if taken + r.participants <= ev.capacity then
      update public.event_registrations set status = next_status, status_changed_at = now() where id = r.id;
      moved := moved + 1;
    end if;
  end loop;
  return moved;
end $$;

-- public registration --------------------------------------------------------------------
create or replace function public.event_register(
  p_event uuid, p_name text, p_phone text, p_email text, p_student boolean,
  p_participants integer, p_notes text
) returns table (out_id uuid, out_code text, out_status event_reg_status, out_position integer)
language plpgsql security definer set search_path = public as $$
declare
  ev record; v_phone text; taken integer; st event_reg_status; new_id uuid; new_code text; pos integer := 0; uid uuid := auth.uid();
begin
  select * into ev from public.events where id = p_event for update;      -- serialises concurrent sign-ups
  if not found or ev.status <> 'published' then raise exception 'event is not open for registration'; end if;
  if now() >= coalesce(ev.registration_deadline, ev.starts_at) then raise exception 'registration is closed'; end if;

  p_name := btrim(coalesce(p_name, ''));
  if char_length(p_name) < 2 or char_length(p_name) > 120 then raise exception 'invalid name'; end if;
  v_phone := public.event_norm_phone(p_phone);
  if v_phone !~ '^\d{7,15}$' or (v_phone ~ '^9' and v_phone !~ '^9\d{9}$' and char_length(v_phone) < 10) then raise exception 'invalid phone number'; end if;
  p_email := nullif(btrim(coalesce(p_email, '')), '');
  if p_email is not null and p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid email'; end if;
  if p_participants is null or p_participants < 1 or p_participants > ev.max_per_registration then
    raise exception 'participants must be between 1 and %', ev.max_per_registration;
  end if;
  if char_length(coalesce(p_notes, '')) > 1000 then raise exception 'notes are too long'; end if;
  if ev.capacity is not null and p_participants > ev.capacity then raise exception 'too many participants for this event'; end if;

  if exists (select 1 from public.event_registrations r
              where r.event_id = p_event and r.status in ('pending', 'confirmed', 'waitlisted')
                and (r.phone = v_phone or (uid is not null and r.user_id = uid))) then
    raise exception 'you are already registered for this event';
  end if;

  select coalesce(sum(r.participants), 0) into taken from public.event_registrations r
   where r.event_id = p_event and r.status in ('pending', 'confirmed');

  if ev.capacity is null or taken + p_participants <= ev.capacity then
    st := case when not ev.is_paid and ev.auto_confirm then 'confirmed' else 'pending' end;
  elsif ev.allow_waitlist then
    st := 'waitlisted';
  else
    raise exception 'this event is full';
  end if;

  new_code := public.event_new_code();
  insert into public.event_registrations (event_id, code, full_name, phone, email, is_student, participants, notes, status, user_id)
  values (p_event, new_code, p_name, v_phone, p_email, coalesce(p_student, false), p_participants, nullif(btrim(coalesce(p_notes, '')), ''), st, uid)
  returning id into new_id;

  if st = 'waitlisted' then
    select count(*) into pos from public.event_registrations r where r.event_id = p_event and r.status = 'waitlisted';
  end if;
  return query select new_id, new_code, st, pos;
end $$;

-- a registrant checks (or cancels) their own registration with code + phone
create or replace function public.event_lookup(p_code text, p_phone text)
returns table (
  out_id uuid, out_event uuid, out_name text, out_status event_reg_status, out_participants integer,
  out_position integer, out_due bigint, out_paid bigint
) language plpgsql stable security definer set search_path = public as $$
declare r record; ev record; pos integer := 0; paid bigint;
begin
  select * into r from public.event_registrations x
   where x.code = upper(btrim(coalesce(p_code, ''))) and x.phone = public.event_norm_phone(p_phone);
  if not found then return; end if;
  select * into ev from public.events where id = r.event_id;
  if r.status = 'waitlisted' then
    select count(*) into pos from public.event_registrations x
     where x.event_id = r.event_id and x.status = 'waitlisted' and (x.created_at, x.id) <= (r.created_at, r.id);
  end if;
  select coalesce(sum(case when kind = 'payment' then amount else -amount end), 0) into paid
    from public.event_payments where registration_id = r.id and voided_at is null;
  return query select r.id, r.event_id, r.full_name, r.status, r.participants, pos,
                      case when ev.is_paid then ev.price * r.participants else 0 end::bigint, paid;
end $$;

create or replace function public.event_cancel_own(p_code text, p_phone text) returns void
language plpgsql security definer set search_path = public as $$
declare r record; ev record;
begin
  select * into r from public.event_registrations x
   where x.code = upper(btrim(coalesce(p_code, ''))) and x.phone = public.event_norm_phone(p_phone);
  if not found then raise exception 'registration not found'; end if;
  select * into ev from public.events where id = r.event_id for update;
  select * into r from public.event_registrations where id = r.id for update;
  if r.status not in ('pending', 'confirmed', 'waitlisted') then raise exception 'registration cannot be cancelled'; end if;
  if now() >= ev.starts_at then raise exception 'the event has already started'; end if;
  update public.event_registrations set status = 'cancelled', status_changed_at = now() where id = r.id;
  perform public.event_promote_waitlist(ev.id);
end $$;

-- admin ----------------------------------------------------------------------------------
create or replace function public.event_set_registration_status(p_id uuid, p_status event_reg_status, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r record; ev record; taken integer; was_active boolean; will_active boolean;
begin
  perform public.event_require_admin();
  select * into r from public.event_registrations where id = p_id;
  if not found then raise exception 'registration not found'; end if;
  select * into ev from public.events where id = r.event_id for update;
  select * into r from public.event_registrations where id = p_id for update;

  was_active  := r.status in ('pending', 'confirmed');
  will_active := p_status in ('pending', 'confirmed');
  if will_active and not was_active and ev.capacity is not null then
    select coalesce(sum(participants), 0) into taken from public.event_registrations
     where event_id = ev.id and status in ('pending', 'confirmed') and id <> r.id;
    if taken + r.participants > ev.capacity then raise exception 'not enough seats for this registration'; end if;
  end if;
  if p_status in ('pending', 'confirmed', 'waitlisted') and r.status not in ('pending', 'confirmed', 'waitlisted') then
    -- re-activating a rejected/cancelled registration must not collide with a newer active one by the same phone
    if exists (select 1 from public.event_registrations x where x.event_id = r.event_id and x.phone = r.phone
                and x.id <> r.id and x.status in ('pending', 'confirmed', 'waitlisted')) then
      raise exception 'this person already has another active registration';
    end if;
  end if;

  update public.event_registrations
     set status = p_status, admin_note = coalesce(nullif(btrim(p_note), ''), admin_note), status_changed_at = now()
   where id = p_id;
  if was_active and not will_active then perform public.event_promote_waitlist(ev.id); end if;
end $$;

create or replace function public.event_record_payment(
  p_registration uuid, p_kind text, p_amount bigint, p_method text, p_reference text,
  p_paid_at date, p_note text, p_client_key text
) returns uuid language plpgsql security definer set search_path = public as $$
declare r record; ev record; due bigint; net bigint; new_id uuid;
begin
  perform public.event_require_admin();
  if p_amount is null or p_amount <= 0 then raise exception 'amount must be positive'; end if;
  if p_kind not in ('payment', 'refund') then raise exception 'invalid kind'; end if;
  if p_client_key is not null then
    select id into new_id from public.event_payments where client_key = p_client_key;
    if found then return new_id; end if;
  end if;
  select * into r from public.event_registrations where id = p_registration for update;
  if not found then raise exception 'registration not found'; end if;
  select * into ev from public.events where id = r.event_id;
  if not ev.is_paid then raise exception 'this event is free'; end if;
  due := ev.price * r.participants;
  select coalesce(sum(case when kind = 'payment' then amount else -amount end), 0) into net
    from public.event_payments where registration_id = r.id and voided_at is null;

  if p_kind = 'payment' then
    if r.status not in ('pending', 'confirmed') then raise exception 'only pending or confirmed registrations can be paid'; end if;
    if net + p_amount > due then raise exception 'payment exceeds the amount due'; end if;
  else
    if p_amount > net then raise exception 'refund exceeds the amount paid'; end if;
  end if;

  insert into public.event_payments (registration_id, kind, amount, method, reference, paid_at, note, client_key, created_by)
  values (r.id, p_kind, p_amount, coalesce(p_method, 'cash'), nullif(p_reference, ''), coalesce(p_paid_at, current_date),
          nullif(p_note, ''), nullif(p_client_key, ''), auth.uid())
  returning id into new_id;

  if p_kind = 'payment' and net + p_amount >= due and r.status = 'pending' then
    update public.event_registrations set status = 'confirmed', status_changed_at = now() where id = r.id;
  end if;
  return new_id;
end $$;

create or replace function public.event_void_payment(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  perform public.event_require_admin();
  if coalesce(btrim(p_reason), '') = '' then raise exception 'a reason is required'; end if;
  select * into p from public.event_payments where id = p_id for update;
  if not found then raise exception 'payment not found'; end if;
  if p.voided_at is not null then raise exception 'already voided'; end if;
  update public.event_payments set voided_at = now(), void_reason = p_reason where id = p_id;
end $$;

create or replace function public.event_set_attendance(p_registration uuid, p_attended integer) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  perform public.event_require_admin();
  select * into r from public.event_registrations where id = p_registration;
  if not found then raise exception 'registration not found'; end if;
  if r.status <> 'confirmed' then raise exception 'only confirmed registrations can be checked in'; end if;
  if p_attended is null or p_attended < 0 or p_attended > r.participants then raise exception 'invalid attendance'; end if;
  insert into public.event_attendance (registration_id, attended_participants, checked_by)
  values (p_registration, p_attended, auth.uid())
  on conflict (registration_id) do update set attended_participants = excluded.attended_participants, checked_in_at = now(), checked_by = auth.uid();
end $$;

-- storage: public bucket for event images, admin-only writes -----------------------------------
insert into storage.buckets (id, name, public) values ('events', 'events', true) on conflict (id) do nothing;
drop policy if exists "events storage public read" on storage.objects;
create policy "events storage public read" on storage.objects for select using (bucket_id = 'events');
drop policy if exists "events storage admin write" on storage.objects;
create policy "events storage admin write" on storage.objects for all
  using (bucket_id = 'events' and public.is_admin()) with check (bucket_id = 'events' and public.is_admin());
