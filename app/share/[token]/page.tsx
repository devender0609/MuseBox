import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminSupabase } from "@/lib/supabase";
import GiftClient from "./gift-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shared Song",
  robots: { index: false, follow: false },
};

export default async function SharedSong({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = adminSupabase();
  if (!admin) notFound();
  const { data: song } = await admin!
    .from("songs")
    .select("id,title,mode,duration,storage_key,version_label,created_at,gift_to,gift_from,dedication")
    .eq("share_token", token)
    .eq("public_share", true)
    .maybeSingle();
  if (!song) notFound();
  const { data: drop } = await admin!
    .from("song_drops")
    .select("unlock_at")
    .eq("song_id", song.id)
    .maybeSingle();
  const unlockAt = drop?.unlock_at ? new Date(drop.unlock_at).getTime() : null;
  const locked = Boolean(unlockAt && unlockAt > Date.now());
  const lyricsKey = song.storage_key.replace(/\.mp3$/, "-lyrics.txt");
  let audio: { signedUrl?: string } | null = null;
  let lyricLink: { signedUrl?: string } | null = null;
  if (!locked) {
    const [audioResult, lyricResult] = await Promise.all([
      admin!.storage.from("songs").createSignedUrl(song.storage_key, 3600),
      admin!.storage.from("songs").createSignedUrl(lyricsKey, 3600),
    ]);
    audio = audioResult.data;
    lyricLink = lyricResult.data;
  }
  let lyrics = "";
  if (lyricLink?.signedUrl) lyrics = await fetch(lyricLink.signedUrl).then((r) => (r.ok ? r.text() : "")).catch(() => "");
  return (
    <main className="gift-page">
      <GiftClient token={token} audioUrl={audio?.signedUrl || ""} title={song.title} giftTo={song.gift_to} giftFrom={song.gift_from} dedication={song.dedication} lyrics={lyrics} mode={song.mode} duration={song.duration} version={song.version_label} unlockAt={unlockAt} />
    </main>
  );
}
