import { finCtx } from "@/lib/finance/page";
import { formatToman, formatNumber, formatDate } from "@/lib/finance/money";
import { todayIso, rangeFromParams } from "@/lib/finance/periods";
import { bookTable } from "@/lib/finance/calc";
import { PAY_METHODS } from "@/lib/finance/types";
import { listBooksNotInInventory } from "@/lib/finance/data";
import {
  addInventoryBook, recordBookPurchase, recordBookSale, setSellingPrice, voidBookSale, voidBookPurchase,
} from "@/lib/actions/admin/finance";
import { FinHeader, Kpi, Pill, tbl, Expand, VoidControl, ExportButton, SectionTitle, Notice, Card, PeriodFilter } from "@/components/finance/ui";
import { FinForm, MoneyInput, PrintButton } from "@/components/finance/FinForm";
import { Field, TextInput, Select } from "@/components/admin/fields";
import { DatePicker } from "@/components/admin/DatePicker";

export default async function BooksFinancePage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await finCtx(params, (t) => t("books"));
  if (!ctx.ok) return ctx.stop;
  const { l, t, ledger } = ctx;
  const sp = await searchParams;
  const cal = ledger.settings.calendar;
  const today = todayIso();
  const { preset, range } = rangeFromParams(sp, today, cal, ledger.settings.default_report_range);
  const m = (n: number) => formatToman(n, l);
  const nf = (n: number) => formatNumber(n, l);

  const table = bookTable(ledger);
  const low = table.filter((b) => b.low);
  const notIn = await listBooksNotInInventory(l, new Set(ledger.inventory.map((i) => i.book_id).filter((x): x is string => !!x)));
  const markup = ledger.settings.book_markup_percent;

  const students = [...new Map(ledger.enrollments.map((e) => [e.studentId, e.studentName])).entries()];
  const periodSales = ledger.sales.filter((s) => s.sold_at >= range.from && s.sold_at <= range.to).sort((a, b) => (a.sold_at < b.sold_at ? 1 : -1));
  const live = periodSales.filter((s) => !s.voided_at);
  const salesRevenue = live.reduce((a, s) => a + s.revenue, 0);
  const salesProfit = live.reduce((a, s) => a + s.revenue - s.cogs, 0);
  const purchases = [...ledger.purchases].sort((a, b) => (a.purchased_at < b.purchased_at ? 1 : -1)).slice(0, 50);
  const invName = new Map(ledger.inventory.map((i) => [i.id, i.title_snapshot]));
  const stockValue = ledger.inventory.reduce((a, i) => a + i.stock_value, 0);

  const methodSelect = (def = "cash") => (
    <Field label={t("method")}>
      <Select name="method" defaultValue={def}>{PAY_METHODS.map((x) => <option key={x} value={x}>{t(`m_${x}` as "m_cash")}</option>)}</Select>
    </Field>
  );

  return (
    <div>
      <FinHeader title={t("books")} subtitle={t("avgCostNote")} actions={<><ExportButton locale={l} t={t} kind="books" params={{ range: preset, from: range.from, to: range.to }} /><PrintButton label={t("print")} /></>} />

      {low.length > 0 && (
        <div className="mb-6"><Notice tone="warn">
          <strong>{t("lowStockAlert")}:</strong> {low.map((b) => `${b.title} (${nf(b.stock)})`).join(l === "fa" ? "، " : ", ")}
        </Notice></div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi label={t("books")} value={nf(table.length)} />
        <Kpi label={t("stock")} value={nf(table.reduce((a, b) => a + b.stock, 0))} />
        <Kpi label={l === "fa" ? "ارزش موجودی (به قیمت خرید)" : "Stock value (at cost)"} value={m(stockValue)} />
        <Kpi label={t("totalProfit")} value={m(table.reduce((a, b) => a + (ledger.sales.filter((s) => s.inventory_id === b.id && !s.voided_at).reduce((x, s) => x + s.revenue - s.cogs, 0)), 0))} tone="good" featured />
      </div>

      <div className={tbl.wrap}>
        <table className={`${tbl.table} min-w-[64rem]`}>
          <thead className={tbl.head}>
            <tr>{(["bookTitle", "purchasePrice", "sellingPrice", "qtyPurchased", "qtySold", "stock", "profitPerBook", "totalProfit", "actions"] as const).map((k) => <th key={k} className={tbl.th}>{t(k)}</th>)}</tr>
          </thead>
          <tbody>
            {table.map((b) => {
              const lifetimeProfit = ledger.sales.filter((s) => s.inventory_id === b.id && !s.voided_at).reduce((x, s) => x + s.revenue - s.cogs, 0);
              return (
                <tr key={b.id} className={`${tbl.row} align-top`}>
                  <td className={`${tbl.td} font-bold text-ink`}><div>{b.title}{b.low && <div className="mt-1"><Pill tone="warn">{t("lowStock")}</Pill></div>}</div></td>
                  <td className={tbl.num}>{m(b.avgCost)}</td>
                  <td className={tbl.num}>{m(b.sellingPrice)}</td>
                  <td className={tbl.num}>{nf(b.purchased)}</td>
                  <td className={tbl.num}>{nf(b.sold)}</td>
                  <td className={`${tbl.num} font-semibold ${b.low ? "text-accent-deep" : ""}`}>{nf(b.stock)}</td>
                  <td className={`${tbl.num} ${b.profitPerBook < 0 ? "text-red-600" : ""}`}>{m(b.profitPerBook)}</td>
                  <td className={`${tbl.num} font-semibold`}>{m(lifetimeProfit)}</td>
                  <td className={`${tbl.td} min-w-44 print:hidden`}>
                    <div className="flex flex-col gap-3">
                      <Expand summary={t("recordPurchase")} wide>
                        <FinForm action={recordBookPurchase.bind(null, l)} submit={t("save")}>
                          <input type="hidden" name="inventory_id" value={b.id} />
                          <Field label={t("quantity")}><TextInput name="quantity" required inputMode="numeric" dir="ltr" className="text-start" /></Field>
                          <Field label={t("unitCost")}><MoneyInput name="unit_cost" locale={l} defaultValue={b.avgCost || undefined} /></Field>
                          <Field label={t("date")}><DatePicker name="date" locale={l} defaultValue={today} /></Field>
                          {methodSelect()}
                          <Field label={t("supplier")}><TextInput name="supplier" /></Field>
                        </FinForm>
                      </Expand>
                      <Expand summary={t("recordSale")} wide>
                        <FinForm action={recordBookSale.bind(null, l)} submit={t("save")}>
                          <input type="hidden" name="inventory_id" value={b.id} />
                          <Field label={`${t("quantity")} (≤ ${nf(b.stock)})`}><TextInput name="quantity" required inputMode="numeric" dir="ltr" className="text-start" defaultValue="1" /></Field>
                          <Field label={t("unitPrice")}><MoneyInput name="unit_price" locale={l} defaultValue={b.sellingPrice || undefined} /></Field>
                          <Field label={t("date")}><DatePicker name="date" locale={l} defaultValue={today} /></Field>
                          {methodSelect()}
                          <Field label={t("student")}>
                            <Select name="student_id" defaultValue="">
                              <option value="">—</option>
                              {students.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                            </Select>
                          </Field>
                          <Field label={t("buyer")}><TextInput name="buyer" /></Field>
                        </FinForm>
                      </Expand>
                      <Expand summary={`${t("sellingPrice")}`} wide>
                        <FinForm action={setSellingPrice.bind(null, l)} submit={t("save")} resetOnOk={false}>
                          <input type="hidden" name="inventory_id" value={b.id} />
                          <Field label={t("sellingPrice")} note={markup > 0 && b.avgCost > 0 ? `${l === "fa" ? "پیشنهاد" : "Suggested"}: ${m(Math.round((b.avgCost * (100 + markup)) / 100))}` : undefined}>
                            <MoneyInput name="selling_price" locale={l} defaultValue={b.sellingPrice} />
                          </Field>
                        </FinForm>
                      </Expand>
                    </div>
                  </td>
                </tr>
              );
            })}
            {table.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted">{t("none")}</td></tr>}
          </tbody>
        </table>
      </div>

      <Card className="mt-6 print:hidden">
        <SectionTitle>{t("addToInventory")}</SectionTitle>
        {notIn.length === 0 ? <p className="text-sm text-muted">{t("allBooksAdded")}</p> : (
          <FinForm action={addInventoryBook.bind(null, l)} submit={t("add")} className="max-w-xl">
            <Field label={t("chooseBook")}>
              <Select name="book_id" required defaultValue="">
                <option value="" disabled>{t("chooseBook")}</option>
                {notIn.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
              </Select>
            </Field>
            <Field label={t("sellingPrice")}><MoneyInput name="selling_price" locale={l} required={false} /></Field>
          </FinForm>
        )}
      </Card>

      <div className="mt-10">
        <SectionTitle>{t("salesReport")}</SectionTitle>
        <PeriodFilter locale={l} t={t} preset={preset} range={range} path="/dashboard/admin/finance/books" />
        <div className="mb-4 grid gap-3 sm:grid-cols-3 sm:gap-4">
          <Kpi label={t("revenue")} value={m(salesRevenue)} />
          <Kpi label={t("cogs")} value={m(salesRevenue - salesProfit)} />
          <Kpi label={t("profit")} value={m(salesProfit)} tone="good" />
        </div>
        <div className={tbl.wrap}>
          <table className={`${tbl.table} min-w-[52rem]`}>
            <thead className={tbl.head}><tr>{(["date", "bookTitle", "quantity", "unitPrice", "revenue", "profit", "buyer", "status"] as const).map((k) => <th key={k} className={tbl.th}>{t(k)}</th>)}<th className={`${tbl.th} print:hidden`} /></tr></thead>
            <tbody>
              {periodSales.map((s) => (
                <tr key={s.id} className={`${tbl.row} ${s.voided_at ? "text-muted line-through" : ""}`}>
                  <td className={tbl.td}>{formatDate(s.sold_at, l)}</td>
                  <td className={tbl.td}>{s.title}</td>
                  <td className={tbl.num}>{nf(s.quantity)}</td>
                  <td className={tbl.num}>{formatNumber(s.unit_price, l)}</td>
                  <td className={tbl.num}>{formatNumber(s.revenue, l)}</td>
                  <td className={tbl.num}>{formatNumber(s.revenue - s.cogs, l)}</td>
                  <td className={tbl.td}>{s.buyer_name ?? "—"}</td>
                  <td className={tbl.td}>{s.voided_at ? <Pill tone="bad">{t("voided")}</Pill> : <Pill tone="good">✓</Pill>}</td>
                  <td className={`${tbl.td} print:hidden`}>{!s.voided_at && <VoidControl action={voidBookSale.bind(null, l)} id={s.id} t={t} />}</td>
                </tr>
              ))}
              {periodSales.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted">{t("none")}</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">{l === "fa" ? "مبالغ به تومان" : "Amounts in Toman"}</p>
      </div>

      <div className="mt-10">
        <SectionTitle>{t("purchasesLog")}</SectionTitle>
        <div className={tbl.wrap}>
          <table className={`${tbl.table} min-w-[44rem]`}>
            <thead className={tbl.head}><tr>{(["date", "bookTitle", "quantity", "unitCost", "total", "supplier", "status"] as const).map((k) => <th key={k} className={tbl.th}>{t(k)}</th>)}<th className={`${tbl.th} print:hidden`} /></tr></thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className={`${tbl.row} ${p.voided_at ? "text-muted line-through" : ""}`}>
                  <td className={tbl.td}>{formatDate(p.purchased_at, l)}</td>
                  <td className={tbl.td}>{invName.get(p.inventory_id) ?? "—"}</td>
                  <td className={tbl.num}>{nf(p.quantity)}</td>
                  <td className={tbl.num}>{formatNumber(p.unit_cost, l)}</td>
                  <td className={tbl.num}>{formatNumber(p.total, l)}</td>
                  <td className={tbl.td}>{p.supplier ?? "—"}</td>
                  <td className={tbl.td}>{p.voided_at ? <Pill tone="bad">{t("voided")}</Pill> : <Pill tone="good">✓</Pill>}</td>
                  <td className={`${tbl.td} print:hidden`}>{!p.voided_at && <VoidControl action={voidBookPurchase.bind(null, l)} id={p.id} t={t} />}</td>
                </tr>
              ))}
              {purchases.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted">{t("none")}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
