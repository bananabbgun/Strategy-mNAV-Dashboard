"use client";

import { TimeRange } from "@/lib/types";
import clsx from "clsx";

const ranges: TimeRange[] = ["30D", "90D", "1Y", "ALL"];

type Props = {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
};

export function TimeRangeSelector({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-full border border-slate-700 bg-slate-900/80 p-1">
      {ranges.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => onChange(range)}
          className={clsx(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            value === range
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          )}
        >
          {range}
        </button>
      ))}
    </div>
  );
}
