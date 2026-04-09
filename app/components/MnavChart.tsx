"use client";

import { MnavDataPoint } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  data: MnavDataPoint[];
};

export function MnavChart({ data }: Props) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-slate-950/30 md:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">mNAV vs BTC Price</h2>
        <p className="mt-1 text-sm text-slate-400">Left axis shows mNAV, right axis shows BTC/USD.</p>
      </div>
      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              minTickGap={28}
              tickFormatter={(value: string) =>
                new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={(value: number) => formatNumber(value, 2)}
              width={60}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={(value: number) => `$${Math.round(value / 1000)}k`}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "16px",
                color: "#e2e8f0",
              }}
              formatter={(value: number, name: string) => {
                if (name === "mNAV") return [formatNumber(value, 3), "mNAV"];
                return [formatCurrency(value, 0), "BTC Price"];
              }}
            />
            <Legend />
            <ReferenceLine yAxisId="left" y={1} stroke="#f8fafc" strokeDasharray="6 6" opacity={0.6} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="mnav"
              name="mNAV"
              stroke="#60a5fa"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="btc_price"
              name="BTC Price"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
