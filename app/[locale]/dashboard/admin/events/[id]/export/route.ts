import ExcelJS from "exceljs";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getSession } from "@/lib/auth";
import { loadEventRegistrations } from "@/lib/events/data";
import { makeET } from "@/lib/events/labels";
import { paymentSummary } from "@/lib/events/stats";
import { displayPhone } from "@/lib/events/phone";
import { formatDate } from "@/lib/finance/money";
import { dateParts } from "@/lib/events/time";

/** Participant list as a real .xlsx — numbers are numbers (Toman), the sheet is right-to-left for Persian. */
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });
  const l = locale as Locale;
  const session = await getSession();
  if (!session || session.role !== "admin" || session.demo) return new Response("Forbidden", { status: 403 });
  const res = await loadEventRegistrations(id);
  if (!res.ok || !res.data) return new Response("Not found", { status: res.ok ? 404 : 503 });
  const { event: ev, registrations, payments, attendance } = res.data;
  const t = makeET(l);
  const att = new Map(attendance.map((a) => [a.registration_id, a.attended_participants]));

  const wb = new ExcelJS.Workbook();
  wb.creator = "Neshat Learning Center";
  const title = (ev.title[l] || ev.title.en || ev.title.fa).replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Participants";
  const ws = wb.addWorksheet(title, { views: [{ rightToLeft: l === "fa", state: "frozen", ySplit: 1 }] });
  const unit = l === "fa" ? "تومان" : "Toman";
  ws.columns = [
    { header: t("c_code"), width: 14 }, { header: t("c_name"), width: 26 }, { header: t("c_phone"), width: 16 }, { header: t("c_email"), width: 26 },
    { header: t("c_student"), width: 10 }, { header: t("c_people"), width: 8 }, { header: t("c_status"), width: 14 }, { header: t("c_payment"), width: 14 },
    { header: `${t("total")} (${unit})`, width: 16, style: { numFmt: "#,##0" } }, { header: `${t("payPaid")} (${unit})`, width: 16, style: { numFmt: "#,##0" } },
    { header: t("s_attended"), width: 10 }, { header: t("c_registered"), width: 14 }, { header: t("c_notes"), width: 36 },
  ];
  const head = ws.getRow(1);
  head.font = { bold: true };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFBE9BF" } };
  head.alignment = { vertical: "middle", horizontal: "center" };
  for (const r of registrations) {
    const p = paymentSummary(ev, r, payments);
    ws.addRow([
      r.code, r.full_name, displayPhone(r.phone), r.email ?? "", r.is_student ? t("yes") : t("no"), r.participants,
      t(`rs_${r.status}` as "rs_pending"), t(`ps_${p.status}` as "ps_paid"), p.due, p.paid, att.get(r.id) ?? "", formatDate(r.created_at.slice(0, 10), l), r.notes ?? "",
    ]);
  }
  const buf = await wb.xlsx.writeBuffer();
  const name = `neshat-event-${ev.slug}-${dateParts(ev.startsAt, "en").year}.xlsx`;
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
