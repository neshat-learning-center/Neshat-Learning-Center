"use client";

import { useActionState, useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { MaterialKind } from "@/lib/supabase/types";
import { Field, TextInput, Select, SubmitButton } from "@/components/admin/fields";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { createMaterial, deleteMaterial, type AdminFormState } from "@/lib/actions/admin/materials";

export interface MaterialWithUrl {
  id: string;
  title: string;
  kind: MaterialKind;
  path: string;
  resolvedUrl: string;
}

export function MaterialsManager({
  dict,
  locale,
  classId,
  materials,
}: {
  dict: Dictionary;
  locale: Locale;
  classId: string;
  materials: MaterialWithUrl[];
}) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    createMaterial.bind(null, locale, classId),
    {},
  );
  const [kind, setKind] = useState<MaterialKind>("pdf");
  const a = dict.admin;

  const kindLabel: Record<MaterialKind, string> = {
    pdf: a.kindPdf,
    document: a.kindDocument,
    audio: a.kindAudio,
    video: a.kindVideo,
    link: a.kindLink,
  };

  return (
    <div>
      <h2 className="eyebrow">{a.materials}</h2>

      {materials.length > 0 && (
        <ul className="mt-4 flex flex-col divide-y divide-line border-y border-line">
          {materials.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="rounded bg-accent-wash px-2 py-0.5 text-xs font-medium uppercase text-accent-deep">
                  {kindLabel[m.kind]}
                </span>
                {m.resolvedUrl ? (
                  <a href={m.resolvedUrl} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-accent-deep hover:underline">
                    {m.title}
                  </a>
                ) : (
                  <span className="text-ink">{m.title}</span>
                )}
              </div>
              <ConfirmForm
                action={deleteMaterial.bind(null, locale, classId, m.id, m.path)}
                confirmText={a.confirmDelete}
              >
                <button type="submit" className="text-red-600 hover:underline">
                  {a.delete}
                </button>
              </ConfirmForm>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="mt-6 flex flex-col gap-5 rounded-lg border border-line bg-canvas p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={a.materialTitle}>
            <TextInput name="title" required />
          </Field>
          <Field label={a.materialKind}>
            <Select value={kind} onChange={(e) => setKind(e.target.value as MaterialKind)}>
              <option value="pdf">{a.kindPdf}</option>
              <option value="document">{a.kindDocument}</option>
              <option value="audio">{a.kindAudio}</option>
              <option value="video">{a.kindVideo}</option>
              <option value="link">{a.kindLink}</option>
            </Select>
            {/* Select above is uncontrolled-by-name on purpose (drives `kind` state);
                this hidden input is what the server action actually reads. */}
            <input type="hidden" name="kind" value={kind} />
          </Field>
        </div>

        {kind === "link" ? (
          <Field label={a.materialLink}>
            <TextInput name="url" dir="ltr" className="text-start" required placeholder="https://…" />
          </Field>
        ) : (
          <FileUploadField
            bucket="materials"
            pathPrefix={classId}
            hiddenInputName="url"
            storePathOnly
            label={a.materialFile}
            chooseLabel={a.chooseFile}
            changeLabel={a.changeFile}
            uploadingLabel={a.uploading}
          />
        )}

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <SubmitButton pending={pending}>{pending ? a.saving : a.add}</SubmitButton>
      </form>
    </div>
  );
}
