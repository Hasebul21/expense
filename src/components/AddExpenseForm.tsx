"use client";

import { useState } from "react";
import { CATEGORIES, type Expense } from "../lib/expenses";

type Props = {
  defaultMonth: string; // yyyy-mm
  onAdd: (expense: Expense) => void;
};

function todayInMonth(month: string): string {
  const now = new Date();
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (month === nowKey) {
    return `${nowKey}-${String(now.getDate()).padStart(2, "0")}`;
  }
  return `${month}-01`;
}

export default function AddExpenseForm({ defaultMonth, onAdd }: Props) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [targetMonth, setTargetMonth] = useState(defaultMonth);
  const [date, setDate] = useState(() => todayInMonth(defaultMonth));
  const [note, setNote] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!isFinite(value) || value <= 0) return;
    onAdd({
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()) + Math.random().toString(16).slice(2),
      amount: value,
      category,
      targetMonth,
      date,
      note: note.trim() || undefined,
    });
    setAmount("");
    setNote("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Amount</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Category</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Target month</span>
        <input
          type="month"
          required
          value={targetMonth}
          onChange={(e) => setTargetMonth(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Date</span>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm sm:col-span-2 lg:col-span-1">
        <span className="font-medium text-slate-600">Note (optional)</span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Lunch with team"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <button
        type="submit"
        className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-300 sm:col-span-2 lg:col-span-1"
      >
        Add expense
      </button>
    </form>
  );
}
