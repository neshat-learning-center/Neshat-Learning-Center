"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { changePassword, type ProfileFormState } from "@/lib/actions/profile";

const field =
  "w-full rounded-md border border-line-strong bg-canvas px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent";
const label = "text-sm font-medium text-ink";

export function ChangePasswordForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    changePassword.bind(null, locale),
    {},
  );
  const p = dict.profile;

  const errorMessage =
    state.error === "password-too-short"
      ? p.passwordTooShort
      : state.error === "password-mismatch"
        ? p.passwordMismatch
        : state.error;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <h2 className="eyebrow">{p.changePassword}</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className={label}>{p.newPassword}</span>
          <input
            name="password"
            type="password"
            dir="ltr"
            required
            minLength={6}
            className={`${field} text-start`}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={label}>{p.confirmPassword}</span>
          <input
            name="confirm_password"
            type="password"
            dir="ltr"
            required
            minLength={6}
            className={`${field} text-start`}
          />
        </label>
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      {state.success && <p className="text-sm text-accent-deep">{p.passwordUpdated}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-accent px-6 py-3.5 font-medium text-slate transition-colors hover:bg-accent-deep disabled:opacity-60"
      >
        {pending ? p.saving : p.changePassword}
      </button>
    </form>
  );
}
