"use client";

import { MnavDataPoint } from "@/lib/types";
import { useMemo, useState } from "react";

type Props = {
  data: MnavDataPoint[];
};

type SummarySource = "gemini" | "fallback";

export function AiSummary({ data }: Props) {
  const [summary, setSummary] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<SummarySource | null>(null);

  const rangeLabel = useMemo(() => {
    if (data.length === 0) return "No visible data";
    return `${data[0].date} to ${data[data.length - 1].date}`;
  }, [data]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError("");
      setSummary("");
      setSource(null);

      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to generate AI summary.");
      }

      const payload = (await response.json()) as { summary: string; source?: SummarySource };
      setSummary(payload.summary);
      setSource(payload.source ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate AI summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">AI Analysis</h2>
          <p className="mt-1 text-sm text-slate-400">
            Generate a trend summary from the currently visible range.
          </p>
          <p className="mt-2 text-xs text-slate-500">{rangeLabel}</p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || data.length === 0}
          className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {loading ? "Generating..." : "Generate Summary"}
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-5 min-h-32 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        {source ? (
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">
            Source: {source === "gemini" ? "Gemini" : "Local fallback"}
          </p>
        ) : null}
        {summary ? (
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{summary}</p>
        ) : (
          <p className="text-sm leading-7 text-slate-400">
            The route sends the visible mNAV, BTC price, and holdings data to Gemini and returns a short narrative
            analysis.
          </p>
        )}
      </div>
    </section>
  );
}
