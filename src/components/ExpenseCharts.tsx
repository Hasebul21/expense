"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  CATEGORY_COLORS,
  formatMoney,
  type Expense,
} from "../lib/expenses";

type Props = {
  categoryTotals: { name: string; value: number }[];
};

export default function ExpenseCharts({ categoryTotals }: Props) {
  const hasCategory = categoryTotals.length > 0;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <h2 className="mb-4 text-base font-semibold text-slate-700">
        By category (all expenses)
      </h2>
      {hasCategory ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryTotals}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={55}
              paddingAngle={2}
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
      ) : (
        <EmptyChart label="No expenses recorded yet." />
      )}
      {hasCategory && (
        <ul className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          {categoryTotals.map((c) => (
            <li key={c.name} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ background: CATEGORY_COLORS[c.name] || "#64748b" }}
              />
              <span className="text-slate-600">{c.name}</span>
              <span className="ml-auto font-medium text-slate-800">
                {formatMoney(c.value)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[300px] items-center justify-center text-center text-sm text-slate-400">
      {label}
    </div>
  );
}

export type { Expense };
