import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") || "").toLowerCase();
  const forwardedProto = (request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "")).toLowerCase();
  const needsCanonicalHost = host === "www.cantoamusic.com";
  const needsHttps = forwardedProto === "http";

  if (needsCanonicalHost || needsHttps) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = "cantoamusic.com";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
