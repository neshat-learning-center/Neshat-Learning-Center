"use client";

import { useActionState, useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { ClassMode, ClassRow } from "@/lib/supabase/types";
import { Field, TextInput, Select, TimeSelect, SubmitButton } from "@/components/admin/fields";
import { DatePicker } from "@/components/admin/DatePicker";
import { WEEKDAYS, dayLabel } from "@/lib/schedule";
import { createClass, updateClass, type AdminFormState } from "@/lib/actions/admin/classes";

export function ClassForm({
  dict,
  locale,
  klass,
  courses,
  teachers,
  lockedCourseId,
  returnTo,
}: {
  dict: Dictionary;
  locale: Locale;
  klass?: ClassRow;
  courses?: { id: string; title: string }[];
  teachers: { id: string; name: string }[];
  /** When set (e.g. this form is embedded on that course's own edit page),
   * the course is fixed and the picker is hidden instead of shown. */
  lockedCourseId?: string;
  /** Where to send the admin back after saving, e.g. the course edit page
   * this form is embedded on — defaults to the classes list. */
  returnTo?: string;
}) {
  const action = klass ? updateClass.bind(null, locale, klass.id) : createClass.bind(null, locale);
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(action, {});
  const [mode, setMode] = useState<ClassMode>(klass?.mode ?? "offline");
  const a = dict.admin;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {returnTo && <input type="hidden" name="return_to" value={returnTo} />}

      <div className="grid gap-6 sm:grid-cols-2">
        {lockedCourseId ? (
          <input type="hidden" name="course_id" value={lockedCourseId} />
        ) : (
          <Field label={a.course}>
            <Select name="course_id" defaultValue={klass?.course_id ?? ""}>
              <option value="">{a.noCourse}</option>
              {courses?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={a.teacher}>
          <Select name="teacher_id" defaultValue={klass?.teacher_id ?? ""}>
            <option value="">{a.noTeacher}</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label={a.mode}>
        <Select name="mode" defaultValue={mode} onChange={(e) => setMode(e.target.value as ClassMode)}>
          <option value="offline">{a.inPerson}</option>
          <option value="online">{a.online}</option>
          <option value="both">{a.bothModes}</option>
        </Select>
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        {mode !== "online" && (
          <Field label={a.classroom}>
            <TextInput name="classroom" defaultValue={klass?.classroom ?? ""} />
          </Field>
        )}
        {mode !== "offline" && (
          <Field label={a.onlineMeetingUrl}>
            <TextInput name="online_meeting_url" dir="ltr" className="text-start" defaultValue={klass?.online_meeting_url ?? ""} />
          </Field>
        )}
      </div>

      <Field label={a.scheduleDays}>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => (
            <label key={day} className="cursor-pointer">
              <input
                type="checkbox"
                name="schedule_days"
                value={day}
                defaultChecked={klass?.schedule_days?.includes(day) ?? false}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border border-line-strong px-4 py-2 text-sm font-medium text-ink transition-colors peer-checked:border-accent peer-checked:bg-accent peer-checked:text-slate">
                {dayLabel(day, locale)}
              </span>
            </label>
          ))}
        </div>
      </Field>

      <div>
        <span className="text-sm font-medium text-ink">{a.classTime}</span>
        <div className="mt-2 grid gap-6 sm:grid-cols-2">
          <Field label={a.classStartTime}>
            <TimeSelect name="start_time" required defaultValue={klass?.start_time} />
          </Field>
          <Field label={a.classEndTime}>
            <TimeSelect name="end_time" required defaultValue={klass?.end_time} />
          </Field>
        </div>
      </div>

      <Field label={a.startDate}>
        <DatePicker
          name="start_date"
          locale={locale}
          defaultValue={klass?.start_date}
          clearLabel={a.clear}
          todayLabel={a.today}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.status}>
          <Select name="status" defaultValue={klass?.status ?? "upcoming"}>
            <option value="upcoming">{a.statusUpcoming}</option>
            <option value="active">{a.statusActive}</option>
            <option value="finished">{a.statusFinished}</option>
            <option value="cancelled">{a.statusCancelled}</option>
          </Select>
        </Field>
        <Field label={a.capacity}>
          <TextInput name="capacity" type="number" min={0} dir="ltr" className="text-start" defaultValue={klass?.capacity ?? ""} />
        </Field>
      </div>

      {state.error && (
        <p className="text-sm text-red-600">
          {state.error === "schedule-days-required" ? a.scheduleDaysRequired : state.error}
        </p>
      )}
      <SubmitButton pending={pending}>{pending ? a.saving : a.save}</SubmitButton>
    </form>
  );
}
