import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import type { Expense } from "@/lib/expenses";

// Maps a database row (snake_case) to the app's Expense shape (camelCase).
type ExpenseRow = {
  id: string;
  amount: number | string;
  category: string;
  date: string;
  target_month: string;
  note: string | null;
};

function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amount: Number(row.amount),
    category: row.category,
    date: row.date,
    targetMonth: row.target_month,
    note: row.note ?? undefined,
  };
}

// Loads the signed-in user's expenses and budgets in one place. RLS guarantees
// only the caller's own rows come back even if the filter were ever omitted.
export async function loadUserData(): Promise<{
  expenses: Expense[];
  budgets: Record<string, number>;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  const [expensesRes, budgetsRes] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, amount, category, date, target_month, note")
      .eq("user_id", user.id)
      .order("date", { ascending: false }),
    supabase.from("budgets").select("month, amount").eq("user_id", user.id),
  ]);

  const expenses = (expensesRes.data ?? []).map(rowToExpense);

  const budgets: Record<string, number> = {};
  for (const b of budgetsRes.data ?? []) {
    budgets[b.month] = Number(b.amount);
  }

  return { expenses, budgets };
}
