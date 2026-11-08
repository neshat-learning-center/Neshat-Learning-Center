export type SalaryMethod = "hourly" | "per_class" | "percentage";
export type PayMethod = "cash" | "card" | "bank_transfer" | "online" | "cheque" | "other";
export type ExpenseCategory =
  | "rent" | "utilities" | "internet" | "teacher_salaries" | "staff_salaries"
  | "marketing" | "book_purchases" | "office_supplies" | "maintenance" | "other";

export const SALARY_METHODS: SalaryMethod[] = ["hourly", "per_class", "percentage"];
export const PAY_METHODS: PayMethod[] = ["cash", "card", "bank_transfer", "online", "cheque", "other"];
/** Categories an admin can enter by hand (the other two are derived — see migration 0015). */
export const MANUAL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "rent", "utilities", "internet", "staff_salaries", "marketing", "office_supplies", "maintenance", "other",
];
export const ALL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "rent", "utilities", "internet", "teacher_salaries", "staff_salaries",
  "marketing", "book_purchases", "office_supplies", "maintenance", "other",
];

export interface FinSettings {
  default_salary_method: SalaryMethod;
  default_salary_rate: number;
  default_session_minutes: number;
  book_markup_percent: number;
  low_stock_threshold: number;
  calendar: "jalali" | "gregorian";
  default_report_range: "this_month" | "last_month" | "last_3_months" | "this_year";
}

export const DEFAULT_SETTINGS: FinSettings = {
  default_salary_method: "per_class",
  default_salary_rate: 0,
  default_session_minutes: 90,
  book_markup_percent: 20,
  low_stock_threshold: 5,
  calendar: "jalali",
  default_report_range: "this_month",
};

export interface TeacherRate {
  teacher_id: string;
  method: SalaryMethod;
  rate: number; // Toman, or basis points for "percentage"
}

export interface PaymentRec {
  id: string;
  enrollment_id: string | null;
  student_id: string | null;
  class_id: string | null;
  student_name: string | null;
  class_title: string | null;
  kind: "payment" | "refund";
  status: "completed" | "pending";
  amount: number;
  method: PayMethod;
  paid_at: string;
  reference: string | null;
  note: string | null;
  voided_at: string | null;
  void_reason: string | null;
  created_at: string;
}

export interface StatementRec {
  id: string;
  teacher_id: string | null;
  teacher_name: string | null;
  period_key: string;
  period_start: string;
  period_end: string;
  method: SalaryMethod;
  rate: number;
  sessions: number;
  minutes: number;
  revenue_base: number;
  gross_amount: number;
  created_at: string;
}

export interface SalaryPaymentRec {
  id: string;
  statement_id: string;
  teacher_id: string | null;
  amount: number;
  method: PayMethod;
  paid_at: string;
  reference: string | null;
  note: string | null;
  voided_at: string | null;
  void_reason: string | null;
}

export interface InventoryRec {
  id: string;
  book_id: string | null;
  title_snapshot: string;
  selling_price: number;
  last_unit_cost: number;
  stock_qty: number;
  stock_value: number;
}

export interface PurchaseRec {
  id: string;
  inventory_id: string;
  quantity: number;
  unit_cost: number;
  total: number;
  purchased_at: string;
  method: PayMethod;
  supplier: string | null;
  note: string | null;
  voided_at: string | null;
  void_reason: string | null;
}

export interface SaleRec {
  id: string;
  inventory_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  revenue: number;
  cogs: number;
  sold_at: string;
  method: PayMethod;
  student_id: string | null;
  buyer_name: string | null;
  note: string | null;
  voided_at: string | null;
  void_reason: string | null;
}

export interface ExpenseRec {
  id: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  method: PayMethod;
  description: string | null;
  receipt_path: string | null;
  voided_at: string | null;
  void_reason: string | null;
}

export interface IncomeRec {
  id: string;
  amount: number;
  income_date: string;
  source: string;
  method: PayMethod;
  note: string | null;
  voided_at: string | null;
  void_reason: string | null;
}

/** one distinct held session of a class (a date with attendance taken) */
export interface SessionFact {
  classId: string;
  teacherId: string;
  date: string;
  minutes: number;
}

/** class → who teaches it, and which course it belongs to */
export interface ClassInfo {
  id: string;
  title: string;
  teacherId: string | null;
  courseId: string | null;
  courseTitle: string;
}

export interface EnrollmentInfo {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  classTitle: string;
  courseTitle: string;
  teacherId: string | null;
  teacherName: string;
  fee: number;
}

/** everything the calculators need, loaded once per request */
export interface Ledger {
  settings: FinSettings;
  rates: TeacherRate[];
  teachers: { id: string; name: string }[];
  classes: ClassInfo[];
  enrollments: EnrollmentInfo[];
  payments: PaymentRec[];
  statements: StatementRec[];
  salaryPayments: SalaryPaymentRec[];
  inventory: InventoryRec[];
  purchases: PurchaseRec[];
  sales: SaleRec[];
  expenses: ExpenseRec[];
  otherIncome: IncomeRec[];
  sessions: SessionFact[];
}
