export type MnavDataPoint = {
  date: string;
  btc_price: number;
  mstr_price: number;
  mstr_market_cap: number;
  btc_holdings: number;
  btc_holdings_value: number;
  mnav: number;
};

export type TimeRange = "30D" | "90D" | "1Y" | "ALL";
