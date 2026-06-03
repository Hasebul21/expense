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
  "Pocket Money",
  "Investment",
  "Stock Market",
  "Credit Card Bill",
  "Savings",
  "Other",
] as const;

// Categories that represent money put away rather than spent — summed per
// month into the card's "Invested" total.
export const INVESTED_CATEGORIES = [
  "Investment",
  "Stock Market",
  "Savings",
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
  "Pocket Money": "#eab308",
  Investment: "#0ea5e9",
  "Stock Market": "#a855f7",
  "Credit Card Bill": "#f43f5e",
  Savings: "#22c55e",
  Other: "#64748b",
};

export const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍔",
  Transport: "🚗",
  Housing: "🏠",
  Utilities: "💡",
  Entertainment: "🎬",
  Health: "🩺",
  Shopping: "🛍️",
  Education: "🎓",
  "Pocket Money": "👛",
  Investment: "📈",
  "Stock Market": "📊",
  "Credit Card Bill": "💳",
  Savings: "🏦",
  Other: "📦",
};

export const STORAGE_KEY = "expense-tracker:expenses";

// Pure parse of the stored JSON — shared by loadExpenses and the storage hook.
export function parseExpenses(raw: string): Expense[] {
  try {
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

export function loadExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? parseExpenses(raw) : [];
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

// Budgets are stored per target month: { "2026-05": 1500, ... }
export const BUDGET_KEY = "expense-tracker:budgets";

export function parseBudgets(raw: string): Record<string, number> {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "number" && isFinite(v)) result[k] = v;
    }
    return result;
  } catch {
    return {};
  }
}

export function loadBudgets(): Record<string, number> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(BUDGET_KEY);
  return raw ? parseBudgets(raw) : {};
}

export function saveBudgets(budgets: Record<string, number>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets));
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7); // yyyy-mm
}

// Step a yyyy-mm key by a number of months (delta may be negative).
export function addMonths(key: string, delta: number): string {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, (month || 1) - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Inclusive range of yyyy-mm keys spanning `before` months back to `after` ahead.
export function monthRange(
  center: string,
  before: number,
  after: number,
): string[] {
  const out: string[] = [];
  for (let i = -before; i <= after; i++) out.push(addMonths(center, i));
  return out;
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
