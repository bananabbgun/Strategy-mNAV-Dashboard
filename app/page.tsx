"use client";

import { AiSummary } from "@/app/components/AiSummary";
import { AboutSection } from "@/app/components/AboutSection";
import { KeyMetrics } from "@/app/components/KeyMetrics";
import { MnavChart } from "@/app/components/MnavChart";
import { TimeRangeSelector } from "@/app/components/TimeRangeSelector";
import { MnavDataPoint, TimeRange } from "@/lib/types";
import { filterDataByRange, getPercentChange } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

export default function Page() {
  const [range, setRange] = useState<TimeRange>("1Y");
  const [data, setData] = useState<MnavDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch("/mnav_data.json", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load public/mnav_data.json. Run the Python pipeline first.");
        }
        const payload = (await response.json()) as MnavDataPoint[];
        setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const visibleData = useMemo(() => filterDataByRange(data, range), [data, range]);
  const latest = visibleData[visibleData.length - 1];
  const first = visibleData[0];
  const rangeChange = latest && first ? getPercentChange(latest.mnav, first.mnav) : null;
  const premium = latest ? (latest.mnav - 1) * 100 : 0;
  const hasVisibleData = !loading && !error && visibleData.length > 0 && !!latest && !!first;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-950/50 p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-300">FinTech Assignment Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">MicroStrategy mNAV Monitor</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Track how MicroStrategy&apos;s equity market value compares with the marked value of its Bitcoin treasury,
              and view mNAV against BTC price on the same chart.
            </p>
          </div>
          <TimeRangeSelector value={range} onChange={setRange} />
        </div>

        {loading ? <p className="text-slate-300">Loading data...</p> : null}
        {error ? <p className="text-rose-300">{error}</p> : null}

        {hasVisibleData ? (
          <>
            <KeyMetrics
              currentMnav={latest!.mnav}
              rangeChange={rangeChange}
              btcHoldings={latest!.btc_holdings}
              premium={premium}
              currentBtcPrice={latest!.btc_price}
              currentMarketCap={latest!.mstr_market_cap}
            />
            <MnavChart data={visibleData} />
            <AiSummary data={visibleData} />
            <AboutSection />
          </>
        ) : null}
      </section>
    </main>
  );
}
