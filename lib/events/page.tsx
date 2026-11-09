import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { requireAdminSession } from "@/lib/admin-guard";
import { makeET, type ET } from "./labels";
import type { AdminLoad } from "./data";
import { FinHeader, Notice } from "@/components/finance/ui";

/** Shared admin-page preamble: locale check, admin gate, friendly notices when the DB isn't ready. */
export async function eventsAdminCtx(params: Promise<{ locale: string }>): Promise<{ l: Locale; t: ET }> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  await requireAdminSession(l);
  return { l, t: makeET(l) };
}

export function adminNotice(res: Extract<AdminLoad<unknown>, { ok: false }>, t: ET, title: string): ReactNode {
  const msg = res.reason === "migration" ? t("a_needsMigration") : res.reason === "not_configured" ? t("a_notConnected") : `${t("e_generic")} ${res.message ?? ""}`;
  return (
    <div>
      <FinHeader title={title} />
      <Notice tone={res.reason === "error" ? "bad" : "warn"}>{msg}</Notice>
    </div>
  );
}
