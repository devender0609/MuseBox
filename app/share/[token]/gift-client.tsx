"use client";

import { useEffect, useState } from "react";

type Counts = { love: number; wow: number; moved: number; celebrate: number };
const OPTIONS = [
  ["love", "❤️", "Love it"],
  ["wow", "😍", "Wow"],
  ["moved", "🥹", "Moved me"],
  ["celebrate", "🎉", "Celebrate"],
] as const;

export default function GiftClient({ token, audioUrl, title, giftTo, giftFrom, dedication, lyrics, mode, duration, version }: { token: string; audioUrl: string; title: string; giftTo?: string | null; giftFrom?: string | null; dedication?: string | null; lyrics: string; mode: string; duration: number; version?: string | null }) {
  const [opened, setOpened] = useState(false);
  const [counts, setCounts] = useState<Counts>({ love: 0, wow: 0, moved: 0, celebrate: 0 });
  const [selected, setSelected] = useState("");
  useEffect(() => { if (!opened) return; fetch(`/api/share/${token}/reaction`).then((r) => r.ok ? r.json() : null).then((data) => data?.counts && setCounts(data.counts)).catch(() => undefined); }, [opened, token]);
  const react = async (reaction: string) => {
    setSelected(reaction);
    const response = await fetch(`/api/share/${token}/reaction`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reaction }) });
    if (response.ok) { const next = await fetch(`/api/share/${token}/reaction`).then((r) => r.json()).catch(() => null); if (next?.counts) setCounts(next.counts); }
  };
  if (!opened) return <section className="gift-unopened"><div className="gift-envelope" aria-hidden="true">♪</div><p>{giftTo ? `A song was made for ${giftTo}` : "Someone made you a song"}</p><h1>A moment, made into music.</h1>{giftFrom && <span>From {giftFrom}</span>}<button onClick={() => setOpened(true)}>Open your song</button><small>Shared privately with an opt-in Cantoa link.</small></section>;
  return <section className="gift-card gift-opened">
    <a className="gift-brand" href="/">〽 Cantoa <span>Moments → Music</span></a>
    <div className="gift-art" aria-hidden="true"><span>♪</span></div>
    {giftTo && <p className="gift-eyebrow">A SONG FOR {giftTo.toUpperCase()}</p>}
    <h1>{title}</h1>
    {giftFrom && <p className="gift-from">Made for you by <b>{giftFrom}</b></p>}
    {dedication && <blockquote>{dedication}</blockquote>}
    {audioUrl ? <audio controls preload="metadata" src={audioUrl} /> : <p className="gift-audio-error">Audio is temporarily unavailable. Please try this gift link again later.</p>}
    <div className="gift-meta"><span>{mode === "vocals" ? "Vocals" : "Instrumental"}</span><span>{Math.ceil(duration / 60)} min</span><span>{version || "Original"}</span></div>
    <div className="gift-reactions"><b>Send a reaction</b><div>{OPTIONS.map(([key, emoji, label]) => <button key={key} className={selected === key ? "selected" : ""} onClick={() => react(key)} aria-label={label}><span>{emoji}</span><small>{counts[key]}</small></button>)}</div></div>
    {lyrics && <details className="gift-lyrics"><summary>Read lyrics</summary><pre>{lyrics}</pre></details>}
    <div className="gift-cta"><p>Know someone who deserves their own song?</p><a href="/?moment=someone">Make one for someone you love →</a></div>
    <small className="gift-note">Created with Cantoa. Shared by the creator through an opt-in public link.</small>
  </section>;
}
