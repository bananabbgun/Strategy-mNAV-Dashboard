# HW2 Report

## 1. Selected Indicator

**Indicator chosen: mNAV (Modified Net Asset Value)**

mNAV measures how richly the public equity market values MicroStrategy (now rebranded as Strategy, ticker: MSTR) relative to the mark-to-market value of its Bitcoin treasury. It is defined as:

```
mNAV = MSTR Market Capitalization / (BTC Holdings × BTC Spot Price)
```

A value of **mNAV > 1** means the market prices MSTR at a *premium* to its Bitcoin holdings — investors pay extra for levered BTC exposure, access to MSTR's capital-markets engine (the ability to issue equity and debt to buy more BTC), and the optionality embedded in Saylor's ongoing accumulation strategy.

A value of **mNAV < 1** means the market prices MSTR at a *discount* — the equity is worth less than the underlying BTC, which would theoretically allow an investor to buy MSTR shares and gain BTC exposure more cheaply than buying BTC directly.

### Why mNAV?

mNAV was chosen for two reasons:

1. **It directly answers the most important valuation question for DAT.co:** Is the equity worth more or less than the Bitcoin it holds, and by how much? Unlike stock price or BTC price in isolation, mNAV normalises for both variables simultaneously.
2. **It produces a rich, interpretable time series.** Because MSTR's BTC holdings grow step-wise through discrete purchase events while its market cap fluctuates continuously with sentiment and BTC price, the resulting mNAV series reveals how market psychology toward Bitcoin treasury companies evolves over time.

---

## 2. Relationship Between mNAV and Bitcoin (BTC)

### How BTC price affects mNAV

mNAV has a non-linear, bidirectional relationship with BTC price:

- **When BTC rallies sharply**, the denominator (BTC holdings value) rises faster than MSTR's market cap can keep pace — this *compresses* mNAV. Historically, strong BTC bull moves therefore push mNAV downward even as MSTR shareholders profit in absolute terms.
- **When BTC falls**, the denominator shrinks faster than sentiment can reprice MSTR equity (partly because MSTR benefits from the implicit call option on continued BTC purchases). This *expands* mNAV.
- **When BTC is range-bound**, mNAV becomes a purer measure of how much the market is willing to pay for the "Strategy premium" — i.e., the optionality of Saylor's capital-markets flywheel.

### Insights and hypotheses

| Observation | Hypothesis |
|---|---|
| mNAV has historically traded in a band of roughly 1.0×–3.5× | The lower bound reflects arbitrage pressure (buy MSTR, effectively buy BTC at discount); the upper bound reflects investor enthusiasm ceiling for levered BTC exposure |
| mNAV peaked in late 2024 / early 2025 as BTC reached all-time highs above $100k | Euphoric markets overprice the Strategy premium; mNAV compression follows BTC ATH cycles |
| mNAV compressed in Q1 2026 as BTC corrected toward $70k | Falling BTC sentiment depresses both the stock and the premium investors assign to MSTR's strategy |
| MSTR's aggressive equity issuance (21,021 BTC in one week via the STRC IPO, July 2025) briefly expanded mNAV | Issuing equity at a premium to NAV is accretive to per-share BTC and reinforces the treasury flywheel narrative |

In short, **BTC price is both the substrate and the driver** of mNAV dynamics. Rising BTC is good for MSTR shareholders in dollar terms but mechanically compresses mNAV, while falling BTC expands mNAV — creating a counterintuitive inverse short-run relationship between BTC performance and the equity premium.

---

## 3. Data Collection

### Sources

| Data | Source | Method |
|---|---|---|
| MSTR daily closing price | Yahoo Finance via `yfinance` Python library | API |
| MSTR shares outstanding | Yahoo Finance `fast_info` / `ticker.info` | API |
| BTC/USD daily price | CoinGecko REST API (`/coins/bitcoin/market_chart/range`) | API |
| MSTR BTC holdings timeline | Strategy press releases & SEC 8-K filings (manually curated) | Manual |

### Pipeline

The Python script `data/fetch_data.py` runs the full pipeline:

1. Loads the hand-maintained `data/btc_holdings.json` (48 entries from August 2020 to April 2026, covering every major acquisition event).
2. Fetches MSTR price history from Yahoo Finance for the past 365 days (limited by CoinGecko Demo API lookback window), along with a quarterly shares-outstanding timeline from the balance sheet.
3. Fetches BTC/USD daily prices from CoinGecko for the same range.
4. For each trading day, looks up the correct BTC holdings total using the step function defined by the holdings timeline, and the correct shares outstanding from the quarterly balance sheet step function (so that equity issuances throughout the year are reflected accurately rather than using today's share count for all historical dates).
5. Computes `mNAV = market_cap / (btc_holdings × btc_price)` and writes all fields to `public/mnav_data.json`.

The output JSON (251 daily rows) is served as a static asset from the Next.js `public/` directory.

---

## 4. Website Visualization

**Live URL: https://hw2-seven-pi.vercel.app**

### Features

- **Dual-axis line chart** (Recharts): mNAV on the left axis, BTC/USD price on the right axis, both plotted over the same time range. A dashed reference line at mNAV = 1 marks the par value boundary.
- **Time range filter**: 30D / 90D / 1Y / ALL, applied client-side.
- **Key metrics cards**: Current mNAV, Range Change (%), BTC Holdings, Premium/Discount (%), BTC Price, MSTR Market Cap.
- **AI-generated summary** (bonus): A button triggers a POST to `/api/summary`, which calls Gemini 2.5 Flash with the visible data range and returns a 3–5 paragraph trend analysis. Falls back to a deterministic local summary if the API key is unavailable.
- **About section**: Plain-language explanation of what mNAV means.

### Tech stack

- **Framework**: Next.js 15 (App Router), TypeScript
- **Styling**: Tailwind CSS 4
- **Charting**: Recharts 2
- **AI**: Google Gemini 2.5 Flash via `@google/genai`
- **Deployment**: Vercel

---

## 5. AI-Generated Summary (Bonus)

The `/api/summary` route accepts the currently visible mNAV dataset (filtered by the selected time range) and constructs a prompt that asks Gemini to analyse:

1. The main mNAV trend and magnitude of change.
2. Notable highs, lows, or turning points.
3. The relationship between BTC price and mNAV during the period.
4. What the current mNAV level implies about market premium or discount expectations.

