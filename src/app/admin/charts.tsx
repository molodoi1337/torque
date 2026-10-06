"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { rub } from "@/lib/format";

const axis = { stroke: "#5a626e", fontSize: 11, tickLine: false, axisLine: false } as const;

function Tip({ active, payload, label, money }: { active?: boolean; payload?: { value: number }[]; label?: string; money?: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-ink-800 px-3 py-2 text-xs shadow-xl ring-1 ring-ink-700">
      <div className="text-ink-400">{label}</div>
      <div className="mt-0.5 font-mono font-semibold text-white">{money ? rub(payload[0].value) : payload[0].value}</div>
    </div>
  );
}

export function RevenueChart({ data }: { data: { day: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6a1f" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#ff6a1f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1c2025" vertical={false} />
        <XAxis dataKey="day" {...axis} interval="preserveStartEnd" minTickGap={24} />
        <YAxis {...axis} width={48} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
        <Tooltip content={<Tip money />} cursor={{ stroke: "#363c45" }} />
        <Area type="monotone" dataKey="revenue" stroke="#ff6a1f" strokeWidth={2} fill="url(#rev)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TopServicesChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" {...axis} width={150} tick={{ fill: "#b4bac3", fontSize: 11 }} />
        <Tooltip content={<Tip />} cursor={{ fill: "#16191d" }} />
        <Bar dataKey="count" fill="#ff6a1f" radius={[0, 6, 6, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
