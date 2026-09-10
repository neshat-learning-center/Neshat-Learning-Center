"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { signUp, enterDemo, type SignUpState } from "@/lib/actions/auth";

const field =
  "w-full rounded-md border border-line-strong bg-canvas px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent";

export function SignUpForm({
  dict,
  locale,
  configured,
}: {
  dict: Dictionary;
  locale: Locale;
  configured: boolean;
}) {
  const [state, formAction, pending] = useActionState<SignUpState, FormData>(
    signUp.bind(null, locale),
    {},
  );
  const a = dict.auth;

  if (state.checkEmail) {
    return (
      <div className="rounded-md border border-line bg-sand p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6h16v12H4z M4 6l8 7 8-7"
              stroke="var(--color-slate)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="mt-5 text-lg font-bold text-ink">{a.checkEmail}</p>
        <p className="mt-2 text-sm text-muted">{a.checkEmailNote}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {configured ? (
        <>
          <form action={formAction} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">{a.name}</span>
              <input name="name" required className={field} placeholder={a.name} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">{a.email}</span>
              <input
                name="email"
                type="email"
                required
                dir="ltr"
                className={`${field} text-start`}
                placeholder="you@email.com"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">{a.phone}</span>
              <input name="phone" type="tel" dir="ltr" className={`${field} text-start`} placeholder="0912…" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">{a.password}</span>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                dir="ltr"
                className={`${field} text-start`}
                placeholder="••••••••"
              />
            </label>
            {state.error && <p className="text-sm text-red-600">{state.error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-full bg-accent px-6 py-3.5 font-medium text-slate transition-colors hover:bg-accent-deep disabled:opacity-60"
            >
              {pending ? a.signingUp : a.signUp}
            </button>
          </form>
          <p className="text-sm text-muted">
            {a.haveAccount}{" "}
            <Link href={href(locale, "/login")} className="font-medium text-ink hover:text-accent-deep">
              {a.goSignIn}
            </Link>
          </p>
        </>
      ) : (
        <div className="rounded-md border border-line bg-sand p-5 text-sm text-ink-soft">
          {a.notConfigured}
        </div>
      )}

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
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="rtl:-scale-x-100 text-muted transition-transform group-hover:translate-x-0.5"
                  >
                    <path
                      d="M3 8h9M8 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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
