"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { CourseRow } from "@/lib/supabase/types";
import { LANGUAGES } from "@/content/languages";
import { COURSE_CATEGORIES } from "@/content/course-categories";
import { Field, TextInput, TextArea, Select, SubmitButton } from "@/components/admin/fields";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { createCourse, updateCourse, type AdminFormState } from "@/lib/actions/admin/courses";

const AGE_GROUPS = [
  { value: "kids", fa: "کودکان", en: "Kids" },
  { value: "teens", fa: "نوجوانان", en: "Teens" },
  { value: "adults", fa: "بزرگسالان", en: "Adults" },
];

export function CourseForm({
  dict,
  locale,
  course,
  books,
  selectedBookIds = [],
}: {
  dict: Dictionary;
  locale: Locale;
  course?: CourseRow;
  books: { id: string; title: string }[];
  selectedBookIds?: string[];
}) {
  const action = course ? updateCourse.bind(null, locale, course.id) : createCourse.bind(null, locale);
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(action, {});
  const a = dict.admin;
  const pathPrefix = course?.id ?? "new";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.titleFa}>
          <TextInput name="title_fa" required defaultValue={course?.title?.fa ?? ""} />
        </Field>
        <Field label={a.titleEn}>
          <TextInput name="title_en" dir="ltr" className="text-start" defaultValue={course?.title?.en ?? ""} />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.language}>
          <Select name="language" required defaultValue={course?.language ?? ""}>
            <option value="" disabled>
              {a.language}
            </option>
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang[locale]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={a.category}>
          <Select name="category" required defaultValue={course?.category ?? "general"}>
            {COURSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c[locale]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.levelFa}>
          <TextInput name="level_fa" defaultValue={course?.level?.fa ?? ""} />
        </Field>
        <Field label={a.levelEn}>
          <TextInput name="level_en" dir="ltr" className="text-start" defaultValue={course?.level?.en ?? ""} />
        </Field>
      </div>

      <Field label={a.ageGroup}>
        <Select name="age_group" defaultValue={course?.age_group ?? ""}>
          <option value="">—</option>
          {AGE_GROUPS.map((g) => (
            <option key={g.value} value={g.value}>
              {g[locale]}
            </option>
          ))}
        </Select>
      </Field>

      <FileUploadField
        bucket="books"
        pathPrefix={`courses/${pathPrefix}/cover`}
        accept="image/*"
        hiddenInputName="cover_url"
        currentUrl={course?.cover_url}
        previewAsImage
        label={a.coverImage}
        chooseLabel={a.chooseFile}
        changeLabel={a.changeFile}
        removeLabel={a.removePicture}
        uploadingLabel={a.uploading}
      />

      {books.length > 0 && (
        <Field label={a.books}>
          <div className="flex flex-col gap-2 rounded-md border border-line-strong p-4">
            {books.map((b) => (
              <label key={b.id} className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" name="book_ids" value={b.id} defaultChecked={selectedBookIds.includes(b.id)} />
                {b.title}
              </label>
            ))}
          </div>
        </Field>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.price}>
          <TextInput name="price" type="number" min={0} dir="ltr" className="text-start" defaultValue={course?.price ?? ""} />
        </Field>
        <Field label={a.duration}>
          <TextInput name="duration" dir="ltr" className="text-start" defaultValue={course?.duration ?? ""} />
        </Field>
      </div>

      <Field label={a.summaryFa}>
        <TextArea name="summary_fa" rows={3} defaultValue={course?.summary?.fa ?? ""} />
      </Field>
      <Field label={a.summaryEn}>
        <TextArea name="summary_en" dir="ltr" className="text-start" rows={3} defaultValue={course?.summary?.en ?? ""} />
      </Field>

      <Field label="Slug" note="/courses/…">
        <TextInput name="slug" dir="ltr" className="text-start" defaultValue={course?.slug ?? ""} placeholder="english-conversation-adults" />
      </Field>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton pending={pending}>{pending ? a.saving : a.save}</SubmitButton>
    </form>
  );
}
