"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { signIn, enterDemo, type SignInState } from "@/lib/actions/auth";

const field =
  "w-full rounded-md border border-line-strong bg-canvas px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent";

export function LoginForm({
  dict,
  locale,
  configured,
}: {
  dict: Dictionary;
  locale: Locale;
  configured: boolean;
}) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signIn.bind(null, locale),
    {},
  );
  const a = dict.auth;

  return (
    <div className="flex flex-col gap-8">
      {configured ? (
        <>
          <form action={formAction} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">{a.email}</span>
              <input name="email" type="email" required dir="ltr" className={`${field} text-start`} placeholder="you@email.com" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">{a.password}</span>
              <input name="password" type="password" required dir="ltr" className={`${field} text-start`} placeholder="••••••••" />
            </label>
            {state.error && (
              <p className="text-sm text-red-600">{a.invalid}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-full bg-accent px-6 py-3.5 font-medium text-slate transition-colors hover:bg-accent-deep disabled:opacity-60"
            >
              {pending ? a.signingIn : a.signIn}
            </button>
          </form>
          <p className="text-sm text-muted">
            {a.noAccount}{" "}
            <Link href={href(locale, "/signup")} className="font-medium text-ink hover:text-accent-deep">
              {a.goSignUp}
            </Link>
          </p>
        </>
      ) : (
        <div className="rounded-md border border-line bg-sand p-5 text-sm text-ink-soft">
          {a.notConfigured}
        </div>
      )}

      {/* demo entry — only when no backend is connected */}
      {!configured && (
        <div>
          <h2 className="text-lg font-bold text-ink">{a.demoTitle}</h2>
          <p className="mt-1 text-sm text-muted">{a.demoLead}</p>
          <div className="mt-4 flex flex-col gap-3">
            {(
              [
                ["student", a.asStudent],
                ["teacher", a.asTeacher],
                ["admin", a.asAdmin],
              ] as const
            ).map(([role, label]) => (
              <form key={role} action={enterDemo.bind(null, role, locale)}>
                <button
                  type="submit"
                  className="group flex w-full items-center justify-between rounded-md border border-line-strong px-5 py-3.5 text-start text-ink transition-colors hover:border-ink hover:bg-canvas"
                >
                  {label}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rtl:-scale-x-100 text-muted transition-transform group-hover:translate-x-0.5">
                    <path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
