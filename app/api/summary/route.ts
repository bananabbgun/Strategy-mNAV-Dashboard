import { MnavDataPoint } from "@/lib/types";
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

type SummaryRequest = {
  data?: MnavDataPoint[];
};

type SummarySource = "gemini" | "fallback";

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function buildFallbackSummary(data: MnavDataPoint[]) {
  const first = data[0];
  const last = data[data.length - 1];
  const mnavChange = ((last.mnav - first.mnav) / first.mnav) * 100;
  const btcChange = ((last.btc_price - first.btc_price) / first.btc_price) * 100;
  const peak = data.reduce((best, point) => (point.mnav > best.mnav ? point : best), data[0]);
  const trough = data.reduce((best, point) => (point.mnav < best.mnav ? point : best), data[0]);
  const premium = (last.mnav - 1) * 100;

  const trendSentence =
    mnavChange >= 0
      ? `During this period, MicroStrategy's mNAV trended upward overall, moving from ${first.mnav.toFixed(3)} to ${last.mnav.toFixed(3)}, for a total change of ${formatPercent(mnavChange)}.`
      : `During this period, MicroStrategy's mNAV trended downward overall, falling from ${first.mnav.toFixed(3)} to ${last.mnav.toFixed(3)}, for a total change of ${formatPercent(mnavChange)}.`;

  const turningPointSentence = `The high point in this range appeared on ${peak.date}, when mNAV reached about ${peak.mnav.toFixed(3)}. The low point appeared on ${trough.date}, when mNAV fell to about ${trough.mnav.toFixed(3)}, indicating a meaningful compression in the market's premium assigned to MSTR.`;

  const relationshipSentence =
    btcChange >= 0
      ? `Over the same interval, BTC moved from $${first.btc_price.toFixed(0)} to $${last.btc_price.toFixed(0)}, a change of ${formatPercent(btcChange)}. If BTC rises while mNAV contracts, it usually means the value of the underlying Bitcoin holdings is growing faster than MSTR's market capitalization, so the equity premium is being compressed.`
      : `Over the same interval, BTC moved from $${first.btc_price.toFixed(0)} to $${last.btc_price.toFixed(0)}, a change of ${formatPercent(btcChange)}. If mNAV holds up while BTC declines, that suggests the market is still assigning some resilience to MSTR's premium.`;

  const premiumSentence =
    premium >= 0
      ? `Based on the latest observation, mNAV stands near ${last.mnav.toFixed(3)}, which implies the market is still pricing MSTR at roughly a ${premium.toFixed(2)}% premium to the marked value of its Bitcoin holdings. That suggests investors continue to pay extra for levered BTC exposure, capital-markets optionality, and the company's broader market narrative.`
      : `Based on the latest observation, mNAV stands near ${last.mnav.toFixed(3)}, which implies the market is pricing MSTR at roughly a ${Math.abs(premium).toFixed(2)}% discount to the marked value of its Bitcoin holdings. That points to a more conservative market view on MSTR relative to its Bitcoin treasury.`;

  return [trendSentence, turningPointSentence, relationshipSentence, premiumSentence].join("\n\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SummaryRequest;
    const data = body.data ?? [];

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Visible range data is required." }, { status: 400 });
    }

    const startDate = data[0].date;
    const endDate = data[data.length - 1].date;
    // Sample at most 60 evenly-spaced points to keep the prompt small.
    const step = Math.max(1, Math.floor(data.length / 60));
    const sampled = data.filter((_, i) => i % step === 0 || i === data.length - 1);
    const slicedData = sampled.map((point) => ({
      date: point.date,
      mnav: point.mnav,
      btc_price: point.btc_price,
      btc_holdings: point.btc_holdings,
      mstr_market_cap: point.mstr_market_cap,
    }));

    const fallbackSummary = buildFallbackSummary(data);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ summary: fallbackSummary, source: "fallback" satisfies SummarySource });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are a financial analysis assistant. Analyze MicroStrategy (MSTR) mNAV data from ${startDate} to ${endDate}.

mNAV = company market cap / (BTC holdings * BTC price)

Data:
${JSON.stringify(slicedData)}

Write 3 to 5 short paragraphs and cover:
1. The main mNAV trend and approximate magnitude of change.
2. Any notable highs, lows, or turning points.
3. The relationship between BTC price and mNAV during this period.
4. What the observed mNAV implies about market premium or discount expectations for MSTR.

Keep the tone concise and professional. Do not use bullet points.
`.trim();

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const summary = response.text?.trim();
      if (!summary) {
        return NextResponse.json({ summary: fallbackSummary, source: "fallback" satisfies SummarySource });
      }

      return NextResponse.json({ summary, source: "gemini" satisfies SummarySource });
    } catch (error) {
      console.error("Gemini summary failed, using fallback", error);
      return NextResponse.json({ summary: fallbackSummary, source: "fallback" satisfies SummarySource });
    }
  } catch (error) {
    console.error("Summary route failed", error);
    return NextResponse.json({ error: "Failed to generate summary." }, { status: 500 });
  }
}
