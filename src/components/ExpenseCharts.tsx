"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CATEGORY_COLORS,
  formatMoney,
  type Expense,
} from "../lib/expenses";

type Props = {
  monthlyTotals: { key: string; label: string; total: number }[];
  categoryTotals: { name: string; value: number }[];
  currency: string;
};

export default function ExpenseCharts({
  monthlyTotals,
  categoryTotals,
  currency,
}: Props) {
  const hasMonthly = monthlyTotals.some((m) => m.total > 0);
  const hasCategory = categoryTotals.length > 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 lg:col-span-2">
        <h2 className="mb-4 text-base font-semibold text-slate-700">
          Total expense by month
        </h2>
        {hasMonthly ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={monthlyTotals}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v) => `${currency}${v}`}
              />
              <Tooltip
                cursor={{ fill: "rgba(99,102,241,0.08)" }}
                formatter={(value) => [
                  formatMoney(Number(value) || 0, currency),
                  "Total",
                ]}
              />
              <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Add expenses to see your monthly trend." />
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-4 text-base font-semibold text-slate-700">
          By category (selected month)
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
                  formatMoney(Number(value) || 0, currency),
                  String(name),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="No expenses this month yet." />
        )}
        {hasCategory && (
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {categoryTotals.map((c) => (
              <li key={c.name} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: CATEGORY_COLORS[c.name] || "#64748b" }}
                />
                <span className="text-slate-600">{c.name}</span>
                <span className="ml-auto font-medium text-slate-800">
                  {formatMoney(c.value, currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
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

// Re-export for convenience in case callers want the type
export type { Expense };
