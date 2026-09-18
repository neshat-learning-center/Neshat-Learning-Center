"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { Profile } from "@/lib/supabase/types";
import { Field, TextInput, SubmitButton } from "@/components/admin/fields";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { updateStudent, type AdminFormState } from "@/lib/actions/admin/students";

export function StudentEditForm({
  dict,
  locale,
  student,
}: {
  dict: Dictionary;
  locale: Locale;
  student: Profile;
}) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    updateStudent.bind(null, locale, student.id),
    {},
  );
  const p = dict.profile;
  const a = dict.admin;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={p.name}>
          <TextInput name="name" defaultValue={student.full_name ?? ""} />
        </Field>
        <Field label={p.phone}>
          <TextInput name="phone" type="tel" dir="ltr" className="text-start" defaultValue={student.phone ?? ""} />
        </Field>
      </div>
      <FileUploadField
        bucket="avatars"
        pathPrefix={student.id}
        accept="image/*"
        hiddenInputName="avatar_url"
        currentUrl={student.avatar_url}
        previewAsImage
        label={p.avatarUrl}
        note={p.avatarNote}
        chooseLabel={a.chooseFile}
        changeLabel={a.changeFile}
        removeLabel={a.removePicture}
        uploadingLabel={a.uploading}
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton pending={pending}>{pending ? a.saving : a.save}</SubmitButton>
    </form>
  );
}
