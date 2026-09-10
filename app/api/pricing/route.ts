import { NextRequest, NextResponse } from "next/server";

function countryFrom(request: NextRequest) {
  return (request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country") || "").toUpperCase();
}

export async function GET(request: NextRequest) {
  const india = countryFrom(request) === "IN";
  return NextResponse.json({
    market: india ? "IN" : "GLOBAL",
    currency: india ? "INR" : "USD",
    creator: { amountMinor: india ? 49900 : 799, display: india ? "₹499" : "US$7.99", minutes: 40 },
    studio: { amountMinor: india ? 129900 : 1999, display: india ? "₹1,299" : "US$19.99", minutes: 120 },
    explore: { freeSongs: 2, maxMinutesEach: 2 },
  }, { headers: { "Cache-Control": "private, max-age=300" } });
}
