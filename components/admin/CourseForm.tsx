"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { CourseRow } from "@/lib/supabase/types";
import { categories } from "@/content/categories";
import { Field, TextInput, TextArea, Select, SubmitButton } from "@/components/admin/fields";
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
  teachers,
}: {
  dict: Dictionary;
  locale: Locale;
  course?: CourseRow;
  teachers: { id: string; name: string }[];
}) {
  const action = course ? updateCourse.bind(null, locale, course.id) : createCourse.bind(null, locale);
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(action, {});
  const a = dict.admin;
  const c = dict.courses;

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
        <Field label={c.language}>
          <Select name="language" required defaultValue={course?.language ?? ""}>
            <option value="" disabled>
              {a.language}
            </option>
            {categories.map((cat) => (
              <option key={cat.language} value={cat.language}>
                {cat.title[locale]}
              </option>
            ))}
          </Select>
        </Field>
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
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.levelFa}>
          <TextInput name="level_fa" defaultValue={course?.level?.fa ?? ""} />
        </Field>
        <Field label={a.levelEn}>
          <TextInput name="level_en" dir="ltr" className="text-start" defaultValue={course?.level?.en ?? ""} />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.mode}>
          <Select name="mode" defaultValue={course?.mode ?? "both"}>
            <option value="offline">{dict.common.offline}</option>
            <option value="online">{dict.common.online}</option>
            <option value="both">{dict.common.both}</option>
          </Select>
        </Field>
        <Field label={a.teacher}>
          <Select name="teacher_id" defaultValue={course?.teacher_id ?? ""}>
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
        <Field label={a.scheduleFa}>
          <TextInput name="schedule_fa" defaultValue={course?.schedule?.fa ?? ""} />
        </Field>
        <Field label={a.scheduleEn}>
          <TextInput name="schedule_en" dir="ltr" className="text-start" defaultValue={course?.schedule?.en ?? ""} />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.capacity}>
          <TextInput name="capacity" type="number" min={0} dir="ltr" className="text-start" defaultValue={course?.capacity ?? ""} />
        </Field>
        <Field label={a.duration}>
          <TextInput name="duration" dir="ltr" className="text-start" defaultValue={course?.duration ?? ""} />
        </Field>
      </div>

      <Field label={a.price}>
        <TextInput name="price" type="number" min={0} dir="ltr" className="text-start" defaultValue={course?.price ?? ""} />
      </Field>

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
