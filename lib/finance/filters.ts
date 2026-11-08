import type { Txn } from "./calc";

/** shared by the Transactions page and its Excel export so both always agree */
export function filterTransactions(all: Txn[], sp: Record<string, string | undefined>): Txn[] {
  const q = (sp.q ?? "").trim().toLowerCase();
  const student = (sp.student ?? "").trim().toLowerCase();
  const teacher = (sp.teacher ?? "").trim().toLowerCase();
  return all.filter((x) => {
    if (!sp.voided && x.voided) return false;
    if (sp.from && x.date < sp.from) return false;
    if (sp.to && x.date > sp.to) return false;
    if (sp.type && x.type !== sp.type) return false;
    if (sp.category && x.category !== sp.category) return false;
    if (student && !(x.studentName ?? "").toLowerCase().includes(student)) return false;
    if (teacher && !(x.teacherName ?? "").toLowerCase().includes(teacher)) return false;
    if (q && !`${x.description} ${x.studentName ?? ""} ${x.teacherName ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });
}
