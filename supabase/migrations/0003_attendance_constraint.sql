-- =============================================================================
-- One attendance record per enrollment per day, so marking attendance twice
-- for the same session updates the existing row instead of duplicating it.
-- =============================================================================
do $$ begin
  alter table public.attendance
    add constraint attendance_unique_session unique (enrollment_id, session_date);
exception when duplicate_object then null; end $$;
