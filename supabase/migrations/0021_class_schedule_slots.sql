-- =============================================================================
-- Per-day class times.
-- A class used to have ONE start/end time applied to all its days, so a class that
-- meets Wed 15:00-16:00 and Sun 12:00-14:00 couldn't be entered. `schedule_slots`
-- holds one { day, start, end } per meeting day. schedule_days / start_time /
-- end_time are kept in sync on every save (start/end = the first day's slot) so
-- every existing reader keeps working.
-- =============================================================================
alter table public.classes add column if not exists schedule_slots jsonb;

-- backfill: every existing class gets one slot per day, all with its current time
update public.classes c
   set schedule_slots = (
     select jsonb_agg(jsonb_build_object(
              'day', d,
              'start', to_char(c.start_time, 'HH24:MI'),
              'end',   to_char(c.end_time,   'HH24:MI')))
       from unnest(c.schedule_days) as d)
 where c.schedule_slots is null
   and c.schedule_days is not null
   and cardinality(c.schedule_days) > 0
   and c.start_time is not null
   and c.end_time is not null;
