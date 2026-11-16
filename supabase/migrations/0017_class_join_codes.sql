-- =============================================================================
-- Class join codes — lets students who already study at Neshat link themselves
-- to their class without the admin typing anything.
--
--  * every class gets a random join code (backfilled + auto-created)
--  * a student enters the code -> enrolled instantly (or a pending request when
--    the class "requires approval")
--  * "I don't have the code": the student picks a class and sends a request,
--    the class's teacher (or an admin) approves/rejects it
--
-- Codes live in their OWN table: `classes` is readable by every signed-in user,
-- so a code column there would leak to all students.
-- =============================================================================

do $$ begin
  create type join_request_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- codes -----
-- 8 chars from an unambiguous alphabet (no 0/O/1/I/L/U), shown as XXXX-XXXX.
create or replace function public.gen_join_code()
returns text language plpgsql volatile as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
  b bytea;
  out text;
  i int;
begin
  loop
    b := uuid_send(gen_random_uuid());
    out := '';
    for i in 0..7 loop
      out := out || substr(alphabet, (get_byte(b, i) % length(alphabet)) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.class_join_codes where code = out);
  end loop;
  return out;
end $$;

create table if not exists public.class_join_codes (
  class_id         uuid primary key references public.classes(id) on delete cascade,
  code             text not null unique,
  require_approval boolean not null default false,
  rotated_at       timestamptz not null default now()
);

create table if not exists public.class_join_requests (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status     join_request_status not null default 'pending',
  via_code   boolean not null default false,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id) on delete set null,
  unique (class_id, student_id)
);
create index if not exists class_join_requests_class_idx on public.class_join_requests(class_id, status);

-- failed code guesses, for rate limiting
create table if not exists public.class_join_attempts (
  id         bigint generated always as identity primary key,
  student_id uuid not null,
  at         timestamptz not null default now()
);
create index if not exists class_join_attempts_idx on public.class_join_attempts(student_id, at);

-- new classes get a code automatically; existing ones are backfilled below
create or replace function public.class_join_code_on_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.class_join_codes(class_id, code) values (new.id, public.gen_join_code())
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists class_join_code_on_insert on public.classes;
create trigger class_join_code_on_insert after insert on public.classes
  for each row execute function public.class_join_code_on_insert();

insert into public.class_join_codes(class_id, code)
  select c.id, public.gen_join_code() from public.classes c
  where not exists (select 1 from public.class_join_codes j where j.class_id = c.id);
-- (collisions are ~1 in 10^11 and the unique constraint would reject one)

-- ------------------------------------------------------------------ RLS -----
alter table public.class_join_codes    enable row level security;
alter table public.class_join_requests enable row level security;
alter table public.class_join_attempts enable row level security;

create or replace function public.is_class_teacher(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes where id = p_class and teacher_id = auth.uid());
$$;

-- only the class's teacher and admins can read a code; nobody writes directly
create policy "join codes read" on public.class_join_codes for select
  using (public.is_admin() or public.is_class_teacher(class_id));

create policy "join requests read" on public.class_join_requests for select
  using (student_id = auth.uid() or public.is_admin() or public.is_class_teacher(class_id));
-- class_join_attempts: no policies = no access (only the security-definer functions touch it)

-- -------------------------------------------------------------- helpers -----
create or replace function public.join_enroll(p_class uuid, p_student uuid)
returns text language plpgsql security definer set search_path = public as $$
declare cap int; taken int;
begin
  if exists (select 1 from public.enrollments where class_id = p_class and student_id = p_student) then
    return 'already';
  end if;
  select capacity into cap from public.classes where id = p_class;
  if cap is not null then
    select count(*) into taken from public.enrollments where class_id = p_class;
    if taken >= cap then return 'full'; end if;
  end if;
  insert into public.enrollments(student_id, class_id) values (p_student, p_class)
  on conflict do nothing;
  return 'joined';
end $$;
revoke all on function public.join_enroll(uuid, uuid) from public, anon, authenticated;

-- ------------------------------------------------- student: join by code -----
-- returns: invalid | already | full | closed | pending | joined  (+ the class id when known)
create or replace function public.join_class_by_code(p_code text)
returns table (out_status text, out_class_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  norm text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  j public.class_join_codes%rowtype;
  cls public.classes%rowtype;
  res text;
begin
  if me is null then raise exception 'not signed in'; end if;

  if (select count(*) from public.class_join_attempts where student_id = me and at > now() - interval '15 minutes') >= 8 then
    raise exception 'too many attempts';
  end if;
  delete from public.class_join_attempts where at < now() - interval '1 day';

  select * into j from public.class_join_codes where code = norm;
  if not found then
    insert into public.class_join_attempts(student_id) values (me);
    return query select 'invalid'::text, null::uuid; return;
  end if;

  select * into cls from public.classes where id = j.class_id;
  if cls.status in ('finished', 'cancelled') then
    return query select 'closed'::text, cls.id; return;
  end if;

  if exists (select 1 from public.enrollments where class_id = cls.id and student_id = me) then
    return query select 'already'::text, cls.id; return;
  end if;

  if j.require_approval then
    insert into public.class_join_requests(class_id, student_id, via_code)
      values (cls.id, me, true)
      on conflict (class_id, student_id) do update
        set status = 'pending', via_code = true, decided_at = null, decided_by = null
        where public.class_join_requests.status <> 'pending';
    return query select 'pending'::text, cls.id; return;
  end if;

  res := public.join_enroll(cls.id, me);
  return query select res, cls.id;
end $$;

-- --------------------------------------- student: "I don't have the code" -----
create or replace function public.request_join_class(p_class uuid)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); cls public.classes%rowtype;
begin
  if me is null then raise exception 'not signed in'; end if;
  select * into cls from public.classes where id = p_class;
  if not found or cls.status in ('finished', 'cancelled') then return 'closed'; end if;
  if exists (select 1 from public.enrollments where class_id = p_class and student_id = me) then return 'already'; end if;
  if (select count(*) from public.class_join_requests where student_id = me and status = 'pending') >= 10 then
    raise exception 'too many pending requests';
  end if;
  insert into public.class_join_requests(class_id, student_id, via_code) values (p_class, me, false)
    on conflict (class_id, student_id) do update
      set status = 'pending', via_code = false, decided_at = null, decided_by = null
      where public.class_join_requests.status <> 'pending';
  return 'pending';
end $$;

-- student withdraws a pending request
create or replace function public.cancel_join_request(p_class uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.class_join_requests where class_id = p_class and student_id = auth.uid() and status = 'pending';
$$;

-- ------------------------------------------- teacher / admin: decide -----
create or replace function public.decide_join_request(p_request uuid, p_approve boolean)
returns text language plpgsql security definer set search_path = public as $$
declare r public.class_join_requests%rowtype; res text;
begin
  select * into r from public.class_join_requests where id = p_request;
  if not found then raise exception 'request not found'; end if;
  if not (public.is_admin() or public.is_class_teacher(r.class_id)) then raise exception 'not allowed'; end if;
  if r.status <> 'pending' then return r.status::text; end if;

  if p_approve then
    res := public.join_enroll(r.class_id, r.student_id);
    if res = 'full' then raise exception 'class is full'; end if;
    update public.class_join_requests set status = 'approved', decided_at = now(), decided_by = auth.uid() where id = p_request;
    return 'approved';
  end if;
  update public.class_join_requests set status = 'rejected', decided_at = now(), decided_by = auth.uid() where id = p_request;
  return 'rejected';
end $$;

create or replace function public.regenerate_join_code(p_class uuid)
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not (public.is_admin() or public.is_class_teacher(p_class)) then raise exception 'not allowed'; end if;
  c := public.gen_join_code();
  insert into public.class_join_codes(class_id, code) values (p_class, c)
    on conflict (class_id) do update set code = excluded.code, rotated_at = now();
  return c;
end $$;

create or replace function public.set_join_approval(p_class uuid, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() or public.is_class_teacher(p_class)) then raise exception 'not allowed'; end if;
  update public.class_join_codes set require_approval = p_on where class_id = p_class;
end $$;


-- pending requests for a class, with the student's name (teachers can't read student profiles directly)
create or replace function public.list_join_requests(p_class uuid)
returns table (out_id uuid, out_student_id uuid, out_name text, out_via_code boolean, out_created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_admin() or public.is_class_teacher(p_class)) then raise exception 'not allowed'; end if;
  return query
    select r.id, r.student_id, coalesce(nullif(p.full_name, ''), '—'), r.via_code, r.created_at
    from public.class_join_requests r
    left join public.profiles p on p.id = r.student_id
    where r.class_id = p_class and r.status = 'pending'
    order by r.created_at;
end $$;

-- ------------------------------------------------------------- grants -----
revoke all on function public.join_class_by_code(text)           from public, anon;
revoke all on function public.request_join_class(uuid)           from public, anon;
revoke all on function public.cancel_join_request(uuid)          from public, anon;
revoke all on function public.decide_join_request(uuid, boolean) from public, anon;
revoke all on function public.regenerate_join_code(uuid)         from public, anon;
revoke all on function public.set_join_approval(uuid, boolean)   from public, anon;
revoke all on function public.gen_join_code()                    from public, anon, authenticated;
revoke all on function public.list_join_requests(uuid)            from public, anon;
grant execute on function public.list_join_requests(uuid)            to authenticated;
grant execute on function public.join_class_by_code(text)           to authenticated;
grant execute on function public.request_join_class(uuid)           to authenticated;
grant execute on function public.cancel_join_request(uuid)          to authenticated;
grant execute on function public.decide_join_request(uuid, boolean) to authenticated;
grant execute on function public.regenerate_join_code(uuid)         to authenticated;
grant execute on function public.set_join_approval(uuid, boolean)   to authenticated;
