import { MnavDataPoint, TimeRange } from "@/lib/types";

export function formatCurrency(value: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatLargeCurrency(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  return formatCurrency(value, 0);
}

export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function filterDataByRange(data: MnavDataPoint[], range: TimeRange): MnavDataPoint[] {
  if (range === "ALL" || data.length === 0) {
    return data;
  }

  const daysMap: Record<Exclude<TimeRange, "ALL">, number> = {
    "30D": 30,
    "90D": 90,
    "1Y": 365,
  };

  const end = new Date(data[data.length - 1].date);
  const start = new Date(end);
  start.setDate(start.getDate() - daysMap[range]);

  return data.filter((point) => new Date(point.date) >= start);
}

export function getPercentChange(current: number, prior: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(prior) || prior === 0) {
    return null;
  }
  return ((current - prior) / prior) * 100;
}
