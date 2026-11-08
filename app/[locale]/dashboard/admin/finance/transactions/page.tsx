import { finCtx } from "@/lib/finance/page";
import { formatToman, formatDate } from "@/lib/finance/money";
import { transactions, type TxnType } from "@/lib/finance/calc";
import { ALL_EXPENSE_CATEGORIES } from "@/lib/finance/types";
import { FinHeader, Pill, tbl, ExportButton, Card } from "@/components/finance/ui";
import { PrintButton } from "@/components/finance/FinForm";
import { Select } from "@/components/admin/fields";
import { DatePicker } from "@/components/admin/DatePicker";
import { filterTransactions } from "@/lib/finance/filters";

const TYPES: TxnType[] = ["student_payment", "refund", "book_sale", "salary_payment", "staff_payment", "expense", "other_income", "book_purchase"];

export default async function TransactionsPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await finCtx(params, (t) => t("transactions"));
  if (!ctx.ok) return ctx.stop;
  const { l, t, ledger } = ctx;
  const sp = await searchParams;
  const m = (n: number) => formatToman(n, l);
  const all = transactions(ledger);
  const rows = filterTransactions(all, sp);
  const shown = rows.slice(0, 300);
  const exportParams = Object.fromEntries(Object.entries(sp).filter(([, v]) => v)) as Record<string, string>;
  const inSum = rows.filter((r) => !r.voided && !r.pending && r.direction === "in").reduce((a, r) => a + r.amount, 0);
  const outSum = rows.filter((r) => !r.voided && !r.pending && r.direction === "out").reduce((a, r) => a + r.amount, 0);

  return (
    <div>
      <FinHeader
        title={t("txnHistory")}
        subtitle={`${t("in")}: ${m(inSum)} · ${t("out")}: ${m(outSum)}`}
        actions={<><ExportButton locale={l} t={t} kind="transactions" params={exportParams} /><PrintButton label={t("print")} /></>}
      />
      <Card className="mb-6 print:hidden">
        <form method="get" className="grid grid-cols-2 items-end gap-3 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs text-muted">{t("from")}<DatePicker name="from" locale={l} defaultValue={sp.from} /></label>
          <label className="flex flex-col gap-1 text-xs text-muted">{t("to")}<DatePicker name="to" locale={l} defaultValue={sp.to} /></label>
          <label className="flex flex-col gap-1 text-xs text-muted">{t("type")}
            <Select name="type" defaultValue={sp.type ?? ""}>
              <option value="">{t("all")}</option>
              {TYPES.map((x) => <option key={x} value={x}>{t(`t_${x}` as "t_expense")}</option>)}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">{t("category")}
            <Select name="category" defaultValue={sp.category ?? ""}>
              <option value="">{t("all")}</option>
              {ALL_EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{t(`c_${c}` as "c_rent")}</option>)}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">{t("student")}
            <input name="student" defaultValue={sp.student ?? ""} className="rounded-md border border-line-strong bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-accent" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">{t("teacher")}
            <input name="teacher" defaultValue={sp.teacher ?? ""} className="rounded-md border border-line-strong bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-accent" />
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-xs text-muted lg:col-span-1">{t("search")}
            <input name="q" defaultValue={sp.q ?? ""} placeholder={t("description")} className="rounded-md border border-line-strong bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-accent" />
          </label>
          <div className="col-span-2 flex flex-wrap items-center gap-4 lg:col-span-1">
            <label className="flex items-center gap-2 text-sm text-ink-soft"><input type="checkbox" name="voided" value="1" defaultChecked={sp.voided === "1"} />{t("includeVoided")}</label>
            <button className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate hover:bg-accent-deep">{t("filter")}</button>
          </div>
        </form>
      </Card>

      <div className={tbl.wrap}>
        <table className={`${tbl.table} min-w-[56rem]`}>
          <thead className={tbl.head}><tr>{(["date", "type", "category", "description", "student", "teacher", "method", "amount"] as const).map((k) => <th key={k} className={tbl.th}>{t(k)}</th>)}</tr></thead>
          <tbody>
            {shown.map((x) => (
              <tr key={`${x.type}-${x.id}`} className={`${tbl.row} ${x.voided ? "text-muted line-through" : ""}`}>
                <td className={tbl.td}>{formatDate(x.date, l)}</td>
                <td className={tbl.td}><div className="flex flex-wrap gap-1 max-md:justify-end"><Pill tone={x.direction === "in" ? "good" : "neutral"}>{t(`t_${x.type}` as "t_expense")}</Pill>{x.pending && <Pill tone="warn">{t("pendingTag")}</Pill>}{x.voided && <Pill tone="bad">{t("voided")}</Pill>}</div></td>
                <td className={tbl.td}>{x.category in { rent: 1, utilities: 1, internet: 1, teacher_salaries: 1, staff_salaries: 1, marketing: 1, book_purchases: 1, office_supplies: 1, maintenance: 1, other: 1 } ? t(`c_${x.category}` as "c_rent") : "—"}</td>
                <td className={tbl.td}>{x.description || "—"}</td>
                <td className={tbl.td}>{x.studentName ?? "—"}</td>
                <td className={tbl.td}>{x.teacherName ?? "—"}</td>
                <td className={tbl.td}>{t(`m_${x.method}` as "m_cash")}</td>
                <td className={`${tbl.num} font-semibold ${x.direction === "in" ? "text-emerald-700" : "text-ink"}`}>{x.direction === "in" ? "+" : "−"} {m(x.amount)}</td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted">{t("none")}</td></tr>}
          </tbody>
        </table>
      </div>
      {rows.length > 300 && <p className="mt-3 text-xs text-muted">{t("showingLatest")}</p>}
    </div>
  );
}
