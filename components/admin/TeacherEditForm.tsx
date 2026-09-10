"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { Profile } from "@/lib/supabase/types";
import { href } from "@/lib/utils";
import { Field, TextInput, TextArea, SubmitButton } from "@/components/admin/fields";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { updateTeacher, type AdminFormState } from "@/lib/actions/admin/teachers";

export function TeacherEditForm({
  dict,
  locale,
  teacher,
}: {
  dict: Dictionary;
  locale: Locale;
  teacher: Profile;
}) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    updateTeacher.bind(null, locale, teacher.id),
    {},
  );
  const p = dict.profile;
  const a = dict.admin;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={p.name}>
          <TextInput name="name" defaultValue={teacher.full_name ?? ""} />
        </Field>
        <Field label={p.phone}>
          <TextInput name="phone" type="tel" dir="ltr" className="text-start" defaultValue={teacher.phone ?? ""} />
        </Field>
      </div>
      <FileUploadField
        bucket="avatars"
        pathPrefix={teacher.id}
        accept="image/*"
        hiddenInputName="avatar_url"
        currentUrl={teacher.avatar_url}
        previewAsImage
        label={p.avatarUrl}
        note={p.avatarNote}
        chooseLabel={a.chooseFile}
        changeLabel={a.changeFile}
        uploadingLabel={a.uploading}
      />
      <Field label={p.slug} note={p.slugNote}>
        <TextInput name="slug" dir="ltr" className="text-start" defaultValue={teacher.slug ?? ""} placeholder="ali-rezaei" />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={p.specialtyFa}>
          <TextInput name="specialty_fa" defaultValue={teacher.specialty?.fa ?? ""} />
        </Field>
        <Field label={p.specialtyEn}>
          <TextInput name="specialty_en" dir="ltr" className="text-start" defaultValue={teacher.specialty?.en ?? ""} />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={p.languagesFa}>
          <TextInput name="languages_fa" defaultValue={teacher.languages?.fa ?? ""} />
        </Field>
        <Field label={p.languagesEn}>
          <TextInput name="languages_en" dir="ltr" className="text-start" defaultValue={teacher.languages?.en ?? ""} />
        </Field>
      </div>

      <Field label={p.bioFa}>
        <TextArea name="bio_fa" rows={4} defaultValue={teacher.bio?.fa ?? ""} />
      </Field>
      <Field label={p.bioEn}>
        <TextArea name="bio_en" dir="ltr" className="text-start" rows={4} defaultValue={teacher.bio?.en ?? ""} />
      </Field>

      {teacher.slug && (
        <Link
          href={href(locale, `/teachers/${teacher.slug}`)}
          target="_blank"
          className="w-fit text-sm font-medium text-accent-deep underline-offset-4 hover:underline"
        >
          {p.publicProfile} ↗
        </Link>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton pending={pending}>{pending ? a.saving : a.save}</SubmitButton>
    </form>
  );
}
