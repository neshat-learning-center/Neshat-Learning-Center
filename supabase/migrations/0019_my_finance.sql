-- =============================================================================
-- Read-only "my money" views for students and teachers.
-- The accounting tables are admin-only (RLS). These security-definer functions
-- return ONLY the caller's own rows, so a student sees their own fees and
-- payments and a teacher sees their own salary statements — nothing else.
-- Voided records are never shown. Requires 0015.
-- =============================================================================

-- per enrolled class: fee, received, refunded, still-pending (promised, not cash)
create or replace function public.my_student_account()
returns table (
  out_enrollment uuid, out_class uuid, out_class_title text, out_class_title_en text,
  out_fee bigint, out_paid bigint, out_refunded bigint, out_pending bigint
)
language sql stable security definer set search_path = public as $$
  select e.id, c.id, c.title, c.title_en,
         public.fin_enrollment_fee(e.id),
         coalesce(sum(p.amount) filter (where p.kind = 'payment' and p.status = 'completed'), 0)::bigint,
         coalesce(sum(p.amount) filter (where p.kind = 'refund'  and p.status = 'completed'), 0)::bigint,
         coalesce(sum(p.amount) filter (where p.kind = 'payment' and p.status = 'pending'),   0)::bigint
    from public.enrollments e
    join public.classes c on c.id = e.class_id
    left join public.student_payments p on p.enrollment_id = e.id and p.voided_at is null
   where e.student_id = auth.uid()
   group by e.id, c.id, c.title, c.title_en
   order by c.title;
$$;

create or replace function public.my_student_payments()
returns table (
  out_id uuid, out_class_title text, out_kind text, out_status text,
  out_amount bigint, out_method text, out_paid_at date, out_reference text
)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(c.title, p.class_title), p.kind::text, p.status::text,
         p.amount, p.method::text, p.paid_at, p.reference
    from public.student_payments p
    left join public.classes c on c.id = p.class_id
   where p.voided_at is null
     and (p.student_id = auth.uid()
          or p.enrollment_id in (select id from public.enrollments where student_id = auth.uid()))
   order by p.paid_at desc, p.created_at desc;
$$;

-- a teacher's own salary statements, with how much of each has been paid
create or replace function public.my_salary()
returns table (
  out_id uuid, out_period_key text, out_period_start date, out_period_end date,
  out_method text, out_rate bigint, out_sessions int, out_minutes int,
  out_gross bigint, out_paid bigint
)
language sql stable security definer set search_path = public as $$
  select s.id, s.period_key, s.period_start, s.period_end, s.method::text, s.rate,
         s.sessions, s.minutes, s.gross_amount,
         coalesce((select sum(sp.amount) from public.salary_payments sp
                    where sp.statement_id = s.id and sp.voided_at is null), 0)::bigint
    from public.salary_statements s
   where s.teacher_id = auth.uid()
   order by s.period_start desc;
$$;

create or replace function public.my_salary_payments()
returns table (out_id uuid, out_period_key text, out_amount bigint, out_method text, out_paid_at date, out_reference text)
language sql stable security definer set search_path = public as $$
  select sp.id, s.period_key, sp.amount, sp.method::text, sp.paid_at, sp.reference
    from public.salary_payments sp
    join public.salary_statements s on s.id = sp.statement_id
   where sp.teacher_id = auth.uid() and sp.voided_at is null
   order by sp.paid_at desc, sp.created_at desc;
$$;

revoke all on function public.my_student_account()  from public, anon;
revoke all on function public.my_student_payments() from public, anon;
revoke all on function public.my_salary()           from public, anon;
revoke all on function public.my_salary_payments()  from public, anon;
grant execute on function public.my_student_account()  to authenticated;
grant execute on function public.my_student_payments() to authenticated;
grant execute on function public.my_salary()           to authenticated;
grant execute on function public.my_salary_payments()  to authenticated;
