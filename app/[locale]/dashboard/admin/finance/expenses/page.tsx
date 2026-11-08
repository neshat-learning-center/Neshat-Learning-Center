import { finCtx } from "@/lib/finance/page";
import { formatToman, formatDate } from "@/lib/finance/money";
import { todayIso, rangeFromParams, inRange } from "@/lib/finance/periods";
import { MANUAL_EXPENSE_CATEGORIES, ALL_EXPENSE_CATEGORIES, PAY_METHODS, type ExpenseCategory } from "@/lib/finance/types";
import { signedReceiptUrl } from "@/lib/finance/data";
import { addExpense, updateExpense, voidExpense, addOtherIncome, voidOtherIncome } from "@/lib/actions/admin/finance";
import { FinHeader, Kpi, Pill, tbl, Expand, VoidControl, ExportButton, SectionTitle, Card, PeriodFilter, Notice } from "@/components/finance/ui";
import { FinForm, MoneyInput, PrintButton } from "@/components/finance/FinForm";
import { Field, TextInput, Select } from "@/components/admin/fields";
import { DatePicker } from "@/components/admin/DatePicker";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { HBarChart } from "@/components/finance/Charts";

export default async function ExpensesPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await finCtx(params, (t) => t("expenses"));
  if (!ctx.ok) return ctx.stop;
  const { l, t, ledger } = ctx;
  const sp = await searchParams;
  const cal = ledger.settings.calendar;
  const today = todayIso();
  const { preset, range } = rangeFromParams(sp, today, cal, ledger.settings.default_report_range);
  const m = (n: number) => formatToman(n, l);
  const cat = (c: ExpenseCategory) => t(`c_${c}` as "c_rent");
  const catFilter = (sp.category ?? "all") as ExpenseCategory | "all";

  const manual = ledger.expenses
    .filter((e) => inRange(e.expense_date, range) && (catFilter === "all" || e.category === catFilter))
    .sort((a, b) => (a.expense_date < b.expense_date ? 1 : -1));
  const receipts = new Map<string, string>();
  await Promise.all(manual.filter((e) => e.receipt_path).map(async (e) => {
    const u = await signedReceiptUrl(e.receipt_path as string);
    if (u) receipts.set(e.id, u);
  }));

  const live = ledger.expenses.filter((e) => !e.voided_at && inRange(e.expense_date, range));
  const salaryPaid = ledger.salaryPayments.filter((p) => !p.voided_at && inRange(p.paid_at, range));
  const bookBuys = ledger.purchases.filter((p) => !p.voided_at && inRange(p.purchased_at, range));
  const byCat = new Map<ExpenseCategory, number>();
  for (const e of live) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  byCat.set("teacher_salaries", salaryPaid.reduce((a, p) => a + p.amount, 0));
  byCat.set("book_purchases", bookBuys.reduce((a, p) => a + p.total, 0));
  const total = [...byCat.values()].reduce((a, v) => a + v, 0);
  const income = ledger.otherIncome.filter((i) => inRange(i.income_date, range)).sort((a, b) => (a.income_date < b.income_date ? 1 : -1));
  const incomeTotal = income.filter((i) => !i.voided_at).reduce((a, i) => a + i.amount, 0);

  const methodField = (def = "cash") => (
    <Field label={t("method")}>
      <Select name="method" defaultValue={def}>{PAY_METHODS.map((x) => <option key={x} value={x}>{t(`m_${x}` as "m_cash")}</option>)}</Select>
    </Field>
  );
  const catField = (def?: string) => (
    <Field label={t("category")}>
      <Select name="category" required defaultValue={def ?? "rent"}>
        {MANUAL_EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{cat(c)}</option>)}
      </Select>
    </Field>
  );
  const upload = (cur?: string | null) => (
    <FileUploadField
      bucket="receipts" pathPrefix="expenses" hiddenInputName="receipt_path" storePathOnly accept="image/*,application/pdf"
      label={t("receipt")} currentUrl={cur} chooseLabel={t("chooseFile")} changeLabel={t("changeFile")} uploadingLabel={t("uploading")}
    />
  );

  return (
    <div>
      <FinHeader title={t("expenses")} subtitle={t("autoRowHint")} actions={<><ExportButton locale={l} t={t} kind="expenses" params={{ range: preset, from: range.from, to: range.to }} /><PrintButton label={t("print")} /></>} />
      <PeriodFilter locale={l} t={t} preset={preset} range={range} path="/dashboard/admin/finance/expenses" keep={catFilter === "all" ? {} : { category: catFilter }} />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Kpi label={`${t("totalExpenses")} (${l === "fa" ? "پرداخت‌شده" : "paid"})`} value={m(total)} featured />
        <Card>
          <HBarChart empty={t("noData")} color="#f4b223"
            rows={ALL_EXPENSE_CATEGORIES.map((c) => ({ label: cat(c), value: byCat.get(c) ?? 0, tip: m(byCat.get(c) ?? 0) })).sort((a, b) => b.value - a.value)} />
        </Card>
      </div>

      <Card className="mb-8 print:hidden">
        <SectionTitle>{t("addExpense")}</SectionTitle>
        <FinForm action={addExpense.bind(null, l)} submit={t("add")} className="max-w-2xl">
          <div className="grid gap-4 sm:grid-cols-2">
            {catField()}
            <Field label={t("amount")} note={t("amountHint")}><MoneyInput name="amount" locale={l} /></Field>
            <Field label={t("date")}><DatePicker name="expense_date" locale={l} defaultValue={today} /></Field>
            {methodField()}
          </div>
          <Field label={t("description")}><TextInput name="description" /></Field>
          {upload()}
        </FinForm>
      </Card>

      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        {(["all", ...MANUAL_EXPENSE_CATEGORIES] as const).map((c) => (
          <a key={c} href={`?range=${preset}${preset === "custom" ? `&from=${range.from}&to=${range.to}` : ""}&category=${c}`}
            className={`rounded-full border px-3 py-1.5 text-xs ${catFilter === c ? "border-ink bg-ink text-canvas" : "border-line-strong text-ink-soft hover:border-ink"}`}>
            {c === "all" ? t("all") : cat(c)}
          </a>
        ))}
      </div>

      <div className={tbl.wrap}>
        <table className={`${tbl.table} min-w-[52rem]`}>
          <thead className={tbl.head}><tr>{(["date", "category", "description", "amount", "method", "status"] as const).map((k) => <th key={k} className={tbl.th}>{t(k)}</th>)}<th className={`${tbl.th} print:hidden`} /></tr></thead>
          <tbody>
            {manual.map((e) => (
              <tr key={e.id} className={`${tbl.row} align-top ${e.voided_at ? "text-muted line-through" : ""}`}>
                <td className={tbl.td}>{formatDate(e.expense_date, l)}</td>
                <td className={tbl.td}>{cat(e.category)}</td>
                <td className={tbl.td}><div>{e.description ?? "—"}{receipts.get(e.id) && <> · <a className="text-accent-deep hover:underline" href={receipts.get(e.id)} target="_blank" rel="noopener noreferrer">{t("viewReceipt")}</a></>}</div></td>
                <td className={`${tbl.num} font-semibold`}>{m(e.amount)}</td>
                <td className={tbl.td}>{t(`m_${e.method}` as "m_cash")}</td>
                <td className={tbl.td}>{e.voided_at ? <Pill tone="bad">{t("voided")} · {e.void_reason}</Pill> : <Pill tone="good">✓</Pill>}</td>
                <td className={`${tbl.td} min-w-40 print:hidden`}>
                  {!e.voided_at && (
                    <div className="flex flex-col gap-3">
                      <Expand summary={t("edit")} wide>
                        <FinForm action={updateExpense.bind(null, l)} submit={t("save")} resetOnOk={false}>
                          <input type="hidden" name="id" value={e.id} />
                          {catField(e.category)}
                          <Field label={t("amount")}><MoneyInput name="amount" locale={l} defaultValue={e.amount} /></Field>
                          <Field label={t("date")}><DatePicker name="expense_date" locale={l} defaultValue={e.expense_date} /></Field>
                          {methodField(e.method)}
                          <Field label={t("description")}><TextInput name="description" defaultValue={e.description ?? ""} /></Field>
                          {upload(e.receipt_path)}
                        </FinForm>
                      </Expand>
                      <VoidControl action={voidExpense.bind(null, l)} id={e.id} t={t} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {catFilter === "all" && salaryPaid.map((p) => (
              <tr key={p.id} className={`${tbl.row} bg-sand/30`}>
                <td className={tbl.td}>{formatDate(p.paid_at, l)}</td>
                <td className={tbl.td}>{cat("teacher_salaries")}</td>
                <td className={tbl.td}><div><Pill>{t("autoRow")}</Pill> {ledger.teachers.find((x) => x.id === p.teacher_id)?.name ?? ""}</div></td>
                <td className={`${tbl.num} font-semibold`}>{m(p.amount)}</td>
                <td className={tbl.td}>{t(`m_${p.method}` as "m_cash")}</td>
                <td className={tbl.td}><Pill tone="good">✓</Pill></td><td />
              </tr>
            ))}
            {catFilter === "all" && bookBuys.map((p) => (
              <tr key={p.id} className={`${tbl.row} bg-sand/30`}>
                <td className={tbl.td}>{formatDate(p.purchased_at, l)}</td>
                <td className={tbl.td}>{cat("book_purchases")}</td>
                <td className={tbl.td}><div><Pill>{t("autoRow")}</Pill> {ledger.inventory.find((i) => i.id === p.inventory_id)?.title_snapshot ?? ""}</div></td>
                <td className={`${tbl.num} font-semibold`}>{m(p.total)}</td>
                <td className={tbl.td}>{t(`m_${p.method}` as "m_cash")}</td>
                <td className={tbl.td}><Pill tone="good">✓</Pill></td><td />
              </tr>
            ))}
            {manual.length === 0 && salaryPaid.length + bookBuys.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted">{t("none")}</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-12">
        <SectionTitle aside={<span className="text-sm font-bold text-emerald-700">{m(incomeTotal)}</span>}>{t("otherIncome")}</SectionTitle>
        <Card className="mb-4 print:hidden">
          <FinForm action={addOtherIncome.bind(null, l)} submit={t("addOtherIncome")} className="max-w-2xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("source")}><TextInput name="source" required /></Field>
              <Field label={t("amount")}><MoneyInput name="amount" locale={l} /></Field>
              <Field label={t("date")}><DatePicker name="income_date" locale={l} defaultValue={today} /></Field>
              {methodField()}
            </div>
            <Field label={t("note")}><TextInput name="note" /></Field>
          </FinForm>
        </Card>
        <div className={tbl.wrap}>
          <table className={`${tbl.table} min-w-[36rem]`}>
            <thead className={tbl.head}><tr>{(["date", "source", "amount", "method", "status"] as const).map((k) => <th key={k} className={tbl.th}>{t(k)}</th>)}<th className={`${tbl.th} print:hidden`} /></tr></thead>
            <tbody>
              {income.map((i) => (
                <tr key={i.id} className={`${tbl.row} ${i.voided_at ? "text-muted line-through" : ""}`}>
                  <td className={tbl.td}>{formatDate(i.income_date, l)}</td>
                  <td className={tbl.td}>{i.source}</td>
                  <td className={`${tbl.num} font-semibold`}>{m(i.amount)}</td>
                  <td className={tbl.td}>{t(`m_${i.method}` as "m_cash")}</td>
                  <td className={tbl.td}>{i.voided_at ? <Pill tone="bad">{t("voided")}</Pill> : <Pill tone="good">✓</Pill>}</td>
                  <td className={`${tbl.td} print:hidden`}>{!i.voided_at && <VoidControl action={voidOtherIncome.bind(null, l)} id={i.id} t={t} />}</td>
                </tr>
              ))}
              {income.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted">{t("none")}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-6"><Notice>{t("voidHint")}</Notice></div>
    </div>
  );
}
