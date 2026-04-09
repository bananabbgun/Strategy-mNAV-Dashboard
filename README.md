# MicroStrategy mNAV Dashboard

Next.js dashboard and Python pipeline for tracking MicroStrategy's mNAV against Bitcoin price, with a Gemini-powered Traditional Chinese summary endpoint.

## Files

- `data/fetch_data.py`: Fetches MSTR and BTC prices, computes mNAV, writes `public/mnav_data.json`
- `data/btc_holdings.json`: Manual BTC holdings timeline for MicroStrategy
- `app/page.tsx`: Single-page dashboard
- `app/api/summary/route.ts`: Gemini-backed AI summary endpoint

## Environment Variables

- `GEMINI_API_KEY`: required for the AI summary API route
- `COINGECKO_DEMO_API_KEY`: optional in code, but currently recommended because CoinGecko may return 401 without it
