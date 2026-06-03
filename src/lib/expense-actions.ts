"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import type { Expense } from "@/lib/expenses";

// Every action re-verifies the session via requireUser() and scopes writes to
// the user's own id. Row-Level Security is the real enforcement layer; these
// checks are defense-in-depth (Server Actions are reachable as raw POSTs).

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function addExpense(expense: Expense): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  await supabase.from("expenses").insert({
    // Trust a client-generated UUID for optimistic-UI consistency; otherwise
    // let the database assign one.
    ...(UUID_RE.test(expense.id) ? { id: expense.id } : {}),
    user_id: user.id,
    amount: expense.amount,
    category: expense.category,
    date: expense.date,
    target_month: expense.targetMonth,
    note: expense.note ?? null,
  });
}

export async function deleteExpense(id: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", id).eq("user_id", user.id);
}

export async function deleteMonth(month: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  await Promise.all([
    supabase
      .from("expenses")
      .delete()
      .eq("target_month", month)
      .eq("user_id", user.id),
    supabase.from("budgets").delete().eq("month", month).eq("user_id", user.id),
    supabase
      .from("month_notes")
      .delete()
      .eq("month", month)
      .eq("user_id", user.id),
  ]);
}

export async function setMonthNote(
  month: string,
  note: string | null,
): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  const trimmed = note?.trim();
  if (!trimmed) {
    await supabase
      .from("month_notes")
      .delete()
      .eq("month", month)
      .eq("user_id", user.id);
    return;
  }

  await supabase
    .from("month_notes")
    .upsert(
      { user_id: user.id, month, note: trimmed },
      { onConflict: "user_id,month" },
    );
}

export async function setMonthBudget(
  month: string,
  amount: number | null,
): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  if (amount === null || !isFinite(amount) || amount < 0) {
    await supabase
      .from("budgets")
      .delete()
      .eq("month", month)
      .eq("user_id", user.id);
    return;
  }

  await supabase
    .from("budgets")
    .upsert(
      { user_id: user.id, month, amount },
      { onConflict: "user_id,month" },
    );
}

// One-time import of a device's localStorage data into the user's account.
// New ids are assigned by the DB so old non-UUID local ids can't break inserts.
export async function migrateLocalData(
  expenses: Expense[],
  budgets: Record<string, number>,
): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  if (expenses.length > 0) {
    await supabase.from("expenses").insert(
      expenses.map((e) => ({
        user_id: user.id,
        amount: e.amount,
        category: e.category,
        date: e.date,
        target_month: e.targetMonth,
        note: e.note ?? null,
      })),
    );
  }

  const budgetRows = Object.entries(budgets).map(([month, amount]) => ({
    user_id: user.id,
    month,
    amount,
  }));
  if (budgetRows.length > 0) {
    await supabase
      .from("budgets")
      .upsert(budgetRows, { onConflict: "user_id,month" });
  }
}
