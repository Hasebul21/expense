"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CATEGORY_COLORS,
  formatMonthLabel,
  formatMoney,
  loadCurrency,
  loadExpenses,
  monthKey,
  saveCurrency,
  saveExpenses,
  type Expense,
} from "../lib/expenses";
import AddExpenseForm from "./AddExpenseForm";
import ExpenseCharts from "./ExpenseCharts";

const CURRENCIES = ["$", "€", "£", "₹", "৳", "¥"];

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currency, setCurrency] = useState("$");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setExpenses(loadExpenses());
    setCurrency(loadCurrency());
    setHydrated(true);
  }, []);

  // Persist on change (after initial hydration)
  useEffect(() => {
    if (hydrated) saveExpenses(expenses);
  }, [expenses, hydrated]);

  useEffect(() => {
    if (hydrated) saveCurrency(currency);
  }, [currency, hydrated]);

  function addExpense(expense: Expense) {
    setExpenses((prev) => [expense, ...prev]);
    setSelectedMonth(monthKey(expense.date));
  }

  function deleteExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  // All months that have data, plus the current month, sorted desc
  const availableMonths = useMemo(() => {
    const set = new Set(expenses.map((e) => monthKey(e.date)));
    set.add(currentMonthKey());
    set.add(selectedMonth);
    return Array.from(set).sort().reverse();
  }, [expenses, selectedMonth]);

  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((e) => monthKey(e.date) === selectedMonth)
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

  // Last 12 months totals for the bar chart
  const monthlyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of expenses) {
      const k = monthKey(e.date);
      totals[k] = (totals[k] || 0) + e.amount;
    }
    const months: { key: string; label: string; total: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        key: k,
        label: formatMonthLabel(k),
        total: totals[k] || 0,
      });
    }
    return months;
  }, [expenses]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of monthExpenses) {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    }
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthExpenses]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
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
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 outline-none focus:border-indigo-500"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Month</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 outline-none focus:border-indigo-500"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {/* Summary cards */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label={`${formatMonthLabel(selectedMonth)} total`}
          value={formatMoney(monthTotal, currency)}
          accent="text-indigo-600"
        />
        <SummaryCard
          label="Transactions this month"
          value={String(monthExpenses.length)}
          accent="text-cyan-600"
        />
        <SummaryCard
          label="All-time total"
          value={formatMoney(allTimeTotal, currency)}
          accent="text-emerald-600"
        />
      </section>

      {/* Add form */}
      <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-4 text-base font-semibold text-slate-700">
          Add a new expense
        </h2>
        <AddExpenseForm defaultMonth={selectedMonth} onAdd={addExpense} />
      </section>

      {/* Charts */}
      <section className="mb-6">
        <ExpenseCharts
          monthlyTotals={monthlyTotals}
          categoryTotals={categoryTotals}
          currency={currency}
        />
      </section>

      {/* Transactions list */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-4 text-base font-semibold text-slate-700">
          {formatMonthLabel(selectedMonth)} transactions
        </h2>
        {monthExpenses.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No expenses recorded for this month yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {monthExpenses.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-3 py-3"
              >
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
                  <p className="text-xs text-slate-400">
                    {new Date(e.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <span className="font-semibold text-slate-800">
                  {formatMoney(e.amount, currency)}
                </span>
                <button
                  onClick={() => deleteExpense(e.id)}
                  aria-label="Delete expense"
                  className="rounded-md px-2 py-1 text-sm text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
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
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}
