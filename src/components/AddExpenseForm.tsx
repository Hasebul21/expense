"use client";

import { useState } from "react";
import { CATEGORIES, CATEGORY_ICONS, type Expense } from "../lib/expenses";

type Props = {
  defaultMonth: string; // yyyy-mm
  onAdd: (expense: Expense) => void;
};

const FIELD =
  "w-full rounded-xl border border-transparent bg-slate-100 px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:bg-[#332720] dark:text-[#f1e7da] dark:focus:border-[#9c6b43] dark:focus:bg-[#3a2d24] dark:focus:ring-[#9c6b43]/20 sm:text-sm";

export default function AddExpenseForm({ defaultMonth, onAdd }: Props) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [targetMonth, setTargetMonth] = useState(defaultMonth);
  const [note, setNote] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!isFinite(value) || value <= 0) return;
    const now = new Date();
    onAdd({
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()) + Math.random().toString(16).slice(2),
      amount: value,
      category,
      targetMonth,
      // No date field anymore — stamp with "now" purely for stable ordering.
      date: now.toISOString().slice(0, 10),
      note: note.trim() || undefined,
    });
    setAmount("");
    setNote("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-500 dark:text-[#c4ac95]">Amount</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className={FIELD}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-500 dark:text-[#c4ac95]">Category</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={FIELD}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_ICONS[c] || "📦"} {c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-500 dark:text-[#c4ac95]">Target month</span>
        <input
          type="month"
          required
          value={targetMonth}
          onChange={(e) => setTargetMonth(e.target.value)}
          className={FIELD}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm sm:col-span-2 lg:col-span-1">
        <span className="font-medium text-slate-500 dark:text-[#c4ac95]">Note (optional)</span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Lunch with team"
          className={FIELD}
        />
      </label>

      <button
        type="submit"
        className="rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-300 active:scale-[0.99] dark:bg-[#9c6b43] dark:shadow-[#9c6b43]/20 dark:hover:bg-[#b07c4f] sm:col-span-2 lg:col-span-1"
      >
        Add expense
      </button>
    </form>
  );
}
