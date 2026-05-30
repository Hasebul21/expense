"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  formatMoney,
  type Expense,
} from "../lib/expenses";

type Props = {
  categoryTotals: { name: string; value: number }[];
};

export default function ExpenseCharts({ categoryTotals }: Props) {
  const hasCategory = categoryTotals.length > 0;
  const grandTotal = categoryTotals.reduce((sum, c) => sum + c.value, 0);

  if (!hasCategory) {
    return (
      <p className="rounded-2xl bg-white dark:bg-[#271d16] py-12 text-center text-sm text-slate-400 dark:text-[#95806c] shadow-sm">
        No expenses recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-[#271d16]">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-[#95806c]">
          Total spent
        </p>
        <p className="mt-1 text-center text-3xl font-bold text-slate-900 dark:text-[#f1e7da]">
          {formatMoney(grandTotal)}
        </p>
        <div className="mt-2">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={categoryTotals}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={62}
                paddingAngle={2}
                stroke="none"
              >
                {categoryTotals.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[entry.name] || "#64748b"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [
                  formatMoney(Number(value) || 0),
                  String(name),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-[#95806c]">
          Breakdown
        </h2>
        <ul className="overflow-hidden rounded-2xl bg-white dark:bg-[#271d16] shadow-sm">
          {categoryTotals.map((c) => {
            const pct = grandTotal > 0 ? (c.value / grandTotal) * 100 : 0;
            const color = CATEGORY_COLORS[c.name] || "#64748b";
            return (
              <li
                key={c.name}
                className="flex items-center gap-3 border-b border-slate-100 dark:border-[#3d2f25] px-3 py-2.5 last:border-0"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                  style={{ backgroundColor: `${color}22` }}
                >
                  {CATEGORY_ICONS[c.name] || "📦"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-slate-900 dark:text-[#f1e7da]">
                    {c.name}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-[#95806c]">{pct.toFixed(0)}%</p>
                </div>
                <span className="text-[15px] font-semibold text-slate-900 dark:text-[#f1e7da]">
                  {formatMoney(c.value)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

export type { Expense };
