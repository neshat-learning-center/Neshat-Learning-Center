"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { TextInput } from "@/components/admin/fields";
import { formatNumber, parseToman } from "@/lib/finance/money";
import type { Locale } from "@/lib/i18n/config";
import type { FinState } from "@/lib/actions/admin/finance";

type Action = (prev: FinState, fd: FormData) => Promise<FinState>;

/**
 * Wraps a finance server action. Adds a per-form idempotency key so a double
 * click (or a retried request) can never record the same payment twice, and a
 * fresh key after every success so the next entry is a genuinely new one.
 */
export function FinForm({
  action, children, submit, className = "", resetOnOk = true, tone = "accent",
}: {
  action: Action;
  children: ReactNode;
  submit: string;
  className?: string;
  resetOnOk?: boolean;
  tone?: "accent" | "dark" | "danger";
}) {
  const [key, setKey] = useState("");
  const [state, formAction, pending] = useActionState<FinState, FormData>(async (prev, fd) => {
    const r = await action(prev, fd);
    if (r.ok) setKey(crypto.randomUUID()); // the next entry is a genuinely new one
    return r;
  }, {});
  // (key is generated after mount, never during SSR, so server and client markup match)
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKey(crypto.randomUUID());
  }, []);

  useEffect(() => {
    if (state.ok && resetOnOk) ref.current?.reset();
  }, [state, resetOnOk]);

  const btn =
    tone === "danger" ? "bg-red-600 text-white hover:bg-red-700"
    : tone === "dark" ? "bg-ink text-canvas hover:bg-slate"
    : "bg-accent text-slate hover:bg-accent-deep";

  return (
    <form ref={ref} action={formAction} className={`flex flex-col gap-4 ${className}`}>
      <input type="hidden" name="client_key" value={key} />
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={`w-fit rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${btn}`}
        >
          {submit}
        </button>
        {state.error && <span role="alert" className="text-sm text-red-600">{state.error}</span>}
        {state.ok && !pending && <span className="text-sm text-accent-deep">✓ {state.message}</span>}
      </div>
    </form>
  );
}

/** Toman amount input: type Persian or Latin digits, with or without separators; shows the parsed value live. */
export function MoneyInput({
  name, locale, defaultValue, required = true, placeholder, label, suffix,
}: {
  name: string; locale: Locale; defaultValue?: number; required?: boolean; placeholder?: string; label?: string; suffix?: string;
}) {
  const [v, setV] = useState(defaultValue != null ? String(defaultValue) : "");
  const n = parseToman(v);
  return (
    <div className="flex flex-col gap-1">
      <TextInput
        name={name} required={required} inputMode="numeric" dir="ltr" autoComplete="off" aria-label={label}
        className="text-start" placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)}
      />
      <span className="min-h-4 text-xs text-muted">
        {n != null && v.trim() ? `${formatNumber(n, locale)} ${suffix ?? (locale === "fa" ? "تومان" : "Toman")}` : ""}
      </span>
    </div>
  );
}

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink transition-colors hover:border-ink print:hidden"
    >
      {label}
    </button>
  );
}
