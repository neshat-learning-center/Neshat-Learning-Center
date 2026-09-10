"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { pick } from "@/lib/i18n/config";
import { categories } from "@/content/categories";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { submitLead, type LeadFormState } from "@/lib/actions/leads";

const field =
  "w-full border-0 border-b border-line-strong bg-transparent px-0 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent";
const labelCls = "text-sm font-medium text-ink";

export function LeadForm({
  dict,
  locale,
  kind,
  showLanguage = true,
  showLevel = false,
}: {
  dict: Dictionary;
  locale: Locale;
  kind: "placement" | "contact";
  showLanguage?: boolean;
  showLevel?: boolean;
}) {
  const [state, formAction, pending] = useActionState<LeadFormState, FormData>(
    submitLead.bind(null, kind),
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const f = dict.pages.form;

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  if (state.success) {
    return (
      <div className="rounded-md border border-line bg-sand p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="var(--color-slate)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="mt-5 text-lg font-bold text-ink">{f.success}</p>
        <p className="mt-2 text-sm text-muted">
          {isSupabaseConfigured() ? f.successNoteConnected : f.successNote}
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-7">
      <div className="grid gap-7 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className={labelCls}>
            {f.name} <span className="text-accent-deep">*</span>
          </span>
          <input required name="name" className={field} placeholder={f.name} />
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelCls}>
            {f.phone} <span className="text-accent-deep">*</span>
          </span>
          <input required name="phone" type="tel" dir="ltr" className={`${field} text-start`} placeholder="0912…" />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className={labelCls}>{f.email}</span>
        <input name="email" type="email" dir="ltr" className={`${field} text-start`} placeholder="you@email.com" />
      </label>

      {showLanguage && (
        <label className="flex flex-col gap-2">
          <span className={labelCls}>{f.language}</span>
          <select name="language" defaultValue="" className={`${field} cursor-pointer`}>
            <option value="" disabled>
              {f.choose}
            </option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {pick(c.title, locale)}
              </option>
            ))}
          </select>
        </label>
      )}

      {showLevel && (
        <label className="flex flex-col gap-2">
          <span className={labelCls}>{f.level}</span>
          <input name="level" className={field} placeholder={f.level} />
        </label>
      )}

      <label className="flex flex-col gap-2">
        <span className={labelCls}>{showLevel ? f.goal : f.message}</span>
        <textarea name="message" rows={3} className={`${field} resize-none`} placeholder={showLevel ? f.goal : f.message} />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="group mt-2 inline-flex w-fit items-center gap-2.5 rounded-full bg-accent px-7 py-3.5 font-medium text-slate transition-colors hover:bg-accent-deep disabled:opacity-60"
      >
        {pending ? f.sending : f.submit}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rtl:-scale-x-100 transition-transform group-hover:translate-x-0.5">
          <path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}
