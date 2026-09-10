"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { Field, TextInput, SubmitButton } from "@/components/admin/fields";
import { createTeacher, type AdminFormState } from "@/lib/actions/admin/teachers";

export function CreateTeacherForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    createTeacher.bind(null, locale),
    {},
  );
  const a = dict.admin;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Field label={dict.profile.name}>
        <TextInput name="name" required />
      </Field>
      <Field label={a.teacherEmail}>
        <TextInput name="email" type="email" required dir="ltr" className="text-start" placeholder="teacher@email.com" />
      </Field>
      <Field label={a.teacherPassword}>
        <TextInput name="password" type="password" required minLength={6} dir="ltr" className="text-start" />
      </Field>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton pending={pending}>{pending ? a.saving : a.add}</SubmitButton>
    </form>
  );
}
