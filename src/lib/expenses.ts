export type Expense = {
  id: string;
  amount: number;
  category: string;
  date: string; // ISO yyyy-mm-dd — when the expense was logged/paid
  targetMonth: string; // yyyy-mm — which month this bill is for
  note?: string;
};

export const CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Entertainment",
  "Health",
  "Shopping",
  "Education",
  "Investment",
  "Stock Market",
  "Credit Card Bill",
  "Savings",
  "Other",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Food: "#6366f1",
  Transport: "#06b6d4",
  Housing: "#f59e0b",
  Utilities: "#10b981",
  Entertainment: "#ec4899",
  Health: "#ef4444",
  Shopping: "#8b5cf6",
  Education: "#14b8a6",
  Investment: "#0ea5e9",
  "Stock Market": "#a855f7",
  "Credit Card Bill": "#f43f5e",
  Savings: "#22c55e",
  Other: "#64748b",
};

const STORAGE_KEY = "expense-tracker:expenses";

export function loadExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e) => e && typeof e.amount === "number" && typeof e.date === "string",
      )
      .map((e) => ({
        ...e,
        // Back-fill targetMonth for data saved before the field existed.
        targetMonth:
          typeof e.targetMonth === "string" && e.targetMonth
            ? e.targetMonth
            : monthKey(e.date),
      }));
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7); // yyyy-mm
}

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, (month || 1) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
