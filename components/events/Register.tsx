"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/lib/i18n/config";
import { dir } from "@/lib/i18n/config";
import { makeET } from "@/lib/events/labels";
import { toIcs, type Availability } from "@/lib/events/time";
import { displayPhone } from "@/lib/events/phone";
import { formatToman } from "@/lib/finance/money";
import {
  registerForEvent, lookupRegistration, cancelOwnRegistration, type RegisterState, type LookupState,
} from "@/lib/actions/events";

/** the few event fields the dialog needs (kept small: it's serialised into the page) */
export interface RegisterInfo {
  id: string;
  slug: string;
  title: string;
  venue?: string;
  startsAt: string;
  endsAt: string | null;
  isPaid: boolean;
  price: number;
  maxPerRegistration: number;
  seatsLeft: number | null;
  waitlist: boolean; // the event is full but the waiting list is open
}

// ---- remember my registration on this device ------------------------------------------
const KEY = (id: string) => `neshat-event-${id}`;
const listeners = new Set<() => void>();
function useStored(id: string): string | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      window.addEventListener("storage", cb);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", cb);
      };
    },
    () => {
      try { return localStorage.getItem(KEY(id)); } catch { return null; }
    },
    () => null,
  );
}
function store(id: string, code: string) {
  try { localStorage.setItem(KEY(id), code); } catch { /* private mode: fine */ }
  listeners.forEach((l) => l());
}

const inputCls =
  "w-full border-0 border-b-2 border-line-strong bg-transparent px-0 py-2.5 text-base text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent aria-[invalid=true]:border-red-500";

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function RegisterButton({
  info, locale, state, variant = "primary", className = "", children,
}: { info: RegisterInfo; locale: Locale; state: Availability; variant?: "primary" | "dark" | "outline"; className?: string; children?: React.ReactNode }) {
  const t = makeET(locale);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"register" | "status">("register");
  const mine = useStored(info.id);
  const canRegister = state === "open" || state === "waitlist";
  const base = "inline-flex items-center justify-center gap-2 px-7 py-4 text-[0.95rem] font-bold transition-colors duration-300 disabled:cursor-not-allowed";
  const tone =
    variant === "dark" ? "bg-ink text-canvas hover:bg-accent hover:text-slate"
    : variant === "outline" ? "border-2 border-ink text-ink hover:bg-ink hover:text-canvas"
    : "bg-accent text-slate hover:bg-ink hover:text-canvas";

  return (
    <>
      <div className={`flex flex-col gap-2 ${className}`}>
        {canRegister ? (
          <button type="button" onClick={() => { setTab("register"); setOpen(true); }} className={`${base} ${tone}`}>
            {children ?? (state === "waitlist" ? t("joinWaitlist") : t("registerNow"))}
          </button>
        ) : (
          <button type="button" disabled className={`${base} border-2 border-line-strong text-muted`}>
            {t(`av_${state}` as "av_open")}
          </button>
        )}
        {mine ? (
          <button type="button" onClick={() => { setTab("status"); setOpen(true); }} className="text-start text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline">
            ✓ {t("yourReg")} · <span dir="ltr">{mine}</span> — {t("checkReg")}
          </button>
        ) : (
          <button type="button" onClick={() => { setTab("status"); setOpen(true); }} className="text-start text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
            {t("checkReg")}
          </button>
        )}
      </div>
      {/* portalled to <body>: an animated/transformed ancestor would otherwise trap position:fixed */}
      {open && createPortal(<RegisterDialog info={info} locale={locale} canRegister={canRegister} initialTab={tab} savedCode={mine} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function RegisterDialog({
  info, locale, canRegister, initialTab, savedCode, onClose,
}: { info: RegisterInfo; locale: Locale; canRegister: boolean; initialTab: "register" | "status"; savedCode: string | null; onClose: () => void }) {
  const t = makeET(locale);
  const rtl = dir[locale] === "rtl";
  const [tab, setTab] = useState(canRegister ? initialTab : "status");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const opener = document.activeElement as HTMLElement | null;
    const first = panelRef.current?.querySelector<HTMLElement>("input,button,select,textarea");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const f = Array.from(panelRef.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input,select,textarea")).filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={t("regTitle")} dir={dir[locale]}>
      <button type="button" aria-label={t("close")} onClick={onClose} className="ev-fade absolute inset-0 bg-slate/60" />
      <div ref={panelRef} className="ev-pop relative flex max-h-[94dvh] w-full flex-col overflow-hidden bg-canvas sm:max-w-xl">
        <div className="h-1.5 shrink-0 bg-accent" />
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-2 pt-5 sm:px-8">
          <div className="min-w-0">
            <p className="eyebrow">{t("regTitle")}</p>
            <h2 className="ev-display mt-1 text-2xl leading-tight text-ink sm:text-3xl">{info.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t("close")} className="flex h-10 w-10 shrink-0 items-center justify-center text-ink hover:bg-sand">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg>
          </button>
        </div>
        <div className="flex shrink-0 gap-6 border-b border-line px-6 sm:px-8" role="tablist">
          {([["register", t("tabRegister")], ["status", t("tabStatus")]] as const).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} disabled={k === "register" && !canRegister}
              onClick={() => setTab(k)}
              className={`-mb-px border-b-2 py-3 text-sm font-semibold transition-colors disabled:opacity-40 ${tab === k ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {tab === "register" ? <RegisterForm info={info} locale={locale} rtl={rtl} onClose={onClose} /> : <StatusPanel info={info} locale={locale} savedCode={savedCode} />}
        </div>
      </div>
    </div>
  );
}

function RegisterForm({ info, locale, rtl, onClose }: { info: RegisterInfo; locale: Locale; rtl: boolean; onClose: () => void }) {
  const t = makeET(locale);
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerForEvent.bind(null, locale, info.id), {});
  const [n, setN] = useState(1);
  const max = Math.max(1, info.maxPerRegistration);
  const nf = (x: number) => x.toLocaleString(locale === "fa" ? "fa-IR" : "en-US");

  // remember the code on this device once registered
  useEffect(() => {
    if (state.ok && state.code) store(info.id, state.code);
  }, [state, info.id]);

  if (state.ok && state.code && state.status) return <Confirmation info={info} locale={locale} s={state} onClose={onClose} />;

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* honeypot — hidden from people, irresistible to bots */}
      <div className="absolute -start-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <FieldRow label={t("fullName")}>
        <input name="full_name" required minLength={2} autoComplete="name" className={inputCls} aria-invalid={state.field === "name"} />
      </FieldRow>
      <FieldRow label={t("phone")} hint={t("phoneHint")}>
        <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" dir="ltr" className={`${inputCls} text-start`} aria-invalid={state.field === "phone"} />
      </FieldRow>
      <FieldRow label={t("email")}>
        <input name="email" type="email" autoComplete="email" dir="ltr" className={`${inputCls} text-start`} aria-invalid={state.field === "email"} />
      </FieldRow>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">{t("participants")}</span>
          <div className="mt-2 flex items-center border border-ink" dir="ltr">
            <button type="button" onClick={() => setN((v) => Math.max(1, v - 1))} aria-label="−" className="h-11 w-11 text-xl hover:bg-ink hover:text-canvas disabled:opacity-30" disabled={n <= 1}>−</button>
            <span className="w-12 text-center font-bold tabular-nums">{nf(n)}</span>
            <button type="button" onClick={() => setN((v) => Math.min(max, v + 1))} aria-label="+" className="h-11 w-11 text-xl hover:bg-ink hover:text-canvas disabled:opacity-30" disabled={n >= max}>+</button>
          </div>
          <input type="hidden" name="participants" value={n} />
        </div>
        {info.isPaid && (
          <div className="text-end">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("total")}</p>
            <p className="ev-display text-2xl text-ink">{formatToman(info.price * n, locale)}</p>
          </div>
        )}
      </div>

      <label className="flex items-center gap-3 text-sm text-ink-soft">
        <input type="checkbox" name="is_student" className="h-4 w-4 accent-[var(--color-accent-deep)]" />
        {t("student")}
      </label>
      <FieldRow label={t("notes")}>
        <textarea name="notes" rows={2} maxLength={1000} className={`${inputCls} resize-none`} />
      </FieldRow>

      {info.isPaid && <p className="border-s-2 border-accent bg-accent-wash px-4 py-3 text-sm text-ink-soft">{t("payNote")}</p>}
      {state.error && <p role="alert" className="text-sm font-medium text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 bg-accent px-7 py-4 font-bold text-slate transition-colors hover:bg-ink hover:text-canvas disabled:opacity-60">
        {pending ? t("sending") : info.waitlist || (info.seatsLeft != null && info.seatsLeft < n) ? t("submitWaitlist") : t("submit")}
        {!pending && <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={rtl ? "-scale-x-100" : ""}><path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </button>
    </form>
  );
}

function StatusMessage({ status, position, locale }: { status: string; position?: number; locale: Locale }) {
  const t = makeET(locale);
  const nf = (x: number) => x.toLocaleString(locale === "fa" ? "fa-IR" : "en-US");
  const tone = status === "confirmed" ? "border-emerald-500 bg-emerald-50 text-emerald-900" : status === "waitlisted" || status === "pending" ? "border-accent bg-accent-wash text-ink" : "border-red-400 bg-red-50 text-red-900";
  return (
    <div className={`border-s-4 px-4 py-3 ${tone}`}>
      <p className="font-semibold">{t(`ok_${status}` as "ok_confirmed")}</p>
      {status === "waitlisted" && position ? <p className="mt-1 text-sm">{t("waitPos")}: <b>{nf(position)}</b></p> : null}
    </div>
  );
}

function Confirmation({ info, locale, s, onClose }: { info: RegisterInfo; locale: Locale; s: RegisterState; onClose: () => void }) {
  const t = makeET(locale);
  const [copied, setCopied] = useState(false);
  const code = s.code as string;
  const download = () => {
    const blob = new Blob([toIcs({ slug: info.slug, startsAt: info.startsAt, endsAt: info.endsAt, title: info.title, venue: info.venue })], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${info.slug}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="ev-pop flex flex-col gap-5">
      <StatusMessage status={s.status as string} position={s.position} locale={locale} />
      <div className="border border-ink p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">{t("refCode")}</p>
        <p className="ev-display mt-2 text-4xl tracking-widest text-ink" dir="ltr">{code}</p>
        <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ } }} className="mt-3 text-sm font-semibold text-accent-deep underline-offset-4 hover:underline">
          {copied ? `✓ ${t("copied")}` : t("copy")}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-muted">{t("refHint")}</p>
      </div>
      {info.isPaid && s.status !== "waitlisted" && (
        <div className="border-s-2 border-accent bg-accent-wash px-4 py-3 text-sm text-ink-soft">
          <p className="font-semibold text-ink">{t("payDue")}: {formatToman(info.price * (s.participants ?? 1), locale)}</p>
          <p className="mt-1">{t("payNote")}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {s.status !== "waitlisted" && <button type="button" onClick={download} className="border-2 border-ink px-5 py-3 text-sm font-bold text-ink hover:bg-ink hover:text-canvas">{t("addToCalendar")}</button>}
        <button type="button" onClick={onClose} className="bg-ink px-5 py-3 text-sm font-bold text-canvas hover:bg-accent hover:text-slate">{t("close")}</button>
      </div>
    </div>
  );
}

function StatusPanel({ info, locale, savedCode }: { info: RegisterInfo; locale: Locale; savedCode: string | null }) {
  const t = makeET(locale);
  const [state, action, pending] = useActionState<LookupState, FormData>(lookupRegistration.bind(null, locale), {});
  const [cancelState, cancelAction, cancelling] = useActionState<LookupState, FormData>(cancelOwnRegistration.bind(null, locale), {});
  const nf = (x: number) => x.toLocaleString(locale === "fa" ? "fa-IR" : "en-US");
  const cancelled = cancelState.cancelled;
  const canCancel = state.ok && !cancelled && ["pending", "confirmed", "waitlisted"].includes(state.status ?? "");

  return (
    <div className="flex flex-col gap-5">
      <form action={action} className="flex flex-col gap-5">
        <FieldRow label={t("refCode")}>
          <input name="code" required defaultValue={savedCode ?? ""} dir="ltr" autoCapitalize="characters" placeholder="NSH-XXXXXX" className={`${inputCls} text-start uppercase`} />
        </FieldRow>
        <FieldRow label={t("phone")}>
          <input name="phone" required type="tel" inputMode="tel" dir="ltr" className={`${inputCls} text-start`} />
        </FieldRow>
        {state.error && <p role="alert" className="text-sm font-medium text-red-600">{state.error}</p>}
        <button type="submit" disabled={pending} className="bg-ink px-7 py-4 font-bold text-canvas transition-colors hover:bg-accent hover:text-slate disabled:opacity-60">
          {pending ? t("sending") : t("lookup")}
        </button>
      </form>

      {state.ok && (
        <div className="ev-pop flex flex-col gap-3 border-t border-line pt-5">
          <p className="text-sm text-muted">{t("yourReg")} · <span dir="ltr">{state.code}</span></p>
          <p className="ev-display text-2xl text-ink">{state.name}</p>
          <StatusMessage status={cancelled ? "cancelled" : (state.status as string)} position={state.position} locale={locale} />
          <p className="text-sm text-ink-soft">{t("participants")}: <b>{nf(state.participants ?? 1)}</b> · {displayPhone(state.phone ?? "")}</p>
          {info.isPaid && (state.due ?? 0) > 0 && (
            <p className="text-sm text-ink-soft">{t("payDue")}: <b>{formatToman(state.due ?? 0, locale)}</b> · {t("payPaid")}: <b>{formatToman(state.paid ?? 0, locale)}</b></p>
          )}
          {canCancel && (
            <form action={cancelAction}>
              <input type="hidden" name="code" value={state.code} />
              <input type="hidden" name="phone" value={state.phone} />
              <button type="submit" disabled={cancelling} className="text-sm font-semibold text-red-600 underline-offset-4 hover:underline disabled:opacity-60">{t("cancelReg")}</button>
              {cancelState.error && <p role="alert" className="mt-1 text-sm text-red-600">{cancelState.error}</p>}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
