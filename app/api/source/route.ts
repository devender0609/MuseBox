import { NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const runtime = "nodejs";
export const maxDuration = 20;
const blockedHost = /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)/i;
function privateIp(value: string) {
  const ip = value.replace(/^\[|\]$/g, "").toLowerCase();
  if (!isIP(ip)) return false;
  if (ip.includes(":")) return ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe8") || ip.startsWith("fe9") || ip.startsWith("fea") || ip.startsWith("feb") || ip.startsWith("::ffff:127.") || ip.startsWith("::ffff:10.") || ip.startsWith("::ffff:192.168.");
  const [a,b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}
async function assertPublicHost(hostname: string) {
  if (blockedHost.test(hostname) || privateIp(hostname)) throw new Error("PRIVATE_HOST");
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((item) => privateIp(item.address))) throw new Error("PRIVATE_HOST");
}
async function readLimited(response: Response, maxBytes = 2_000_000) {
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new Error("TOO_LARGE");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0, output = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) { await reader.cancel(); throw new Error("TOO_LARGE"); }
    output += decoder.decode(value, { stream: true });
  }
  return output + decoder.decode();
}
export async function POST(request: NextRequest) {
  try {
    const value = String((await request.json()).url || "").trim();
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return NextResponse.json({ error: "Enter a public HTTPS webpage." }, { status: 400 });
    await assertPublicHost(url.hostname);
    const response = await fetch(url, { redirect: "error", headers: { "User-Agent": "Cantoa/1.0 song-source reader", Accept: "text/html,text/plain" } });
    if (!response.ok) return NextResponse.json({ error: "This webpage could not be read. Paste its text instead." }, { status: 422 });
    const type = response.headers.get("content-type") || "";
    if (!/text\/(html|plain)/i.test(type)) return NextResponse.json({ error: "This link is not a readable webpage. Paste its text instead." }, { status: 415 });
    const raw = await readLimited(response);
    const title = (raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || url.hostname).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const text = raw.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&#39;/gi, "'").replace(/&quot;/gi, '"').replace(/\s+/g, " ").trim().slice(0, 12000);
    if (text.length < 80) return NextResponse.json({ error: "Not enough readable text was found. Paste the important text instead." }, { status: 422 });
    return NextResponse.json({ title, text }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "PRIVATE_HOST") return NextResponse.json({ error: "Private or local network addresses cannot be used as webpage sources." }, { status: 400 });
    if (code === "TOO_LARGE") return NextResponse.json({ error: "This webpage is too large to import safely. Paste the relevant text instead." }, { status: 413 });
    return NextResponse.json({ error: "Enter a valid public HTTPS webpage." }, { status: 400 });
  }
}
