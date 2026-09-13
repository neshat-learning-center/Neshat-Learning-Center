"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { submitHomework, type HomeworkFormState } from "@/lib/actions/homework";

export function HomeworkSubmitForm({
  dict,
  locale,
  homeworkId,
  classId,
  alreadySubmitted,
}: {
  dict: Dictionary;
  locale: Locale;
  homeworkId: string;
  classId: string;
  alreadySubmitted: boolean;
}) {
  const [state, formAction, pending] = useActionState<HomeworkFormState, FormData>(
    submitHomework.bind(null, locale, homeworkId),
    {},
  );
  const h = dict.homework;
  const a = dict.admin;

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-md border border-line-strong bg-sand/30 p-4">
      <FileUploadField
        bucket="homework"
        pathPrefix={classId}
        hiddenInputName="file_url"
        storePathOnly
        label={h.yourSubmission}
        chooseLabel={h.chooseSubmissionFile}
        changeLabel={a.changeFile}
        uploadingLabel={a.uploading}
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-accent-deep">{h.submitted}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-slate transition-colors hover:bg-accent-deep disabled:opacity-60"
      >
        {pending ? h.submitting : alreadySubmitted ? h.resubmit : h.submit}
      </button>
    </form>
  );
}
