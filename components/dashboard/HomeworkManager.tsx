"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomeworkRow } from "@/lib/supabase/types";
import { href } from "@/lib/utils";
import { Field, TextInput, TextArea, SubmitButton } from "@/components/admin/fields";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { createHomework, deleteHomework, type HomeworkFormState } from "@/lib/actions/homework";

export function HomeworkManager({
  dict,
  locale,
  classId,
  homework,
}: {
  dict: Dictionary;
  locale: Locale;
  classId: string;
  homework: HomeworkRow[];
}) {
  const [state, formAction, pending] = useActionState<HomeworkFormState, FormData>(
    createHomework.bind(null, locale, classId),
    {},
  );
  const h = dict.homework;
  const a = dict.admin;

  return (
    <div>
      <h2 className="eyebrow">{h.title}</h2>

      {homework.length > 0 && (
        <ul className="mt-4 flex flex-col divide-y divide-line border-y border-line">
          {homework.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <Link
                  href={href(locale, `/dashboard/homework/${item.id}`)}
                  className="font-medium text-ink hover:text-accent-deep hover:underline"
                >
                  {item.title}
                </Link>
                {item.due_date && <p className="mt-0.5 text-xs text-muted">{h.dueDate}: {item.due_date}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <Link href={href(locale, `/dashboard/homework/${item.id}`)} className="text-accent-deep hover:underline">
                  {h.viewSubmissions}
                </Link>
                <ConfirmForm
                  action={deleteHomework.bind(null, locale, classId, item.id, item.file_url)}
                  confirmText={a.confirmDelete}
                >
                  <button type="submit" className="text-red-600 hover:underline">
                    {a.delete}
                  </button>
                </ConfirmForm>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="mt-6 flex flex-col gap-5 rounded-lg border border-line bg-canvas p-5">
        <Field label={h.homeworkTitle}>
          <TextInput name="title" required />
        </Field>
        <Field label={h.description}>
          <TextArea name="description" rows={3} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={h.dueDate}>
            <TextInput name="due_date" type="date" dir="ltr" className="text-start" />
          </Field>
        </div>
        <FileUploadField
          bucket="homework"
          pathPrefix={classId}
          hiddenInputName="file_url"
          storePathOnly
          label={h.attachment}
          chooseLabel={a.chooseFile}
          changeLabel={a.changeFile}
          uploadingLabel={a.uploading}
        />

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && <p className="text-sm text-accent-deep">{a.save} ✓</p>}
        <SubmitButton pending={pending}>{pending ? a.saving : h.addHomework}</SubmitButton>
      </form>
    </div>
  );
}
