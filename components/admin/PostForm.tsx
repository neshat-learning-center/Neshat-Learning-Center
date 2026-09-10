"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { BlogPostRow } from "@/lib/supabase/types";
import { Field, TextInput, TextArea, SubmitButton } from "@/components/admin/fields";
import { createPost, updatePost, type AdminFormState } from "@/lib/actions/admin/posts";

export function PostForm({
  dict,
  locale,
  post,
}: {
  dict: Dictionary;
  locale: Locale;
  post?: BlogPostRow;
}) {
  const action = post ? updatePost.bind(null, locale, post.id) : createPost.bind(null, locale);
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(action, {});
  const a = dict.admin;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.titleFa}>
          <TextInput name="title_fa" required defaultValue={post?.title?.fa ?? ""} />
        </Field>
        <Field label={a.titleEn}>
          <TextInput name="title_en" dir="ltr" className="text-start" defaultValue={post?.title?.en ?? ""} />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.categoryFa}>
          <TextInput name="category_fa" defaultValue={post?.category?.fa ?? ""} />
        </Field>
        <Field label={a.categoryEn}>
          <TextInput name="category_en" dir="ltr" className="text-start" defaultValue={post?.category?.en ?? ""} />
        </Field>
      </div>

      <Field label={a.excerptFa}>
        <TextArea name="excerpt_fa" rows={2} defaultValue={post?.excerpt?.fa ?? ""} />
      </Field>
      <Field label={a.excerptEn}>
        <TextArea name="excerpt_en" dir="ltr" className="text-start" rows={2} defaultValue={post?.excerpt?.en ?? ""} />
      </Field>

      <Field label={a.bodyFa} note="پاراگراف‌ها را با یک خط خالی از هم جدا کن.">
        <TextArea name="body_fa" rows={8} defaultValue={post?.body?.fa ?? ""} />
      </Field>
      <Field label={a.bodyEn} note="Separate paragraphs with a blank line.">
        <TextArea name="body_en" dir="ltr" className="text-start" rows={8} defaultValue={post?.body?.en ?? ""} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={a.minRead}>
          <TextInput name="min_read" type="number" min={1} dir="ltr" className="text-start" defaultValue={post?.min_read ?? ""} />
        </Field>
        <Field label={a.coverUrl}>
          <TextInput name="cover_url" dir="ltr" className="text-start" defaultValue={post?.cover_url ?? ""} />
        </Field>
      </div>

      <Field label="Slug" note="/journal/…">
        <TextInput name="slug" dir="ltr" className="text-start" defaultValue={post?.slug ?? ""} />
      </Field>

      <label className="flex items-center gap-3 text-sm font-medium text-ink">
        <input type="checkbox" name="published" defaultChecked={post?.published ?? false} className="h-4 w-4 accent-accent" />
        {a.published}
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton pending={pending}>{pending ? a.saving : a.save}</SubmitButton>
    </form>
  );
}
