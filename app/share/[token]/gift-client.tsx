"use client";

import { useEffect, useRef, useState } from "react";

type Counts = { love: number; wow: number; moved: number; celebrate: number };
const OPTIONS = [
  ["love", "❤️", "Love it"],
  ["wow", "😍", "Wow"],
  ["moved", "🥹", "Moved me"],
  ["celebrate", "🎉", "Celebrate"],
] as const;

export default function GiftClient({ token, audioUrl, title, giftTo, giftFrom, dedication, lyrics, mode, duration, version, unlockAt }: { token: string; audioUrl: string; title: string; giftTo?: string | null; giftFrom?: string | null; dedication?: string | null; lyrics: string; mode: string; duration: number; version?: string | null; unlockAt?: number | null }) {
  const [opened, setOpened] = useState(false);
  const [counts, setCounts] = useState<Counts>({ love: 0, wow: 0, moved: 0, celebrate: 0 });
  const [selected, setSelected] = useState("");
  const [reactionRecording, setReactionRecording] = useState(false);
  const [reactionUrl, setReactionUrl] = useState("");
  const [reactionBlob, setReactionBlob] = useState<Blob | null>(null);
  const reactionRecorder = useRef<MediaRecorder | null>(null);
  const reactionChunks = useRef<Blob[]>([]);
  useEffect(() => { if (!opened) return; fetch(`/api/share/${token}/reaction`).then((r) => r.ok ? r.json() : null).then((data) => data?.counts && setCounts(data.counts)).catch(() => undefined); }, [opened, token]);

  const toggleReactionRecording = async () => {
    if (reactionRecording) { reactionRecorder.current?.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const video = document.createElement("video");
      video.srcObject = stream; video.muted = true; video.playsInline = true;
      await video.play();
      const canvas = document.createElement("canvas"); canvas.width = 720; canvas.height = 1280;
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas unavailable");
      const canvasStream = canvas.captureStream(30);
      const brandedStream = new MediaStream([...canvasStream.getVideoTracks(), ...stream.getAudioTracks()]);
      reactionChunks.current = [];
      const mime = ["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find((type)=>MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(brandedStream, mime ? { mimeType: mime, videoBitsPerSecond: 3_600_000 } : undefined); reactionRecorder.current = recorder;
      let drawing = true;
      const draw = () => {
        if (!drawing) return;
        const vw=video.videoWidth||720, vh=video.videoHeight||1280, scale=Math.max(canvas.width/vw,canvas.height/vh), w=vw*scale,h=vh*scale;
        ctx.drawImage(video,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
        const grad=ctx.createLinearGradient(0,canvas.height-170,0,canvas.height); grad.addColorStop(0,"rgba(0,0,0,0)"); grad.addColorStop(1,"rgba(0,0,0,.55)"); ctx.fillStyle=grad;ctx.fillRect(0,canvas.height-180,canvas.width,180);
        ctx.fillStyle="rgba(255,255,255,.94)";ctx.font="700 26px Arial,sans-serif";ctx.fillText("Cantoa",34,canvas.height-48);ctx.font="500 15px Arial,sans-serif";ctx.fillStyle="rgba(255,255,255,.76)";ctx.fillText("Moments → Music",34,canvas.height-24);
        requestAnimationFrame(draw);
      };
      recorder.ondataavailable = (event) => { if (event.data.size) reactionChunks.current.push(event.data); };
      recorder.onstop = () => {
        drawing=false; stream.getTracks().forEach((track) => track.stop()); canvasStream.getTracks().forEach((track)=>track.stop()); setReactionRecording(false);
        const blob = new Blob(reactionChunks.current, { type: recorder.mimeType || "video/webm" });
        if (reactionUrl) URL.revokeObjectURL(reactionUrl);
        setReactionBlob(blob); setReactionUrl(URL.createObjectURL(blob));
      };
      recorder.start(500); draw(); setReactionRecording(true);
      window.setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 30000);
    } catch { setReactionRecording(false); }
  };
  const shareReaction = async () => {
    if (!reactionBlob) return;
    const file = new File([reactionBlob], "cantoa-reaction.webm", { type: reactionBlob.type || "video/webm" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: `My reaction to ${title}` }).catch(() => undefined); return; }
    const a=document.createElement("a"); a.href=URL.createObjectURL(reactionBlob); a.download="cantoa-reaction.webm"; a.click(); window.setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  };
  const locked = Boolean(unlockAt && unlockAt > Date.now());
  if (locked) return <section className="gift-unopened gift-locked"><div className="gift-envelope" aria-hidden="true">♪</div><p>SECRET SONG DROP</p><h1>This song unlocks soon.</h1>{giftTo && <span>Made for {giftTo}</span>}<b>{new Date(unlockAt!).toLocaleString()}</b><small>Come back at the scheduled time to open it.</small></section>;
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
    <div className="gift-reaction-capture"><div><b>Capture your reaction</b><small>Optional · record up to 30 seconds. The video stays on this device unless you choose to share it. Cantoa branding is included on exported reactions.</small></div><button onClick={() => void toggleReactionRecording()}>{reactionRecording ? "Stop recording" : "Record reaction"}</button>{reactionUrl && <><video controls playsInline src={reactionUrl} /><button className="gift-reaction-share" onClick={() => void shareReaction()}>Share or download reaction</button></>}</div>
    {lyrics && <details className="gift-lyrics"><summary>Read lyrics</summary><pre>{lyrics}</pre></details>}
    <div className="gift-cta"><p>Want to answer with a song?</p><a href={`/?moment=someone&reply=${token}`}>Send a song reply →</a><p>Know someone who deserves their own song?</p><a href="/?moment=someone">Make one for someone you love →</a></div>
    <small className="gift-note">Created with Cantoa. Shared by the creator through an opt-in public link.</small>
  </section>;
}
