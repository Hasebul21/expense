"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CATEGORY_COLORS,
  formatMonthLabel,
  formatMoney,
  loadExpenses,
  saveExpenses,
  type Expense,
} from "../lib/expenses";
import AddExpenseForm from "./AddExpenseForm";
import ExpenseCharts from "./ExpenseCharts";

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setExpenses(loadExpenses());
    setHydrated(true);
  }, []);

  // Persist on change (after initial hydration)
  useEffect(() => {
    if (hydrated) saveExpenses(expenses);
  }, [expenses, hydrated]);

  function addExpense(expense: Expense) {
    setExpenses((prev) => [expense, ...prev]);
    setSelectedMonth(expense.targetMonth);
  }

  function deleteExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  // All target months that have data, plus the current and selected month, desc
  const availableMonths = useMemo(() => {
    const set = new Set(expenses.map((e) => e.targetMonth));
    set.add(currentMonthKey());
    set.add(selectedMonth);
    return Array.from(set).sort().reverse();
  }, [expenses, selectedMonth]);

  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.targetMonth === selectedMonth)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [expenses, selectedMonth],
  );

  const monthTotal = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses],
  );

  const allTimeTotal = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of monthExpenses) {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    }
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthExpenses]);

  // Group every expense by its target month/year, newest month first.
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    for (const e of expenses) {
      (groups[e.targetMonth] ||= []).push(e);
    }
    return Object.entries(groups)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([month, items]) => ({
        month,
        items: items.slice().sort((a, b) => (a.date < b.date ? 1 : -1)),
        total: items.reduce((sum, e) => sum + e.amount, 0),
      }));
  }, [expenses]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
            💰 Expense Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your monthly spending and visualize where your money goes.
          </p>
        </div>
        <label className="flex w-full items-center gap-2 text-sm text-slate-600 sm:w-auto">
          <span className="font-medium">Month</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-indigo-500 sm:flex-none sm:py-1.5 sm:text-sm"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        </label>
      </header>

      {/* Summary cards */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard
          label={`${formatMonthLabel(selectedMonth)} total`}
          value={formatMoney(monthTotal)}
          accent="text-indigo-600"
        />
        <SummaryCard
          label="All-time total"
          value={formatMoney(allTimeTotal)}
          accent="text-emerald-600"
        />
      </section>

      {/* Add form */}
      <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-700">
          Add a new expense
        </h2>
        <AddExpenseForm
          key={selectedMonth}
          defaultMonth={selectedMonth}
          onAdd={addExpense}
        />
      </section>

      {/* Category chart */}
      <section className="mb-6">
        <ExpenseCharts categoryTotals={categoryTotals} />
      </section>

      {/* Transactions grouped into month/year cards */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-700">
          Expenses by month
        </h2>
        {groupedByMonth.length === 0 ? (
          <p className="rounded-2xl bg-white py-10 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-100">
            No expenses recorded yet. Add your first one above.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {groupedByMonth.map((group) => (
              <div
                key={group.month}
                className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5"
              >
                <div className="mb-3 flex items-baseline justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {formatMonthLabel(group.month)}
                  </h3>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">
                      {formatMoney(group.total)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {group.items.length}{" "}
                      {group.items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
                <ul className="divide-y divide-slate-100">
                  {group.items.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 py-3">
                      <span
                        className="inline-block h-9 w-1.5 rounded-full"
                        style={{
                          background: CATEGORY_COLORS[e.category] || "#64748b",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-800">
                          {e.category}
                          {e.note ? (
                            <span className="font-normal text-slate-500">
                              {" "}
                              · {e.note}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <span className="font-semibold text-slate-800">
                        {formatMoney(e.amount)}
                      </span>
                      <button
                        onClick={() => deleteExpense(e.id)}
                        aria-label="Delete expense"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600 active:bg-red-100"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-8 text-center text-xs text-slate-400">
        Your data is stored privately in this browser (localStorage). It never
        leaves your device.
      </footer>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}
