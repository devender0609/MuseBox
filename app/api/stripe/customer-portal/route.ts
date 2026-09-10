import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const configured = process.env.STRIPE_CUSTOMER_PORTAL_URL?.trim();
  if (!configured) {
    return NextResponse.redirect(new URL("/?portal=unavailable", request.url));
  }

  try {
    const portal = new URL(configured);
    if (portal.protocol !== "https:") throw new Error("Portal URL must use HTTPS.");
    return NextResponse.redirect(portal);
  } catch {
    return NextResponse.redirect(new URL("/?portal=unavailable", request.url));
  }
}
