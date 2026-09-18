"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { BookRow } from "@/lib/supabase/types";
import { categories } from "@/content/categories";
import { Field, TextInput, TextArea, Select, SubmitButton } from "@/components/admin/fields";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { createBook, updateBook, type AdminFormState } from "@/lib/actions/admin/books";

export function BookForm({
  dict,
  locale,
  book,
}: {
  dict: Dictionary;
  locale: Locale;
  book?: BookRow;
}) {
  const action = book ? updateBook.bind(null, locale, book.id) : createBook.bind(null, locale);
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(action, {});
  const a = dict.admin;
  const pathPrefix = book?.id ?? book?.slug ?? "new";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.titleFa}>
          <TextInput name="title_fa" required defaultValue={book?.title?.fa ?? ""} />
        </Field>
        <Field label={a.titleEn}>
          <TextInput name="title_en" dir="ltr" className="text-start" defaultValue={book?.title?.en ?? ""} />
        </Field>
      </div>

      <Field label={dict.courses.language}>
        <Select name="language" defaultValue={book?.language ?? ""}>
          <option value="">—</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.filter.value}>
              {cat.title[locale]}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.levelFa}>
          <TextInput name="level_fa" defaultValue={book?.level?.fa ?? ""} />
        </Field>
        <Field label={a.levelEn}>
          <TextInput name="level_en" dir="ltr" className="text-start" defaultValue={book?.level?.en ?? ""} />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.kindFa}>
          <TextInput name="kind_fa" defaultValue={book?.kind?.fa ?? ""} />
        </Field>
        <Field label={a.kindEn}>
          <TextInput name="kind_en" dir="ltr" className="text-start" defaultValue={book?.kind?.en ?? ""} />
        </Field>
      </div>

      <Field label={a.descriptionFa}>
        <TextArea name="description_fa" rows={3} defaultValue={book?.description?.fa ?? ""} />
      </Field>
      <Field label={a.descriptionEn}>
        <TextArea name="description_en" dir="ltr" className="text-start" rows={3} defaultValue={book?.description?.en ?? ""} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <FileUploadField
          bucket="books"
          pathPrefix={`${pathPrefix}/cover`}
          accept="image/*"
          hiddenInputName="cover_url"
          currentUrl={book?.cover_url}
          previewAsImage
          label={a.coverUrl}
          chooseLabel={a.chooseFile}
          changeLabel={a.changeFile}
          removeLabel={a.removePicture}
          uploadingLabel={a.uploading}
        />
        <FileUploadField
          bucket="books"
          pathPrefix={`${pathPrefix}/file`}
          accept=".pdf,.doc,.docx,.mp3,.mp4"
          hiddenInputName="file_url"
          currentUrl={book?.file_url}
          label={a.fileUrl}
          chooseLabel={a.chooseFile}
          changeLabel={a.changeFile}
          uploadingLabel={a.uploading}
        />
      </div>

      <Field label="Slug" note="/books/…">
        <TextInput name="slug" dir="ltr" className="text-start" defaultValue={book?.slug ?? ""} />
      </Field>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton pending={pending}>{pending ? a.saving : a.save}</SubmitButton>
    </form>
  );
}
