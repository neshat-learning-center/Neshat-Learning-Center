-- =============================================================================
-- Neshat Learning Center — Accounting & Financial Management
-- Run after 0001-0014.
--
-- Principles
--   * Currency is Toman, stored as INTEGER (bigint) — never floats.
--   * Admin-only: every table has RLS = is_admin(); every function re-checks.
--   * Ledger rows (payments, refunds, salary payments, book sales/purchases)
--     are IMMUTABLE. They can only be VOIDED (voided_at + reason), never
--     deleted or silently edited. Triggers enforce this even for admins.
--   * Multi-step money operations are SQL functions, so each runs inside one
--     transaction with row locks (no overpaying, no negative stock, no
--     duplicate salary statements). Idempotency keys stop double-submits.
--   * Every change is written to fin_audit_log.
-- =============================================================================

-- enums -----------------------------------------------------------------------
do $$ begin create type fin_salary_method as enum ('hourly', 'per_class', 'percentage');
exception when duplicate_object then null; end $$;
do $$ begin create type fin_pay_method as enum ('cash', 'card', 'bank_transfer', 'online', 'cheque', 'other');
exception when duplicate_object then null; end $$;
do $$ begin create type fin_payment_kind as enum ('payment', 'refund');
exception when duplicate_object then null; end $$;
do $$ begin create type fin_payment_status as enum ('completed', 'pending');
exception when duplicate_object then null; end $$;
do $$ begin create type fin_expense_category as enum (
  'rent', 'utilities', 'internet', 'teacher_salaries', 'staff_salaries',
  'marketing', 'book_purchases', 'office_supplies', 'maintenance', 'other');
exception when duplicate_object then null; end $$;

-- helpers ---------------------------------------------------------------------
create or replace function public.fin_require_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden: accounting is restricted to administrators' using errcode = '42501';
  end if;
end $$;

-- audit log -------------------------------------------------------------------
create table if not exists public.fin_audit_log (
  id         bigserial primary key,
  at         timestamptz not null default now(),
  actor      uuid,
  table_name text not null,
  row_id     text,
  action     text not null,
  old_row    jsonb,
  new_row    jsonb
);

create or replace function public.fin_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(new);
begin
  insert into public.fin_audit_log (actor, table_name, row_id, action, old_row, new_row)
  values (
    auth.uid(), tg_table_name,
    coalesce(j->>'id', j->>'teacher_id', j->>'enrollment_id', j->>'book_id'),
    tg_op,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    to_jsonb(new)
  );
  return new;
end $$;

-- never delete financial rows
create or replace function public.fin_no_delete() returns trigger
language plpgsql as $$
begin
  raise exception 'financial records cannot be deleted; void them instead';
end $$;

-- ledger rows: only the listed columns may ever change (void flags, FK set-null)
create or replace function public.fin_guard_ledger() returns trigger
language plpgsql as $$
begin
  if (to_jsonb(new) - tg_argv) is distinct from (to_jsonb(old) - tg_argv) then
    raise exception 'financial ledger rows are immutable; void the record instead';
  end if;
  return new;
end $$;

-- settings --------------------------------------------------------------------
create table if not exists public.fin_settings (
  id                      boolean primary key default true check (id),
  default_salary_method   fin_salary_method not null default 'per_class',
  default_salary_rate     bigint not null default 0 check (default_salary_rate >= 0),
  default_session_minutes integer not null default 90 check (default_session_minutes > 0),
  book_markup_percent     integer not null default 20 check (book_markup_percent >= 0),
  low_stock_threshold     integer not null default 5 check (low_stock_threshold >= 0),
  calendar                text not null default 'jalali' check (calendar in ('jalali', 'gregorian')),
  default_report_range    text not null default 'this_month'
                          check (default_report_range in ('this_month', 'last_month', 'last_3_months', 'this_year')),
  updated_at              timestamptz not null default now()
);
insert into public.fin_settings (id) values (true) on conflict do nothing;

-- teacher financial profile ---------------------------------------------------
-- rate: Toman for hourly / per_class; for percentage it is basis points
-- (2500 = 25.00%) so the whole thing stays integer.
create table if not exists public.teacher_finance_profiles (
  teacher_id uuid primary key references public.profiles(id) on delete cascade,
  method     fin_salary_method not null,
  rate       bigint not null check (rate >= 0 and (method <> 'percentage' or rate <= 10000)),
  updated_at timestamptz not null default now()
);

-- student fees & payments -----------------------------------------------------
-- fee = override for one enrollment; otherwise the course price applies.
create table if not exists public.student_fees (
  enrollment_id uuid primary key references public.enrollments(id) on delete cascade,
  fee_amount    bigint not null check (fee_amount >= 0),
  updated_at    timestamptz not null default now()
);

create table if not exists public.student_payments (
  id            uuid primary key default gen_random_uuid(),
  enrollment_id uuid references public.enrollments(id) on delete set null,
  student_id    uuid references public.profiles(id) on delete set null,
  class_id      uuid references public.classes(id) on delete set null,
  student_name  text,
  class_title   text,
  kind          fin_payment_kind not null default 'payment',
  status        fin_payment_status not null default 'completed',
  amount        bigint not null check (amount > 0),
  method        fin_pay_method not null default 'cash',
  paid_at       date not null default current_date,
  reference     text,
  note          text,
  client_key    text unique,
  created_by    uuid,
  created_at    timestamptz not null default now(),
  voided_at     timestamptz,
  void_reason   text,
  check (kind = 'payment' or status = 'completed')
);
create index if not exists student_payments_paid_at_idx on public.student_payments (paid_at);
create index if not exists student_payments_enrollment_idx on public.student_payments (enrollment_id);

-- teacher salaries ------------------------------------------------------------
create table if not exists public.salary_statements (
  id            uuid primary key default gen_random_uuid(),
  teacher_id    uuid references public.profiles(id) on delete set null,
  teacher_name  text,
  period_key    text not null,            -- '1405-07' (jalali) or '2026-10'
  period_start  date not null,
  period_end    date not null,
  method        fin_salary_method not null,
  rate          bigint not null,
  sessions      integer not null default 0,
  minutes       integer not null default 0,
  revenue_base  bigint not null default 0,
  gross_amount  bigint not null check (gross_amount >= 0),
  created_by    uuid,
  created_at    timestamptz not null default now(),
  unique (teacher_id, period_key)
);

create table if not exists public.salary_payments (
  id           uuid primary key default gen_random_uuid(),
  statement_id uuid not null references public.salary_statements(id) on delete restrict,
  teacher_id   uuid references public.profiles(id) on delete set null,
  amount       bigint not null check (amount > 0),
  method       fin_pay_method not null default 'bank_transfer',
  paid_at      date not null default current_date,
  reference    text,
  note         text,
  client_key   text unique,
  created_by   uuid,
  created_at   timestamptz not null default now(),
  voided_at    timestamptz,
  void_reason  text
);
create index if not exists salary_payments_statement_idx on public.salary_payments (statement_id);

-- book inventory & sales ------------------------------------------------------
-- stock_qty / stock_value (total cost of units on hand) are maintained ONLY by
-- the functions below, so cost of goods sold uses exact integer weighted-average
-- cost.
create table if not exists public.book_inventory (
  id             uuid primary key default gen_random_uuid(),
  book_id        uuid unique references public.books(id) on delete set null,
  title_snapshot text not null,
  selling_price  bigint not null default 0 check (selling_price >= 0),
  last_unit_cost bigint not null default 0 check (last_unit_cost >= 0),
  stock_qty      integer not null default 0 check (stock_qty >= 0),
  stock_value    bigint not null default 0 check (stock_value >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.book_purchases (
  id           uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references public.book_inventory(id) on delete restrict,
  quantity     integer not null check (quantity > 0),
  unit_cost    bigint not null check (unit_cost >= 0),
  total        bigint not null check (total >= 0),
  purchased_at date not null default current_date,
  method       fin_pay_method not null default 'cash',
  supplier     text,
  note         text,
  client_key   text unique,
  created_by   uuid,
  created_at   timestamptz not null default now(),
  voided_at    timestamptz,
  void_reason  text
);

create table if not exists public.book_sales (
  id           uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references public.book_inventory(id) on delete restrict,
  title        text not null,
  quantity     integer not null check (quantity > 0),
  unit_price   bigint not null check (unit_price >= 0),
  revenue      bigint not null check (revenue >= 0),
  cogs         bigint not null check (cogs >= 0),
  sold_at      date not null default current_date,
  method       fin_pay_method not null default 'cash',
  student_id   uuid references public.profiles(id) on delete set null,
  buyer_name   text,
  note         text,
  client_key   text unique,
  created_by   uuid,
  created_at   timestamptz not null default now(),
  voided_at    timestamptz,
  void_reason  text
);
create index if not exists book_sales_sold_at_idx on public.book_sales (sold_at);

-- expenses & other income -----------------------------------------------------
-- 'teacher_salaries' and 'book_purchases' exist as categories for reporting, but
-- they are NOT enterable by hand: salary payments and inventory purchases already
-- create those outflows, so a manual row would double count them.
create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  category     fin_expense_category not null
               check (category not in ('teacher_salaries', 'book_purchases')),
  amount       bigint not null check (amount > 0),
  expense_date date not null default current_date,
  method       fin_pay_method not null default 'cash',
  description  text,
  receipt_path text,
  client_key   text unique,
  created_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  voided_at    timestamptz,
  void_reason  text
);
create index if not exists expenses_date_idx on public.expenses (expense_date);

create table if not exists public.other_income (
  id          uuid primary key default gen_random_uuid(),
  amount      bigint not null check (amount > 0),
  income_date date not null default current_date,
  source      text not null,
  method      fin_pay_method not null default 'cash',
  note        text,
  client_key  text unique,
  created_by  uuid,
  created_at  timestamptz not null default now(),
  voided_at   timestamptz,
  void_reason text
);
create index if not exists other_income_date_idx on public.other_income (income_date);

-- guards + audit triggers -------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'fin_settings','teacher_finance_profiles','student_fees','student_payments',
    'salary_statements','salary_payments','book_inventory','book_purchases',
    'book_sales','expenses','other_income'
  ] loop
    execute format('drop trigger if exists %I_audit on public.%I', t, t);
    execute format('create trigger %I_audit after insert or update on public.%I for each row execute function public.fin_audit()', t, t);
  end loop;

  foreach t in array array[
    'student_payments','salary_statements','salary_payments','book_inventory',
    'book_purchases','book_sales','expenses','other_income'
  ] loop
    execute format('drop trigger if exists %I_nodelete on public.%I', t, t);
    execute format('create trigger %I_nodelete before delete on public.%I for each row execute function public.fin_no_delete()', t, t);
  end loop;
end $$;

-- a student payment may only move pending -> completed (confirm), never change otherwise
create or replace function public.fin_guard_student_payment() returns trigger
language plpgsql as $$
declare allowed text[] := array['voided_at', 'void_reason', 'enrollment_id', 'student_id', 'class_id'];
begin
  if old.status = 'pending' then allowed := allowed || array['status', 'paid_at']; end if;
  if (to_jsonb(new) - allowed) is distinct from (to_jsonb(old) - allowed) then
    raise exception 'financial ledger rows are immutable; void the record instead';
  end if;
  return new;
end $$;
drop trigger if exists student_payments_guard on public.student_payments;
create trigger student_payments_guard before update on public.student_payments
  for each row execute function public.fin_guard_student_payment();

drop trigger if exists salary_payments_guard on public.salary_payments;
create trigger salary_payments_guard before update on public.salary_payments
  for each row execute function public.fin_guard_ledger('voided_at', 'void_reason', 'teacher_id');

drop trigger if exists book_purchases_guard on public.book_purchases;
create trigger book_purchases_guard before update on public.book_purchases
  for each row execute function public.fin_guard_ledger('voided_at', 'void_reason');

drop trigger if exists book_sales_guard on public.book_sales;
create trigger book_sales_guard before update on public.book_sales
  for each row execute function public.fin_guard_ledger('voided_at', 'void_reason', 'student_id');

-- salary statements are frozen too (they are only replaced through
-- fin_save_salary_statement, which sets fin.rpc); FK set-null is allowed
create or replace function public.fin_guard_statement() returns trigger
language plpgsql as $$
begin
  if coalesce(current_setting('fin.rpc', true), '') <> 'on'
     and (to_jsonb(new) - 'teacher_id') is distinct from (to_jsonb(old) - 'teacher_id') then
    raise exception 'salary statements can only be changed through fin_save_salary_statement';
  end if;
  return new;
end $$;
drop trigger if exists salary_statements_guard on public.salary_statements;
create trigger salary_statements_guard before update on public.salary_statements
  for each row execute function public.fin_guard_statement();

-- inventory: stock fields only move through the RPCs (fin.rpc = on)
create or replace function public.fin_guard_inventory() returns trigger
language plpgsql as $$
begin
  if coalesce(current_setting('fin.rpc', true), '') <> 'on'
     and (to_jsonb(new) - array['selling_price','title_snapshot','updated_at','book_id'])
         is distinct from (to_jsonb(old) - array['selling_price','title_snapshot','updated_at','book_id']) then
    raise exception 'stock can only change through purchases and sales';
  end if;
  return new;
end $$;
drop trigger if exists book_inventory_guard on public.book_inventory;
create trigger book_inventory_guard before update on public.book_inventory
  for each row execute function public.fin_guard_inventory();

-- RLS: admin read everywhere; direct writes only where safe ----------------------
do $$
declare t text;
begin
  foreach t in array array[
    'fin_audit_log','fin_settings','teacher_finance_profiles','student_fees',
    'student_payments','salary_statements','salary_payments','book_inventory',
    'book_purchases','book_sales','expenses','other_income'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s admin read" on public.%I', t, t);
    execute format('create policy "%s admin read" on public.%I for select using (public.is_admin())', t, t);
  end loop;
end $$;

-- plain admin writes (no money-movement invariants): settings, rates, expenses, other income
drop policy if exists "fin_settings admin update" on public.fin_settings;
create policy "fin_settings admin update" on public.fin_settings for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tfp admin write" on public.teacher_finance_profiles;
create policy "tfp admin write" on public.teacher_finance_profiles for insert with check (public.is_admin());
drop policy if exists "tfp admin update" on public.teacher_finance_profiles;
create policy "tfp admin update" on public.teacher_finance_profiles for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "expenses admin insert" on public.expenses;
create policy "expenses admin insert" on public.expenses for insert with check (public.is_admin());
drop policy if exists "expenses admin update" on public.expenses;
create policy "expenses admin update" on public.expenses for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "other_income admin insert" on public.other_income;
create policy "other_income admin insert" on public.other_income for insert with check (public.is_admin());
drop policy if exists "other_income admin update" on public.other_income;
create policy "other_income admin update" on public.other_income for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "book_inventory admin update" on public.book_inventory;
create policy "book_inventory admin update" on public.book_inventory for update
  using (public.is_admin()) with check (public.is_admin());
-- (student_payments, salary_*, book_purchases, book_sales, student_fees: NO direct
--  insert/update policy — they are written only by the security-definer functions.)

-- =============================================================================
-- Money-movement functions (each runs in a single transaction)
-- =============================================================================

-- fee for one enrollment: override, else the course price, else 0
create or replace function public.fin_enrollment_fee(p_enrollment uuid) returns bigint
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select f.fee_amount from public.student_fees f where f.enrollment_id = p_enrollment),
    (select co.price::bigint from public.enrollments en
       join public.classes cl on cl.id = en.class_id
       join public.courses co on co.id = cl.course_id
      where en.id = p_enrollment),
    0);
$$;

-- net cash received for an enrollment (completed payments minus completed refunds)
create or replace function public.fin_enrollment_received(p_enrollment uuid) returns bigint
language sql stable security definer set search_path = public as $$
  select coalesce(sum(case when kind = 'payment' then amount else -amount end), 0)
    from public.student_payments
   where enrollment_id = p_enrollment and status = 'completed' and voided_at is null;
$$;

create or replace function public.fin_set_student_fee(p_enrollment uuid, p_fee bigint) returns void
language plpgsql security definer set search_path = public as $$
declare recv bigint;
begin
  perform public.fin_require_admin();
  if p_fee is null or p_fee < 0 then raise exception 'fee must not be negative'; end if;
  perform 1 from public.enrollments where id = p_enrollment for update;
  if not found then raise exception 'enrollment not found'; end if;
  recv := public.fin_enrollment_received(p_enrollment);
  if p_fee < recv then raise exception 'fee cannot be lower than the amount already received'; end if;
  insert into public.student_fees (enrollment_id, fee_amount) values (p_enrollment, p_fee)
  on conflict (enrollment_id) do update set fee_amount = excluded.fee_amount, updated_at = now();
end $$;

create or replace function public.fin_record_student_payment(
  p_enrollment uuid, p_amount bigint, p_kind fin_payment_kind, p_status fin_payment_status,
  p_method fin_pay_method, p_paid_at date, p_reference text, p_note text, p_client_key text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  e record; fee bigint; recv bigint; new_id uuid; st fin_payment_status;
begin
  perform public.fin_require_admin();
  if p_amount is null or p_amount <= 0 then raise exception 'amount must be positive'; end if;

  if p_client_key is not null then
    select id into new_id from public.student_payments where client_key = p_client_key;
    if found then return new_id; end if;
  end if;

  select en.id, en.student_id, en.class_id, cl.title as class_title, pr.full_name
    into e
    from public.enrollments en
    join public.classes cl on cl.id = en.class_id
    left join public.profiles pr on pr.id = en.student_id
   where en.id = p_enrollment
   for update of en;
  if not found then raise exception 'enrollment not found'; end if;

  fee  := public.fin_enrollment_fee(p_enrollment);
  recv := public.fin_enrollment_received(p_enrollment);
  st   := case when p_kind = 'refund' then 'completed' else p_status end;

  if p_kind = 'payment' and st = 'completed' then
    if fee <= 0 then raise exception 'course fee is not set for this enrollment'; end if;
    if recv + p_amount > fee then raise exception 'payment exceeds the remaining balance'; end if;
  elsif p_kind = 'refund' then
    if p_amount > recv then raise exception 'refund exceeds the amount received'; end if;
  end if;

  insert into public.student_payments
    (enrollment_id, student_id, class_id, student_name, class_title, kind, status, amount,
     method, paid_at, reference, note, client_key, created_by)
  values
    (e.id, e.student_id, e.class_id, e.full_name, e.class_title, p_kind, st, p_amount,
     p_method, coalesce(p_paid_at, current_date), nullif(p_reference, ''), nullif(p_note, ''),
     nullif(p_client_key, ''), auth.uid())
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.fin_confirm_student_payment(p_id uuid, p_paid_at date) returns void
language plpgsql security definer set search_path = public as $$
declare p record; fee bigint; recv bigint;
begin
  perform public.fin_require_admin();
  select * into p from public.student_payments where id = p_id for update;
  if not found then raise exception 'payment not found'; end if;
  if p.status <> 'pending' or p.voided_at is not null then raise exception 'payment is not pending'; end if;
  if p.enrollment_id is null then raise exception 'enrollment no longer exists'; end if;
  perform 1 from public.enrollments where id = p.enrollment_id for update;
  fee  := public.fin_enrollment_fee(p.enrollment_id);
  recv := public.fin_enrollment_received(p.enrollment_id);
  if recv + p.amount > fee then raise exception 'payment exceeds the remaining balance'; end if;
  update public.student_payments
     set status = 'completed', paid_at = coalesce(p_paid_at, p.paid_at) where id = p_id;
end $$;

create or replace function public.fin_void_student_payment(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare p record; recv bigint;
begin
  perform public.fin_require_admin();
  if coalesce(trim(p_reason), '') = '' then raise exception 'a reason is required'; end if;
  select * into p from public.student_payments where id = p_id for update;
  if not found then raise exception 'payment not found'; end if;
  if p.voided_at is not null then raise exception 'already voided'; end if;
  if p.enrollment_id is not null then
    perform 1 from public.enrollments where id = p.enrollment_id for update;
    recv := public.fin_enrollment_received(p.enrollment_id);
    if p.kind = 'payment' and p.status = 'completed' and recv - p.amount < 0 then
      raise exception 'cannot void: refunds already issued against this payment';
    end if;
  end if;
  update public.student_payments set voided_at = now(), void_reason = p_reason where id = p_id;
end $$;

-- salary statements -----------------------------------------------------------
create or replace function public.fin_save_salary_statement(
  p_teacher uuid, p_period_key text, p_start date, p_end date, p_method fin_salary_method,
  p_rate bigint, p_sessions integer, p_minutes integer, p_revenue bigint, p_gross bigint,
  p_replace boolean
) returns uuid
language plpgsql security definer set search_path = public as $$
declare st record; tname text; new_id uuid;
begin
  perform public.fin_require_admin();
  perform set_config('fin.rpc', 'on', true);
  if p_gross is null or p_gross < 0 then raise exception 'invalid salary amount'; end if;
  select full_name into tname from public.profiles where id = p_teacher;

  select * into st from public.salary_statements
   where teacher_id = p_teacher and period_key = p_period_key for update;
  if found then
    if exists (select 1 from public.salary_payments
                where statement_id = st.id and voided_at is null) then
      raise exception 'this statement already has payments and cannot be recalculated';
    end if;
    if not p_replace then raise exception 'a statement for this teacher and period already exists'; end if;
    update public.salary_statements
       set method = p_method, rate = p_rate, sessions = p_sessions, minutes = p_minutes,
           revenue_base = p_revenue, gross_amount = p_gross, teacher_name = tname,
           period_start = p_start, period_end = p_end
     where id = st.id;
    return st.id;
  end if;

  insert into public.salary_statements
    (teacher_id, teacher_name, period_key, period_start, period_end, method, rate,
     sessions, minutes, revenue_base, gross_amount, created_by)
  values
    (p_teacher, tname, p_period_key, p_start, p_end, p_method, p_rate,
     p_sessions, p_minutes, p_revenue, p_gross, auth.uid())
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.fin_record_salary_payment(
  p_statement uuid, p_amount bigint, p_method fin_pay_method, p_paid_at date,
  p_reference text, p_note text, p_client_key text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare st record; paid bigint; new_id uuid;
begin
  perform public.fin_require_admin();
  if p_amount is null or p_amount <= 0 then raise exception 'amount must be positive'; end if;

  if p_client_key is not null then
    select id into new_id from public.salary_payments where client_key = p_client_key;
    if found then return new_id; end if;
  end if;

  select * into st from public.salary_statements where id = p_statement for update;
  if not found then raise exception 'salary statement not found'; end if;
  select coalesce(sum(amount), 0) into paid
    from public.salary_payments where statement_id = p_statement and voided_at is null;
  if paid + p_amount > st.gross_amount then
    raise exception 'payment exceeds the remaining salary balance';
  end if;

  insert into public.salary_payments
    (statement_id, teacher_id, amount, method, paid_at, reference, note, client_key, created_by)
  values
    (p_statement, st.teacher_id, p_amount, p_method, coalesce(p_paid_at, current_date),
     nullif(p_reference, ''), nullif(p_note, ''), nullif(p_client_key, ''), auth.uid())
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.fin_void_salary_payment(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  perform public.fin_require_admin();
  if coalesce(trim(p_reason), '') = '' then raise exception 'a reason is required'; end if;
  select * into p from public.salary_payments where id = p_id for update;
  if not found then raise exception 'payment not found'; end if;
  if p.voided_at is not null then raise exception 'already voided'; end if;
  update public.salary_payments set voided_at = now(), void_reason = p_reason where id = p_id;
end $$;

-- books -----------------------------------------------------------------------
create or replace function public.fin_inventory_add(p_book uuid, p_selling bigint) returns uuid
language plpgsql security definer set search_path = public as $$
declare t text; new_id uuid;
begin
  perform public.fin_require_admin();
  perform set_config('fin.rpc', 'on', true);
  select coalesce(title->>'fa', title->>'en') into t from public.books where id = p_book;
  if t is null then raise exception 'book not found'; end if;
  if exists (select 1 from public.book_inventory where book_id = p_book) then
    raise exception 'this book is already in the inventory';
  end if;
  insert into public.book_inventory (book_id, title_snapshot, selling_price)
  values (p_book, t, greatest(coalesce(p_selling, 0), 0)) returning id into new_id;
  return new_id;
end $$;

create or replace function public.fin_record_book_purchase(
  p_inventory uuid, p_qty integer, p_unit_cost bigint, p_date date, p_method fin_pay_method,
  p_supplier text, p_note text, p_client_key text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv record; new_id uuid;
begin
  perform public.fin_require_admin();
  perform set_config('fin.rpc', 'on', true);
  if p_qty is null or p_qty <= 0 then raise exception 'quantity must be positive'; end if;
  if p_unit_cost is null or p_unit_cost < 0 then raise exception 'unit cost must not be negative'; end if;
  if p_client_key is not null then
    select id into new_id from public.book_purchases where client_key = p_client_key;
    if found then return new_id; end if;
  end if;
  select * into inv from public.book_inventory where id = p_inventory for update;
  if not found then raise exception 'inventory item not found'; end if;

  insert into public.book_purchases
    (inventory_id, quantity, unit_cost, total, purchased_at, method, supplier, note, client_key, created_by)
  values
    (p_inventory, p_qty, p_unit_cost, p_qty * p_unit_cost, coalesce(p_date, current_date), p_method,
     nullif(p_supplier, ''), nullif(p_note, ''), nullif(p_client_key, ''), auth.uid())
  returning id into new_id;

  update public.book_inventory
     set stock_qty = stock_qty + p_qty,
         stock_value = stock_value + p_qty * p_unit_cost,
         last_unit_cost = p_unit_cost, updated_at = now()
   where id = p_inventory;
  return new_id;
end $$;

create or replace function public.fin_record_book_sale(
  p_inventory uuid, p_qty integer, p_unit_price bigint, p_date date, p_method fin_pay_method,
  p_student uuid, p_buyer text, p_note text, p_client_key text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv record; new_id uuid; cogs bigint;
begin
  perform public.fin_require_admin();
  perform set_config('fin.rpc', 'on', true);
  if p_qty is null or p_qty <= 0 then raise exception 'quantity must be positive'; end if;
  if p_unit_price is null or p_unit_price < 0 then raise exception 'price must not be negative'; end if;
  if p_client_key is not null then
    select id into new_id from public.book_sales where client_key = p_client_key;
    if found then return new_id; end if;
  end if;
  select * into inv from public.book_inventory where id = p_inventory for update;
  if not found then raise exception 'inventory item not found'; end if;
  if p_qty > inv.stock_qty then raise exception 'insufficient stock'; end if;

  -- exact integer weighted-average cost; the last unit absorbs the rounding remainder
  cogs := case when p_qty = inv.stock_qty then inv.stock_value
               else round(inv.stock_value::numeric * p_qty / inv.stock_qty)::bigint end;

  insert into public.book_sales
    (inventory_id, title, quantity, unit_price, revenue, cogs, sold_at, method, student_id,
     buyer_name, note, client_key, created_by)
  values
    (p_inventory, inv.title_snapshot, p_qty, p_unit_price, p_qty * p_unit_price, cogs,
     coalesce(p_date, current_date), p_method, p_student, nullif(p_buyer, ''), nullif(p_note, ''),
     nullif(p_client_key, ''), auth.uid())
  returning id into new_id;

  update public.book_inventory
     set stock_qty = stock_qty - p_qty, stock_value = stock_value - cogs, updated_at = now()
   where id = p_inventory;
  return new_id;
end $$;

create or replace function public.fin_void_book_sale(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare s record;
begin
  perform public.fin_require_admin();
  perform set_config('fin.rpc', 'on', true);
  if coalesce(trim(p_reason), '') = '' then raise exception 'a reason is required'; end if;
  select * into s from public.book_sales where id = p_id for update;
  if not found then raise exception 'sale not found'; end if;
  if s.voided_at is not null then raise exception 'already voided'; end if;
  perform 1 from public.book_inventory where id = s.inventory_id for update;
  update public.book_sales set voided_at = now(), void_reason = p_reason where id = p_id;
  update public.book_inventory
     set stock_qty = stock_qty + s.quantity, stock_value = stock_value + s.cogs, updated_at = now()
   where id = s.inventory_id;
end $$;

create or replace function public.fin_void_book_purchase(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare p record; inv record;
begin
  perform public.fin_require_admin();
  perform set_config('fin.rpc', 'on', true);
  if coalesce(trim(p_reason), '') = '' then raise exception 'a reason is required'; end if;
  select * into p from public.book_purchases where id = p_id for update;
  if not found then raise exception 'purchase not found'; end if;
  if p.voided_at is not null then raise exception 'already voided'; end if;
  select * into inv from public.book_inventory where id = p.inventory_id for update;
  if inv.stock_qty < p.quantity then
    raise exception 'cannot void: those copies have already been sold';
  end if;
  update public.book_purchases set voided_at = now(), void_reason = p_reason where id = p_id;
  update public.book_inventory
     set stock_qty = stock_qty - p.quantity,
         stock_value = greatest(stock_value - p.total, 0), updated_at = now()
   where id = p.inventory_id;
end $$;

-- receipts: private bucket, admin only ----------------------------------------
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "receipts admin all" on storage.objects;
create policy "receipts admin all" on storage.objects for all
  using (bucket_id = 'receipts' and public.is_admin())
  with check (bucket_id = 'receipts' and public.is_admin());

-- held sessions: one row per class per day on which attendance was taken.
-- This is what "completed classes" means for salary calculation.
create or replace view public.fin_class_sessions with (security_invoker = true) as
  select distinct e.class_id, a.session_date
    from public.attendance a
    join public.enrollments e on e.id = a.enrollment_id;
