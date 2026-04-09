export function AboutSection() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
      <h2 className="text-xl font-semibold text-white">About</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
        <p>
          mNAV measures how richly the market values MicroStrategy relative to the marked-to-market value of its Bitcoin
          holdings. A value above 1 implies a premium, while a value below 1 implies a discount.
        </p>
        <p>
          This dashboard combines MSTR price history, Bitcoin price data, and a manually maintained BTC holdings
          timeline to study how mNAV evolves across different market regimes.
        </p>
      </div>
    </section>
  );
}
