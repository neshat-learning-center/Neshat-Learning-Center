"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { ClassRow } from "@/lib/supabase/types";
import { Field, TextInput, Select, SubmitButton } from "@/components/admin/fields";
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
  const a = dict.admin;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {returnTo && <input type="hidden" name="return_to" value={returnTo} />}
      <Field label={dict.dash.name}>
        <TextInput name="title" required defaultValue={klass?.title ?? ""} />
      </Field>

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

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.classroom}>
          <TextInput name="classroom" defaultValue={klass?.classroom ?? ""} />
        </Field>
        <Field label={dict.courses.schedule}>
          <TextInput name="schedule" defaultValue={klass?.schedule ?? ""} />
        </Field>
      </div>

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

      <Field label={a.onlineMeetingUrl}>
        <TextInput name="online_meeting_url" dir="ltr" className="text-start" defaultValue={klass?.online_meeting_url ?? ""} />
      </Field>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton pending={pending}>{pending ? a.saving : a.save}</SubmitButton>
    </form>
  );
}
