-- =============================================================================
-- Connect admin <-> teacher <-> student data
--
-- 1. A teacher could not read the profile of the students in their own classes
--    (profiles are readable only by role=teacher / self / admin), so every
--    teacher-side list showed blank student names. A teacher may now read the
--    profiles of students enrolled in a class they teach — nobody else's.
-- 2. `enrollments.level` / `.progress` are shown to students but nobody could
--    set them (only admins can write enrollments). A security-definer function
--    lets the class's teacher or an admin update just those two columns.
-- Requires 0017 (is_class_teacher).
-- =============================================================================

create or replace function public.teaches_student(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments e
    join public.classes c on c.id = e.class_id
    where e.student_id = p_student and c.teacher_id = auth.uid()
  );
$$;

drop policy if exists "profiles teacher reads own students" on public.profiles;
create policy "profiles teacher reads own students" on public.profiles for select
  using (public.teaches_student(id));

create or replace function public.set_enrollment_progress(p_enrollment uuid, p_level text, p_progress int)
returns void language plpgsql security definer set search_path = public as $$
declare cls uuid;
begin
  select class_id into cls from public.enrollments where id = p_enrollment;
  if not found then raise exception 'enrollment not found'; end if;
  if not (public.is_admin() or public.is_class_teacher(cls)) then raise exception 'not allowed'; end if;
  if p_progress is not null and (p_progress < 0 or p_progress > 100) then raise exception 'invalid progress'; end if;
  if char_length(coalesce(p_level, '')) > 40 then raise exception 'invalid level'; end if;
  update public.enrollments
     set level = nullif(btrim(p_level), ''),
         progress = coalesce(p_progress, progress)
   where id = p_enrollment;
end $$;

revoke all on function public.set_enrollment_progress(uuid, text, int) from public, anon;
grant execute on function public.set_enrollment_progress(uuid, text, int) to authenticated;
-- NOTE: this function is called by the profiles RLS policy, which runs for EVERY
-- reader including signed-out visitors (the public teacher directory). It must
-- stay executable by anon, otherwise every public profiles query errors out.
-- It returns false when auth.uid() is null, so it exposes nothing.
grant execute on function public.teaches_student(uuid) to anon, authenticated;
