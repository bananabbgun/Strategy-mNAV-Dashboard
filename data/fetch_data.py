import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List

import requests
import yfinance as yf


ROOT = Path(__file__).resolve().parent.parent
HOLDINGS_PATH = ROOT / "data" / "btc_holdings.json"
OUTPUT_PATH = ROOT / "public" / "mnav_data.json"
DEMO_LOOKBACK_DAYS = 365


def load_holdings_timeline() -> List[Dict[str, object]]:
    with HOLDINGS_PATH.open("r", encoding="utf-8") as file:
        timeline = json.load(file)
    timeline.sort(key=lambda item: item["date"])
    return timeline


def fetch_mstr_history(start_date: str):
    ticker = yf.Ticker("MSTR")
    history = ticker.history(start=start_date, auto_adjust=False)
    if history.empty:
        raise RuntimeError("No MSTR history returned from Yahoo Finance.")

    # Build a quarterly shares timeline so historical market caps are accurate.
    # MSTR has been continuously issuing equity, so using today's share count for
    # all historical dates would inflate past market caps and mNAV values.
    shares_timeline: Dict[str, float] = {}
    try:
        bs = ticker.quarterly_balance_sheet
        for row_name in ("Ordinary Shares Number", "Share Issued"):
            if row_name in bs.index:
                for date, shares in bs.loc[row_name].dropna().items():
                    date_key = (
                        date.tz_localize(None) if getattr(date, "tzinfo", None) else date
                    ).date().isoformat()
                    shares_timeline[date_key] = float(shares)
                if shares_timeline:
                    break
    except Exception:
        pass

    # Fallback: current shares from fast_info (used when quarterly data unavailable
    # or as the default for dates before the earliest quarterly report).
    info = ticker.fast_info
    fallback_shares = float(info.get("shares") or ticker.info.get("sharesOutstanding") or 0)
    if not shares_timeline and not fallback_shares:
        raise RuntimeError("Unable to determine MSTR shares outstanding from yfinance.")

    trimmed = history[["Close"]].copy()
    if getattr(trimmed.index, "tz", None) is not None:
        trimmed.index = trimmed.index.tz_convert(None)
    return trimmed, dict(sorted(shares_timeline.items())), fallback_shares


def get_shares_for_date(date_str: str, shares_timeline: Dict[str, float], fallback: float) -> float:
    """Return the shares outstanding on a given date using a quarterly step function."""
    if not shares_timeline:
        return fallback
    current = fallback
    for report_date, shares in shares_timeline.items():
        if report_date <= date_str:
            current = shares
        else:
            break
    return current


def fetch_btc_prices(start_date: str, end_date: str) -> Dict[str, float]:
    start_dt = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
    end_dt = datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc) + timedelta(days=1)
    params = {
        "vs_currency": "usd",
        "from": int(start_dt.timestamp()),
        "to": int(end_dt.timestamp()),
    }
    demo_api_key = os.getenv("COINGECKO_DEMO_API_KEY")
    headers = {"accept": "application/json"}
    if demo_api_key:
        headers["x-cg-demo-api-key"] = demo_api_key

    response = requests.get(
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range",
        params=params,
        headers=headers,
        timeout=30,
    )
    if response.status_code == 401:
        raise RuntimeError(
            "CoinGecko returned 401 Unauthorized. Set COINGECKO_DEMO_API_KEY in your shell and retry."
        )
    response.raise_for_status()
    payload = response.json()

    daily_prices: Dict[str, float] = {}
    for timestamp_ms, price in payload.get("prices", []):
        date_key = datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc).date().isoformat()
        daily_prices[date_key] = float(price)

    if not daily_prices:
        raise RuntimeError("No BTC prices returned from CoinGecko.")

    return daily_prices


def get_holdings_for_date(date_str: str, timeline: List[Dict[str, object]]) -> float:
    current_holdings = 0.0
    for event in timeline:
        if event["date"] <= date_str:
            current_holdings = float(event["btc"])
        else:
            break
    return current_holdings


def build_dataset():
    timeline = load_holdings_timeline()
    timeline_start_date = datetime.fromisoformat(timeline[0]["date"]).date()
    today = datetime.now(tz=timezone.utc).date()
    demo_earliest_date = today - timedelta(days=DEMO_LOOKBACK_DAYS)
    effective_start_date = max(timeline_start_date, demo_earliest_date)
    start_date = effective_start_date.isoformat()
    end_date = today.isoformat()

    mstr_history, shares_timeline, fallback_shares = fetch_mstr_history(start_date)
    btc_prices = fetch_btc_prices(start_date, end_date)

    rows = []
    for date_idx, row in mstr_history.iterrows():
        date_str = date_idx.date().isoformat()
        btc_price = btc_prices.get(date_str)
        if btc_price is None:
            continue

        btc_holdings = get_holdings_for_date(date_str, timeline)
        if btc_holdings <= 0:
            continue

        mstr_price = float(row["Close"])
        shares_outstanding = get_shares_for_date(date_str, shares_timeline, fallback_shares)
        market_cap = mstr_price * shares_outstanding
        btc_holdings_value = btc_holdings * btc_price
        mnav = market_cap / btc_holdings_value if btc_holdings_value else None
        if mnav is None:
            continue

        rows.append(
            {
                "date": date_str,
                "btc_price": round(btc_price, 2),
                "mstr_price": round(mstr_price, 2),
                "mstr_market_cap": round(market_cap, 2),
                "btc_holdings": int(btc_holdings),
                "btc_holdings_value": round(btc_holdings_value, 2),
                "mnav": round(mnav, 4),
            }
        )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as file:
        json.dump(rows, file, ensure_ascii=False, indent=2)

    print(f"Wrote {len(rows)} rows to {OUTPUT_PATH}")
    if effective_start_date > timeline_start_date:
        print(
            "Note: CoinGecko Demo API only provides up to the past "
            f"{DEMO_LOOKBACK_DAYS} days, so the dataset starts at {start_date}."
        )


if __name__ == "__main__":
    build_dataset()
