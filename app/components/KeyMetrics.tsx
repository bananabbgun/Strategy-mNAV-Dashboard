import { formatCurrency, formatLargeCurrency, formatNumber } from "@/lib/utils";

type Props = {
  currentMnav: number;
  rangeChange: number | null;
  btcHoldings: number;
  premium: number;
  currentBtcPrice: number;
  currentMarketCap: number;
};

const changeColor = (change: number | null) => {
  if (change === null) return "text-slate-300";
  return change >= 0 ? "text-emerald-400" : "text-rose-400";
};

export function KeyMetrics({
  currentMnav,
  rangeChange,
  btcHoldings,
  premium,
  currentBtcPrice,
  currentMarketCap,
}: Props) {
  const items = [
    { label: "Current mNAV", value: formatNumber(currentMnav, 3) },
    {
      label: "Range Change",
      value: rangeChange === null ? "N/A" : `${rangeChange >= 0 ? "+" : ""}${formatNumber(rangeChange, 2)}%`,
      valueClassName: changeColor(rangeChange),
    },
    { label: "BTC Holdings", value: `${formatNumber(btcHoldings, 0)} BTC` },
    { label: "Premium / Discount", value: `${premium >= 0 ? "+" : ""}${formatNumber(premium, 2)}%` },
    { label: "BTC Price", value: formatCurrency(currentBtcPrice, 0) },
    { label: "MSTR Market Cap", value: `$${formatLargeCurrency(currentMarketCap)}` },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/20"
        >
          <p className="text-sm text-slate-400">{item.label}</p>
          <p className={`mt-3 text-2xl font-semibold text-white ${item.valueClassName ?? ""}`}>{item.value}</p>
        </article>
      ))}
    </section>
  );
}
