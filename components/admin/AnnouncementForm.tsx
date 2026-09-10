"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { Announcement } from "@/lib/supabase/types";
import { Field, TextInput, TextArea, Select, SubmitButton } from "@/components/admin/fields";
import {
  createAnnouncement,
  updateAnnouncement,
  type AdminFormState,
} from "@/lib/actions/admin/announcements";

export function AnnouncementForm({
  dict,
  locale,
  announcement,
  classes,
}: {
  dict: Dictionary;
  locale: Locale;
  announcement?: Announcement;
  classes: { id: string; title: string }[];
}) {
  const action = announcement
    ? updateAnnouncement.bind(null, locale, announcement.id)
    : createAnnouncement.bind(null, locale);
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(action, {});
  const a = dict.admin;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Field label={dict.dash.name}>
        <TextInput name="title" required defaultValue={announcement?.title ?? ""} />
      </Field>
      <Field label={a.body}>
        <TextArea name="body" rows={4} defaultValue={announcement?.body ?? ""} />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.audience}>
          <Select name="audience" defaultValue={announcement?.audience ?? "all"}>
            <option value="all">{a.audienceAll}</option>
            <option value="student">{a.audienceStudent}</option>
            <option value="teacher">{a.audienceTeacher}</option>
          </Select>
        </Field>
        <Field label={a.course}>
          <Select name="class_id" defaultValue={announcement?.class_id ?? ""}>
            <option value="">{a.noCourse}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton pending={pending}>{pending ? a.saving : a.save}</SubmitButton>
    </form>
  );
}
