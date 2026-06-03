"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  BUDGET_KEY,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  formatMonthLabel,
  formatMoney,
  INVESTED_CATEGORIES,
  loadBudgets,
  loadExpenses,
  monthRange,
  STORAGE_KEY,
  type Expense,
} from "../lib/expenses";
import { useLocalStorageState } from "../lib/useLocalStorageState";
import { signOut } from "@/lib/auth-actions";
import {
  addExpense as addExpenseAction,
  deleteExpense as deleteExpenseAction,
  deleteMonth as deleteMonthAction,
  migrateLocalData,
  setMonthBudget as setMonthBudgetAction,
  setMonthNote as setMonthNoteAction,
} from "@/lib/expense-actions";
import AddExpenseForm from "./AddExpenseForm";
import ExpenseCharts from "./ExpenseCharts";

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type TabId = "overview" | "monthly" | "category";

const TABS: { id: TabId; label: string; short: string; icon: string }[] = [
  { id: "overview", label: "Overview", short: "Overview", icon: "🏠" },
  { id: "monthly", label: "Expenses by Month", short: "Months", icon: "📅" },
  { id: "category", label: "By Category", short: "Category", icon: "🥧" },
];

const INPUT_CLASS =
  "w-full rounded-xl border border-transparent bg-slate-100 px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:bg-[#332720] dark:text-[#f1e7da] dark:focus:border-[#9c6b43] dark:focus:bg-[#3a2d24] dark:focus:ring-[#9c6b43]/20 sm:text-sm";

// Stable references for the theme storage hook (parse/fallback must not change
// identity between renders).
const THEME_KEY = "expense-tracker:theme";
const MIGRATED_KEY = "expense-tracker:migrated";
const parseTheme = (raw: string): "light" | "dark" =>
  raw === "dark" ? "dark" : "light";
const identity = (value: string) => value;

type DashboardProps = {
  initialExpenses: Expense[];
  initialBudgets: Record<string, number>;
  initialNotes: Record<string, string>;
  userEmail: string;
};

export default function Dashboard({
  initialExpenses,
  initialBudgets,
  initialNotes,
  userEmail,
}: DashboardProps) {
  // Expenses/budgets live on the server (per-user, RLS-protected). We seed
  // client state from the server snapshot and keep it in sync optimistically:
  // each mutation updates local state immediately and fires a Server Action to
  // persist. Theme stays a device-local preference in localStorage.
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [budgets, setBudgets] =
    useState<Record<string, number>>(initialBudgets);
  const [notes, setNotes] =
    useState<Record<string, string>>(initialNotes);
  const [theme, setTheme] = useLocalStorageState<"light" | "dark">(
    THEME_KEY,
    "light",
    parseTheme,
    identity,
  );
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [budgetMonth, setBudgetMonth] = useState(currentMonthKey());
  const [budgetAmount, setBudgetAmount] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Mirror the stored budget for the chosen month into the editable input.
  // Done during render (not an effect) so the field is correct without an
  // extra commit; we re-sync only when the month or its stored value changes.
  const storedBudget = budgets[budgetMonth];
  const [budgetSync, setBudgetSync] = useState({
    month: budgetMonth,
    stored: storedBudget,
  });
  if (budgetSync.month !== budgetMonth || budgetSync.stored !== storedBudget) {
    setBudgetSync({ month: budgetMonth, stored: storedBudget });
    setBudgetAmount(storedBudget !== undefined ? String(storedBudget) : "");
  }

  // Theme persists via the hook; toggle the document class imperatively so
  // there's no flash and no reactive effect mirroring state into the DOM.
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next === "dark");
    }
  }

  // One-time migration: if this device still has the old localStorage data,
  // push it into the user's account on first authenticated load, then clear it
  // and reload so the UI reflects the canonical server snapshot. Guarded by a
  // flag so it never runs twice on this device.
  useEffect(() => {
    try {
      if (localStorage.getItem(MIGRATED_KEY)) return;
      const localExpenses = loadExpenses();
      const localBudgets = loadBudgets();
      if (localExpenses.length === 0 && Object.keys(localBudgets).length === 0) {
        localStorage.setItem(MIGRATED_KEY, "1");
        return;
      }
      void (async () => {
        await migrateLocalData(localExpenses, localBudgets);
        localStorage.setItem(MIGRATED_KEY, "1");
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(BUDGET_KEY);
        window.location.reload();
      })();
    } catch {
      // localStorage unavailable (private mode) — nothing to migrate.
    }
  }, []);

  function setMonthBudget(month: string, raw: string) {
    const value = parseFloat(raw);
    const clear = raw === "" || !isFinite(value) || value < 0;
    setBudgets((prev) => {
      const next = { ...prev };
      if (clear) {
        delete next[month];
      } else {
        next[month] = value;
      }
      return next;
    });
    void setMonthBudgetAction(month, clear ? null : value);
  }

  // Persist a month's note optimistically: update local state right away, drop
  // the key when it's blank, and fire the Server Action to save.
  function setMonthNote(month: string, raw: string) {
    const value = raw.trim();
    setNotes((prev) => {
      const next = { ...prev };
      if (value) {
        next[month] = value;
      } else {
        delete next[month];
      }
      return next;
    });
    void setMonthNoteAction(month, value || null);
  }

  function handleSetBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!budgetMonth) return;
    setMonthBudget(budgetMonth, budgetAmount);
    setSelectedMonth(budgetMonth);
  }

  function shiftMonth(delta: number) {
    setSelectedMonth((m) => addMonths(m, delta));
  }

  function addExpense(expense: Expense) {
    setExpenses((prev) => [expense, ...prev]);
    setSelectedMonth(expense.targetMonth);
    void addExpenseAction(expense);
  }

  function deleteExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    void deleteExpenseAction(id);
  }

  function deleteMonth(month: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Delete all expenses and the budget for ${formatMonthLabel(month)}?`,
      )
    ) {
      return;
    }
    setExpenses((prev) => prev.filter((e) => e.targetMonth !== month));
    setBudgets((prev) => {
      const next = { ...prev };
      delete next[month];
      return next;
    });
    setNotes((prev) => {
      const next = { ...prev };
      delete next[month];
      return next;
    });
    void deleteMonthAction(month);
  }

  // Always offer the last 3 and next 3 months around the current month, plus
  // any month that already has expenses and whatever is currently selected.
  const availableMonths = useMemo(() => {
    const set = new Set(expenses.map((e) => e.targetMonth));
    for (const m of monthRange(currentMonthKey(), 3, 3)) set.add(m);
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
    for (const e of expenses) {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    }
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

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
        invested: items.reduce(
          (sum, e) =>
            INVESTED_CATEGORIES.includes(
              e.category as (typeof INVESTED_CATEGORIES)[number],
            )
              ? sum + e.amount
              : sum,
          0,
        ),
      }));
  }, [expenses]);

  const monthBudget = budgets[selectedMonth];
  const hasBudget = monthBudget !== undefined;
  const remaining = hasBudget ? monthBudget - monthTotal : null;
  const overBudget = remaining !== null && remaining < 0;
  const spentPct =
    hasBudget && monthBudget > 0 ? (monthTotal / monthBudget) * 100 : 0;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-[calc(6.5rem_+_env(safe-area-inset-bottom))] pt-6 sm:max-w-3xl sm:px-6 sm:pb-10 lg:max-w-5xl">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-[#f1e7da] dark:text-[#f1e7da] sm:text-3xl">
          Expenses
        </h1>
        <div className="flex items-center gap-2">
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sign out"
              title={`Sign out (${userEmail})`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-base shadow-sm dark:bg-[#271d16]"
            >
              🚪
            </button>
          </form>
          <button
            onClick={toggleTheme}
            aria-label="Toggle coffee dark mode"
            title={theme === "dark" ? "Switch to light" : "Switch to coffee dark"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-base shadow-sm dark:bg-[#271d16]"
          >
            {theme === "dark" ? "☀️" : "☕"}
          </button>
          <div className="flex items-center rounded-full bg-white shadow-sm dark:bg-[#271d16]">
            <button
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              title="Previous month"
              className="flex h-9 w-8 items-center justify-center rounded-l-full text-indigo-600 transition hover:bg-slate-100 active:scale-95 dark:text-[#d6a77a] dark:hover:bg-[#332720]"
            >
              ‹
            </button>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Select month"
              className="bg-transparent py-2 pl-1 pr-1 text-center text-sm font-semibold text-indigo-600 outline-none dark:text-[#d6a77a]"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
            <button
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              title="Next month"
              className="flex h-9 w-8 items-center justify-center rounded-r-full text-indigo-600 transition hover:bg-slate-100 active:scale-95 dark:text-[#d6a77a] dark:hover:bg-[#332720]"
            >
              ›
            </button>
          </div>
        </div>
      </header>

      {/* Top tabs — tablet/desktop (segmented control) */}
      <nav className="mb-6 hidden gap-1 rounded-2xl bg-slate-200/70 p-1 dark:bg-[#241c16] sm:flex">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-white text-slate-900 dark:text-[#f1e7da] shadow-sm dark:bg-[#332720]"
                : "text-slate-500 dark:text-[#c4ac95] hover:text-slate-700 dark:hover:text-[#f1e7da]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Bottom tab bar — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-[#3d2f25] dark:bg-[#1f1813]/90 sm:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
              activeTab === tab.id
                ? "text-indigo-600 dark:text-[#d6a77a]"
                : "text-slate-400 dark:text-[#95806c]"
            }`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span>{tab.short}</span>
          </button>
        ))}
      </nav>

      {/* ---------- OVERVIEW ---------- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Hero budget card */}
          <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-violet-600 p-6 text-white shadow-lg shadow-violet-500/25 dark:from-[#7b5536] dark:via-[#5e4029] dark:to-[#43301f] dark:shadow-black/40">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/70">
                  {formatMonthLabel(selectedMonth)} ·{" "}
                  {hasBudget ? "left to spend" : "spent"}
                </p>
                <p className="mt-1 truncate text-[40px] font-bold leading-none tracking-tight">
                  {hasBudget
                    ? formatMoney(remaining as number)
                    : formatMoney(monthTotal)}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {hasBudget
                    ? `${formatMoney(monthTotal)} of ${formatMoney(monthBudget)}`
                    : "No budget set for this month"}
                </p>
              </div>
              {hasBudget ? (
                <ProgressRing pct={spentPct} over={overBudget} />
              ) : (
                <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full bg-white/15 text-3xl">
                  💸
                </div>
              )}
            </div>
          </section>

          {/* Stat pills */}
          <section className="grid grid-cols-3 gap-3">
            <Stat label="Spent" value={formatMoney(monthTotal)} />
            <Stat
              label="Remaining"
              value={hasBudget ? formatMoney(remaining as number) : "—"}
              tone={overBudget ? "red" : "green"}
            />
            <Stat label="All time" value={formatMoney(allTimeTotal)} />
          </section>

          {/* Add expense */}
          <section>
            <SectionLabel>Add expense</SectionLabel>
            <div className="rounded-2xl bg-white dark:bg-[#271d16] p-4 shadow-sm sm:p-5">
              <AddExpenseForm
                key={selectedMonth}
                defaultMonth={selectedMonth}
                onAdd={addExpense}
              />
            </div>
          </section>

          {/* Set monthly budget */}
          <section>
            <SectionLabel>Monthly budget</SectionLabel>
            <div className="rounded-2xl bg-white dark:bg-[#271d16] p-4 shadow-sm sm:p-5">
              <form
                onSubmit={handleSetBudget}
                className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end"
              >
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-500 dark:text-[#c4ac95]">
                    Budget month
                  </span>
                  <input
                    type="month"
                    required
                    value={budgetMonth}
                    onChange={(e) => setBudgetMonth(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-500 dark:text-[#c4ac95]">Amount</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 1500 (empty to clear)"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-300 active:scale-[0.99] dark:bg-[#9c6b43] dark:shadow-[#9c6b43]/20 dark:hover:bg-[#b07c4f]"
                >
                  Set budget
                </button>
              </form>
            </div>
          </section>
        </div>
      )}

      {/* ---------- EXPENSES BY MONTH ---------- */}
      {activeTab === "monthly" && (
        <div>
          {groupedByMonth.length === 0 ? (
            <EmptyState>
              No expenses recorded yet. Add your first one from the Overview tab.
            </EmptyState>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {groupedByMonth.map((group) => {
                const budget = budgets[group.month];
                const left = budget !== undefined ? budget - group.total : null;
                return (
                  <section key={group.month}>
                    <div className="mb-2 flex items-end justify-between gap-2 px-1">
                      <div>
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-[#95806c]">
                          {formatMonthLabel(group.month)}
                        </h2>
                        {left !== null && (
                          <p
                            className={`mt-0.5 text-xs font-medium ${
                              left < 0 ? "text-rose-500" : "text-emerald-600"
                            }`}
                          >
                            {left < 0
                              ? `Over by ${formatMoney(-left)}`
                              : `${formatMoney(left)} left`}{" "}
                            <span className="text-slate-400 dark:text-[#95806c]">
                              of {formatMoney(budget as number)}
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-slate-900 dark:text-[#f1e7da]">
                          {formatMoney(group.total)}
                        </span>
                        <button
                          onClick={() => deleteMonth(group.month)}
                          aria-label={`Delete ${formatMonthLabel(group.month)}`}
                          title="Delete this month"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-slate-400 dark:text-[#95806c] transition hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#271d16] shadow-sm">
                      <ul>
                        {group.items.map((e) => (
                          <li
                            key={e.id}
                            className="flex items-center gap-3 border-b border-slate-100 dark:border-[#3d2f25] px-3 py-2.5 last:border-0"
                          >
                            <CategoryIcon category={e.category} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[15px] font-medium text-slate-900 dark:text-[#f1e7da]">
                                {e.category}
                              </p>
                              {e.note ? (
                                <p className="truncate text-xs text-slate-400 dark:text-[#95806c]">
                                  {e.note}
                                </p>
                              ) : null}
                            </div>
                            <span className="text-[15px] font-semibold text-slate-900 dark:text-[#f1e7da]">
                              {formatMoney(e.amount)}
                            </span>
                            <button
                              onClick={() => deleteExpense(e.id)}
                              aria-label="Delete expense"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base text-slate-300 dark:text-[#6f5d4d] transition hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100"
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>

                      {/* Total invested this month */}
                      <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-[#3d2f25] px-3 py-2.5">
                        <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 dark:text-[#c4ac95]">
                          <span aria-hidden>📈</span> Total invested
                        </span>
                        <span className="text-[15px] font-semibold text-emerald-600">
                          {formatMoney(group.invested)}
                        </span>
                      </div>

                      {/* Per-month note */}
                      <div className="border-t border-slate-100 dark:border-[#3d2f25] px-3 py-2.5">
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-[#95806c]">
                          Note
                        </label>
                        <textarea
                          defaultValue={notes[group.month] ?? ""}
                          onBlur={(ev) =>
                            setMonthNote(group.month, ev.target.value)
                          }
                          rows={2}
                          placeholder="Add a note for this month…"
                          className="w-full resize-y rounded-lg border border-transparent bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:bg-[#332720] dark:text-[#f1e7da] dark:focus:border-[#9c6b43] dark:focus:bg-[#3a2d24] dark:focus:ring-[#9c6b43]/20"
                        />
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------- BY CATEGORY ---------- */}
      {activeTab === "category" && <ExpenseCharts categoryTotals={categoryTotals} />}

      <footer className="mt-10 text-center text-xs text-slate-400 dark:text-[#95806c]">
        Stored privately on this device — your data never leaves your browser.
      </footer>
    </main>
  );
}

function ProgressRing({ pct, over }: { pct: number; over: boolean }) {
  const size = 76;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(pct, 100));
  const dash = (circumference * clamped) / 100;
  return (
    <div className="relative h-[76px] w-[76px] shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={over ? "#fda4af" : "#ffffff"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
        {Math.round(pct)}%
      </span>
    </div>
  );
}

function CategoryIcon({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] || "#64748b";
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
      style={{ backgroundColor: `${color}22` }}
    >
      {CATEGORY_ICONS[category] || "📦"}
    </span>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "red" | "green";
}) {
  const color =
    tone === "red"
      ? "text-rose-600"
      : tone === "green"
        ? "text-emerald-600"
        : "text-slate-900 dark:text-[#f1e7da]";
  return (
    <div className="rounded-2xl bg-white dark:bg-[#271d16] p-3 text-center shadow-sm">
      <p className="truncate text-[11px] font-medium text-slate-400 dark:text-[#95806c]">{label}</p>
      <p className={`mt-0.5 truncate text-base font-bold sm:text-lg ${color}`}>
        {value}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-[#95806c]">
      {children}
    </h2>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl bg-white dark:bg-[#271d16] py-12 text-center text-sm text-slate-400 dark:text-[#95806c] shadow-sm">
      {children}
    </p>
  );
}
