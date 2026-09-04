import { notFound } from "next/navigation";
import { adminSupabase } from "@/lib/supabase";
import GiftClient from "./gift-client";

export const dynamic = "force-dynamic";

export default async function SharedSong({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = adminSupabase();
  if (!admin) notFound();
  const { data: song } = await admin!
    .from("songs")
    .select("title,mode,duration,storage_key,version_label,created_at,gift_to,gift_from,dedication")
    .eq("share_token", token)
    .eq("public_share", true)
    .maybeSingle();
  if (!song) notFound();
  const lyricsKey = song.storage_key.replace(/\.mp3$/, "-lyrics.txt");
  const [{ data: audio }, { data: lyricLink }] = await Promise.all([
    admin!.storage.from("songs").createSignedUrl(song.storage_key, 3600),
    admin!.storage.from("songs").createSignedUrl(lyricsKey, 3600),
  ]);
  let lyrics = "";
  if (lyricLink?.signedUrl) lyrics = await fetch(lyricLink.signedUrl).then((r) => (r.ok ? r.text() : "")).catch(() => "");
  return (
    <main className="gift-page">
      <GiftClient token={token} audioUrl={audio?.signedUrl || ""} title={song.title} giftTo={song.gift_to} giftFrom={song.gift_from} dedication={song.dedication} lyrics={lyrics} mode={song.mode} duration={song.duration} version={song.version_label} />
    </main>
  );
}
