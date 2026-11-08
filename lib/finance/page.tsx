import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { requireAdminSession } from "@/lib/admin-guard";
import { makeT, type T } from "./labels";
import { loadLedger } from "./data";
import type { Ledger } from "./types";
import { Notice, FinHeader } from "@/components/finance/ui";

export type FinCtx =
  | { ok: false; stop: ReactNode }
  | { ok: true; l: Locale; t: T; ledger: Ledger };

/** Shared page preamble: locale check, admin-only gate, ledger load with friendly setup/error notices. */
export async function finCtx(params: Promise<{ locale: string }>, title: (t: T) => string): Promise<FinCtx> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  await requireAdminSession(l);
  const t = makeT(l);
  const res = await loadLedger(l);
  if (!res.ok) {
    const msg = res.reason === "migration" ? t("needsMigration") : res.reason === "not_configured" ? t("notConnected") : `${t("loadError")}: ${res.message ?? ""}`;
    return {
      ok: false,
      stop: (
        <div>
          <FinHeader title={title(t)} />
          <Notice tone={res.reason === "error" ? "bad" : "warn"}>{msg}</Notice>
        </div>
      ),
    };
  }
  return { ok: true, l, t, ledger: res.ledger };
}
