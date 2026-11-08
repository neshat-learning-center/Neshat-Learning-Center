import { finCtx } from "@/lib/finance/page";
import { formatDateTime, formatBp } from "@/lib/finance/money";
import { loadAudit } from "@/lib/finance/data";
import { SALARY_METHODS } from "@/lib/finance/types";
import { saveSettings } from "@/lib/actions/admin/finance";
import { FinHeader, Card, SectionTitle, tbl, Pill } from "@/components/finance/ui";
import { FinForm } from "@/components/finance/FinForm";
import { Field, TextInput, Select } from "@/components/admin/fields";

const SKIP = new Set(["updated_at", "created_at", "created_by"]);

export default async function FinanceSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const ctx = await finCtx(params, (t) => t("settings"));
  if (!ctx.ok) return ctx.stop;
  const { l, t, ledger } = ctx;
  const s = ledger.settings;
  const audit = await loadAudit(100);

  const changed = (a: Record<string, unknown> | null, b: Record<string, unknown> | null) => {
    if (!b) return "";
    if (!a) return Object.keys(b).filter((k) => !SKIP.has(k) && b[k] != null).slice(0, 4).map((k) => `${k}=${String(b[k]).slice(0, 24)}`).join(" · ");
    return Object.keys(b).filter((k) => !SKIP.has(k) && JSON.stringify(a[k]) !== JSON.stringify(b[k])).slice(0, 4)
      .map((k) => `${k}: ${String(a[k]).slice(0, 18)} → ${String(b[k]).slice(0, 18)}`).join(" · ");
  };

  return (
    <div>
      <FinHeader title={t("settings")} subtitle={t("settingsIntro")} />
      <Card className="max-w-3xl">
        <FinForm action={saveSettings.bind(null, l)} submit={t("save")} resetOnOk={false}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("defaultMethod")}>
              <Select name="default_salary_method" defaultValue={s.default_salary_method}>
                {SALARY_METHODS.map((x) => <option key={x} value={x}>{t(x)}</option>)}
              </Select>
            </Field>
            <Field label={t("defaultRateAmt")} note={`${t("ratePerHour")} · ${t("ratePerClass")} · ${t("ratePercent")}`}>
              <TextInput name="default_salary_rate" dir="ltr" className="text-start" inputMode="decimal" required
                defaultValue={s.default_salary_method === "percentage" ? String(s.default_salary_rate / 100) : String(s.default_salary_rate)} />
            </Field>
            <Field label={t("sessionMinutes")} note={t("sessionMinutesHint")}>
              <TextInput name="default_session_minutes" type="number" min={1} dir="ltr" className="text-start" required defaultValue={s.default_session_minutes} />
            </Field>
            <Field label={t("lowStockThreshold")}>
              <TextInput name="low_stock_threshold" type="number" min={0} dir="ltr" className="text-start" required defaultValue={s.low_stock_threshold} />
            </Field>
            <Field label={t("markup")} note={t("markupHint")}>
              <TextInput name="book_markup_percent" type="number" min={0} dir="ltr" className="text-start" required defaultValue={s.book_markup_percent} />
            </Field>
            <Field label={t("calendar")}>
              <Select name="calendar" defaultValue={s.calendar}>
                <option value="jalali">{t("jalali")}</option>
                <option value="gregorian">{t("gregorian")}</option>
              </Select>
            </Field>
            <Field label={t("defaultRange")}>
              <Select name="default_report_range" defaultValue={s.default_report_range}>
                <option value="this_month">{t("thisMonth")}</option>
                <option value="last_month">{t("lastMonth")}</option>
                <option value="last_3_months">{t("last3")}</option>
                <option value="this_year">{t("thisYear")}</option>
              </Select>
            </Field>
          </div>
          <p className="text-xs text-muted">{s.default_salary_method === "percentage" ? formatBp(s.default_salary_rate, l) : ""}</p>
        </FinForm>
      </Card>

      <div className="mt-10">
        <SectionTitle>{t("auditLog")}</SectionTitle>
        <p className="mb-3 text-sm text-muted">{t("auditHint")}</p>
        <div className={tbl.wrap}>
          <table className={`${tbl.table} min-w-[52rem]`}>
            <thead className={tbl.head}><tr>{(["when", "table", "actionCol"] as const).map((k) => <th key={k} className={tbl.th}>{t(k)}</th>)}<th className={tbl.th}>{t("description")}</th></tr></thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className={tbl.row}>
                  <td className={tbl.td}>{formatDateTime(a.at, l)}</td>
                  <td className={tbl.td} dir="ltr">{a.table_name}</td>
                  <td className={tbl.td}><Pill tone={a.action === "INSERT" ? "good" : "warn"}>{a.action}</Pill></td>
                  <td className={`${tbl.td} max-w-md truncate text-xs text-ink-soft`} dir="ltr">{changed(a.old_row, a.new_row)}</td>
                </tr>
              ))}
              {audit.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted">{t("none")}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
