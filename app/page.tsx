"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  AtSign,
  Check,
  ChevronDown,
  CircleStop,
  Crown,
  Download,
  Gift,
  Heart,
  Cake,
  GraduationCap,
  Building2,
  School,
  Globe2,
  Copy,
  ExternalLink,
  FileAudio,
  Library,
  Mail,
  MessageCircle,
  Mic2,
  Music2,
  Music4,
  Paperclip,
  Play,
  Plus,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Trash2,
  Upload,
  UserCircle,
  Video,
  WandSparkles,
  Waves,
  X,
} from "lucide-react";
import { type CantoaFeature, planAllowsFeature } from "@/lib/features";
import CantoaAccount, {
  type CantoaAccountInfo,
  useCantoaSession,
} from "@/components/cantoa-account";

type View = "create" | "song" | "library";
type VocalMode = "vocals" | "instrumental";
type SourceKind = "idea" | "text" | "link" | "audio";
type CreateMode = "quick" | "advanced";
type RevisionStrength = "subtle" | "balanced" | "bold";
type PronunciationEntry = { id: string; target: string; reading: string; section: string };
type SectionLanguages = { verse: string; chorus: string; bridge: string };
type SocialVideoFormat = "vertical" | "square" | "lyrics";
type IntentPlan = { giftPage: boolean; socialVideo: boolean; lyricVideo: boolean; memoryMovie: boolean; jinglePack: boolean; instrumental: boolean; preserveWords: boolean; soundtrack: boolean; labels: string[]; };
type MySoundProfile = { style: string; emotion: string; language: string; voice: string; quality: "creative" | "release"; creativeDirection: "faithful" | "bold"; };
type PricingData = {
  market: "IN" | "GLOBAL";
  currency: "INR" | "USD";
  creator: { amountMinor: number; display: string; minutes: number };
  studio: { amountMinor: number; display: string; minutes: number };
  explore: { freeSongs: number; maxMinutesEach: number };
};
type Song = {
  id?: string;
  url: string;
  blob: Blob;
  title: string;
  prompt: string;
  mode: VocalMode;
  duration: number;
  createdAt?: number;
  parentId?: string;
  versionLabel?: string;
  generatedLyrics?: string;
};
type Preview = {
  id: string;
  label: string;
  description: string;
  url: string;
  blob: Blob;
  direction: "faithful" | "bold";
};
type SavedSong = {
  id: string;
  title: string;
  prompt: string;
  mode: VocalMode;
  duration: number;
  createdAt: number;
  blob?: Blob;
  remoteUrl?: string;
  parentId?: string;
  versionLabel?: string;
  generatedLyrics?: string;
  remoteLyricsUrl?: string;
  ownerId?: string;
};
type CloudSong = {
  id: string;
  title: string;
  prompt: string;
  mode: VocalMode;
  duration: number;
  created_at: number;
  url?: string;
  parent_id?: string | null;
  version_label?: string | null;
  lyrics_url?: string | null;
};
const MOMENTS = [
  { id: "someone", label: "For someone", icon: "♥", occasion: "Song for someone special", emotion: "Intimate and heartfelt", style: "Auto — choose for me", prompt: "Create a personal, memorable song that feels written specifically for someone important.", placeholder: "Tell us who this is for, what makes them special, favorite memories, and how you want the song to feel…" },
  { id: "birthday", label: "Birthday", icon: "🎂", occasion: "Birthday or celebration", emotion: "Joyful and energetic", style: "Pop", prompt: "Create a joyful birthday song with a huge sing-along chorus and personal details that make the recipient smile.", placeholder: "Who is the birthday song for? Share their personality, favorite memories, inside jokes, age or milestone, and the music they love…" },
  { id: "wedding", label: "Wedding", icon: "💍", occasion: "Wedding or anniversary", emotion: "Intimate and heartfelt", style: "Cinematic", prompt: "Turn a love story or vows into an elegant, emotional song that builds to a memorable final chorus.", placeholder: "Tell us the couple’s story, meaningful moments, names or vows, and the feeling you want the wedding song to capture…" },
  { id: "family", label: "Family", icon: "🏡", occasion: "Family memory", emotion: "Uplifting", style: "Acoustic pop", prompt: "Turn a family memory into a warm, uplifting song with vivid details and an easy chorus.", placeholder: "Share a family memory, names, traditions, places or little details you want woven into the song…" },
  { id: "graduation", label: "Graduation", icon: "🎓", occasion: "Graduation or milestone", emotion: "Powerful and inspirational", style: "Pop", prompt: "Create an inspiring graduation song about growth, friendship, courage and what comes next.", placeholder: "Tell us who is graduating, what they achieved, people or memories to include, and what comes next…" },
  { id: "creator", label: "Video / Reel", icon: "🎬", occasion: "Social media", emotion: "Joyful and energetic", style: "Auto — choose for me", prompt: "Create immediately engaging original music for a short-form video, with a strong hook in the first seconds and a clean ending.", placeholder: "Add your video, then describe the mood, pace and feeling the music should follow. For example: cinematic, playful, dramatic or relaxing…" },
  { id: "business", label: "Business", icon: "🏢", occasion: "Brand or jingle", emotion: "Uplifting", style: "Auto — choose for me", prompt: "Create a distinctive, memorable brand jingle with a concise hook suitable for social media and advertising.", placeholder: "Tell us your brand, product, audience, message and the feeling people should remember…" },
  { id: "school", label: "School", icon: "🏫", occasion: "School or organization", emotion: "Powerful and inspirational", style: "Pop", prompt: "Create an uplifting school song built around community, values, pride and a chorus students can sing together.", placeholder: "Share the school or group name, values, traditions, community details and the feeling the song should create…" },
  { id: "relax", label: "Relax", icon: "🌙", occasion: "Relaxation or ambience", emotion: "Peaceful and reflective", style: "Cinematic", prompt: "Create a soothing, elegant instrumental with gentle movement, warm atmosphere and no abrupt changes.", placeholder: "Describe the atmosphere you want—sleep, study, evening patio, meditation, spa, peaceful piano, ambient soundscape, or something else…" },
  { id: "anything", label: "Anything → music", icon: "✨", occasion: "Transform source material", emotion: "Uplifting", style: "Auto — choose for me", prompt: "Transform the supplied idea, message, story or webpage into an original song while preserving its meaning, not its protected wording.", placeholder: "Type or paste anything you want to turn into music—a story, message, idea or description…" },
];

const LANGUAGE_OPTIONS = [
  "Auto — follow my prompt",
  "English", "Spanish", "French", "German", "Portuguese", "Brazilian Portuguese", "Italian", "Dutch",
  "Hindi", "Hinglish (Hindi + English)", "Hindi + English", "Punjabi", "Punjabi + English", "Tamil", "Telugu", "Gujarati", "Bengali", "Urdu", "Marathi", "Malayalam", "Kannada", "Odia", "Nepali", "Sinhala",
  "Arabic", "Arabic + English", "Persian (Farsi)", "Hebrew", "Turkish", "Greek", "Armenian", "Georgian",
  "Mandarin Chinese", "Cantonese", "Japanese", "Korean", "Vietnamese", "Thai", "Indonesian", "Malay", "Tagalog / Filipino", "Khmer", "Burmese",
  "Polish", "Ukrainian", "Russian", "Romanian", "Czech", "Slovak", "Hungarian", "Swedish", "Norwegian", "Danish", "Finnish", "Icelandic", "Croatian", "Serbian", "Bulgarian", "Slovenian", "Lithuanian", "Latvian", "Estonian",
  "Swahili", "Afrikaans", "Amharic", "Somali", "Hausa", "Yoruba", "Igbo", "Zulu",
  "Mexican Spanish", "Latin American Spanish", "European Spanish", "Canadian French", "European Portuguese"
];

const LANGUAGE_GROUPS = [
  { label: "Popular", items: ["English", "Hindi", "Spanish", "Punjabi", "Arabic", "French", "Tamil", "Telugu"] },
  { label: "South Asia", items: ["Hindi / Hinglish", "Punjabi", "Tamil", "Telugu", "Gujarati", "Bengali", "Urdu", "Marathi", "Malayalam", "Kannada", "Odia", "Nepali", "Sinhala"] },
  { label: "East & Southeast Asia", items: ["Mandarin", "Cantonese", "Japanese", "Korean", "Vietnamese", "Thai", "Indonesian", "Malay", "Tagalog", "Khmer", "Burmese"] },
  { label: "Middle East", items: ["Arabic", "Persian / Farsi", "Hebrew", "Turkish", "Armenian", "Georgian"] },
  { label: "Europe & Americas", items: ["Spanish", "French", "Portuguese", "German", "Italian", "Dutch", "Polish", "Ukrainian", "Russian", "Nordic and Balkan languages"] },
  { label: "Africa", items: ["Swahili", "Afrikaans", "Amharic", "Somali", "Hausa", "Yoruba", "Igbo", "Zulu"] },
];

const LANGUAGE_BLEND_PRESETS = [
  { label: "Hindi → English chorus", verse: "Hindi", chorus: "English", bridge: "Hindi + English" },
  { label: "Punjabi → English chorus", verse: "Punjabi", chorus: "English", bridge: "Punjabi + English" },
  { label: "Tamil → English chorus", verse: "Tamil", chorus: "English", bridge: "Tamil + English" },
  { label: "Telugu → English chorus", verse: "Telugu", chorus: "English", bridge: "Telugu + English" },
  { label: "Arabic → English chorus", verse: "Arabic", chorus: "English", bridge: "Arabic + English" },
  { label: "Spanish → English chorus", verse: "Spanish", chorus: "English", bridge: "Spanish + English" },
  { label: "English → Spanish chorus", verse: "English", chorus: "Spanish", bridge: "English + Spanish" },
];


const palettes = [
  ["#7658ff", "#ed4b9a", "#ffb35c", "#65d9c4"],
  ["#195b8f", "#68b9d3", "#ffd36f", "#ee6c7a"],
  ["#a23e48", "#e58f65", "#f4d35e", "#4a7c59"],
];
function hash(value: string) {
  return [...value].reduce((n, c) => n + c.charCodeAt(0), 0);
}
function titleFrom(prompt: string) {
  const clean = prompt
    .replace(/[^\p{L}\p{N}\s'-]/gu, "")
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join(" ");
  return clean || "Untitled song";
}

function inferIntentPlan(text: string, momentId: string, photoCount: number, hasVideo = false): IntentPlan {
  const value = text.toLowerCase();
  const wantsGift = /gift|for my|for mom|for dad|for wife|for husband|for daughter|for son|birthday|anniversary|wedding|graduation|dedication/.test(value) || ["someone","birthday","wedding","family","graduation"].includes(momentId);
  const wantsSocial = /reel|tiktok|instagram|shorts|social video|social clip|vertical video|story video/.test(value) || momentId === "creator";
  const wantsLyric = /lyric video|lyrics video|karaoke/.test(value);
  const wantsMemory = photoCount > 0 && (/memory movie|photo video|slideshow|memories|photos|pictures|birthday video|wedding video|anniversary video|graduation video/.test(value) || wantsGift);
  const wantsJingle = /15\s*(?:sec|second)|30\s*(?:sec|second)|60\s*(?:sec|second)|jingle pack|ad pack|brand pack/.test(value) || (momentId === "business" && /jingle|ad|commercial|promo/.test(value));
  const instrumental = /instrumental|no vocals|without vocals|background music|score this|soundtrack/.test(value);
  const preserveWords = /keep (?:my|these|the) words|don't change my words|do not change my words|preserve (?:my|the) words|exact words|wedding vows|my poem|my letter/.test(value);
  const soundtrack = hasVideo && (
    /(?:score|soundtrack|soundtrack this|music for|create music for|make music for|music that follows|music that follow|follows this|follow this|match|matches|sync|synced|synchronize|cinematic music).*\b(?:video|clip|reel|footage|scene|scenes)\b/.test(value)
    || /\b(?:video|clip|reel|footage|scene|scenes)\b.*(?:score|soundtrack|music|follow|follows|match|matches|sync|cinematic)/.test(value)
    || momentId === "creator"
  );
  const labels = [
    "Song",
    wantsGift && "Gift page",
    wantsSocial && "Social video",
    wantsLyric && "Lyric video",
    wantsMemory && "Memory Movie",
    wantsJingle && "15/30/60 jingle pack",
    instrumental && "Instrumental",
    preserveWords && "Preserve my words",
    soundtrack && "Auto-score video",
  ].filter(Boolean) as string[];
  return { giftPage: wantsGift, socialVideo: wantsSocial, lyricVideo: wantsLyric, memoryMovie: wantsMemory, jinglePack: wantsJingle, instrumental, preserveWords, soundtrack, labels };
}

function lyricsFromPlan(plan: unknown) {
  if (!plan || typeof plan !== "object") return "";
  const value = plan as {
    chunks?: Array<{ text?: string }>;
    sections?: Array<{ section_name?: string; lines?: string[] }>;
  };
  if (Array.isArray(value.chunks))
    return value.chunks
      .map((chunk) => chunk.text?.trim() || "")
      .filter(Boolean)
      .join("\n\n");
  if (Array.isArray(value.sections))
    return value.sections
      .map((section) =>
        [`[${section.section_name || "Section"}]`, ...(section.lines || [])]
          .filter(Boolean)
          .join("\n"),
      )
      .join("\n\n");
  return "";
}
function pcmWav(buffer: AudioBuffer) {
  const channels = buffer.numberOfChannels;
  const samples = buffer.length;
  const bytes = new ArrayBuffer(44 + samples * channels * 2);
  const view = new DataView(bytes);
  const write = (offset: number, value: string) =>
    [...value].forEach((character, index) =>
      view.setUint8(offset + index, character.charCodeAt(0)),
    );
  write(0, "RIFF");
  view.setUint32(4, 36 + samples * channels * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples * channels * 2, true);
  let offset = 44;
  for (let sample = 0; sample < samples; sample++)
    for (let channel = 0; channel < channels; channel++) {
      const value = Math.max(
        -1,
        Math.min(1, buffer.getChannelData(channel)[sample]),
      );
      view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true);
      offset += 2;
    }
  return new Blob([bytes], { type: "audio/wav" });
}
const DB_NAME = "musebox-library",
  STORE = "songs";
function openLocalDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE))
        request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function localList() {
  const db = await openLocalDb();
  return new Promise<SavedSong[]>((resolve, reject) => {
    const request = db
      .transaction(STORE, "readonly")
      .objectStore(STORE)
      .getAll();
    request.onsuccess = () =>
      resolve(
        (request.result as SavedSong[]).sort(
          (a, b) => b.createdAt - a.createdAt,
        ),
      );
    request.onerror = () => reject(request.error);
  });
}
async function localPut(value: SavedSong) {
  const db = await openLocalDb();
  return new Promise<void>((resolve, reject) => {
    const request = db
      .transaction(STORE, "readwrite")
      .objectStore(STORE)
      .put(value);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
async function localDelete(id: string) {
  const db = await openLocalDb();
  return new Promise<void>((resolve, reject) => {
    const request = db
      .transaction(STORE, "readwrite")
      .objectStore(STORE)
      .delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export default function Home() {
  const [view, setView] = useState<View>("create");
  const [createMode, setCreateMode] = useState<CreateMode>("quick");
  const [momentId, setMomentId] = useState("someone");
  const [recipient, setRecipient] = useState("");
  const [personalDetails, setPersonalDetails] = useState("");
  const [dedication, setDedication] = useState("");
  const [publicShareUrl, setPublicShareUrl] = useState("");
  const [shareCreating, setShareCreating] = useState(false);
  const [prompt, setPrompt] = useState(
    "A soaring alternative-pop song about choosing courage over certainty, intimate verses, an unforgettable chorus and a cinematic final lift",
  );
  const [mode, setMode] = useState<VocalMode>("vocals");
  const [duration, setDuration] = useState(120);
  const [lyrics, setLyrics] = useState("");
  const [quickLyricsOpen, setQuickLyricsOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [style, setStyle] = useState("Modern alternative pop");
  const [language, setLanguage] = useState("Auto — follow my prompt");
  const [voice, setVoice] = useState("Warm female lead");
  const [title, setTitle] = useState("");
  const [exclude, setExclude] = useState("");
  const [quality, setQuality] = useState<"creative" | "release">("release");
  const [fineTuneOpen, setFineTuneOpen] = useState(false);
  const [creativeDirection, setCreativeDirection] = useState<
    "faithful" | "bold"
  >("faithful");
  const [weirdness, setWeirdness] = useState(35);
  const [influence, setInfluence] = useState(75);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceKind, setSourceKind] = useState<SourceKind>("idea");
  const [sourceText, setSourceText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [action, setAction] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("cantoa-theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("Explore");
  const [planMessage, setPlanMessage] = useState("");
  const [pricing, setPricing] = useState<PricingData>({
    market: "GLOBAL", currency: "USD",
    creator: { amountMinor: 799, display: "US$7.99", minutes: 40 },
    studio: { amountMinor: 1999, display: "US$19.99", minutes: 120 },
    explore: { freeSongs: 2, maxMinutesEach: 2 },
  });
  const [accountOpen, setAccountOpen] = useState(false);
  const { session, configured: accountConfigured } = useCantoaSession();
  const [accountInfo, setAccountInfo] = useState<CantoaAccountInfo | null>(
    null,
  );
  const [cloudStatus, setCloudStatus] = useState("");
  const [cloudSaveFailed, setCloudSaveFailed] = useState(false);
  const [occasion, setOccasion] = useState("Personal story");
  const [emotion, setEmotion] = useState("Uplifting");
  const [structure, setStructure] = useState(
    "Verse · Chorus · Verse · Chorus · Bridge · Final chorus",
  );
  const [pronunciation, setPronunciation] = useState("");
  const [pronunciationStudioOpen, setPronunciationStudioOpen] = useState(false);
  const [pronunciationEntries, setPronunciationEntries] = useState<PronunciationEntry[]>([
    { id: "pron-1", target: "", reading: "", section: "All vocals" },
  ]);
  const [sectionLanguageOpen, setSectionLanguageOpen] = useState(false);
  const [sectionLanguages, setSectionLanguages] = useState<SectionLanguages>({ verse: "", chorus: "", bridge: "" });
  const [socialVideoRendering, setSocialVideoRendering] = useState(false);
  const [socialVideoBlob, setSocialVideoBlob] = useState<Blob | null>(null);
  const [socialVideoUrl, setSocialVideoUrl] = useState("");
  const [socialVideoFormat, setSocialVideoFormat] = useState<SocialVideoFormat>("vertical");
  const [socialVideoSupported, setSocialVideoSupported] = useState(false);
  const [memoryPhotos, setMemoryPhotos] = useState<File[]>([]);
  const [videoSourceFile, setVideoSourceFile] = useState<File | null>(null);
  const [memoryPhotoUrls, setMemoryPhotoUrls] = useState<string[]>([]);
  const [memoryMovieRendering, setMemoryMovieRendering] = useState(false);
  const [memoryMovieUrl, setMemoryMovieUrl] = useState("");
  const [memoryMovieBlob, setMemoryMovieBlob] = useState<Blob | null>(null);
  const [jinglePackBuilding, setJinglePackBuilding] = useState(false);
  const [jinglePackUrl, setJinglePackUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [surpriseDirection, setSurpriseDirection] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionStrength, setRevisionStrength] = useState<RevisionStrength>("balanced");
  const [mySound, setMySound] = useState<MySoundProfile | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("cantoa-my-sound");
      return raw ? (JSON.parse(raw) as MySoundProfile) : null;
    } catch { return null; }
  });
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [blendDirections, setBlendDirections] = useState(false);
  const [song, setSong] = useState<Song | null>(null);
  const [playing, setPlaying] = useState(false);
  const [library, setLibrary] = useState<SavedSong[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [legacyLocalCount, setLegacyLocalCount] = useState(0);
  const songAudio = useRef<HTMLAudioElement | null>(null);
  const palette = useMemo(
    () => palettes[hash(prompt) % palettes.length],
    [prompt],
  );
  useEffect(() => {
    setSocialVideoSupported(typeof MediaRecorder !== "undefined" && typeof HTMLCanvasElement !== "undefined" && typeof HTMLCanvasElement.prototype.captureStream === "function");
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("cantoa-theme", theme);
  }, [theme]);
  useEffect(() => {
    void fetch("/api/pricing", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data?.creator?.display && data?.studio?.display) setPricing(data as PricingData); })
      .catch(() => {});
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMoment = params.get("moment");
    const requestedPrompt = params.get("prompt");
    if (requestedMoment && MOMENTS.some((item) => item.id === requestedMoment)) {
      const item = MOMENTS.find((candidate) => candidate.id === requestedMoment)!;
      setMomentId(item.id); setOccasion(item.occasion); setEmotion(item.emotion); setStyle(item.style); setPrompt(requestedPrompt?.trim() || item.prompt);
    } else if (requestedPrompt?.trim()) {
      setPrompt(requestedPrompt.trim());
    }
  }, []);
  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const allLocal = await localList();
      const legacy = allLocal.filter((item) => !item.ownerId);
      setLegacyLocalCount(legacy.length);
      if (!session) {
        setLibrary(legacy);
        return;
      }
      const local = allLocal.filter((item) => item.ownerId === session.user.id);
      const response = await fetch("/api/library", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        setLibrary(local);
        return;
      }
      const data = (await response.json()) as { songs?: CloudSong[] };
      const cloud: SavedSong[] = (data.songs || []).map((item) => ({
        id: item.id,
        title: item.title,
        prompt: item.prompt,
        mode: item.mode,
        duration: item.duration,
        createdAt: item.created_at,
        remoteUrl: item.url,
        remoteLyricsUrl: item.lyrics_url || undefined,
        parentId: item.parent_id || undefined,
        versionLabel: item.version_label || "Original",
        ownerId: session.user.id,
      }));
      const merged = [
        ...local,
        ...cloud.filter(
          (remote) => !local.some((item) => item.id === remote.id),
        ),
      ].sort((a, b) => b.createdAt - a.createdAt);
      setLibrary(merged);
    } catch {
      setMessage("Cantoa could not open your song library.");
    } finally {
      setLibraryLoading(false);
    }
  }, [session]);
  useEffect(() => {
    queueMicrotask(() => void loadLibrary());
  }, [loadLibrary]);
  const claimLegacyLocalSongs = async () => {
    if (!session) return;
    const all = await localList();
    const legacy = all.filter((item) => !item.ownerId);
    if (!legacy.length) return;
    if (!window.confirm(`Recover ${legacy.length} legacy device-only song${legacy.length === 1 ? "" : "s"} into this account? Only continue if these songs are yours.`)) return;
    for (const item of legacy) await localPut({ ...item, ownerId: session.user.id });
    setMessage(`${legacy.length} device-only song${legacy.length === 1 ? "" : "s"} recovered into this account on this device.`);
    await loadLibrary();
  };

  const refreshAccount = useCallback(async () => {
    if (!session) {
      setSelectedPlan("Explore");
      setAccountInfo(null);
      return;
    }
    try {
      const response = await fetch("/api/account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) return;
      const data = (await response.json()) as CantoaAccountInfo;
      setAccountInfo(data);
      if (data.plan) setSelectedPlan(data.plan);
    } catch {}
  }, [session]);
  useEffect(() => {
    queueMicrotask(() => void refreshAccount());
  }, [refreshAccount]);
  const intentPlan = useMemo(() => inferIntentPlan(`${prompt}\n${personalDetails}\n${dedication}`, momentId, memoryPhotos.length, Boolean(videoSourceFile)), [prompt, personalDetails, dedication, momentId, memoryPhotos.length, videoSourceFile]);
  const activeMoment = MOMENTS.find((item) => item.id === momentId) || MOMENTS[0];
  const freeCreationsRemaining = accountInfo?.plan === "Explore" ? (accountInfo.freeSongsRemaining ?? 2) : 2;
  const showFreeOffer = !accountInfo || accountInfo.plan === "Explore";
  const showExportBranding = !accountInfo?.isOwner && (!accountInfo || accountInfo.plan === "Explore");

  useEffect(() => {
    const urls = memoryPhotos.map((file) => URL.createObjectURL(file));
    setMemoryPhotoUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [memoryPhotos]);

  const authorizeFeature = useCallback(async (feature: CantoaFeature) => {
    if (!session) { setAccountOpen(true); setMessage("Sign in to use this feature."); return false; }
    if (accountInfo?.plan && planAllowsFeature(accountInfo.plan, feature)) return true;
    try {
      const response = await fetch("/api/feature-access", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ feature }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.allowed) {
        setMembershipOpen(true);
        setMessage(`${data.minimumPlan || "Creator"} membership includes this feature.`);
        return false;
      }
      return true;
    } catch { setMessage("Cantoa could not verify feature access. Try again."); return false; }
  }, [session, accountInfo?.plan]);

  const completePrompt = useMemo(() => {
    const structuredPronunciation = pronunciationEntries
      .filter((entry) => entry.target.trim() && entry.reading.trim())
      .map((entry) => `${entry.section}: “${entry.target.trim()}” → ${entry.reading.trim()}`)
      .join("\n");
    const sectionLanguagePlan = [
      sectionLanguages.verse.trim() && `Verses: ${sectionLanguages.verse.trim()}`,
      sectionLanguages.chorus.trim() && `Choruses: ${sectionLanguages.chorus.trim()}`,
      sectionLanguages.bridge.trim() && `Bridge/outro: ${sectionLanguages.bridge.trim()}`,
    ].filter(Boolean).join("; ");
    const production =
      quality === "release"
        ? "Release-ready production: balanced mix, controlled dynamics, clear lead vocal, clean low end, wide but mono-compatible image, polished transitions and a definitive ending."
        : "Creative demo with expressive, surprising arrangement choices.";
    const direction = blendDirections
      ? "Creative direction: blend the strongest qualities of both explored directions—keep the faithful version's clarity, structure and emotional coherence while borrowing the bold version's most distinctive production, rhythmic or instrumental idea. The result should feel unified, not stitched together."
      : creativeDirection === "faithful"
        ? "Creative direction: faithful to the brief, emotionally coherent, memorable and accessible."
        : "Creative direction: a clearly bolder interpretation with an unexpected but tasteful arrangement, distinctive rhythm or instrumentation, while preserving the requested meaning.";
    return [
      prompt,
      `Purpose: ${occasion}. Emotional direction: ${emotion}. Structure: ${structure}.`,
      `Style: ${style}. Language: ${language}. Voice: ${mode === "instrumental" ? "none, instrumental" : voice}. Style influence: ${influence}%. Creative variation: ${weirdness}%.`,
      direction,
      `Define the production intentionally: genre, mood, instrumentation, tempo and production era should feel specific rather than generic.`,
      sectionLanguagePlan && `Section-by-section language plan (follow exactly unless the supplied lyrics require otherwise): ${sectionLanguagePlan}. Keep transitions natural and do not translate sections assigned to a specific language.`,
      (pronunciation.trim() || structuredPronunciation) &&
        `Pronunciation guide (follow carefully):\n${[pronunciation.trim(), structuredPronunciation].filter(Boolean).join("\n")}`,
      exclude && `Exclude: ${exclude}.`,
      production,
      intentPlan.preserveWords && "Word-preservation request: keep the user’s supplied wording as intact as possible. Adapt only where necessary for singability and preserve the meaning exactly.",
      lyrics.trim() && `Use these lyrics exactly where appropriate:\n${lyrics}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [
    prompt,
    createMode,
    occasion,
    emotion,
    structure,
    style,
    language,
    voice,
    mode,
    influence,
    weirdness,
    creativeDirection,
    blendDirections,
    pronunciation,
    pronunciationEntries,
    sectionLanguages,
    exclude,
    quality,
    lyrics,
    intentPlan.preserveWords,
  ]);

  const saveMySound = () => {
    const profile: MySoundProfile = { style, emotion, language, voice, quality, creativeDirection };
    setMySound(profile);
    localStorage.setItem("cantoa-my-sound", JSON.stringify(profile));
    setMessage("My Sound saved. Cantoa can reuse these creative preferences on future songs.");
  };
  const applyMySound = () => {
    if (!mySound) { setMessage("Save My Sound first, then you can reuse it on future songs."); return; }
    setStyle(mySound.style);
    setEmotion(mySound.emotion);
    setLanguage(mySound.language);
    setVoice(mySound.voice);
    setQuality(mySound.quality);
    setCreativeDirection(mySound.creativeDirection);
    setMessage("My Sound applied to this song.");
  };

  const revisionStrengthText = (strength: RevisionStrength) =>
    strength === "subtle"
      ? "Make a subtle refinement. Preserve almost all melody, arrangement, timing and performance identity."
      : strength === "bold"
        ? "Make a clearly noticeable creative revision while preserving the song's lyrics, central identity and strongest hooks."
        : "Make a balanced revision: keep the song recognizably the same while improving the requested area enough to hear the difference.";

  const applyMoment = (id: string) => {
    const moment = MOMENTS.find((item) => item.id === id);
    if (!moment) return;
    setMomentId(id);
    setCreateMode("quick");
    setCustom(false);
    setOccasion(moment.occasion);
    setEmotion(moment.emotion);
    setStyle(moment.style);
    setPrompt(moment.prompt);
    if (id === "creator") { setDuration(30); setQuality("release"); }
    if (id === "business") { setDuration(30); setQuality("release"); }
    if (id === "relax") { setMode("instrumental"); setDuration(180); }
    else setMode("vocals");
    setSurpriseDirection("");
    setBlendDirections(false);
    setMessage(`${moment.label} selected. Cantoa has prepared the song direction for you.`);
  };
  const surpriseMe = () => {
    const choices = [
      ["Dreamy indie pop", "Intimate and heartfelt"],
      ["Afrobeat", "Joyful and energetic"],
      ["Cinematic soul", "Dramatic and cinematic"],
      ["Acoustic folk-pop", "Uplifting"],
      ["Retro synth-pop", "Joyful and energetic"],
    ];
    const pick = choices[Math.floor(Math.random() * choices.length)];
    setStyle(pick[0]); setEmotion(pick[1]); setCreativeDirection("bold");
    setSurpriseDirection(`${pick[0]} · ${pick[1]}`);
    setMessage(`Surprise direction: ${pick[0]} · ${pick[1]}.`);
  };

  const detectPromptInput = (value: string) => {
    setPrompt(value);
    const lower = value.toLowerCase();
    if (/\b(instrumental|no vocals|without vocals|background music|soundtrack)\b/.test(lower)) setMode("instrumental");
    if (/hindi[^\n,.]{0,50}(verse|verses)[^\n,.]{0,80}english[^\n,.]{0,40}(chorus|choruses)|(?:verse|verses)[^\n,.]{0,40}hindi[^\n,.]{0,80}(?:chorus|choruses)[^\n,.]{0,40}english/.test(lower)) {
      setLanguage("Hindi + English"); setSectionLanguages({ verse: "Hindi", chorus: "English", bridge: "Hindi + English" });
    } else if (/punjabi[^\n,.]{0,80}english/.test(lower)) {
      setLanguage("Punjabi + English");
    } else if (/spanish[^\n,.]{0,80}english|english[^\n,.]{0,80}spanish/.test(lower)) {
      setLanguage("Spanish + English");
    }
    const trimmed = value.trim();
    if (/^https:\/\/\S+$/i.test(trimmed)) {
      setSourceKind("link");
      setSourceMode(false);
      setSourceUrl(trimmed);
      setMessage(
        "Webpage detected automatically. Cantoa will read it when you create the song.",
      );
    } else if (sourceKind === "link" && !trimmed.startsWith("https://")) {
      setSourceKind("idea");
      setSourceUrl("");
    }
  };
  const detectPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData("text").trim();
    if (/^https:\/\/\S+$/i.test(pasted)) {
      event.preventDefault();
      setPrompt("Create an original song inspired by this webpage");
      setSourceUrl(pasted);
      setSourceKind("link");
      setSourceMode(false);
      setMessage(
        "Webpage detected automatically. You can continue without opening the Source menu.",
      );
    } else if (pasted.length > 500) {
      event.preventDefault();
      setSourceText(pasted.slice(0, 12000));
      setSourceKind("text");
      setSourceMode(false);
      setPrompt(
        "Transform this material into an original, emotionally coherent song",
      );
      setMessage(
        "Long text detected automatically. Cantoa will use it as source material.",
      );
    }
  };
  const toggleRecording = async () => {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setMessage(
        "Voice input is not supported by this browser. Try current Chrome, Edge, Firefox or Safari.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunks.current = [];
      const active = new MediaRecorder(stream);
      recorder.current = active;
      active.ondataavailable = (e) => {
        if (e.data.size) recordedChunks.current.push(e.data);
      };
      active.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setTranscribing(true);
        try {
          const blob = new Blob(recordedChunks.current, {
            type: active.mimeType || "audio/webm",
          });
          const form = new FormData();
          form.append(
            "file",
            new File([blob], "spoken-song-idea.webm", { type: blob.type }),
          );
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: form,
          });
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.error || "Voice transcription failed.");
          setPrompt((current) =>
            current &&
            current !==
              "A soaring alternative-pop song about choosing courage over certainty, intimate verses, an unforgettable chorus and a cinematic final lift"
              ? `${current.trim()} ${data.text}`
              : data.text,
          );
          setSourceKind("idea");
          setMessage(
            `Voice idea added${data.language ? ` · detected ${String(data.language).toUpperCase()}` : ""}. Review the text before generating.`,
          );
        } catch (error) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Voice transcription failed.",
          );
        } finally {
          setTranscribing(false);
        }
      };
      active.start();
      setRecording(true);
      setMessage("Listening… describe the song naturally, then press Stop.");
    } catch {
      setMessage(
        "Microphone permission was not granted. Allow microphone access in your browser and try again.",
      );
    }
  };

  const cloudSave = async (saved: SavedSong, blob: Blob) => {
    if (!session) return false;
    try {
      setCloudSaveFailed(false);
      setCloudStatus("Saving securely…");
      const form = new FormData();
      form.append(
        "file",
        new File([blob], `${saved.id}.mp3`, { type: "audio/mpeg" }),
      );
      form.append("id", saved.id);
      form.append("title", saved.title);
      form.append("prompt", saved.prompt);
      form.append("mode", saved.mode);
      form.append("duration", String(saved.duration));
      form.append("createdAt", String(saved.createdAt));
      if (saved.parentId) form.append("parentId", saved.parentId);
      form.append("versionLabel", saved.versionLabel || "Original");
      if (saved.generatedLyrics) form.append("lyrics", saved.generatedLyrics);
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const reason = response.status === 401 ? "Your sign-in session expired." : response.status === 503 ? "Cloud storage is not configured on this deployment." : "Cloud save could not complete.";
        throw new Error(reason);
      }
      setCloudSaveFailed(false);
      setCloudStatus("Saved to your private cloud library");
      return true;
    } catch (error) {
      setCloudSaveFailed(true);
      setCloudStatus(`Saved on this device · cloud save failed${error instanceof Error && error.message ? `: ${error.message}` : "."}`);
      return false;
    }
  };

  const resolveGenerationPrompt = async (base: string) => {
    let generationPrompt = base;
    if (sourceKind === "text" && sourceText.trim())
      generationPrompt += `\n\nSource material to transform into an original song:\n${sourceText.slice(0, 12000)}`;
    if (sourceKind === "link" && sourceUrl.trim()) {
      const sourceResponse = await fetch("/api/source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl }),
      });
      const sourceData = await sourceResponse.json();
      if (!sourceResponse.ok)
        throw new Error(sourceData.error || "The webpage could not be read.");
      generationPrompt += `\n\nCreate an original song inspired by this webpage. Do not copy protected wording unless supplied by the user. Page: ${sourceData.title}. Source material: ${sourceData.text}`;
    }
    return generationPrompt;
  };
  const hasPremiumTools = Boolean(accountInfo?.isOwner || (accountInfo?.plan && accountInfo.plan !== "Explore"));
  const requirePremiumTool = (feature: string) => {
    if (hasPremiumTools) return true;
    setMembershipOpen(true);
    setMessage(`${feature} is included with Creator and Studio. Your free creations remain downloadable as MP3 and shareable.`);
    return false;
  };
  const retryCloudSave = async () => {
    if (!song?.id || !session) { setAccountOpen(true); return; }
    const saved: SavedSong = { id: song.id, title: song.title, prompt: song.prompt, mode: song.mode, duration: song.duration, createdAt: song.createdAt || Date.now(), blob: song.blob, parentId: song.parentId, versionLabel: song.versionLabel, generatedLyrics: song.generatedLyrics, ownerId: session.user.id };
    await cloudSave(saved, song.blob);
    await loadLibrary();
  };

  const generatePreviews = async () => {
    if (prompt.trim().length < 8) {
      setMessage("Describe the song before creating previews.");
      return;
    }
    if (sourceKind === "audio") {
      setMessage(
        "Direction previews are available for ideas, text and webpages. Audio references go directly to remix.",
      );
      return;
    }
    if (!session) {
      setAccountOpen(true);
      setMessage("Sign in before generating direction previews.");
      return;
    }
    if (accountInfo?.plan === "Explore" && !accountInfo.isOwner) {
      setMembershipOpen(true);
      setMessage("Your 2 free music creations are reserved for complete creations. A/B direction previews are available with Creator or Studio.");
      return;
    }
    const fullSongMinutes = duration / 60;
    if (
      accountInfo &&
      !accountInfo.isOwner &&
      accountInfo.minutesRemaining !== null &&
      accountInfo.minutesRemaining < fullSongMinutes + 1
    ) {
      const remainingAfterPreview = Math.max(
        0,
        accountInfo.minutesRemaining - 1,
      );
      const proceed = window.confirm(
        `These previews use 1 minute and would leave ${remainingAfterPreview} minute${remainingAfterPreview === 1 ? "" : "s"}. That is not enough for your selected ${fullSongMinutes}-minute complete song. Continue anyway?`,
      );
      if (!proceed) {
        setMessage(
          "Preview canceled so you can keep your minutes for the complete song.",
        );
        return;
      }
    }
    setPreviewing(true);
    setMessage("");
    previews.forEach((item) => URL.revokeObjectURL(item.url));
    setPreviews([]);
    try {
      const base = await resolveGenerationPrompt(completePrompt);
      const directions = [
        {
          direction: "faithful" as const,
          label: "Faithful",
          description: "Focused, memorable and close to your brief.",
          instruction:
            "Create a concise 30-second preview that is faithful, emotionally coherent and immediately memorable.",
        },
        {
          direction: "bold" as const,
          label: "Bold",
          description: "More distinctive rhythm, texture and arrangement.",
          instruction:
            "Create a concise 30-second preview with a bolder, surprising but tasteful arrangement and a clearly different musical identity.",
        },
      ];
      const results: Preview[] = [];
      for (const item of directions) {
        const response = await fetch("/api/music", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session
              ? { Authorization: `Bearer ${session.access_token}` }
              : {}),
          },
          body: JSON.stringify({
            prompt: `${base}\n\n${item.instruction}`,
            instrumental: mode === "instrumental",
            duration: 30,
            structured: false,
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "A preview could not be created.");
        }
        const blob = await response.blob();
        results.push({
          ...item,
          id: crypto.randomUUID(),
          blob,
          url: URL.createObjectURL(blob),
        });
      }
      setPreviews(results);
      setMessage(
        "Compare both directions, choose one, then create the complete song. These two previews use one generation minute in total.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Previews could not be created.",
      );
    } finally {
      setPreviewing(false);
      void refreshAccount();
    }
  };

  const generateSong = async (override?: string) => {
    if (prompt.trim().length < 8) {
      setMessage("Describe the song in a little more detail.");
      return;
    }
    if (!session) {
      setAccountOpen(true);
      setMessage("Create your free Cantoa account to hear your creation. Your first 2 music creations are free, up to 2 minutes each.");
      return;
    }
    if (accountInfo?.plan === "Explore" && (accountInfo.freeSongsRemaining ?? 2) <= 0) {
      setMembershipOpen(true);
      setMessage("Your 2 free music creations have been used. Choose a membership to create more music.");
      return;
    }
    if (accountInfo?.plan === "Explore" && duration > 120) {
      setMessage("Each free music creation can be up to 2 minutes. Shorten it to 2:00 or choose a membership for longer creations.");
      return;
    }
    setGenerating(true);
    setMessage("");
    try {
      const generationPrompt = await resolveGenerationPrompt(
        override || completePrompt,
      );
      let compositionPlan: unknown;
      let generatedLyrics = lyrics.trim() || "";
      if (mode === "vocals" && !lyrics.trim() && !(sourceMode && sourceFile)) {
        setMessage("Preparing the lyrics and song structure…");
        const planResponse = await fetch("/api/music/plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ prompt: generationPrompt, duration }),
        });
        const planData = await planResponse.json();
        if (!planResponse.ok)
          throw new Error(
            planData.error || "The song plan could not be created.",
          );
        compositionPlan = planData.compositionPlan;
        generatedLyrics = lyricsFromPlan(compositionPlan) || generatedLyrics;
        setMessage("Lyrics and structure are ready. Generating the audio…");
      } else if (mode === "vocals" && lyrics.trim()) {
        generatedLyrics = lyrics.trim();
        setMessage("Using your lyrics as provided. Creating the music around them…");
      } else if (sourceMode && sourceFile) {
        generatedLyrics = song?.generatedLyrics || lyrics.trim();
      }
      let response: Response;
      if (intentPlan.soundtrack && videoSourceFile) {
        const form = new FormData();
        form.append("file", videoSourceFile);
        form.append("prompt", generationPrompt);
        response = await fetch("/api/soundtrack", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body: form });
        generatedLyrics = "";
      } else if (sourceMode && sourceFile) {
        const form = new FormData();
        form.append("file", sourceFile);
        form.append("prompt", generationPrompt);
        form.append("duration", String(duration));
        response = await fetch("/api/music/remix", {
          method: "POST",
          headers: session
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
          body: form,
        });
      } else
        response = await fetch("/api/music", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session
              ? { Authorization: `Bearer ${session.access_token}` }
              : {}),
          },
          body: JSON.stringify({
            prompt: generationPrompt,
            instrumental: mode === "instrumental",
            duration,
            structured: quality === "release",
            compositionPlan,
            lyrics: generatedLyrics,
            providerIntent: mode === "instrumental" && /background|ambient|soundtrack|score|cinematic|atmospher|sound\s*design|texture|underscore|meditat|sleep|relaxing/i.test(generationPrompt) ? "background" : "song",
          }),
        });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "The song could not be created.");
      }
      const blob = await response.blob();
      if (song?.url) URL.revokeObjectURL(song.url);
      const songTitle = title.trim() || titleFrom(prompt);
      const parentId = song?.id;
      const savedSong: SavedSong = {
        id: crypto.randomUUID(),
        title: songTitle,
        prompt,
        mode,
        duration,
        createdAt: Date.now(),
        blob,
        parentId,
        versionLabel: parentId ? "Revised version" : "Original",
        generatedLyrics,
        ownerId: session.user.id,
      };
      const objectUrl = URL.createObjectURL(blob);
      setSong({ ...savedSong, blob, url: objectUrl });
      setView("song");
      setPlaying(false);
      try {
        await localPut(savedSong as SavedSong & { blob: Blob });
      } catch {
        setMessage("Your song was created, but this browser could not save it to the device library. Download the MP3 now and retry cloud save if needed.");
      }
      await cloudSave(savedSong, blob);
      await loadLibrary();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The song could not be created.",
      );
    } finally {
      setGenerating(false);
      void refreshAccount();
    }
  };
  const toggleSong = () => {
    if (!songAudio.current) return;
    if (songAudio.current.paused) {
      void songAudio.current.play();
      setPlaying(true);
    } else {
      songAudio.current.pause();
      setPlaying(false);
    }
  };
  const newSong = () => {
    if (song?.url) URL.revokeObjectURL(song.url);
    previews.forEach((item) => URL.revokeObjectURL(item.url));
    setSong(null);
    setPreviews([]);
    setBlendDirections(false);
    setRevisionNote("");
    setView("create");
    setMessage("");
    setPlaying(false);
    setSourceMode(false);
    setSourceKind("idea");
    setSourceFile(null);
    setTitle("");
    setLyrics("");
    setPublicShareUrl("");
    setCloudStatus("");
    setCloudSaveFailed(false);
  };
  const download = () => {
    if (!song) return;
    const a = document.createElement("a");
    a.href = song.url;
    a.download = `${song.title.replace(/\s+/g, "-").toLowerCase()}.mp3`;
    a.click();
  };
  const saveText = (content: string, suffix: string, type = "text/plain") => {
    if (!song) return;
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${song.title.replace(/\s+/g, "-").toLowerCase()}-${suffix}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const exportLyrics = () =>
    saveText(
      song?.generatedLyrics?.trim() ||
        lyrics.trim() ||
        `No written lyrics are available for “${song?.title || "this song"}”. Instrumental songs do not contain lyrics.`,
      "lyrics.txt",
    );
  const exportWav = async () => {
    if (!song) return;
    if (!(await authorizeFeature("wav_export"))) return;
    setAction("Creating WAV…");
    setMessage("");
    try {
      const AudioContextClass = window.AudioContext;
      const context = new AudioContextClass();
      const decoded = await context.decodeAudioData(
        await song.blob.arrayBuffer(),
      );
      const wav = pcmWav(decoded);
      const url = URL.createObjectURL(wav);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${song.title.replace(/\s+/g, "-").toLowerCase()}.wav`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      await context.close();
      setMessage(
        "PCM WAV created for editing compatibility. It does not add detail beyond the generated source audio.",
      );
    } catch {
      setMessage(
        "This browser could not create the WAV file. Try current Chrome, Edge, Firefox or Safari.",
      );
    } finally {
      setAction("");
    }
  };
  const exportStems = async () => {
    if (!song) return;
    if (!requirePremiumTool("Stem separation")) return;
    setAction("Separating six stems…");
    setMessage("");
    try {
      const form = new FormData();
      form.append(
        "file",
        new File([song.blob], "song.mp3", { type: "audio/mpeg" }),
      );
      const response = await fetch("/api/music/stems", {
        method: "POST",
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: form,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Stem export failed.");
      }
      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${song.title.replace(/\s+/g, "-").toLowerCase()}-stems.zip`;
      a.click();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Stem export failed.",
      );
    } finally {
      setAction("");
    }
  };
  const reviseSong = (instruction: string, label: string) => {
    if (!song) return;
    if (!accountInfo?.isOwner && accountInfo?.plan === "Explore") {
      setMembershipOpen(true);
      setMessage("Revisions create a new audio generation and are available with Creator or Studio after your free creations.");
      return;
    }
    setView("create");
    setQuality("release");
    setSourceMode(true);
    setSourceKind("audio");
    setSourceFile(
      new File([song.blob], `${song.title}.mp3`, { type: "audio/mpeg" }),
    );
    setPrompt(`${revisionStrengthText(revisionStrength)}\n\nRequested change: ${instruction}`);
    setTitle(`${song.title} — ${label}`);
    setMessage(
      "Your original is preserved. This creates a new linked version using the current audio as its source.",
    );
  };
  const polish = () =>
    reviseSong(
      "Preserve this song's identity, melody and emotional character while improving vocal clarity, arrangement, transitions, tonal balance, impact and the final ending.",
      "Polished",
    );
  const applyCustomRevision = () => {
    const note = revisionNote.trim();
    if (!note) { setMessage("Tell Cantoa what you want to change first."); return; }
    reviseSong(note, "Custom revision");
  };
  const quickShare = async () => {
    if (!song) return;
    const file = new File([song.blob], `${song.title}.mp3`, {
      type: "audio/mpeg",
    });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: song.title,
          text: `Listen to “${song.title},” created with Cantoa.`,
          files: [file],
        });
        setShareStatus("Shared from this device.");
      } else {
        download();
        setShareStatus("MP3 downloaded—attach it wherever you share.");
      }
    } catch {
      setShareStatus("");
    }
  };
  const shareDestination = (
    destination:
      | "whatsapp"
      | "facebook"
      | "x"
      | "email"
      | "instagram"
      | "tiktok"
      | "youtube",
  ) => {
    if (!song) return;
    const text = `Listen to “${song.title},” created with Cantoa.`;
    const page = publicShareUrl || location.href;
    const targets = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${page}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(page)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(page)}`,
      email: `mailto:?subject=${encodeURIComponent(song.title)}&body=${encodeURIComponent(`${text}\n\n${page}`)}`,
      instagram: "https://www.instagram.com/",
      tiktok: "https://www.tiktok.com/upload",
      youtube: "https://www.youtube.com/upload",
    };
    window.open(targets[destination], "_blank", "noopener,noreferrer");
    download();
    setShareStatus(
      `MP3 downloaded · ${destination[0].toUpperCase() + destination.slice(1)} opened.`,
    );
  };

  const notify = useCallback((text: string) => {
    setToastMessage(text);
    window.setTimeout(() => setToastMessage((current) => current === text ? "" : current), 2600);
  }, []);

  const exportRightsRecord = () => {
    if (!song) return;
    const record = [
      "CANTOA CREATION RECORD",
      "",
      `Title: ${song.title}`,
      `Created: ${new Date(song.createdAt || Date.now()).toISOString()}`,
      `Version: ${song.versionLabel || "Original"}`,
      `Mode: ${song.mode}`,
      `Duration: ${song.duration} seconds`,
      `Plan at export: ${selectedPlan}`,
      "",
      "CREATIVE INPUT",
      song.prompt,
      "",
      "HUMAN CONTRIBUTIONS",
      [recipient && `Subject/recipient: ${recipient}`, personalDetails && `Personal details supplied: ${personalDetails}`, dedication && `Dedication supplied: ${dedication}`, pronunciation && `Pronunciation guidance supplied: ${pronunciation}`, lyrics.trim() && "User supplied or edited lyrics"].filter(Boolean).join("\n") || "No additional contribution fields were recorded in this session.",
      "",
      "RIGHTS NOTE",
      "This record documents the creation session. Commercial-use eligibility depends on the Cantoa plan and underlying provider terms applicable when the audio was generated. It is not a copyright registration or legal determination.",
    ].join("\n");
    saveText(record, "creation-record.txt");
  };
  const updatePronunciationEntry = (id: string, field: keyof Omit<PronunciationEntry, "id">, value: string) => {
    setPronunciationEntries((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };
  const addPronunciationEntry = () => {
    setPronunciationEntries((items) => [...items, { id: `pron-${Date.now()}-${items.length}`, target: "", reading: "", section: "All vocals" }]);
  };
  const removePronunciationEntry = (id: string) => {
    setPronunciationEntries((items) => items.length === 1 ? [{ ...items[0], target: "", reading: "" }] : items.filter((item) => item.id !== id));
  };

  const renderSocialVideo = async (format: SocialVideoFormat, downloadAfter = true) => {
    if (!song) return null;
    if (!(await authorizeFeature(format === "lyrics" ? "lyric_video" : "social_video"))) return null;
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      setMessage("Social video rendering is not supported by this browser. Try current Chrome, Edge or Firefox.");
      return null;
    }
    setSocialVideoRendering(true);
    setAction(format === "vertical" ? "Rendering Reel video…" : format === "lyrics" ? "Rendering lyric video…" : "Rendering square video…");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = format === "square" ? 1080 : 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      const canvasStream = canvas.captureStream(30);
      const audioContext = new AudioContext();
      const audio = new Audio(song.url);
      audio.preload = "auto";
      const source = audioContext.createMediaElementSource(audio);
      const capture = audioContext.createMediaStreamDestination();
      source.connect(capture);
      source.connect(audioContext.destination);
      const combined = new MediaStream([...canvasStream.getVideoTracks(), ...capture.stream.getAudioTracks()]);
      const preferred = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(combined, preferred ? { mimeType: preferred, videoBitsPerSecond: 4_800_000 } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      const done = new Promise<Blob>((resolve, reject) => {
        recorder.onerror = () => reject(new Error("Video recorder failed"));
        recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
      });

      const clipSeconds = Math.max(4, Math.min(15, song.duration || 15));
      const startedAt = performance.now();
      const [c1, c2, c3, c4] = palette;
      const safeX = format === "square" ? 76 : 96;
      const safeW = canvas.width - safeX * 2;
      const bars = [42,72,52,88,64,96,46,78,58,92,68,48,84,62,98,54,76,44,90,66,82,50,94,60,74,48,86,56,80,64,92,52];

      const roundedRect = (x:number,y:number,w:number,h:number,r:number) => {
        const radius=Math.min(r,w/2,h/2);
        ctx.beginPath();
        ctx.moveTo(x+radius,y); ctx.arcTo(x+w,y,x+w,y+h,radius); ctx.arcTo(x+w,y+h,x,y+h,radius); ctx.arcTo(x,y+h,x,y,radius); ctx.arcTo(x,y,x+w,y,radius); ctx.closePath();
      };
      const wrap = (value:string, maxWidth:number, font:string, maxLines=3) => {
        ctx.font=font; const rows:string[]=[]; let line="";
        for (const word of value.trim().split(/\s+/)) {
          const next=(line+" "+word).trim();
          if (line && ctx.measureText(next).width>maxWidth) { rows.push(line); line=word; if(rows.length===maxLines-1) break; }
          else line=next;
        }
        if (line && rows.length<maxLines) rows.push(line);
        const consumed=rows.join(" ").split(/\s+/).length;
        const total=value.trim().split(/\s+/).length;
        if (consumed<total && rows.length) {
          let last=rows[rows.length-1]; while(last.length>3 && ctx.measureText(last+"…").width>maxWidth) last=last.slice(0,-1);
          rows[rows.length-1]=last.replace(/[\s,;:-]+$/,'')+"…";
        }
        return rows;
      };
      const drawBackground = (elapsed:number) => {
        const gradient=ctx.createLinearGradient(0,0,canvas.width,canvas.height);
        gradient.addColorStop(0,c1); gradient.addColorStop(.34,c2); gradient.addColorStop(.68,c3); gradient.addColorStop(1,c4);
        ctx.fillStyle=gradient; ctx.fillRect(0,0,canvas.width,canvas.height);
        const veil=ctx.createLinearGradient(0,0,0,canvas.height); veil.addColorStop(0,"rgba(15,10,24,.08)"); veil.addColorStop(.55,"rgba(15,10,24,.16)"); veil.addColorStop(1,"rgba(10,8,18,.48)"); ctx.fillStyle=veil; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.save(); ctx.globalAlpha=.13; ctx.fillStyle="#fff";
        const pulse=1+Math.sin(elapsed*2.25)*.025;
        ctx.beginPath();ctx.arc(canvas.width*.82,canvas.height*.16,canvas.width*.22*pulse,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=.09;ctx.beginPath();ctx.arc(canvas.width*.09,canvas.height*.82,canvas.width*.27*(2-pulse),0,Math.PI*2);ctx.fill();ctx.restore();
      };
      const drawArtwork = (x:number,y:number,size:number) => {
        ctx.save(); ctx.shadowColor="rgba(7,5,15,.34)";ctx.shadowBlur=48;ctx.shadowOffsetY=22;roundedRect(x,y,size,size,44);ctx.fillStyle="rgba(14,10,23,.95)";ctx.fill();ctx.shadowColor="transparent";
        roundedRect(x,y,size,size,44);ctx.clip();
        const g=ctx.createLinearGradient(x,y,x+size,y+size);g.addColorStop(0,"#1a1225");g.addColorStop(.45,c2);g.addColorStop(1,"#12101c");ctx.fillStyle=g;ctx.fillRect(x,y,size,size);
        ctx.globalAlpha=.60;ctx.fillStyle=c1;ctx.beginPath();ctx.arc(x+size*.21,y+size*.34,size*.22,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=.58;ctx.fillStyle=c3;ctx.beginPath();ctx.arc(x+size*.72,y+size*.22,size*.27,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=.40;ctx.fillStyle=c4;ctx.beginPath();ctx.arc(x+size*.59,y+size*.78,size*.28,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=1;
        const titleFont=`700 ${Math.round(size*.078)}px Georgia,serif`;ctx.fillStyle="#fff";const titleRows=wrap(song.title,size*.82,titleFont,4);ctx.font=titleFont;titleRows.forEach((row,i)=>ctx.fillText(row,x+size*.08,y+size*.64+i*size*.083));
        ctx.font=`600 ${Math.round(size*.025)}px Arial,sans-serif`;ctx.globalAlpha=.86;ctx.fillText(song.mode==="vocals"?"Original song · Vocals":"Original instrumental",x+size*.08,y+size*.94);ctx.restore();
      };
      const drawWaveform = (x:number,y:number,w:number,h:number,progress:number) => {
        const gap=w/(bars.length-1);ctx.save();ctx.lineCap="round";ctx.lineWidth=Math.max(4,w*.006);
        bars.forEach((bar,i)=>{const px=x+i*gap;const bh=h*(bar/100);ctx.strokeStyle=i/(bars.length-1)<=progress?"rgba(255,255,255,.96)":"rgba(255,255,255,.34)";ctx.beginPath();ctx.moveTo(px,y+(h-bh)/2);ctx.lineTo(px,y+(h+bh)/2);ctx.stroke();});ctx.restore();
      };
      const drawProgress = (y:number, progress:number) => {ctx.fillStyle="rgba(255,255,255,.25)";roundedRect(safeX,y,safeW,7,4);ctx.fill();ctx.fillStyle="#fff";roundedRect(safeX,y,safeW*progress,7,4);ctx.fill();};
      const lyricLines=(song.generatedLyrics||lyrics||"").split(/\n+/).map((line)=>line.replace(/^\[[^\]]+\]$/,'').trim()).filter(Boolean);

      const draw = () => {
        const elapsed=Math.min(clipSeconds,(performance.now()-startedAt)/1000); const progress=elapsed/clipSeconds;
        drawBackground(elapsed);
        ctx.textAlign="left";ctx.textBaseline="alphabetic";

        if (format === "square") {
          const art=500; drawArtwork((canvas.width-art)/2,92,art);
          const titleSize=song.title.length>55?47:song.title.length>35?54:60; const titleFont=`700 ${titleSize}px Georgia,serif`;ctx.fillStyle="#fff";const titleRows=wrap(song.title,safeW,titleFont,3);ctx.font=titleFont;titleRows.forEach((row,i)=>ctx.fillText(row,safeX,675+i*(titleSize*1.03)));
          const lyric=dedication||song.prompt||"A moment, made into music.";const subFont="500 27px Arial,sans-serif";ctx.fillStyle="rgba(255,255,255,.78)";const subs=wrap(lyric,safeW,subFont,2);ctx.font=subFont;subs.forEach((row,i)=>ctx.fillText(row,safeX,850+i*36));
          drawWaveform(safeX,925,safeW,68,progress);drawProgress(1010,progress);if(showExportBranding){ctx.fillStyle="rgba(255,255,255,.76)";ctx.font="600 20px Arial,sans-serif";ctx.fillText("Made with Cantoa",safeX,1045);}
        } else if (format === "lyrics") {
          const art=500;drawArtwork((canvas.width-art)/2,145,art);
          const titleFont="700 54px Georgia,serif";ctx.fillStyle="#fff";const titleRows=wrap(song.title,safeW,titleFont,2);ctx.font=titleFont;titleRows.forEach((row,i)=>ctx.fillText(row,safeX,760+i*60));
          const lyric=lyricLines.length?lyricLines[Math.min(lyricLines.length-1,Math.floor(progress*lyricLines.length))]:dedication||"A moment, made into music.";
          const lyricFont="650 54px Arial,sans-serif";const lyricRows=wrap(lyric,safeW,lyricFont,4);ctx.fillStyle="#fff";ctx.font=lyricFont;lyricRows.forEach((row,i)=>ctx.fillText(row,safeX,1080+i*70));
          drawWaveform(safeX,1530,safeW,105,progress);drawProgress(1712,progress);if(showExportBranding){ctx.fillStyle="rgba(255,255,255,.76)";ctx.font="600 21px Arial,sans-serif";ctx.fillText("Made with Cantoa",safeX,1780);}
        } else {
          const art=720;drawArtwork((canvas.width-art)/2,170,art);
          const titleSize=song.title.length>60?58:song.title.length>38?66:74;const titleFont=`700 ${titleSize}px Georgia,serif`;ctx.fillStyle="#fff";const titleRows=wrap(song.title,safeW,titleFont,3);ctx.font=titleFont;titleRows.forEach((row,i)=>ctx.fillText(row,safeX,1045+i*(titleSize*1.04)));
          const descriptor=dedication||song.prompt||"A moment, made into music.";const descFont="500 30px Arial,sans-serif";ctx.fillStyle="rgba(255,255,255,.78)";const descRows=wrap(descriptor,safeW,descFont,2);ctx.font=descFont;const descY=1045+titleRows.length*(titleSize*1.04)+35;descRows.forEach((row,i)=>ctx.fillText(row,safeX,descY+i*42));
          drawWaveform(safeX,1510,safeW,110,progress);drawProgress(1695,progress);if(showExportBranding){ctx.fillStyle="rgba(255,255,255,.76)";ctx.font="600 21px Arial,sans-serif";ctx.fillText("Made with Cantoa",safeX,1770);}
          ctx.fillStyle="rgba(255,255,255,.72)";ctx.textAlign="right";ctx.font="600 22px Arial,sans-serif";ctx.fillText(`${Math.ceil(elapsed)}s / ${Math.ceil(clipSeconds)}s`,canvas.width-safeX,1770);ctx.textAlign="left";
        }
        if (elapsed < clipSeconds && !audio.ended) requestAnimationFrame(draw);
      };

      await audioContext.resume(); recorder.start(500); await audio.play(); draw();
      await new Promise((resolve)=>setTimeout(resolve,clipSeconds*1000)); audio.pause(); recorder.stop(); const blob=await done;
      source.disconnect();capture.disconnect();canvasStream.getTracks().forEach((track)=>track.stop());capture.stream.getTracks().forEach((track)=>track.stop());await audioContext.close();
      if (socialVideoUrl) URL.revokeObjectURL(socialVideoUrl); const url=URL.createObjectURL(blob);setSocialVideoBlob(blob);setSocialVideoUrl(url);setSocialVideoFormat(format);
      if(downloadAfter){const a=document.createElement("a");a.href=url;const slug=song.title.replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").toLowerCase()||"cantoa-song";a.download=`${slug}-${format==="vertical"?"reel":format==="lyrics"?"lyric-video":"square"}.webm`;a.click();notify(`${format==="vertical"?"15-second Reel":format==="lyrics"?"Lyric video":"Square social video"} created and downloaded.`)}
      return blob;
    } catch(error){setMessage(error instanceof Error?`Social video could not be created: ${error.message}`:"Social video could not be created in this browser.");return null}
    finally{setSocialVideoRendering(false);setAction("")}
  };

  const renderMemoryMovie = async () => {
    if (!song) return null;
    if (!memoryPhotos.length) { setMessage("Add photos beside ‘Speak your idea’ to create a Memory Movie."); return null; }
    if (!(await authorizeFeature("memory_movie"))) return null;
    if (!socialVideoSupported) { setMessage("Memory Movie rendering needs a browser with canvas video recording support. Try current Chrome, Edge or Firefox."); return null; }
    setMemoryMovieRendering(true); setAction("Creating Memory Movie…");
    try {
      const images=await Promise.all(memoryPhotos.map(async(file)=>{if("createImageBitmap" in window)return await createImageBitmap(file);return await new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();const url=URL.createObjectURL(file);image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Photo could not be loaded"))};image.src=url})}));
      const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas unavailable");
      const canvasStream=canvas.captureStream(30);const audioContext=new AudioContext();const audio=new Audio(song.url);audio.preload="auto";const source=audioContext.createMediaElementSource(audio);const capture=audioContext.createMediaStreamDestination();source.connect(capture);source.connect(audioContext.destination);
      const combined=new MediaStream([...canvasStream.getVideoTracks(),...capture.stream.getAudioTracks()]);const mime=["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find((type)=>MediaRecorder.isTypeSupported(type));const recorder=new MediaRecorder(combined,mime?{mimeType:mime,videoBitsPerSecond:5_000_000}:undefined);const chunks:BlobPart[]=[];recorder.ondataavailable=(event)=>{if(event.data.size)chunks.push(event.data)};const done=new Promise<Blob>((resolve,reject)=>{recorder.onerror=()=>reject(new Error("Memory Movie recorder failed"));recorder.onstop=()=>resolve(new Blob(chunks,{type:recorder.mimeType||"video/webm"}))});
      const seconds=Math.max(10,Math.min(30,song.duration||30));const startedAt=performance.now();const safe=88;
      const drawCover=(image:ImageBitmap|HTMLImageElement,alpha:number,scale:number,offsetX:number,offsetY:number)=>{const iw=image.width,ih=image.height,ratio=Math.max(canvas.width/iw,canvas.height/ih)*scale,w=iw*ratio,h=ih*ratio;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(image,(canvas.width-w)/2+offsetX,(canvas.height-h)/2+offsetY,w,h);ctx.restore()};
      const wrap=(value:string,maxWidth:number,font:string,maxLines=3)=>{ctx.font=font;const rows:string[]=[];let line="";for(const word of value.trim().split(/\s+/)){const next=(line+" "+word).trim();if(line&&ctx.measureText(next).width>maxWidth){rows.push(line);line=word;if(rows.length===maxLines-1)break}else line=next}if(line&&rows.length<maxLines)rows.push(line);return rows};
      const draw=()=>{const elapsed=Math.min(seconds,(performance.now()-startedAt)/1000),progress=elapsed/seconds,exact=progress*images.length,index=Math.min(images.length-1,Math.floor(exact)),local=exact-index;ctx.fillStyle="#120e1a";ctx.fillRect(0,0,canvas.width,canvas.height);const move=(local-.5)*28;drawCover(images[index],1,1.06+local*.025,move,-move*.35);if(index+1<images.length&&local>.74)drawCover(images[index+1],(local-.74)/.26,1.06,-24+move,8);
        const top=ctx.createLinearGradient(0,0,0,340);top.addColorStop(0,"rgba(10,7,16,.62)");top.addColorStop(1,"rgba(10,7,16,0)");ctx.fillStyle=top;ctx.fillRect(0,0,canvas.width,350);const bottom=ctx.createLinearGradient(0,canvas.height*.52,0,canvas.height);bottom.addColorStop(0,"rgba(10,7,16,0)");bottom.addColorStop(.42,"rgba(10,7,16,.36)");bottom.addColorStop(1,"rgba(10,7,16,.88)");ctx.fillStyle=bottom;ctx.fillRect(0,canvas.height*.50,canvas.width,canvas.height*.50);
        ctx.fillStyle="rgba(255,255,255,.92)";ctx.font="800 25px Arial,sans-serif";ctx.letterSpacing="4px" as any;ctx.fillText("CANTOA MEMORY MOVIE",safe,112);ctx.letterSpacing="0px" as any;
        const titleFont=song.title.length>52?"700 58px Georgia,serif":"700 66px Georgia,serif";const titleRows=wrap(song.title,canvas.width-safe*2,titleFont,3);ctx.fillStyle="#fff";ctx.font=titleFont;titleRows.forEach((row,i)=>ctx.fillText(row,safe,canvas.height-395+i*72));
        const note=dedication|| (recipient?`For ${recipient}`:"A moment, made into music.");const noteRows=wrap(note,canvas.width-safe*2,"500 30px Arial,sans-serif",2);ctx.fillStyle="rgba(255,255,255,.82)";ctx.font="500 30px Arial,sans-serif";noteRows.forEach((row,i)=>ctx.fillText(row,safe,canvas.height-170+i*40));
        ctx.fillStyle="rgba(255,255,255,.25)";ctx.fillRect(safe,canvas.height-82,canvas.width-safe*2,7);ctx.fillStyle="#fff";ctx.fillRect(safe,canvas.height-82,(canvas.width-safe*2)*progress,7);if(showExportBranding){ctx.fillStyle="rgba(255,255,255,.72)";ctx.font="600 19px Arial,sans-serif";ctx.fillText("Made with Cantoa",safe,canvas.height-38);}if(elapsed<seconds&&!audio.ended)requestAnimationFrame(draw)};
      await audioContext.resume();recorder.start(500);await audio.play();draw();await new Promise((resolve)=>setTimeout(resolve,seconds*1000));audio.pause();recorder.stop();const blob=await done;source.disconnect();capture.disconnect();canvasStream.getTracks().forEach((track)=>track.stop());capture.stream.getTracks().forEach((track)=>track.stop());await audioContext.close();images.forEach((image)=>{"close" in image&&typeof image.close==="function"&&image.close()});if(memoryMovieUrl)URL.revokeObjectURL(memoryMovieUrl);const url=URL.createObjectURL(blob);setMemoryMovieBlob(blob);setMemoryMovieUrl(url);notify("Memory Movie created.");return blob;
    } catch(error){setMessage(error instanceof Error?`Memory Movie could not be created: ${error.message}`:"Memory Movie could not be created in this browser.");return null} finally{setMemoryMovieRendering(false);setAction("")}
  };

  const createJinglePack = async () => {
    if (!song || !session) return;
    if (!(await authorizeFeature("jingle_pack"))) return;
    if (!window.confirm("Create 15-, 30- and 60-second jingle variants? This uses provider generation minutes for three new audio renders.")) return;
    setJinglePackBuilding(true); setAction("Creating 15/30/60 jingle pack…");
    try {
      const JSZip=(await import("jszip")).default; const zip=new JSZip(); const variants=[15,30,60];
      for(const seconds of variants){
        const response=await fetch("/api/music",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({prompt:`${completePrompt}\n\nCreate a ${seconds}-second brand/jingle variant. Put the memorable brand hook early, keep the ending clean, and make this version feel complete at exactly this short duration.`,instrumental:mode==="instrumental",duration:seconds,structured:true})});
        const data=response.ok?await response.blob():await response.json().catch(()=>({})); if(!response.ok) throw new Error((data as any).error||`${seconds}-second jingle could not be created.`); zip.file(`${song.title.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}-${seconds}s.mp3`,data as Blob);
      }
      zip.file("README.txt","Cantoa Business Jingle Pack\n\nContains 15-, 30- and 60-second generated variants. Each is a separate provider-backed generation and consumes generation minutes."); const blob=await zip.generateAsync({type:"blob"}); if(jinglePackUrl)URL.revokeObjectURL(jinglePackUrl); const url=URL.createObjectURL(blob);setJinglePackUrl(url);const a=document.createElement("a");a.href=url;a.download=`${song.title.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}-jingle-pack.zip`;a.click();notify("15/30/60 jingle pack created and downloaded.");void refreshAccount();
    } catch(error){setMessage(error instanceof Error?error.message:"Jingle pack could not be created.")} finally{setJinglePackBuilding(false);setAction("")}
  };

  const exportCreatorPack = async () => {
    if (!song) return;
    if (!(await authorizeFeature("creator_pack"))) return;
    setAction("Building Creator Pack…");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const slug = song.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "cantoa-song";
      zip.file(`${slug}.mp3`, song.blob);
      zip.file(`${slug}-lyrics.txt`, song.generatedLyrics?.trim() || lyrics.trim() || "Instrumental / no lyrics saved.");
      zip.file(`${slug}-caption.txt`, `Listen to “${song.title}” — created with Cantoa. #Cantoa #AIMusic`);
      zip.file(`${slug}-metadata.txt`, `Title: ${song.title}\nCreated: ${new Date(song.createdAt || Date.now()).toISOString()}\nMode: ${song.mode}\nDuration: ${song.duration}s\nVersion: ${song.versionLabel || "Original"}\n\nCreation brief:\n${song.prompt}\n\nRights note: Commercial eligibility depends on the Cantoa plan and provider terms applicable when the audio was generated. This record is not a copyright determination.`);
      zip.file(`${slug}-youtube-description.txt`, `${song.title}\n\nCreated with Cantoa.\n\n${dedication ? `${dedication}\n\n` : ""}#Cantoa #OriginalMusic`);
      zip.file(`${slug}-instagram-caption.txt`, `${recipient ? `For ${recipient} — ` : ""}${song.title}. ${dedication || "A moment turned into music."} #Cantoa #OriginalMusic #MadeWithCantoa`);
      zip.file(`${slug}-tiktok-caption.txt`, `${recipient ? `Made this for ${recipient} 💛 ` : ""}${song.title} · made with Cantoa. #Cantoa #OriginalMusic`);
      zip.file(`${slug}-shorts-caption.txt`, `${song.title} · an original Cantoa creation. ${dedication || ""}`.trim());
      const escapeXml = (value: string) => value.replace(/[&<>"']/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[ch] || ch));
      const artwork = (w:number,h:number,label:string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7658ff"/><stop offset=".48" stop-color="#ed4b9a"/><stop offset="1" stop-color="#ffb35c"/></linearGradient></defs><rect width="100%" height="100%" rx="${Math.round(Math.min(w,h)*.05)}" fill="url(#g)"/><circle cx="${w*.78}" cy="${h*.2}" r="${Math.min(w,h)*.19}" fill="#fff" opacity=".12"/><circle cx="${w*.23}" cy="${h*.78}" r="${Math.min(w,h)*.25}" fill="#65d9c4" opacity=".24"/><text x="8%" y="72%" fill="white" font-family="Arial,sans-serif" font-size="${Math.round(Math.min(w,h)*.07)}" font-weight="800">${escapeXml(song.title)}</text><text x="8%" y="82%" fill="white" opacity=".8" font-family="Arial,sans-serif" font-size="${Math.round(Math.min(w,h)*.027)}">${label}</text></svg>`;
      zip.file(`${slug}-cover-square.svg`, artwork(1080,1080,"Square cover"));
      zip.file(`${slug}-reel-cover.svg`, artwork(1080,1920,"Vertical social cover"));
      zip.file(`${slug}-youtube-cover.svg`, artwork(1920,1080,"YouTube cover"));
      let packVideo = socialVideoBlob;
      if (!packVideo) {
        setAction("Creator Pack 2.0 · rendering 15-sec social video…");
        packVideo = await renderSocialVideo("vertical", false);
      }
      if (packVideo) zip.file(`${slug}-reel-15s.webm`, packVideo);
      zip.file("README.txt", "Cantoa Creator Pack 2.0\n\nIncludes: generated MP3, lyrics, platform-specific captions, creation metadata/rights note, square/vertical/YouTube cover artwork and (when supported by the browser) a ready-to-post 15-second vertical WebM social video.\n\nWebM is broadly accepted for upload workflows; transcode to MP4 in your publishing tool if a destination requires MP4.");
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${slug}-creator-pack.zip`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("Creator Pack 2.0 downloaded.");
    } catch { setMessage("Creator Pack could not be created in this browser."); }
    finally { setAction(""); }
  };
  const createGiftLink = async () => {
    if (!song?.id) { setMessage("Sign in and save this song to your cloud library before creating a gift link."); return; }
    if (!session) { setAccountOpen(true); return; }
    setShareCreating(true); setMessage("");
    try {
      const response = await fetch(`/api/library/${song.id}/share`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ giftTo: recipient, dedication, giftFrom: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Someone special" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gift link could not be created.");
      setPublicShareUrl(data.url);
      const copied = !!navigator.clipboard && await navigator.clipboard.writeText(data.url).then(() => true).catch(() => false);
      notify(copied ? "Gift page ready · link copied" : "Gift page ready");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Gift link could not be created."); }
    finally { setShareCreating(false); }
  };

  const openSaved = async (saved: SavedSong) => {
    setMessage("");
    if (song?.url) URL.revokeObjectURL(song.url);
    try {
      let blob: Blob;
      if (saved.blob) blob = saved.blob;
      else
        blob = await fetch(saved.remoteUrl || "").then((r) => {
          if (!r.ok) throw new Error();
          return r.blob();
        });
      let generatedLyrics = saved.generatedLyrics || "";
      if (!generatedLyrics && saved.remoteLyricsUrl)
        generatedLyrics = await fetch(saved.remoteLyricsUrl)
          .then((response) => (response.ok ? response.text() : ""))
          .catch(() => "");
      setSong({
        ...saved,
        generatedLyrics,
        blob,
        url: URL.createObjectURL(blob),
      });
      setView("song");
      setPlaying(false);
    } catch {
      setMessage(
        "This cloud audio link expired. Refresh the library and try again.",
      );
    }
  };
  const deleteSaved = async (id: string) => {
    if (!confirm("Delete this song permanently from your Cantoa library?"))
      return;
    await localDelete(id);
    if (session)
      await fetch(`/api/library/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    if (song?.id === id) {
      setSong(null);
      setView("library");
    }
    await loadLibrary();
  };
  const choosePlan = async (plan: string) => {
    if (plan === "Explore") {
      setSelectedPlan("Explore");
      setPlanMessage("Explore is your current free plan.");
      return;
    }
    if (!session) {
      setMembershipOpen(false);
      setAccountOpen(true);
      return;
    }
    setPlanMessage("Opening secure checkout…");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ plan }),
    });
    const data = await response.json();
    if (response.ok && data.url) {
      location.href = data.url;
    } else setPlanMessage(data.error || "Checkout is unavailable.");
  };

  return (
    <main
      className={`app theme-${theme}`}
      style={
        {
          "--a": palette[0],
          "--b": palette[1],
          "--c": palette[2],
          "--d": palette[3],
        } as React.CSSProperties
      }
    >
      <aside className="sidebar">
        <button className="logo" onClick={() => setView("create")}>
          <span>
            <Waves />
          </span>
          <div>
            <b>Cantoa</b>
            <small>MOMENTS → MUSIC</small>
          </div>
        </button>
        <nav>
          <button
            className={view === "create" ? "active" : ""}
            onClick={() => setView("create")}
          >
            <Plus /> Create
          </button>
          <button
            className={view === "library" ? "active" : ""}
            onClick={() => {
              void loadLibrary();
              setView("library");
            }}
          >
            <Library /> Library
          </button>
          {accountInfo?.isOwner && (
            <a className="owner-nav-link" href="/owner">
              <ShieldCheck /> Owner console
            </a>
          )}
        </nav>
        <div className="side-note">
          <Sparkles />
          <div>
            <b>Moments become music.</b>
            <span>Create · refine · share.</span>
          </div>
        </div>
        <button className="profile" onClick={() => setAccountOpen(true)}>
          <span>{session?.user.email?.slice(0, 2).toUpperCase() || "DS"}</span>
          <div>
            <b>{session ? "Your account" : "Sign in"}</b>
            <small>
              {session
                ? `${selectedPlan} · ${accountInfo?.cloudConfigured === false ? "Cloud setup needed" : accountInfo?.cloudConfigured ? "Cloud ready" : "Signed in"}`
                : accountConfigured
                  ? "Save across devices"
                  : "Preview mode"}
            </small>
          </div>
          <UserCircle />
        </button>
      </aside>
      <section className="workspace">
        <header>
          <div>
            <span className="status-dot" /> Music studio ready
          </div>
          <div className="header-actions">
            <button
              className="top-profile"
              onClick={() => setAccountOpen(true)}
            >
              <span>
                {session?.user.email?.slice(0, 2).toUpperCase() || "?"}
              </span>
              <div>
                <b>
                  {session?.user.user_metadata?.full_name ||
                    session?.user.email ||
                    "Sign in"}
                </b>
                <small>
                  {accountInfo?.isOwner
                    ? "Owner · Unlimited"
                    : session
                      ? selectedPlan === "Explore"
                        ? `Explore · ${accountInfo?.freeSongsRemaining ?? 2} free creation${(accountInfo?.freeSongsRemaining ?? 2) === 1 ? "" : "s"} left`
                        : `${selectedPlan} · ${accountInfo?.minutesRemaining ?? 0} of ${selectedPlan === "Studio" ? 120 : 40} music min left`
                      : "Create an account"}
                </small>
              </div>
            </button>
            <button
              className="theme-toggle"
              title={`Use ${theme === "light" ? "dark" : "light"} mode`}
              aria-label={`Use ${theme === "light" ? "dark" : "light"} mode`}
              onClick={() =>
                setTheme((value) => (value === "light" ? "dark" : "light"))
              }
            >
              {theme === "light" ? <Moon /> : <Sun />}
              <span>{theme === "light" ? "Dark" : "Light"}</span>
            </button>
            <button
              className="membership-trigger"
              onClick={() => setMembershipOpen(true)}
            >
              <Crown /> Membership
            </button>
            <button onClick={newSong}>
              <Plus /> New song
            </button>
          </div>
        </header>
        {view === "create" && (
          <div className="create-view">
            <div className="create-heading v17-heading">
              <p>CANTOA MUSIC</p>
              <h1>Turn any moment into <i>music.</i></h1>
              <span>Start with a person, occasion, story, webpage, voice note or blank idea. Cantoa guides the brief, creates the song, then helps you revise, package and share it.</span>
            </div>
            <section className="moment-launcher" aria-label="Start with a moment">
              <div className="moment-launcher-head"><div><b>What are you making today?</b><span>Choose one or start from scratch.</span></div><div className="surprise-wrap"><button onClick={surpriseMe}><Sparkles /> {surpriseDirection ? "Surprise me again" : "Surprise me"}</button>{surpriseDirection && <small aria-live="polite">{surpriseDirection}</small>}</div></div>
              {showFreeOffer && <div className="free-moment-banner"><Sparkles /><span><b>{session ? `${freeCreationsRemaining} free music creation${freeCreationsRemaining === 1 ? "" : "s"} remaining` : "Your first 2 music creations are free"}</b><small>Any 2 Moments · up to 2 minutes each · including Video / Reel.</small></span></div>}
              <div className="moment-grid">{MOMENTS.map((item) => <button key={item.id} className={momentId === item.id ? "active" : ""} onClick={() => applyMoment(item.id)}><span>{item.icon}</span><b>{item.label}</b></button>)}</div>
              {showFreeOffer && freeCreationsRemaining > 0 && <p className="free-moment-note"><b>{activeMoment.label}</b> · Uses 1 free creation only after the music is successfully generated. Re-exports do not use another generation minute.</p>}
            </section>
            <section className="composer">
              <div className="composer-tabs v17-tabs simple-create-tabs">
                <button className={createMode === "quick" ? "active" : ""} onClick={() => {setCreateMode("quick");setCustom(false);}}>Create</button>
                <button className={createMode === "advanced" ? "active" : ""} onClick={() => {setCreateMode("advanced");setCustom(true);}}>Advanced</button>
              </div>
              <label className="field-label" htmlFor="idea">
                Describe what you want to create
              </label>
              <div className="idea-box">
                <WandSparkles />
                <textarea
                  id="idea"
                  rows={5}
                  maxLength={4000}
                  value={prompt}
                  onPaste={detectPaste}
                  onChange={(e) => detectPromptInput(e.target.value)}
                  placeholder={
                    sourceMode
                      ? "Describe the cover, remix or transformation…"
                      : activeMoment.placeholder
                  }
                />
                <button
                  type="button"
                  className={`voice-idea ${recording ? "recording" : ""}`}
                  onClick={toggleRecording}
                  disabled={transcribing}
                  aria-label={
                    recording ? "Stop recording" : "Speak your song idea"
                  }
                >
                  {recording ? <CircleStop /> : <Mic2 />}
                  <b>
                    {transcribing
                      ? "Transcribing…"
                      : recording
                        ? "Stop"
                        : "Speak your idea"}
                  </b>
                </button>
                <label className={`memory-attach ${memoryPhotos.length || videoSourceFile || (sourceMode && sourceFile) ? "has-files" : ""}`} title="Add photos, video or audio. Cantoa will detect what you attached.">
                  <Paperclip /><b>{sourceMode && sourceFile ? `Audio attached · ${sourceFile.name}` : videoSourceFile ? `Video attached${memoryPhotos.length ? ` · ${memoryPhotos.length} photos` : ""}` : memoryPhotos.length ? `${memoryPhotos.length} photo${memoryPhotos.length === 1 ? "" : "s"}` : "Add media"}</b>
                  <input type="file" accept="image/*,audio/*,video/mp4,video/webm,video/quicktime" multiple onChange={(e) => {
                    const files = Array.from(e.target.files || []) as File[];
                    const images = files.filter((file) => file.type.startsWith("image/")).slice(0, 20);
                    const video = files.find((file) => file.type.startsWith("video/")) || null;
                    const audio = files.find((file) => file.type.startsWith("audio/")) || null;
                    setMemoryPhotos(images);
                    setVideoSourceFile(video);
                    if (audio) {
                      setSourceFile(audio);
                      setSourceKind("audio");
                      setSourceMode(true);
                      setMessage("Audio attached. Describe the cover, remix or transformation you want.");
                    } else if (video) {
                      setSourceFile(null);
                      setSourceKind("idea");
                      setSourceMode(false);
                      setMessage("Video attached. Describe how the music should follow the moment.");
                    } else if (images.length) {
                      setSourceFile(null);
                      setSourceKind("idea");
                      setSourceMode(false);
                      setMessage(`${images.length} photo${images.length === 1 ? "" : "s"} attached for your Memory Movie.`);
                    }
                  }} />
                </label>
                <span>{prompt.length}/4000</span>
              </div>
              <div className="intent-summary" aria-live="polite">
                <Sparkles /><span><b>Cantoa understood</b>{intentPlan.labels.map((label) => <i key={label}>{label}</i>)}</span>
              </div>
              <div className="examples">
                <button
                  onClick={() =>
                    setPrompt(
                      "A euphoric dance-pop anthem with a massive chorus, bright female vocals and festival energy",
                    )
                  }
                >
                  Dance pop
                </button>
                <button
                  onClick={() =>
                    setPrompt(
                      "Dreamy indie pop about a midnight drive, intimate vocal, warm synths, nostalgic and hopeful",
                    )
                  }
                >
                  Indie night drive
                </button>
                <button
                  onClick={() =>
                    setPrompt(
                      "A cinematic orchestral instrumental that grows from quiet piano into a triumphant finale",
                    )
                  }
                >
                  Cinematic score
                </button>
                <button
                  onClick={() =>
                    setPrompt(
                      "A joyful Afrobeat song with playful vocals, syncopated percussion, bright guitars and an irresistible hook",
                    )
                  }
                >
                  Afrobeat
                </button>
              </div>
              {createMode === "quick" && (
                <div className="quick-essentials">
                  <label>
                    <span>Song title <i>optional</i></span>
                    <input
                      maxLength={80}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Auto — Cantoa can choose"
                    />
                  </label>
                  <label>
                    <span>Style <i>optional</i></span>
                    <input
                      list="quick-styles"
                      maxLength={200}
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      placeholder="Auto — follow my idea"
                    />
                    <datalist id="quick-styles">
                      {[
                        "Auto — choose for me",
                        "Pop",
                        "Bollywood",
                        "Hip-hop",
                        "R&B",
                        "Acoustic pop",
                        "Afrobeat",
                        "Punjabi pop",
                        "Electronic",
                        "Cinematic",
                      ].map((x) => <option key={x} value={x} />)}
                    </datalist>
                  </label>
                  <button
                    type="button"
                    className={`quick-lyrics-toggle ${quickLyricsOpen || lyrics.trim() ? "active" : ""}`}
                    onClick={() => setQuickLyricsOpen((open) => !open)}
                  >
                    <Music4 />
                    <span>
                      <b>{lyrics.trim() ? "Your lyrics added" : "Use my lyrics"}</b>
                      <small>{lyrics.trim() ? "Edit the words Cantoa will sing" : "Paste finished lyrics and Cantoa will create the music around them"}</small>
                    </span>
                    <ChevronDown />
                  </button>
                  {quickLyricsOpen && (
                    <label className="quick-lyrics-field">
                      <span>Paste your lyrics <i>optional</i></span>
                      <textarea
                        maxLength={8000}
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        rows={7}
                        placeholder={"Paste your finished lyrics here. You can use [Verse], [Chorus], [Bridge], etc. Cantoa will preserve your words and create the music around them."}
                      />
                      <small>{lyrics.length.toLocaleString()}/8,000 characters · Leave blank and Cantoa will write the lyrics for you.</small>
                    </label>
                  )}
                </div>
              )}
              {sourceKind === "text" && (
                <div className="source-entry">
                  <label>
                    Paste a message, story, notes, poem or document excerpt
                  </label>
                  <textarea
                    rows={7}
                    maxLength={12000}
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Paste the material you want transformed into an original song…"
                  />
                  <small>
                    {sourceText.length.toLocaleString()}/12,000 characters
                  </small>
                </div>
              )}
              {sourceKind === "link" && (
                <div className="source-entry">
                  <label>Public webpage link</label>
                  <input
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://example.com/article"
                  />
                  <small>
                    Works with readable public HTTPS pages. Sign-in pages,
                    paywalls and blocked websites may require pasted text.
                  </small>
                </div>
              )}
              {sourceKind === "audio" && (
                <label className="upload-box">
                  <Upload />
                  <div>
                    <b>
                      {sourceFile
                        ? sourceFile.name
                        : "Upload audio to cover or remix"}
                    </b>
                    <span>
                      MP3, WAV or M4A · your melody, demo or finished track
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setSourceFile(e.target.files?.[0] || null)}
                  />
                </label>
              )}
              {custom && (
                <>
                  <div className="advanced-intro">
                    <b>Advanced is optional.</b>
                    <span>
                      Use only the controls that matter to you—Cantoa can decide
                      the rest.
                    </span>
                  </div>
                  <div className="advanced-grid">
                    <label>
                      Song title <em>optional</em>
                      <input
                        maxLength={80}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Cantoa can create one"
                      />
                      <small>{title.length}/80</small>
                    </label>
                    <label>
                      Style <em>optional</em>
                      <input
                        maxLength={200}
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        placeholder="e.g. soulful pop, warm piano, uplifting"
                      />
                      <small>
                        Use a short phrase—genre, mood and instruments.{" "}
                        {style.length}/200
                      </small>
                    </label>
                    <div className="wide prompt-chips">
                      <span>Style ideas</span>
                      {[
                        "Acoustic pop",
                        "Afrobeat",
                        "Cinematic",
                        "Dance pop",
                        "Indie folk",
                        "Punjabi pop",
                        "R&B",
                        "Surprise me",
                      ].map((x) => (
                        <button
                          key={x}
                          onClick={() =>
                            setStyle(
                              x === "Surprise me" ? "Auto — choose for me" : x,
                            )
                          }
                        >
                          {x}
                        </button>
                      ))}
                    </div>
                    <div className="wide style-profile-actions">
                      <button type="button" className={mySound ? "saved" : ""} onClick={saveMySound}>
                        <Heart /> {mySound ? "Update My Sound" : "Save My Sound"}
                      </button>
                      {mySound && (
                        <button type="button" onClick={applyMySound}>
                          <Sparkles /> Use My Sound
                        </button>
                      )}
                    </div>
                    <label>
                      Song language
                      <input
                        list="languages"
                        maxLength={60}
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        placeholder="Auto — follow my prompt"
                      />
                      <datalist id="languages">
                        {LANGUAGE_OPTIONS.map((x) => (
                          <option key={x} value={x} />
                        ))}
                      </datalist>
                      <small>Any language, dialect or mix. Type yours if it isn’t listed.</small>
                    </label>
                    <label>
                      Voice direction <em>optional</em>
                      <input
                        maxLength={120}
                        value={voice}
                        onChange={(e) => setVoice(e.target.value)}
                        placeholder="e.g. warm female lead"
                      />
                      <small>
                        Keep it simple: vocal character, age range or delivery.{" "}
                        {voice.length}/120
                      </small>
                    </label>
                    <div className="wide prompt-chips">
                      <span>Voice ideas</span>
                      {[
                        "Warm female lead",
                        "Expressive male lead",
                        "Youthful duet",
                        "Powerful choir",
                        "Soft intimate vocal",
                      ].map((x) => (
                        <button key={x} onClick={() => setVoice(x)}>
                          {x}
                        </button>
                      ))}
                    </div>
                    <label className="wide">
                      Your lyrics <em>optional</em>
                      <textarea
                        maxLength={8000}
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        rows={6}
                        placeholder="Paste finished lyrics here, or leave blank for Cantoa to write them. You can use [Verse], [Chorus] and [Bridge]…"
                      />
                      <small>
                        {lyrics.length.toLocaleString()}/8,000 characters
                      </small>
                    </label>
                  </div>
                  <details className="song-blueprint blueprint-details">
                    <summary>
                      <span><Sparkles /><b>Song Blueprint</b><small>Optional fine-tuning</small></span>
                      <ChevronDown />
                    </summary>
                    <div className="blueprint-body">
                      <div className="blueprint-heading compact">
                        <span>Shape the purpose, emotion and structure only when you want more control.</span>
                        <em>SMART BRIEF</em>
                      </div>
                      <div className="blueprint-grid">
                  <label>
                    Made for
                    <select
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                    >
                      {[
                        "Personal story",
                        "Birthday or celebration",
                        "Wedding or anniversary",
                        "Tribute or memorial",
                        "School or organization",
                        "Social media",
                        "Brand or jingle",
                        "Devotional or festival",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Emotional arc
                    <select
                      value={emotion}
                      onChange={(e) => setEmotion(e.target.value)}
                    >
                      {[
                        "Uplifting",
                        "Joyful and energetic",
                        "Intimate and heartfelt",
                        "Peaceful and reflective",
                        "Dramatic and cinematic",
                        "Playful and funny",
                        "Powerful and inspirational",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label className="wide">
                    Song journey
                    <select
                      value={structure}
                      onChange={(e) => setStructure(e.target.value)}
                    >
                      {[
                        "Verse · Chorus · Verse · Chorus · Bridge · Final chorus",
                        "Short intro · Hook-first · Verse · Hook · Outro",
                        "Story verse · Rising pre-chorus · Anthem chorus · Bridge",
                        "Instrumental opening · Theme A · Theme B · Finale",
                        "Let Cantoa choose the strongest structure",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                </div>
                    </div>
                  </details>
                  <button
                    className="fine-tune-toggle"
                    onClick={() => setFineTuneOpen((v) => !v)}
                  >
                    Fine-tune sound{" "}
                    <span>{fineTuneOpen ? "Hide" : "Optional"}</span>
                    <ChevronDown />
                  </button>
                  {fineTuneOpen && (
                    <div className="advanced-grid fine-tune">
                      <label className="wide">
                        Avoid these sounds <em>optional</em>
                        <input
                          maxLength={120}
                          value={exclude}
                          onChange={(e) => setExclude(e.target.value)}
                          placeholder="e.g. heavy autotune, trap drums"
                        />
                        <small>{exclude.length}/120</small>
                      </label>
                      <label>
                        Creative variation <b>{weirdness}%</b>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={weirdness}
                          onChange={(e) => setWeirdness(+e.target.value)}
                        />
                      </label>
                      <label>
                        How strongly should Cantoa follow this style? <b>{influence}%</b>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={influence}
                          onChange={(e) => setInfluence(+e.target.value)}
                        />
                      </label>
                    </div>
                  )}
                </>
              )}
              {!custom && (
                <label className="language-row">
                  Song language
                  <input
                    list="languages"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="Auto — follow my prompt"
                  />
                  <datalist id="languages">
                    {LANGUAGE_OPTIONS.map((x) => (
                      <option key={x} value={x} />
                    ))}
                  </datalist>
                  <small>
                    Choose any language, dialect or mix—from English and Hindi to Hinglish, Spanish, Arabic, Mandarin and many more. Don’t see yours? Just type it. Pronunciation quality may vary by music provider.
                  </small>
                </label>
              )}
              {mode === "vocals" && createMode === "advanced" && (
                <details className="advanced-language-panel">
                  <summary><span><Globe2 /><b>Multilingual & pronunciation controls</b><small>Section languages, blends and name pronunciation</small></span><ChevronDown /></summary>
                  <div className="advanced-language-body">
                    <details className="language-details">
                      <summary><Globe2 /> Browse language presets · 60+ options</summary>
                      <div className="language-detail-groups">
                        {LANGUAGE_GROUPS.map((group) => (
                          <div key={group.label}><b>{group.label}</b><span>{group.items.join(" · ")}</span></div>
                        ))}
                      </div>
                      <small>Presets are shortcuts, not limits. You can always type another language, dialect, regional variant or mix.</small>
                    </details>
                    <div className="language-advanced-tools">
                    <button type="button" className={sectionLanguageOpen ? "active" : ""} onClick={() => setSectionLanguageOpen((open) => !open)}>
                      <Globe2 /> {sectionLanguageOpen ? "Hide section language plan" : "Section language plan"}
                    </button>
                    {sectionLanguageOpen && (
                      <div className="section-language-grid">
                        {([ ["verse","Verses"], ["chorus","Choruses"], ["bridge","Bridge / outro"] ] as const).map(([key,label]) => (
                          <label key={key}>{label}
                            <input list="languages" value={sectionLanguages[key]} onChange={(e) => setSectionLanguages((current) => ({ ...current, [key]: e.target.value }))} placeholder="Follow song language" />
                          </label>
                        ))}
                        <div className="language-blend-presets">
                          <span>Quick blends</span>
                          {LANGUAGE_BLEND_PRESETS.map((preset) => <button key={preset.label} type="button" onClick={() => setSectionLanguages({ verse: preset.verse, chorus: preset.chorus, bridge: preset.bridge })}>{preset.label}</button>)}
                        </div>
                        <small>Set each section explicitly or type any language. Cantoa will carry the assignment into the song brief.</small>
                      </div>
                    )}
                  </div>
                  <label className="pronunciation-guide">
                    Pronunciation guide <em>optional</em>
                    <textarea
                      rows={2}
                      maxLength={1000}
                      value={pronunciation}
                      onChange={(e) => setPronunciation(e.target.value)}
                      placeholder={"Example: “Cantoa” = can-TOH-ah; “प्रगति” = pra-ga-ti"}
                    />
                    <small>Add a quick note, or use Pronunciation Studio for names and multilingual terms. {pronunciation.length}/1,000</small>
                  </label>
                  <div className="pronunciation-studio">
                    <button type="button" className={pronunciationStudioOpen ? "active" : ""} onClick={() => setPronunciationStudioOpen((open) => !open)}>
                      <Mic2 /> {pronunciationStudioOpen ? "Close Pronunciation Studio" : "Pronunciation Studio"}
                    </button>
                    {pronunciationStudioOpen && (
                      <div className="pronunciation-editor">
                        <div className="pronunciation-editor-heading"><b>Teach Cantoa important pronunciations</b><span>Target · how it should sound · where it matters</span></div>
                        {pronunciationEntries.map((entry) => (
                          <div className="pronunciation-entry" key={entry.id}>
                            <input aria-label="Word or name" value={entry.target} maxLength={80} onChange={(e) => updatePronunciationEntry(entry.id,"target",e.target.value)} placeholder="Name or word" />
                            <input aria-label="Pronunciation" value={entry.reading} maxLength={120} onChange={(e) => updatePronunciationEntry(entry.id,"reading",e.target.value)} placeholder="e.g. uh-NEE-kuh" />
                            <select aria-label="Song section" value={entry.section} onChange={(e) => updatePronunciationEntry(entry.id,"section",e.target.value)}><option>All vocals</option><option>Verse</option><option>Chorus</option><option>Bridge / outro</option></select>
                            <button type="button" aria-label="Remove pronunciation" onClick={() => removePronunciationEntry(entry.id)}><X /></button>
                          </div>
                        ))}
                        <button type="button" className="add-pronunciation" onClick={addPronunciationEntry}><Plus /> Add another term</button>
                        <small>Use the reading you actually want sung. Cantoa adds these instructions to the structured music brief.</small>
                      </div>
                    )}
                  </div>
                    <small className="provider-language-note">Final pronunciation and language rendering depend on the selected music provider.</small>
                  </div>
                </details>
              )}
              <div className="settings-row">
                <div>
                  <label>Output</label>
                  <div className="segmented">
                    <button
                      className={mode === "vocals" ? "active" : ""}
                      onClick={() => setMode("vocals")}
                    >
                      <Mic2 /> Vocals
                    </button>
                    <button
                      className={mode === "instrumental" ? "active" : ""}
                      onClick={() => setMode("instrumental")}
                    >
                      <Music2 /> Instrumental
                    </button>
                  </div>
                </div>
                {createMode === "advanced" && <div>
                  <label>Finish</label>
                  <div className="segmented">
                    <button
                      className={quality === "creative" ? "active" : ""}
                      onClick={() => setQuality("creative")}
                    >
                      Creative
                    </button>
                    <button
                      className={quality === "release" ? "active" : ""}
                      onClick={() => setQuality("release")}
                    >
                      <ShieldCheck /> Release-ready
                    </button>
                  </div>
                </div>}
              </div>
              {createMode === "advanced" && <div className="direction-choice">
                <div>
                  <b>Creative direction</b>
                  <span>
                    Choose how closely Cantoa should follow your brief.
                  </span>
                </div>
                <div className="segmented">
                  <button
                    className={creativeDirection === "faithful" ? "active" : ""}
                    onClick={() => { setCreativeDirection("faithful"); setBlendDirections(false); }}
                  >
                    Faithful
                  </button>
                  <button
                    className={creativeDirection === "bold" ? "active" : ""}
                    onClick={() => { setCreativeDirection("bold"); setBlendDirections(false); }}
                  >
                    Bold
                  </button>
                </div>
              </div>}
              <div className="length-control">
                <label>
                  Song length{" "}
                  <b>
                    {duration < 60
                      ? `${duration} sec`
                      : `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`}
                  </b>
                </label>
                <input
                  type="range"
                  min="15"
                  max="300"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(+e.target.value)}
                />
                <div>
                  {[30, 120, 180, 300].map((n) => (
                    <button key={n} onClick={() => setDuration(n)}>
                      {n < 60 ? `${n}s` : `${n / 60} min`}
                    </button>
                  ))}
                </div>
                <small>
                  Up to 5 minutes in one render—the current provider limit.
                </small>
                <p className="usage-preview">
                  <Music2 /> This generation uses{" "}
                  {Number((duration / 60).toFixed(2))} generation minute
                  {duration === 60 ? "" : "s"}. Planning and lyrics do not use
                  generation minutes.
                </p>
              </div>
              {sourceKind !== "audio" && (
                <div className="preview-option">
                  <button
                    className="preview-button"
                    disabled={previewing || generating}
                    onClick={generatePreviews}
                  >
                    <Play />{" "}
                    {previewing
                      ? "Creating two directions…"
                      : createMode === "quick"
                        ? "Not sure? Preview two directions"
                        : "Optional · compare two directions"}
                    <span>2 × 30 sec · uses 1 minute</span>
                  </button>
                  <small>
                    {createMode === "quick"
                      ? "Optional. Hear two short directions before committing to the full song."
                      : "Use this when you are unsure between a faithful version and a bolder interpretation. Skip it when your brief is already clear."}
                  </small>
                </div>
              )}
              {previews.length > 0 && (
                <section className="preview-compare">
                  <div className="preview-heading">
                    <b>Choose the stronger direction</b>
                    <span>
                      Your complete song will follow the selected approach.
                    </span>
                  </div>
                  <div>
                    {previews.map((item) => (
                      <article
                        className={
                          creativeDirection === item.direction ? "selected" : ""
                        }
                        key={item.id}
                      >
                        <p>{item.label}</p>
                        <span>{item.description}</span>
                        <audio controls src={item.url} />
                        <button
                          onClick={() => {
                            setCreativeDirection(item.direction);
                            setBlendDirections(false);
                            setMessage(
                              `${item.label} direction selected for the complete song.`,
                            );
                          }}
                        >
                          {creativeDirection === item.direction ? (
                            <>
                              <Check /> Selected
                            </>
                          ) : (
                            "Use this direction"
                          )}
                        </button>
                      </article>
                    ))}
                  </div>
                  <button
                    className={`blend-directions ${blendDirections ? "active" : ""}`}
                    onClick={() => {
                      setBlendDirections(true);
                      setMessage("Best of both selected. Cantoa will combine the faithful direction's clarity with the bold direction's strongest creative idea.");
                    }}
                  >
                    <Sparkles /> {blendDirections ? "Best of both selected" : "Blend the best of both"}
                  </button>
                </section>
              )}
              <button
                className="primary"
                disabled={
                  generating ||
                  previewing ||
                  (sourceKind === "audio" && !sourceFile) ||
                  (sourceKind === "text" && !sourceText.trim()) ||
                  (sourceKind === "link" && !sourceUrl.trim())
                }
                onClick={() => generateSong()}
              >
                {generating ? (
                  <>
                    <Music2 className="spin" /> Composing your song…
                  </>
                ) : (
                  <>
                    <Sparkles />{" "}
                    {intentPlan.soundtrack && videoSourceFile
                      ? "Score this video"
                      : sourceKind === "audio"
                        ? "Create remix"
                        : "Create complete song"}{" "}
                    <span>
                      {quality === "release" ? "STRUCTURED HQ" : "CREATIVE"}
                    </span>
                  </>
                )}
              </button>
              {message && <p className="error">{message}</p>}
              <p className="fineprint">
                A complete MP3 is generated from your description. Longer songs
                use more provider credits.
              </p>
            </section>
            <section className="membership" id="membership">
              <div className="membership-copy">
                <p>MEMBERSHIP</p>
                <h2>Start free. Upgrade when music becomes a habit.</h2>
                <span>
                  Ideas, lyrics and planning stay free. Only new AI-generated audio uses an allowance; downloads, gift pages and re-exports from an existing song do not.
                </span>
                <button onClick={() => setMembershipOpen(true)}>
                  Compare plans
                </button>
              </div>
              <div className="plan-cards compact">
                <article>
                  <b>Explore · Free</b>
                  <strong>2 creations</strong>
                  <span>Any 2 Moments · up to 2 min each</span>
                </article>
                <article className="featured">
                  <b>Creator · {pricing.creator.display}</b>
                  <strong>{pricing.creator.minutes} min</strong>
                  <span>New music generation each month</span>
                </article>
                <article className="studio">
                  <b>Studio · {pricing.studio.display}</b>
                  <strong>{pricing.studio.minutes} min</strong>
                  <span>For heavier creation and premium outputs</span>
                </article>
              </div>
            </section>
          </div>
        )}
        {view === "song" && song && (
          <div className="result-view">
            <button className="back" onClick={newSong}>
              <ArrowLeft /> Create another
            </button>
            <div className="result-grid">
              <div className="cover">
                <div className="cover-orb one" />
                <div className="cover-orb two" />
                <div className="cover-orb three" />
                <span>CANTOA ORIGINAL</span>
                <div>
                  <h2>{song.title}</h2>
                  <p>
                    {song.mode === "vocals"
                      ? "Original song · Vocals"
                      : "Original instrumental"}
                  </p>
                </div>
              </div>
              <div className="player-panel">
                <p>YOUR SONG IS READY</p>
                <h1>{song.title}</h1>
                <span className="song-prompt">{song.prompt}</span>
                {song.versionLabel && (
                  <span className="version-badge">{song.versionLabel}</span>
                )}
                <audio
                  ref={songAudio}
                  src={song.url}
                  onEnded={() => setPlaying(false)}
                />
                <div className="transport">
                  <button className="play" onClick={toggleSong}>
                    {playing ? <CircleStop /> : <Play />}
                  </button>
                  <div className="waveform">
                    {[
                      28, 48, 74, 42, 82, 58, 91, 38, 68, 85, 45, 76, 55, 88,
                      62, 36, 70, 94, 52, 79, 43, 65, 86, 47,
                    ].map((h, i) => (
                      <i key={i} style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <span>{Math.ceil(song.duration / 60)} min</span>
                </div>
                {cloudStatus && (
                  <div className={`cloud-status ${cloudSaveFailed ? "cloud-status-error" : ""}`}>
                    <ShieldCheck /> <span>{cloudStatus}</span>
                    {cloudSaveFailed && session && <button onClick={retryCloudSave}>Retry cloud save</button>}
                  </div>
                )}
                <div className="primary-actions">
                  <button onClick={() => setExportOpen((v) => !v)}>
                    <Download /> Download <ChevronDown />
                  </button>
                  <button onClick={polish}>
                    <ShieldCheck /> Create polished version
                  </button>
                  <button
                    className="share"
                    onClick={() => setShareOpen((v) => !v)}
                  >
                    <Share2 /> Share song
                  </button>
                </div>
                {exportOpen && (
                  <section className="export-panel">
                    <div className="export-song-summary">
                      <div className="export-song-art"><Music4 /></div>
                      <div><small>DOWNLOADING FROM</small><b>{song.title}</b><span>{song.mode === "vocals" ? "Original song · Vocals" : "Original instrumental"} · {Math.ceil(song.duration / 60)} min</span></div>
                    </div>
                    <div className="panel-heading">
                      <span>
                        <Download />
                      </span>
                      <div>
                        <b>Choose what to download</b>
                        <small>
                          Original-quality files and creator resources
                        </small>
                      </div>
                    </div>
                    <div className="export-grid">
                      <button onClick={download}>
                        <Music4 />
                        <span>
                          <b>MP3 audio</b>
                          <small>Complete song · ready to play</small>
                        </span>
                      </button>
                      <button onClick={exportStems}>
                        <Waves />
                        <span>
                          <b>{action || "Six stems ZIP · Creator"}</b>
                          <small>Vocals, drums, bass and more</small>
                        </span>
                      </button>
                      <button onClick={exportLyrics}>
                        <FileAudio />
                        <span>
                          <b>Lyrics TXT</b>
                          <small>Exact planned lyrics for this version</small>
                        </span>
                      </button>
                      <button onClick={exportWav} title="WAV export">
                        <Waves />
                        <span>
                          <b>
                            {action === "Creating WAV…" ? action : "PCM WAV · Creator"}
                          </b>
                          <small>Editing-compatible WAV conversion</small>
                        </span>
                      </button>
                    </div>
                  </section>
                )}
                {shareOpen && (
                  <section className="share-panel social">
                    <div className="panel-heading">
                      <span>
                        <Share2 />
                      </span>
                      <div>
                        <b>Share your song</b>
                        <small>
                          Share the audio file, or download it and open a destination
                        </small>
                      </div>
                    </div>
                    <button className="share-file" onClick={quickShare}>
                      <Send /> Share the audio file from this device
                    </button>
                    <div className="social-grid">
                      <button onClick={() => shareDestination("whatsapp")}>
                        <MessageCircle /> WhatsApp
                      </button>
                      <button onClick={() => shareDestination("facebook")}>
                        <AtSign /> Facebook
                      </button>
                      <button onClick={() => shareDestination("x")}>
                        <b className="xmark">𝕏</b> X
                      </button>
                      <button onClick={() => shareDestination("email")}>
                        <Mail /> Email
                      </button>
                      <button onClick={() => shareDestination("instagram")}>
                        <AtSign /> Instagram
                      </button>
                      <button onClick={() => shareDestination("tiktok")}>
                        <Video /> TikTok
                      </button>
                      <button onClick={() => shareDestination("youtube")}>
                        <Play /> YouTube
                      </button>
                    </div>
                    {shareStatus && (
                      <span className="share-note">{shareStatus}</span>
                    )}
                  </section>
                )}

              </div>
            </div>
            <div className="result-workflow">
              <section className="revision-studio">
                  <div>
                    <p>REVISION STUDIO</p>
                    <h3>Improve this version without overwriting it.</h3>
                    <span>
                      Every revision is saved as a new version. Your original
                      remains in the library.
                    </span>
                  </div>
                  <div className="revision-actions">
                    <button
                      onClick={() =>
                        reviseSong(
                          "Preserve the song but correct unclear pronunciation, improve lyrical intelligibility and keep the same emotional delivery.",
                          "Pronunciation fix",
                        )
                      }
                    >
                      Fix pronunciation
                    </button>
                    <button
                      onClick={() =>
                        reviseSong(
                          "Preserve the core song while creating a stronger, more memorable chorus with a satisfying return after the bridge.",
                          "Stronger chorus",
                        )
                      }
                    >
                      Strengthen chorus
                    </button>
                    <button
                      onClick={() =>
                        reviseSong(
                          "Preserve the song and create a natural extended final section with a decisive, non-abrupt ending.",
                          "Extended ending",
                        )
                      }
                    >
                      Extend ending
                    </button>
                    <button onClick={() => reviseSong("Preserve the song but make the lead vocal clearer, more intelligible and naturally present in the mix.", "Clearer vocals")}>Clearer vocals</button>
                    <button onClick={() => reviseSong("Preserve the lyrics and identity but increase energy, rhythmic drive and emotional lift, especially into each chorus.", "More energy")}>More energy</button>
                    <button onClick={() => reviseSong("Preserve the song while making the performance warmer, more intimate and emotionally moving without becoming sad unless the lyrics call for it.", "More emotional")}>More emotional</button>
                    <button onClick={() => reviseSong("Preserve the core song but shorten the introduction and reach the first memorable vocal or hook sooner.", "Shorter intro")}>Shorter intro</button>
                    <button
                      onClick={() =>
                        reviseSong(
                          "Create a clearly different arrangement of this song while preserving its lyrics, central melody and emotional identity.",
                          "Alternate arrangement",
                        )
                      }
                    >
                      Alternate arrangement
                    </button>
                  </div>
                  <div className="revision-custom">
                    <div className="revision-strength" aria-label="Revision strength">
                      <span>Change strength</span>
                      {(["subtle", "balanced", "bold"] as RevisionStrength[]).map((strength) => (
                        <button key={strength} className={revisionStrength === strength ? "active" : ""} onClick={() => setRevisionStrength(strength)}>
                          {strength[0].toUpperCase() + strength.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="revision-request">
                      <input
                        value={revisionNote}
                        maxLength={500}
                        onChange={(e) => setRevisionNote(e.target.value)}
                        placeholder='Tell Cantoa what to change — e.g. “keep everything, but make the chorus bigger and pronounce Anika clearly”'
                        onKeyDown={(e) => { if (e.key === "Enter") applyCustomRevision(); }}
                      />
                      <button onClick={applyCustomRevision} disabled={!revisionNote.trim()}><WandSparkles /> Make this better</button>
                    </div>
                    <small>Your original stays safe. Cantoa creates a linked new version.</small>
                  </div>
                </section>
                <div className="secondary-actions">
                  {song.id && (
                    <button
                      className="danger"
                      onClick={() => deleteSaved(song.id!)}
                    >
                      <Trash2 /> Delete from library
                    </button>
                  )}
                </div>
                <section className="v17-finish">
                  <div><b>Finish & Share</b><span>Package, document and share your finished song.</span></div>
                  <div className="v17-finish-actions">
                    <button className="finish-pack" onClick={exportCreatorPack} disabled={!!action}><Download /> Creator Pack 2.0</button>
                    <button className="finish-video" aria-label="15-sec Reel video" onClick={() => void renderSocialVideo("vertical")} disabled={socialVideoRendering || !song || !socialVideoSupported} title={!socialVideoSupported ? "Video rendering needs a browser with MediaRecorder and canvas capture support." : undefined}><Video /> {socialVideoRendering ? "Rendering video…" : socialVideoSupported ? "Create 15-sec Reel" : "Reel unavailable"}</button>
                    <button className="finish-video-alt" aria-label="Square social video" onClick={() => void renderSocialVideo("square")} disabled={socialVideoRendering || !song || !socialVideoSupported} title={!socialVideoSupported ? "Video rendering needs a browser with MediaRecorder and canvas capture support." : undefined}><Video /> {socialVideoSupported ? "Create square video" : "Square video unavailable"}</button>
                    {intentPlan.lyricVideo && <button className="finish-lyric-video" onClick={() => void renderSocialVideo("lyrics")} disabled={socialVideoRendering || !song || !socialVideoSupported}><Video /> Create lyric video</button>}
                    {memoryPhotos.length > 0 && <button className="finish-memory" onClick={() => void renderMemoryMovie()} disabled={memoryMovieRendering || !song || !socialVideoSupported}><Sparkles /> {memoryMovieRendering ? "Creating Memory Movie…" : "Create Memory Movie"}</button>}
                    {(momentId === "business" || intentPlan.jinglePack) && <button className="finish-jingle" onClick={() => void createJinglePack()} disabled={jinglePackBuilding || !song}><Building2 /> {jinglePackBuilding ? "Creating jingle pack…" : "Create 15/30/60 jingle pack"}</button>}
                    <button className="finish-record" onClick={exportRightsRecord}><ShieldCheck /> Creation record</button>
                    <button className="finish-gift" onClick={createGiftLink} disabled={shareCreating || accountInfo?.cloudConfigured === false}><Gift /> {shareCreating ? "Creating…" : accountInfo?.cloudConfigured === false ? "Gift page · cloud setup needed" : "Create gift page"}</button>
                    {publicShareUrl && <button className="finish-copy" onClick={() => {void navigator.clipboard?.writeText(publicShareUrl).then(() => notify("Share link copied")).catch(() => setMessage("Could not copy the share link in this browser."));}}><Copy /> Copy link</button>}
                    {publicShareUrl && <button className="finish-open" onClick={() => window.open(publicShareUrl,"_blank","noopener,noreferrer")}><ExternalLink /> Open gift page</button>}
                  </div>
                  {socialVideoUrl && (
                    <div className="social-video-preview">
                      <video src={socialVideoUrl} controls playsInline preload="metadata" />
                      <div><b>{socialVideoFormat === "vertical" ? "15-second Reel ready" : socialVideoFormat === "lyrics" ? "Lyric video ready" : "Square social video ready"}</b><span>Real video + song audio · WebM · full-screen safe layout</span><a href={socialVideoUrl} download={`${song?.title || "cantoa-song"}-${socialVideoFormat}.webm`}><Download /> Download video</a></div>
                    </div>
                  )}
                  {memoryMovieUrl && (
                    <div className="social-video-preview memory-movie-preview">
                      <video src={memoryMovieUrl} controls playsInline preload="metadata" />
                      <div><b>Memory Movie ready</b><span>{memoryPhotos.length} photo{memoryPhotos.length === 1 ? "" : "s"} + your song · WebM</span><a href={memoryMovieUrl} download={`${song?.title || "cantoa-song"}-memory-movie.webm`}><Download /> Download movie</a></div>
                    </div>
                  )}
                  {!socialVideoSupported && <small className="video-support-note">Social video rendering is unavailable in this browser. Chrome, Edge and Firefox provide the best support.</small>}
                  <small>Gift pages are opt-in. Creating one does not make your private library public.</small>
                </section>
                {message && <p className="error">{message}</p>}
                <div className="release-checklist">
                  <b>Before you publish</b>
                  <span>
                    <Check /> Lyrics and names sound correct
                  </span>
                  <span>
                    <Check /> Beginning and ending are clean
                  </span>
                  <span>
                    <Check /> No audible glitches or unwanted words
                  </span>
                  <span>
                    <Check /> You understand the provider’s commercial-use terms
                  </span>
                </div>
            </div>
          </div>
        )}
        {view === "library" && (
          <div className="library-view">
            <div className="library-heading">
              <div>
                <p>
                  {session
                    ? "YOUR PRIVATE CLOUD LIBRARY"
                    : "YOUR MUSIC · THIS DEVICE"}
                </p>
                <h1>Library</h1>
                <span>
                  {session
                    ? "Signed-in songs are backed up privately and can follow you across devices. Local copies remain available on this browser."
                    : "Completed songs stay in this browser. Sign in to enable private cloud backup and cross-device access."}
                </span>
              </div>
              <div className="library-heading-actions">
                {session && legacyLocalCount > 0 && (
                  <button onClick={claimLegacyLocalSongs}><Download /> Recover {legacyLocalCount} device-only</button>
                )}
                {!session && (
                  <button onClick={() => setAccountOpen(true)}>
                    <UserCircle /> Sign in to sync
                  </button>
                )}
                <button onClick={newSong}>
                  <Plus /> Create a song
                </button>
              </div>
            </div>
            {libraryLoading ? (
              <div className="library-empty">Loading your songs…</div>
            ) : library.length === 0 ? (
              <div className="library-empty">
                <Music2 />
                <h2>No saved songs yet</h2>
                <span>
                  Your completed songs will appear here automatically.
                </span>
              </div>
            ) : (
              <div className="library-grid">
                {library.map((item) => (
                  <article key={item.id}>
                    <button
                      className="library-cover"
                      onClick={() => openSaved(item)}
                    >
                      <Music2 />
                    </button>
                    <div>
                      <button
                        className="library-title"
                        onClick={() => openSaved(item)}
                      >
                        {item.title}
                      </button>
                      <span>
                        {item.versionLabel || "Original"} ·{" "}
                        {item.mode === "vocals" ? "Vocals" : "Instrumental"} ·{" "}
                        {Math.ceil(item.duration / 60)} min ·{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className="icon-delete"
                      aria-label={`Delete ${item.title}`}
                      onClick={() => deleteSaved(item.id)}
                    >
                      <Trash2 />
                    </button>
                  </article>
                ))}
              </div>
            )}
            {message && <p className="error">{message}</p>}
          </div>
        )}
        {membershipOpen && (
          <div
            className="modal-backdrop"
            role="presentation"
            onMouseDown={(e) => {
              if (e.currentTarget === e.target) setMembershipOpen(false);
            }}
          >
            <section
              className="membership-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="membership-title"
            >
              <button
                className="modal-close"
                aria-label="Close membership"
                onClick={() => setMembershipOpen(false)}
              >
                <X />
              </button>
              <div className="modal-heading">
                <p>MEMBERSHIP</p>
                <h2 id="membership-title">Start simple. Upgrade when you need more.</h2>
                <span>
                  Song setup, prompt editing and manual lyric editing are free. Provider-backed audio and premium production tools require an eligible account.
                </span>
              </div>
              <div className="membership-grid">
                <article className="selected">
                  <b>Explore</b>
                  <strong>US$0</strong>
                  <small>Try Cantoa first</small>
                  <ul>
                    <li>Build and customize before signing in</li>
                    <li><b>2 free music creations</b> · choose any two Moments · up to 2 minutes each</li>
                    <li>MP3 download, sharing and opt-in gift page</li>
                    <li>Multilingual + pronunciation controls</li>
                    <li>Private cloud library after sign-in</li>
                  </ul>
                  <button onClick={() => choosePlan("Explore")}>
                    <Check /> Current plan
                  </button>
                </article>
                <article className="recommended">
                  <em>RECOMMENDED</em>
                  <b>Creator</b>
                  <strong>
                    {pricing.creator.display} <i>/ month</i>
                  </strong>
                  <small>{pricing.creator.minutes} minutes of new AI music each month</small>
                  <div className="plan-fit">For gifts, creators & everyday music</div>
                  <ul>
                    <li><b>{pricing.creator.minutes} music-generation minutes</b> — used only when Cantoa creates new AI audio</li>
                    <li>Failed provider generations are restored automatically</li>
                    <li>Unlimited reasonable-use Reels, square videos, lyric videos, gift pages and re-exports from finished songs</li>
                    <li>Custom “Make it better” revisions + optional A/B / Best of Both</li>
                    <li>MP3 + WAV, Creator Pack 2.0 and My Sound</li>
                    <li>Stem separation where supported*</li>
                    <li>Commercial-use eligibility for qualifying paid generations*</li>
                  </ul>
                  <button onClick={() => choosePlan("Creator")}>
                    <Crown /> Subscribe securely
                  </button>
                </article>
                <article>
                  <b>Studio</b>
                  <strong>
                    {pricing.studio.display} <i>/ month</i>
                  </strong>
                  <small>{pricing.studio.minutes} minutes of new AI music each month</small>
                  <div className="plan-fit">For frequent creators, brands & bigger projects</div>
                  <ul>
                    <li><b>{pricing.studio.minutes} music-generation minutes</b> — 3× the Creator allowance</li>
                    <li>Everything in Creator</li>
                    <li>Failed provider generations are restored automatically</li>
                    <li>Unlimited reasonable-use Reels, square videos, lyric videos, gift pages and re-exports from finished songs</li>
                    <li>Memory Movie from up to 20 photos</li>
                    <li>15/30/60-second Business Jingle Packs</li>
                    <li>Stem separation where supported*</li>
                    <li>Commercial-use eligibility for qualifying paid generations*</li>
                  </ul>
                  <button onClick={() => choosePlan("Studio")}>
                    <Crown /> Subscribe securely
                  </button>
                </article>
              </div>
              {planMessage && <div className="plan-message">{planMessage}</div>}
              <p className="pricing-note">
                Cantoa uses Stripe for secure subscription checkout. Music-generation minutes are used only for successful new AI audio; failed provider generations are restored automatically. Reels, square videos, lyric videos, gift pages and re-exports made from an existing finished song do not use music minutes. India visitors automatically see and pay the regional ₹ price; other markets see the US$ price. Your final amount and currency are shown again before payment. *Stem availability and commercial-use eligibility depend on Cantoa’s provider terms and connected provider plan at the time of use.
              </p>
            </section>
          </div>
        )}
        {toastMessage && <div className="cantoa-toast" role="status">{toastMessage}</div>}
      <CantoaAccount
          open={accountOpen}
          onClose={() => setAccountOpen(false)}
          session={session}
          account={accountInfo}
        />
      </section>
    </main>
  );
}
