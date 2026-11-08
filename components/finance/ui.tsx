import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import type { T } from "@/lib/finance/labels";
import type { Range, Preset } from "@/lib/finance/periods";
import { DatePicker } from "@/components/admin/DatePicker";
import { FinForm } from "@/components/finance/FinForm";
import { TextInput } from "@/components/admin/fields";
import type { FinState } from "@/lib/actions/admin/finance";

export function FinHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6 sm:gap-4">
      <div>
        <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 print:hidden">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-paper p-5 shadow-sm ${className}`}>{children}</div>;
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="h-5 w-1 rounded-full bg-accent" />
        <h2 className="text-lg font-bold text-ink">{children}</h2>
      </div>
      {aside}
    </div>
  );
}

const TONES = {
  default: "text-ink",
  good: "text-emerald-700",
  bad: "text-red-600",
  accent: "text-accent-deep",
} as const;

export function Kpi({ label, value, hint, tone = "default", featured }: {
  label: string; value: string; hint?: string; tone?: keyof typeof TONES; featured?: boolean;
}) {
  return (
    <div className={`min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5 ${featured ? "border-accent/40 bg-accent-wash" : "border-line bg-paper"}`}>
      <p className="text-xs text-muted sm:text-sm">{label}</p>
      <p className={`mt-1.5 break-words text-[1.05rem] font-extrabold leading-snug sm:mt-2 sm:text-2xl ${TONES[tone]}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const PILL = {
  neutral: "bg-sand text-ink-soft",
  good: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  warn: "bg-accent-wash text-accent-deep ring-1 ring-accent/30",
  bad: "bg-red-50 text-red-700 ring-1 ring-red-200",
} as const;

export function Pill({ tone = "neutral", children }: { tone?: keyof typeof PILL; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${PILL[tone]}`}>{children}</span>;
}

/** consistent table chrome */
export const tbl = {
  wrap: "overflow-x-auto rounded-2xl border border-line bg-paper shadow-sm",
  table: "rtable w-full min-w-[40rem] text-sm",
  head: "border-b border-line bg-sand/50 text-xs text-muted",
  th: "px-4 py-3 text-start font-medium",
  td: "px-4 py-3 align-middle",
  row: "border-b border-line last:border-0",
  num: "px-4 py-3 align-middle tabular-nums",
};

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" | "bad" }) {
  const c = tone === "bad" ? "border-red-200 bg-red-50 text-red-700" : tone === "warn" ? "border-accent/40 bg-accent-wash text-ink" : "border-line bg-sand text-ink-soft";
  return <div className={`rounded-xl border p-4 text-sm ${c}`}>{children}</div>;
}

export function PeriodFilter({ locale, t, preset, range, path, keep = {} }: {
  locale: Locale; t: T; preset: Preset; range: Range; path: string; keep?: Record<string, string>;
}) {
  const presets: { key: Exclude<Preset, "custom">; label: string }[] = [
    { key: "this_month", label: t("thisMonth") },
    { key: "last_month", label: t("lastMonth") },
    { key: "last_3_months", label: t("last3") },
    { key: "this_year", label: t("thisYear") },
  ];
  const q = (extra: Record<string, string>) => new URLSearchParams({ ...keep, ...extra }).toString();
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end print:hidden">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Link
            key={p.key}
            href={`${href(locale, path)}?${q({ range: p.key })}`}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              preset === p.key ? "border-ink bg-ink text-canvas" : "border-line-strong text-ink-soft hover:border-ink hover:text-ink"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>
      <form method="get" action={href(locale, path)} className="grid grid-cols-2 items-end gap-2 sm:flex sm:flex-wrap">
        {Object.entries(keep).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <input type="hidden" name="range" value="custom" />
        <label className="flex flex-col gap-1 text-xs text-muted">{t("from")}
          <span className="block sm:w-40"><DatePicker name="from" locale={locale} defaultValue={preset === "custom" ? range.from : undefined} required /></span>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">{t("to")}
          <span className="block sm:w-40"><DatePicker name="to" locale={locale} defaultValue={preset === "custom" ? range.to : undefined} required /></span>
        </label>
        <button type="submit" className={`col-span-2 rounded-full border px-4 py-2.5 text-sm transition-colors sm:col-span-1 ${preset === "custom" ? "border-ink bg-ink text-canvas" : "border-line-strong text-ink-soft hover:border-ink hover:text-ink"}`}>
          {t("custom")}
        </button>
      </form>
    </div>
  );
}

/** Void = the only way to remove a financial record. Needs a reason; keeps the row + audit trail. */
export function VoidControl({ action, id, t, label }: { action: (p: FinState, fd: FormData) => Promise<FinState>; id: string; t: T; label?: string }) {
  return (
    <details className="group relative text-start sm:inline-block">
      <summary className="cursor-pointer list-none text-sm text-red-600 hover:underline">{label ?? t("void")}</summary>
      <div className="mt-2 w-full rounded-xl border border-line bg-paper p-4 shadow-lg sm:absolute sm:end-0 sm:z-20 sm:w-72">
        <FinForm action={action} submit={t("void")} tone="danger">
          <input type="hidden" name="id" value={id} />
          <TextInput name="reason" required placeholder={t("voidReason")} />
          <p className="text-xs text-muted">{t("voidHint")}</p>
        </FinForm>
      </div>
    </details>
  );
}

/** a collapsible inline form row ("Record payment", "Edit rate"…) */
export function Expand({ summary, children, wide }: { summary: string; children: ReactNode; wide?: boolean }) {
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm font-medium text-accent-deep hover:underline">{summary}</summary>
      <div className={`mt-3 rounded-xl border border-line bg-canvas p-4 ${wide ? "sm:min-w-[22rem]" : ""}`}>{children}</div>
    </details>
  );
}

export function ExportButton({ locale, t, kind, params }: { locale: Locale; t: T; kind: string; params: Record<string, string> }) {
  const qs = new URLSearchParams({ kind, ...params }).toString();
  return (
    <a
      href={`${href(locale, "/dashboard/admin/finance/export")}?${qs}`}
      className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink transition-colors hover:border-ink"
    >
      {t("exportExcel")}
    </a>
  );
}
