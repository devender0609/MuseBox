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
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type View = "create" | "song" | "library";
type VocalMode = "vocals" | "instrumental";
type SourceKind = "idea" | "text" | "link" | "audio";
type CreateMode = "quick" | "advanced";
type RevisionStrength = "subtle" | "balanced" | "bold";
type SmartRevisionAction = { label: string; prompt: string; versionLabel: string };
type PronunciationEntry = { id: string; target: string; reading: string; section: string };
type RememberedPronunciation = { id: string; target: string; reading: string; updatedAt: number };
type SavedPerson = { id: string; name: string; relationship: string; language: string; musicStyle: string; details: string; importantDate: string; updatedAt: number };
type SavedMoment = { id: string; title: string; kind: string; date: string; details: string; people: string; updatedAt: number };
type MyVoiceProfile = { id: string; voiceId: string; name: string; createdAt: number; provider: "elevenlabs" };
type MyVoiceUse = "intro" | "outro" | "message";
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

const STARTER_IDEAS = [
  {
    id: "birthday-mom",
    icon: "🎂",
    title: "Birthday song",
    description: "A heartfelt birthday song for someone special",
    prompt: "Create a warm and joyful birthday song for someone special, with personal-feeling lyrics, an uplifting chorus and a memorable emotional hook.",
    style: "Acoustic pop",
    emotion: "Joyful and energetic",
    language: "Auto — follow my prompt",
    duration: 120,
    mode: "vocals" as VocalMode,
    momentId: "birthday",
  },
  {
    id: "romantic-evening",
    icon: "♥",
    title: "Romantic evening",
    description: "A soft, cinematic song about love and togetherness",
    prompt: "Create a soft romantic evening song about love and togetherness, with intimate vocals, warm cinematic production and a chorus that feels memorable without becoming overly dramatic.",
    style: "Cinematic soul",
    emotion: "Intimate and heartfelt",
    language: "Auto — follow my prompt",
    duration: 180,
    mode: "vocals" as VocalMode,
    momentId: "someone",
  },
  {
    id: "motivation",
    icon: "☀️",
    title: "Motivation boost",
    description: "An uplifting song to keep going",
    prompt: "Create an uplifting motivational song about choosing courage, moving forward and believing in yourself, with a strong build and an energizing sing-along chorus.",
    style: "Pop",
    emotion: "Powerful and inspirational",
    language: "Auto — follow my prompt",
    duration: 120,
    mode: "vocals" as VocalMode,
    momentId: "anything",
  },
  {
    id: "family-memory",
    icon: "👨‍👩‍👧‍👦",
    title: "Family memory",
    description: "A warm song about family, memories and gratitude",
    prompt: "Create a warm family song about shared memories, gratitude and the little moments that make home feel special, with gentle verses and an easy chorus everyone can remember.",
    style: "Acoustic pop",
    emotion: "Uplifting",
    language: "Auto — follow my prompt",
    duration: 120,
    mode: "vocals" as VocalMode,
    momentId: "family",
  },
  {
    id: "reel",
    icon: "🎬",
    title: "Reel / video",
    description: "A short, catchy track for your next reel",
    prompt: "Create immediately engaging music for a short reel or video, with a strong hook in the first few seconds, modern production and a clean ending that is easy to edit around.",
    style: "Auto — choose for me",
    emotion: "Joyful and energetic",
    language: "Auto — follow my prompt",
    duration: 30,
    mode: "vocals" as VocalMode,
    momentId: "creator",
  },
  {
    id: "hindi-punjabi",
    icon: "🎵",
    title: "Hindi–Punjabi mix",
    description: "A fun bilingual song in Hindi & Punjabi",
    prompt: "Create a lively Hindi-Punjabi bilingual song with natural code-switching, a catchy modern hook and energetic production. Keep the language mix natural and easy to sing along with.",
    style: "Punjabi pop",
    emotion: "Joyful and energetic",
    language: "Punjabi + English",
    duration: 120,
    mode: "vocals" as VocalMode,
    momentId: "anything",
  },
] as const;

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


function smartRevisionActions(context: {
  momentId: string;
  mode: VocalMode;
  prompt: string;
  language: string;
  lyrics: string;
}): SmartRevisionAction[] {
  const combined = `${context.prompt} ${context.language} ${context.lyrics}`.toLocaleLowerCase();
  const multilingual = /hinglish|bilingual|mixed[- ]language|code[- ]switch|hindi.*english|english.*hindi|punjabi.*english|english.*punjabi|arabic.*english|english.*arabic|spanish.*english|english.*spanish|hindi.*spanish|spanish.*hindi/.test(combined);
  if (context.mode === "instrumental") {
    return [
      { label: "More energy", versionLabel: "More energy", prompt: "Preserve the musical identity but increase energy, rhythmic drive and lift without making the arrangement harsh or overcrowded." },
      { label: "Stronger ending", versionLabel: "Extended ending", prompt: "Preserve the instrumental but create a more satisfying final section with a deliberate, non-abrupt ending." },
      { label: "Fresh arrangement", versionLabel: "Alternate arrangement", prompt: "Create a clearly different arrangement while preserving the central mood, melodic identity and intended use." },
    ];
  }
  if (context.momentId === "business") {
    return [
      { label: "Hook sooner", versionLabel: "Shorter intro", prompt: "Preserve the brand identity and lyrics but reach the memorable hook sooner, ideally within the opening seconds." },
      { label: "Stronger hook", versionLabel: "Stronger chorus", prompt: "Preserve the message but make the central brand hook shorter, clearer and more memorable without becoming repetitive." },
      { label: "Clearer vocals", versionLabel: "Clearer vocals", prompt: "Preserve the song but make the lead vocal and key brand words clearer and more intelligible in the mix." },
    ];
  }
  if (multilingual) {
    return [
      { label: "Smoother language flow", versionLabel: "Language flow", prompt: "Preserve the meaning and song identity but make the multilingual transitions feel natural, idiomatic and musically intentional. Keep names and key phrases unchanged." },
      { label: "Fix pronunciation", versionLabel: "Pronunciation fix", prompt: "Preserve the song but improve pronunciation and intelligibility across all requested languages, especially names and code-switched phrases." },
      { label: "Stronger chorus", versionLabel: "Stronger chorus", prompt: "Preserve the languages, lyrics and story while making the chorus more memorable and emotionally satisfying." },
    ];
  }
  const devotional = /\bdevotional\b|\bbhajan\b|\bprayer(?:ful)?\b|\bspiritual\b|\bworship\b|\bmeditative\b|भक्ति|भजन|प्रार्थना/.test(combined);
  if (devotional) {
    return [
      { label: "More peaceful", versionLabel: "More peaceful", prompt: "Preserve the devotional identity, lyrics, names and melody while making the performance calmer, more prayerful and spacious without becoming sleepy or losing emotional warmth." },
      { label: "Stronger chorus", versionLabel: "Stronger chorus", prompt: "Preserve the devotional meaning and language while making the central refrain more memorable, singable and emotionally uplifting without sounding commercial or repetitive." },
      { label: "Clearer vocals", versionLabel: "Clearer vocals", prompt: "Preserve the song but make the lead vocal clearer, warmer and more intelligible so devotional words and names are easy to hear." },
    ];
  }
  if (["someone", "birthday", "wedding", "family", "graduation", "school"].includes(context.momentId)) {
    return [
      { label: "More emotional", versionLabel: "More emotional", prompt: "Preserve the story, names, lyrics and song identity while making the performance warmer, more personal and emotionally moving without becoming melodramatic." },
      { label: "Stronger chorus", versionLabel: "Stronger chorus", prompt: "Preserve the personal details and core song while creating a stronger, more memorable chorus with a satisfying return." },
      { label: "Clearer vocals", versionLabel: "Clearer vocals", prompt: "Preserve the song but make the lead vocal clearer, more intelligible and naturally present so personal names and key lines are easy to hear." },
    ];
  }
  return [
    { label: "Stronger chorus", versionLabel: "Stronger chorus", prompt: "Preserve the core song while creating a stronger, more memorable chorus with a satisfying return after the bridge." },
    { label: "More emotional", versionLabel: "More emotional", prompt: "Preserve the song while making the performance warmer, more expressive and emotionally engaging without changing its meaning." },
    { label: "Clearer vocals", versionLabel: "Clearer vocals", prompt: "Preserve the song but make the lead vocal clearer, more intelligible and naturally present in the mix." },
  ];
}

const palettes = [
  ["#7658ff", "#ed4b9a", "#ffb35c", "#65d9c4"],
  ["#195b8f", "#68b9d3", "#ffd36f", "#ee6c7a"],
  ["#a23e48", "#e58f65", "#f4d35e", "#4a7c59"],
];
function hash(value: string) {
  return [...value].reduce((n, c) => n + c.charCodeAt(0), 0);
}
function titleCaseWords(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^(?:AI|EDM|R&B|DJ)$/i.test(word)) return word.toUpperCase();
      if (/^hip-hop$/i.test(word)) return "Hip-Hop";
      return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
    })
    .join(" ");
}

function cleanCreativeBrief(prompt: string) {
  return prompt
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, ".")
    .trim()
    .replace(/^(?:please\s+)?(?:create|make|generate|write|compose|produce)\s+(?:me\s+|us\s+)?/i, "")
    .replace(/^an?\s+(?=(?:original\s+)?(?:song|track|piece|instrumental)\b)/i, "")
    .replace(/^original\s+/i, "")
    .replace(/\bhip[ -]?hop style\b/gi, "hip-hop")
    .replace(/\bhip hop\b/gi, "hip-hop")
    .trim();
}

function polishLyricTitleCandidate(value: string) {
  const weakTrailingWords = new Set(["a", "an", "and", "but", "for", "from", "in", "of", "or", "the", "this", "that", "to", "with"]);
  let words = value.split(/\s+/).filter(Boolean);

  // Hooks often repeat immediately (for example, “This is our land this is our land”).
  // Keep the first complete phrase rather than leaking the repeated opening word into the title.
  for (let start = 2; start < words.length; start += 1) {
    const prefixLength = Math.min(start, words.length - start);
    if (prefixLength >= 2) {
      const left = words.slice(0, prefixLength).join(" ").toLocaleLowerCase();
      const right = words.slice(start, start + prefixLength).join(" ").toLocaleLowerCase();
      if (left === right) {
        words = words.slice(0, start);
        break;
      }
    }
    if (words[start]?.toLocaleLowerCase() === words[0]?.toLocaleLowerCase() && start >= 3) {
      words = words.slice(0, start);
      break;
    }
  }

  while (words.length > 2 && weakTrailingWords.has(words.at(-1)!.toLocaleLowerCase())) words.pop();
  if (words.length < 2 || words.length > 8) return "";
  return titleCaseWords(words.slice(0, 6).join(" "));
}

function titleFromLyrics(lyrics?: string) {
  if (!lyrics?.trim()) return "";
  const lines = lyrics.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const chorusIndex = lines.findIndex((line) => /^\[(?:chorus|hook|refrain)\]$/i.test(line));
  const candidates = chorusIndex >= 0 ? lines.slice(chorusIndex + 1) : lines;
  const line = candidates.find((value) => !/^\[[^\]]+\]$/.test(value) && /\p{L}/u.test(value));
  if (!line) return "";
  const clause = line
    .replace(/^[\s\-–—]+|[\s\-–—]+$/g, "")
    .split(/[,;:–—.!?]/)[0]
    .replace(/^(?:oh|ooh|yeah|hey)\b[ ,!-]*/i, "")
    .trim();
  return polishLyricTitleCandidate(clause);
}

function titleFrom(prompt: string, lyrics?: string) {
  const lyricTitle = titleFromLyrics(lyrics);
  if (lyricTitle) return lyricTitle;
  const brief = cleanCreativeBrief(prompt);
  const lower = brief.toLocaleLowerCase();
  const has = (pattern: RegExp) => pattern.test(lower);

  // Prefer natural, consumer-facing titles for common Cantoa intents instead of
  // exposing the first few words of the user's instruction as a title.
  if (has(/\bpatriotic\b/) && has(/\bhip[- ]?hop\b/)) {
    const region = has(/\bindia(?:n)?\b|\bdesh\b|\bbharat\b/) ? "Indian " : "";
    return `${region}Patriotic Hip-Hop Anthem`;
  }
  if (has(/\bnavratri\b/)) return "Navratri Celebration";
  if (has(/\bbirthday\b/)) return "Birthday Celebration";
  if (has(/\bwedding\b/)) return "Wedding Day";
  if (has(/\banniversary\b/)) return "Anniversary Memories";
  if (has(/\bromantic\b/) && has(/\bevening\b|\bsunset\b|\bnight\b/)) return "Evening Romance";
  if (has(/\brelax(?:ing|ed)?\b|\bcalm\b|\bsoothing\b/) && has(/\bevening\b|\bsunset\b|\bnight\b/)) return "Evening Calm";

  const filler = new Set([
    "a", "an", "the", "original", "song", "music", "track", "piece", "style",
    "with", "and", "that", "should", "feel", "feels", "sung", "by", "vocals",
    "vocal", "voice", "singer", "create", "make", "generate", "write", "compose",
  ]);
  const words = brief
    .replace(/[^\p{L}\p{N}\s'&-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const meaningful = words.filter((word) => !filler.has(word.toLocaleLowerCase())).slice(0, 5);
  const candidate = meaningful.length ? meaningful.join(" ") : words.slice(0, 5).join(" ");
  return titleCaseWords(candidate) || "Untitled Song";
}

const INTERNAL_METADATA_INSTRUCTION = /transform (?:this|the|supplied) material|transform source material|create an original|generate (?:a|the) song|production intent|define the production|emotional direction|creative direction|cantoa quality gate|follow the selected|user requested|section-by-section language plan|pronunciation guide|word-preservation request|use these lyrics exactly|preserve proper names exactly/i;

function metadataSafeBrief(prompt: string) {
  const cleaned = cleanCreativeBrief(prompt);
  if (!cleaned) return "";
  const safeClauses = cleaned
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !INTERNAL_METADATA_INSTRUCTION.test(part));
  return safeClauses.join(" ").trim();
}

function descriptionFrom(prompt: string, generatedLyrics = "") {
  const safeBrief = metadataSafeBrief(prompt);
  const brief = safeBrief || cleanCreativeBrief(prompt);
  if (!brief) return "An original Cantoa creation.";
  // Metadata must never echo Cantoa/provider planning instructions. If every prompt
  // clause is internal, use only safe musical signals and (when available) lyric script.
  const metadataSource = safeBrief || generatedLyrics || "original song";
  const lower = metadataSource.toLocaleLowerCase();
  const has = (pattern: RegExp) => pattern.test(lower);

  const hindiSpanish = /(?:hindi.*spanish|spanish.*hindi)/.test(lower);
  const bilingual = hindiSpanish || /hinglish|bilingual|mixed[- ]language|code[- ]switch|hindi.*english|english.*hindi|punjabi.*english|english.*punjabi|arabic.*english|english.*arabic|spanish.*english|english.*spanish/.test(lower);
  const subject = has(/\bpatriotic\b/) && has(/\bhip[- ]?hop\b/)
    ? `${has(/\bindia(?:n)?\b|\bdesh\b|\bbharat\b/) ? "Indian " : ""}patriotic hip-hop anthem`
    : has(/\bdevotional\b|\bbhajan\b|\bprayer(?:ful)?\b|\bspiritual\b|\bworship\b/) ? "devotional song"
    : has(/\bbirthday\b/) ? "birthday song"
    : has(/\bwedding\b/) ? "wedding song"
    : has(/\banniversary\b/) ? "anniversary song"
    : has(/\binstrumental\b/) ? "instrumental track"
    : has(/\bhip[- ]?hop\b/) ? "hip-hop track"
    : has(/\bromantic\b|\blove\b/) ? "love song"
    : "original song";

  const qualities: string[] = [];
  const devotionalSubject = subject === "devotional song";
  if (has(/\b(?:powerful|bold|strong)\b/) && !devotionalSubject) qualities.push("bold");
  else if (has(/\b(?:high[- ]energy|energetic|upbeat|euphoric)\b/)) qualities.push("high-energy");
  else if (devotionalSubject) qualities.push("heartfelt");
  else if (has(/\b(?:romantic|intimate|heartfelt)\b/)) qualities.push("heartfelt");
  else if (has(/\b(?:relaxing|calm|soothing|dreamy)\b/)) qualities.push("relaxed");

  const details: string[] = [];
  if (hindiSpanish) details.push("a natural Hindi-Spanish blend");
  else if (bilingual) details.push("natural multilingual flow");
  const maleVoice = has(/\bmale\b.{0,30}\b(?:vocal|vocals|voice|singer)|\b(?:vocal|vocals|voice|singer)\b.{0,30}\bmale\b|\bsung by (?:a )?man\b|\bsang by (?:a )?male\b/);
  const femaleVoice = has(/\bfemale\b.{0,30}\b(?:vocal|vocals|voice|singer)|\b(?:vocal|vocals|voice|singer)\b.{0,30}\bfemale\b|\bsung by (?:a )?woman\b|\bsang by (?:a )?female\b/);
  if (maleVoice) {
    if (has(/\b(?:gentle|soft|warm|soothing|devotional|prayerful|peaceful)\b/)) details.push("warm male vocals");
    else if (has(/\b(?:powerful|bold|strong|high[- ]energy)\b/)) details.push("powerful male vocals");
    else details.push("expressive male vocals");
  } else if (femaleVoice) {
    if (has(/\b(?:gentle|soft|warm|soothing|devotional|prayerful|peaceful)\b/)) details.push("warm female vocals");
    else if (has(/\b(?:powerful|bold|strong|high[- ]energy)\b/)) details.push("powerful female vocals");
    else details.push("expressive female vocals");
  }
  if (has(/\bpunchy drums?\b/)) details.push("punchy drums");
  if (has(/\bdeep bass\b/)) details.push("deep bass");
  if (has(/\bcinematic\b/)) details.push("cinematic energy");
  else if (has(/\bacoustic\b/)) details.push("acoustic warmth");
  if (has(/\bdevotional\b|\bbhajan\b|\bprayer(?:ful)?\b|\bspiritual\b|\bworship\b/)) details.push("a peaceful, prayerful atmosphere");
  else if (has(/\bunity\b/)) details.push("an uplifting spirit of unity");
  else if (has(/\buplifting\b|\bproud\b/)) details.push("an uplifting atmosphere");

  const adjective = qualities.length ? `${qualities[0]} ` : "";
  const uniqueDetails = [...new Set(details)].slice(0, 4);
  if (uniqueDetails.length) {
    const detailText = uniqueDetails.length === 1
      ? uniqueDetails[0]
      : uniqueDetails.length === 2
        ? `${uniqueDetails[0]} and ${uniqueDetails[1]}`
        : `${uniqueDetails.slice(0, -1).join(", ")}, and ${uniqueDetails.at(-1)}`;
    return `A ${adjective}${subject} with ${detailText}.`;
  }

  // Hard-safe fallback: never expose internal planning/provider text as user-facing metadata.
  const compact = safeBrief
    .replace(/\bsang by a male\b/gi, "sung by a male vocalist")
    .replace(/\bsang by a female\b/gi, "sung by a female vocalist")
    .split(/[.!?]/)[0].split(/[,;]/).slice(0, 2).join(", ").trim();
  if (!compact || INTERNAL_METADATA_INSTRUCTION.test(compact)) {
    if (hindiSpanish) return "A bilingual Hindi-Spanish original with a natural, emotionally coherent flow.";
    if (/[\u0900-\u097F]/u.test(generatedLyrics)) return "An original song shaped around its lyrics, mood and musical character.";
    return "An original Cantoa song shaped around the requested mood, voice and musical character.";
  }
  const words = compact.split(/\s+/).filter(Boolean).slice(0, 18).join(" ");
  const sentence = words.replace(/\s+([,.;!?])/g, "$1").trim();
  return `${/^(?:a|an|the|music)\b/i.test(sentence) ? sentence : `A ${sentence}`}.`;
}


function looksLikeCreationInstruction(text: string) {
  const value = text.trim();
  if (!value) return false;
  const startsAsRequest = /^(?:please\s+)?(?:create|make|generate|write|compose|produce|turn|build|craft)\b/i.test(value);
  const directiveDensity = (value.match(/\b(?:should|use|keep|make|avoid|include|switch|alternate|sing|sung|vocals?|lyrics?|chorus|verse|instrumental|song|track|music|mood|style|language|hindi|spanish|english|punjabi|arabic)\b/gi) || []).length;
  const imperativePhrase = /\b(?:the lyrics should|make the chorus|keep the mood|avoid overly|use (?:soft|warm|gentle|powerful)|sung by|with .*vocals?)\b/i.test(value);
  return startsAsRequest || (directiveDensity >= 5 && imperativePhrase);
}

function canonicalUserBrief(prompt: string, sourceKind: SourceKind, sourceText: string) {
  const source = sourceText.trim();
  if (sourceKind === "text" && looksLikeCreationInstruction(source)) return source;
  return prompt.trim();
}

function inferNaturalLanguageMix(text: string): string | null {
  const value = text.toLocaleLowerCase();
  const pairs: Array<[RegExp, string]> = [
    [/\bhinglish\b|\bhindi\s*(?:[-/+&]|and)\s*english\b|\benglish\s*(?:[-/+&]|and)\s*hindi\b/i, "Hindi and English"],
    [/\bpunjabi\s*(?:[-/+&]|and)\s*english\b|\benglish\s*(?:[-/+&]|and)\s*punjabi\b/i, "Punjabi and English"],
    [/\barabic\s*(?:[-/+&]|and)\s*english\b|\benglish\s*(?:[-/+&]|and)\s*arabic\b/i, "Arabic and English"],
    [/\bspanish\s*(?:[-/+&]|and)\s*english\b|\benglish\s*(?:[-/+&]|and)\s*spanish\b/i, "Spanish and English"],
    [/\bhindi\s*(?:[-/+&]|and)\s*spanish\b|\bspanish\s*(?:[-/+&]|and)\s*hindi\b/i, "Hindi and Spanish"],
  ];
  for (const [pattern, label] of pairs) if (pattern.test(value)) return label;
  if (/\bbilingual\b|\bmixed[- ]language\b|\bcode[- ]switch/i.test(value)) return "the language mix requested in the prompt";
  return null;
}

function contextualShareText(songTitle: string, momentId: string, recipient: string, dedication: string) {
  const who = recipient.trim();
  const note = dedication.trim();
  if (["someone", "birthday", "wedding", "family", "graduation"].includes(momentId) || who) {
    return `${who ? `Made for ${who}: ` : "Made for a special moment: "}“${songTitle}”${note ? ` — ${note}` : ""}`;
  }
  if (momentId === "business") return `Listen to “${songTitle}” — an original brand music creation made with Cantoa.`;
  if (momentId === "creator") return `Listen to “${songTitle}” — original music made for this moment with Cantoa.`;
  return `Listen to “${songTitle},” created with Cantoa.`;
}

function inferPromptVoiceDirection(text: string): string | null {
  const value = text.toLowerCase();
  const duet = /\b(?:male|man|masculine)\b.{0,40}\b(?:female|woman|feminine)\b|\b(?:female|woman|feminine)\b.{0,40}\b(?:male|man|masculine)\b|\b(?:male\s*(?:and|&|\+)\s*female|female\s*(?:and|&|\+)\s*male|duet)\b/i;
  if (duet.test(value)) return "Male and female duet";
  const male = /\b(?:male|man|masculine|baritone|tenor)\b.{0,35}\b(?:voice|vocal|vocals|vocalist|singer|lead|singing)\b|\b(?:voice|vocal|vocals|vocalist|singer|lead|singing)\b.{0,35}\b(?:male|man|masculine|baritone|tenor)\b|\bsung\s+by\s+(?:a\s+)?(?:male|man)\b/i;
  if (male.test(value)) return "Male lead vocal";
  const female = /\b(?:female|woman|feminine|alto|soprano)\b.{0,35}\b(?:voice|vocal|vocals|vocalist|singer|lead|singing)\b|\b(?:voice|vocal|vocals|vocalist|singer|lead|singing)\b.{0,35}\b(?:female|woman|feminine|alto|soprano)\b|\bsung\s+by\s+(?:a\s+)?(?:female|woman)\b/i;
  if (female.test(value)) return "Female lead vocal";
  return null;
}


function culturalProductionHints(value: string) {
  const text = value.toLocaleLowerCase();
  const cues: string[] = [];
  if (/bollywood|hindi|hindustani|punjabi|bhangra|ghazal|qawwali|bhajan|devotional|india|indian/.test(text)) cues.push("South Asian cultural context: use idiomatic phrasing and musically appropriate rhythmic/instrumental color without caricature or imitation of a named artist.");
  if (/spanish|latin|latino|flamenco|salsa|bachata|reggaeton|mexic|caribbean/.test(text)) cues.push("Spanish/Latin cultural context: keep language idiomatic and use culturally coherent rhythmic or acoustic color only when it serves the brief.");
  if (/arabic|middle eastern|khaleeji|levant|oud|maqam/.test(text)) cues.push("Arabic/Middle Eastern cultural context: keep phrasing natural, respect pronunciation, and use regionally coherent musical color without stereotypes.");
  if (/african|afrobeats|amapiano|swahili|yoruba|igbo|zulu/.test(text)) cues.push("African musical context: preserve language authenticity and rhythmic identity without reducing the request to generic stereotypes.");
  if (/japanese|korean|mandarin|cantonese|thai|vietnamese/.test(text)) cues.push("East/Southeast Asian language context: prioritize native-sounding phrasing, clear diction and natural prosody over literal translation.");
  return cues.join(" ");
}

function inferMomentIdFromBrief(brief: string) {
  const value = brief.toLocaleLowerCase();
  const cues: Record<string, RegExp> = {
    someone: /for (?:my|someone)|someone special|dedicat|recipient/,
    birthday: /birthday|turns? \d+|celebrat/,
    wedding: /wedding|anniversary|vows?|bride|groom/,
    family: /family|mother|father|mom|dad|sister|brother|grandparent/,
    graduation: /graduat|commencement|class of/,
    creator: /reel|short-form|social video|tiktok|instagram|youtube short/,
    business: /brand|jingle|advertis|business|product|campaign/,
    school: /school|students?|teacher|campus|classroom|academy/,
    relax: /relax|ambient|sleep|meditat|spa|calm instrumental|study music/,
  };
  return MOMENTS.find((item) => item.id !== "anything" && cues[item.id]?.test(value))?.id || "anything";
}

function inferMomentFromBrief(brief: string) {
  return MOMENTS.find((item) => item.id === inferMomentIdFromBrief(brief))?.label || "Anything → music";
}

function inferStyleFromBrief(brief: string) {
  const value = brief.toLocaleLowerCase();
  const styles: Array<[RegExp, string]> = [
    [/hip[- ]?hop|rap/, "Hip-Hop"], [/afrobeat|afrobeats/, "Afrobeat"], [/amapiano/, "Amapiano"],
    [/acoustic/, "Acoustic"], [/cinematic/, "Cinematic"], [/indie/, "Indie"], [/pop/, "Pop"],
    [/rock/, "Rock"], [/jazz/, "Jazz"], [/r&b|rhythm and blues/, "R&B"], [/folk/, "Folk"],
    [/latin|salsa|bachata|reggaeton/, "Latin"], [/devotional|bhajan|worship|prayer/, "Devotional"],
    [/ambient|soundscape/, "Ambient"], [/electronic|edm|synth/, "Electronic"],
  ];
  return styles.find(([pattern]) => pattern.test(value))?.[1] || "Prompt-led";
}

function inferEmotionFromBrief(brief: string) {
  const value = brief.toLocaleLowerCase();
  const emotions: Array<[RegExp, string]> = [
    [/romantic|love|intimate|tender/, "Romantic and intimate"],
    [/hopeful|uplifting|inspir|triumph|courage/, "Hopeful and uplifting"],
    [/peaceful|calm|soothing|reflective|meditative/, "Peaceful and reflective"],
    [/joyful|happy|celebrat|party|energetic/, "Joyful and energetic"],
    [/devotional|prayer|worship|spiritual/, "Prayerful and devotional"],
    [/sad|melanchol|heartbreak|grief|somber/, "Reflective and emotional"],
    [/dramatic|epic|cinematic build/, "Dramatic and cinematic"],
  ];
  return emotions.find(([pattern]) => pattern.test(value))?.[1] || "Prompt-led";
}

function compactSmartCreateLabel(value: string) {
  return value
    .replace(/^Auto\s*[—-]\s*/i, "")
    .replace(/^follow my prompt$/i, "")
    .replace(/^choose for me$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}


function songDNAFrom(song: Song) {
  const brief = song.prompt.replace(/\s+/g, " ").trim();
  const inferredVoice = song.mode === "instrumental" ? "Instrumental" : inferPromptVoiceDirection(brief) || "Vocals follow the brief";
  const inferredMix = inferNaturalLanguageMix(brief) || "Follow the brief";
  return {
    moment: inferMomentFromBrief(brief),
    mode: song.mode,
    language: inferredMix,
    voice: inferredVoice,
    style: inferStyleFromBrief(brief),
    emotion: inferEmotionFromBrief(brief),
    identity: brief.slice(0, 420),
  };
}

function whyThisWorksFrom(song: Song) {
  const text = `${song.prompt} ${song.generatedLyrics || ""}`.toLocaleLowerCase();
  const notes: string[] = [];
  if (/chorus|hook|refrain/.test(text)) notes.push("The song is organized around a repeatable hook, which gives the listener a clear emotional anchor.");
  if (/hindi|spanish|punjabi|arabic|english|bilingual|multilingual/.test(text)) notes.push("Language and phrasing are treated as part of the musical identity rather than as a word-for-word translation exercise.");
  if (/romantic|love|heart|home|family|birthday|wedding|memory|devotional|prayer/.test(text)) notes.push("The arrangement is centered on the emotional purpose of the moment, so production choices support the story rather than compete with it.");
  if (song.mode === "instrumental") notes.push("The arrangement carries the emotional arc without relying on lyrics, keeping texture, pacing and dynamics in the foreground.");
  if (!notes.length) notes.push("The production brief keeps one clear musical identity while leaving enough room for a memorable arrangement.");
  return notes.slice(0, 3);
}

function friendlyGenerationError(raw: string) {
  const text = String(raw || "").replace(/\s+/g, " ").trim();
  const value = text.toLowerCase();
  if (/terms of service|policy|copyright|imitat|specific artist|artist style|protected style|moderation/.test(value)) {
    return "Try describing the mood, genre, instruments, vocal character, tempo or energy instead of asking to copy a specific artist, song or movie style.";
  }
  if (/quota_exceeded|quota exceeded|credit limit/.test(value)) {
    return "Cantoa's primary music connection is temporarily unavailable. Please try again in a moment; your generation allowance will not be lost if the request fails.";
  }
  if (/too many concurrent|concurrency|rate limit|429/.test(value)) {
    return "The music service is busy right now. Please wait a few seconds and try again.";
  }
  if (/api key|unauthorized|forbidden|permission|401|403/.test(value)) {
    return "Cantoa's music connection needs attention. Please try again shortly.";
  }
  if (text.startsWith("{") || text.length > 320) {
    return "The music provider could not complete this request. Try a slightly different description or try again.";
  }
  return text || "The song could not be created.";
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
    /(?:score|soundtrack|soundtrack this|music for|create music for|make music for|music that follows|music that follow|follows this|follow this|match|matches|sync|synced|synchronize|cinematic music).*\b(?:video|clip|reel|footage|scene|scenes|image|photo|picture)\b/.test(value)
    || /\b(?:video|clip|reel|footage|scene|scenes|image|photo|picture)\b.*(?:score|soundtrack|music|follow|follows|match|matches|sync|cinematic)/.test(value)
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
    soundtrack && "Auto-score media",
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


function audioFileInfo(blob: Blob) {
  const type = (blob.type || "").toLowerCase();
  if (type.includes("wav")) return { extension: "wav", type: "audio/wav" };
  if (type.includes("mp4") || type.includes("m4a") || type.includes("aac")) return { extension: "m4a", type: "audio/mp4" };
  return { extension: "mp3", type: "audio/mpeg" };
}

async function blobToDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not prepare embedded audio."));
    reader.readAsDataURL(blob);
  });
}

async function cantoaCoverJpeg(title: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const gradient = ctx.createLinearGradient(0, 0, 720, 720);
  gradient.addColorStop(0, "#3b1d54");
  gradient.addColorStop(0.5, "#d94f8f");
  gradient.addColorStop(1, "#f0a15b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 720, 720);
  ctx.globalAlpha = 0.33;
  [[160,160,120],[555,155,145],[390,520,170]].forEach(([x,y,r]) => {
    const g = ctx.createRadialGradient(x,y,5,x,y,r);
    g.addColorStop(0,"#fff"); g.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 190px system-ui, sans-serif";
  ctx.fillText("♫", 360, 300);
  ctx.font = "700 34px system-ui, sans-serif";
  const clipped = title.trim().slice(0, 34) || "Cantoa";
  ctx.fillText(clipped, 360, 530);
  ctx.font = "600 20px system-ui, sans-serif";
  ctx.fillText("CANTOA MUSIC", 360, 585);
  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
}

function synchsafe(value: number) {
  return new Uint8Array([(value >> 21) & 0x7f, (value >> 14) & 0x7f, (value >> 7) & 0x7f, value & 0x7f]);
}

async function wavWithCantoaArtwork(wav: Blob, title: string) {
  try {
    const cover = await cantoaCoverJpeg(title);
    if (!cover) return wav;
    const wavBytes = new Uint8Array(await wav.arrayBuffer());
    if (wavBytes.length < 12 || String.fromCharCode(...wavBytes.slice(0,4)) !== "RIFF") return wav;
    const image = new Uint8Array(await cover.arrayBuffer());
    const mime = new TextEncoder().encode("image/jpeg\0");
    const apicPayload = new Uint8Array(1 + mime.length + 1 + 1 + image.length);
    let o = 0;
    apicPayload[o++] = 0; // ISO-8859-1 description encoding
    apicPayload.set(mime, o); o += mime.length;
    apicPayload[o++] = 3; // front cover
    apicPayload[o++] = 0; // empty description
    apicPayload.set(image, o);
    const frame = new Uint8Array(10 + apicPayload.length);
    frame.set(new TextEncoder().encode("APIC"), 0);
    new DataView(frame.buffer).setUint32(4, apicPayload.length, false);
    frame.set(apicPayload, 10);
    const tag = new Uint8Array(10 + frame.length);
    tag.set(new TextEncoder().encode("ID3"), 0);
    tag[3] = 3; tag[4] = 0; tag[5] = 0;
    tag.set(synchsafe(frame.length), 6);
    tag.set(frame, 10);
    const pad = tag.length % 2;
    const chunk = new Uint8Array(8 + tag.length + pad);
    chunk.set(new TextEncoder().encode("id3 "), 0);
    new DataView(chunk.buffer).setUint32(4, tag.length, true);
    chunk.set(tag, 8);
    const out = new Uint8Array(wavBytes.length + chunk.length);
    out.set(wavBytes, 0); out.set(chunk, wavBytes.length);
    new DataView(out.buffer).setUint32(4, out.length - 8, true);
    return new Blob([out], { type: "audio/wav" });
  } catch {
    return wav;
  }
}

async function mp3WithCantoaArtwork(mp3: Blob, title: string) {
  try {
    const cover = await cantoaCoverJpeg(title);
    if (!cover) return mp3;
    const audio = new Uint8Array(await mp3.arrayBuffer());
    const image = new Uint8Array(await cover.arrayBuffer());
    const encoder = new TextEncoder();
    const mime = encoder.encode("image/jpeg\0");
    const apicPayload = new Uint8Array(1 + mime.length + 1 + 1 + image.length);
    let o = 0;
    apicPayload[o++] = 0;
    apicPayload.set(mime, o); o += mime.length;
    apicPayload[o++] = 3;
    apicPayload[o++] = 0;
    apicPayload.set(image, o);
    const apic = new Uint8Array(10 + apicPayload.length);
    apic.set(encoder.encode("APIC"), 0);
    new DataView(apic.buffer).setUint32(4, apicPayload.length, false);
    apic.set(apicPayload, 10);
    const titleBytes = encoder.encode(title.slice(0, 120));
    const tit2Payload = new Uint8Array(1 + titleBytes.length);
    tit2Payload[0] = 3;
    tit2Payload.set(titleBytes, 1);
    const tit2 = new Uint8Array(10 + tit2Payload.length);
    tit2.set(encoder.encode("TIT2"), 0);
    new DataView(tit2.buffer).setUint32(4, tit2Payload.length, false);
    tit2.set(tit2Payload, 10);
    const bodyLength = apic.length + tit2.length;
    const tag = new Uint8Array(10 + bodyLength);
    tag.set(encoder.encode("ID3"), 0);
    tag[3] = 3; tag[4] = 0; tag[5] = 0;
    tag.set(synchsafe(bodyLength), 6);
    tag.set(tit2, 10);
    tag.set(apic, 10 + tit2.length);
    const out = new Uint8Array(tag.length + audio.length);
    out.set(tag, 0);
    out.set(audio, tag.length);
    return new Blob([out.buffer], { type: "audio/mpeg" });
  } catch {
    return mp3;
  }
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
  const [momentId, setMomentId] = useState("anything");
  const [recipient, setRecipient] = useState("");
  const [personalDetails, setPersonalDetails] = useState("");
  const [dedication, setDedication] = useState("");
  const [publicShareUrl, setPublicShareUrl] = useState("");
  const [shareCreating, setShareCreating] = useState(false);
  const [prompt, setPrompt] = useState("");
  // Provider-facing context for derived Cantoa Moments flows. This stays out of the visible prompt
  // so users see a simple creative brief while Cantoa preserves the useful song identity underneath.
  const [derivedContext, setDerivedContext] = useState("");
  const [mode, setMode] = useState<VocalMode>("vocals");
  const [duration, setDuration] = useState(120);
  const [lyrics, setLyrics] = useState("");
  const [quickLyricsOpen, setQuickLyricsOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [style, setStyle] = useState("Auto — follow my prompt");
  const [language, setLanguage] = useState("Auto — follow my prompt");
  const [voice, setVoice] = useState("Auto — follow my prompt");
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
  const [visualScoreFile, setVisualScoreFile] = useState<File | null>(null);
  const [turnAnythingOpen, setTurnAnythingOpen] = useState(false);
  const [starterIdeasExpanded, setStarterIdeasExpanded] = useState(false);
  const [smartDirection, setSmartDirection] = useState<"heartfelt" | "cinematic" | "fun" | null>(null);
  type SourcePanel = "story" | "website" | "photo" | "video";
  const [activeSourcePanel, setActiveSourcePanel] = useState<SourcePanel | null>(null);
  const [storyInterview, setStoryInterview] = useState({ story: "", vibe: "" });
  const [action, setAction] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [singAlongOpen, setSingAlongOpen] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [backingTrackBlob, setBackingTrackBlob] = useState<Blob | null>(null);
  const [backingTrackStatus, setBackingTrackStatus] = useState<"idle" | "building" | "ready" | "error">("idle");
  const [karaokeBuilding, setKaraokeBuilding] = useState(false);
  const [instrumentalBuilding, setInstrumentalBuilding] = useState(false);
  const [sixStemStatus, setSixStemStatus] = useState<"idle" | "building" | "ready" | "error">("idle");
  type SongExportSession = {
    songId: string;
    providerQueue: Promise<void>;
    twoStemArchive?: Blob;
    twoStemPromise?: Promise<Blob>;
    backingBlob?: Blob;
    backingPromise?: Promise<Blob>;
    sixStemArchive?: Blob;
    sixStemPromise?: Promise<Blob>;
  };
  const exportSessionRef = useRef<SongExportSession | null>(null);
  // Compatibility refs used by the existing UI; the authoritative cache is exportSessionRef.
  const backingTrackPromiseRef = useRef<Promise<Blob> | null>(null);
  const backingTrackBlobRef = useRef<Blob | null>(null);
  const backingTrackSourceRef = useRef<Blob | null>(null);
  const sixStemArchiveRef = useRef<Blob | null>(null);
  const sixStemPromiseRef = useRef<Promise<Blob> | null>(null);
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
  const downloadClickGuardUntilRef = useRef(0);
  const armDownloadClickGuard = () => {
    // Chrome/Edge can dismiss the browser download flyout on the first click and deliver
    // the second half of a double-click to the web page underneath. Ignore trusted pointer
    // events briefly after a download starts so that click-through cannot open Account,
    // Membership, or trigger another Cantoa action. Synthetic anchor clicks remain allowed.
    downloadClickGuardUntilRef.current = Date.now() + 1100;
  };
  const openAccountPanel = () => {
    if (Date.now() < downloadClickGuardUntilRef.current) return;
    setAccountOpen(true);
  };
  const openMembershipPanel = () => {
    if (Date.now() < downloadClickGuardUntilRef.current) return;
    setMembershipOpen(true);
  };
  useEffect(() => {
    const blockDownloadFlyoutClickThrough = (event: Event) => {
      if (!event.isTrusted || Date.now() >= downloadClickGuardUntilRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      if ('stopImmediatePropagation' in event) event.stopImmediatePropagation();
    };
    document.addEventListener('pointerdown', blockDownloadFlyoutClickThrough, true);
    document.addEventListener('click', blockDownloadFlyoutClickThrough, true);
    document.addEventListener('dblclick', blockDownloadFlyoutClickThrough, true);
    return () => {
      document.removeEventListener('pointerdown', blockDownloadFlyoutClickThrough, true);
      document.removeEventListener('click', blockDownloadFlyoutClickThrough, true);
      document.removeEventListener('dblclick', blockDownloadFlyoutClickThrough, true);
    };
  }, []);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (accountOpen) setAccountOpen(false);
      if (membershipOpen) setMembershipOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [accountOpen, membershipOpen]);
  const { session, ready: sessionReady, configured: accountConfigured } = useCantoaSession();
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
  const [rememberedPronunciations, setRememberedPronunciations] = useState<RememberedPronunciation[]>([]);
  const [savedPeople, setSavedPeople] = useState<SavedPerson[]>([]);
  const [savedMoments, setSavedMoments] = useState<SavedMoment[]>([]);
  const [myVoiceOpen, setMyVoiceOpen] = useState(false);
  const [myVoiceProfiles, setMyVoiceProfiles] = useState<MyVoiceProfile[]>([]);
  const [myVoiceLimit, setMyVoiceLimit] = useState(0);
  const [myVoiceName, setMyVoiceName] = useState("My Voice");
  const [myVoiceConsent, setMyVoiceConsent] = useState(false);
  const [myVoiceSample, setMyVoiceSample] = useState<File | Blob | null>(null);
  const [myVoiceSampleName, setMyVoiceSampleName] = useState("");
  const [myVoiceCreating, setMyVoiceCreating] = useState(false);
  const [myVoiceRecording, setMyVoiceRecording] = useState(false);
  const [myVoiceRecordSeconds, setMyVoiceRecordSeconds] = useState(0);
  const myVoiceRecordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [myVoicePreviewingId, setMyVoicePreviewingId] = useState<string | null>(null);
  const [myVoiceSelectedId, setMyVoiceSelectedId] = useState<string | null>(null);
  const [myVoiceUse, setMyVoiceUse] = useState<MyVoiceUse>("intro");
  const [myVoiceCombining, setMyVoiceCombining] = useState(false);
  const [myVoiceText, setMyVoiceText] = useState("A special message, made with love in my own voice.");
  const myVoiceRecorderRef = useRef<MediaRecorder | null>(null);
  const myVoiceChunksRef = useRef<Blob[]>([]);
  const [peopleMomentsOpen, setPeopleMomentsOpen] = useState(false);
  const [peopleMomentsTab, setPeopleMomentsTab] = useState<"people" | "moments">("people");
  const [personDraft, setPersonDraft] = useState({ name: "", relationship: "", language: "", musicStyle: "", details: "", importantDate: "" });
  const [momentDraft, setMomentDraft] = useState({ title: "", kind: "", date: "", details: "", people: "" });
  const [pronunciationFixOpen, setPronunciationFixOpen] = useState(false);
  const [resultLyricLines, setResultLyricLines] = useState<string[]>([]);
  const [resultPronunciationTarget, setResultPronunciationTarget] = useState("");
  const [resultPronunciationReading, setResultPronunciationReading] = useState("");
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
  const [emotionLock, setEmotionLock] = useState(false);
  const [momentLabOpen, setMomentLabOpen] = useState(false);
  const [bestClipOffset, setBestClipOffset] = useState<number | null>(null);
  const [groupCollectUrl, setGroupCollectUrl] = useState("");
  const [groupContributionCount, setGroupContributionCount] = useState(0);
  const [groupVoteCount, setGroupVoteCount] = useState(0);
  const [groupStatusLoading, setGroupStatusLoading] = useState(false);
  const [secretDropAt, setSecretDropAt] = useState("");
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
  const [comparePlayingId, setComparePlayingId] = useState<string | null>(null);
  const [comparePosition, setComparePosition] = useState(0);
  const [preferredVersionId, setPreferredVersionId] = useState<string | null>(null);
  const compareAudio = useRef<HTMLAudioElement | null>(null);
  const compareObjectUrls = useRef<Map<string, string>>(new Map());
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryFilter, setLibraryFilter] = useState<"all" | "vocal" | "instrumental" | "revised">("all");
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
    const replyToken = params.get("reply");
    if (requestedMoment && MOMENTS.some((item) => item.id === requestedMoment)) {
      const item = MOMENTS.find((candidate) => candidate.id === requestedMoment)!;
      setMomentId(item.id); setOccasion(item.occasion); setEmotion(item.emotion); setStyle(item.style); setPrompt(requestedPrompt?.trim() || item.prompt);
    } else if (requestedPrompt?.trim()) {
      setPrompt(requestedPrompt.trim());
    } else if (replyToken) {
      setMomentId("someone");
      setOccasion("Song reply");
      setEmotion("Intimate and heartfelt");
      setStyle("Auto — choose for me");
      setPrompt("Create an original song reply to a Cantoa song someone shared with me. Respond to the feeling and relationship behind their song without copying its lyrics or melody. I will add what I want to say back.");
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
        mode: item.mode === "instrumental" && Boolean(item.lyrics_url) ? "vocals" : item.mode,
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
  useEffect(() => {
    if (!sessionReady) return;
    const userId = session?.user?.id || "guest";
    const localKey = `cantoa-pronunciation-memory:${userId}`;
    let localItems: RememberedPronunciation[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(localKey) || "[]");
      if (Array.isArray(parsed)) localItems = parsed.filter((item) => item?.target && item?.reading).slice(0, 100);
    } catch {}
    const cloudItems = Array.isArray(session?.user?.user_metadata?.cantoa_pronunciations)
      ? (session!.user.user_metadata.cantoa_pronunciations as RememberedPronunciation[]).filter((item) => item?.target && item?.reading).slice(0, 100)
      : [];
    const merged = new Map<string, RememberedPronunciation>();
    [...localItems, ...cloudItems].forEach((item) => {
      const key = String(item.target).trim().toLocaleLowerCase();
      const prior = merged.get(key);
      if (!prior || Number(item.updatedAt || 0) >= Number(prior.updatedAt || 0)) merged.set(key, { ...item, target: String(item.target).trim(), reading: String(item.reading).trim() });
    });
    const values = [...merged.values()].sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 100);
    setRememberedPronunciations(values);
    try { localStorage.setItem(localKey, JSON.stringify(values)); } catch {}
  }, [sessionReady, session?.user?.id]);
  useEffect(() => {
    if (!sessionReady) return;
    const userId = session?.user?.id || "guest";
    let localPeople: SavedPerson[] = [];
    let localMoments: SavedMoment[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(`cantoa-people-moments:${userId}`) || "{}");
      if (Array.isArray(parsed?.people)) localPeople = parsed.people.filter((item: SavedPerson) => item?.name).slice(0, 50);
      if (Array.isArray(parsed?.moments)) localMoments = parsed.moments.filter((item: SavedMoment) => item?.title).slice(0, 50);
    } catch {}
    const cloudPeople = Array.isArray(session?.user?.user_metadata?.cantoa_people)
      ? (session!.user.user_metadata.cantoa_people as SavedPerson[]).filter((item) => item?.name).slice(0, 50) : [];
    const cloudMoments = Array.isArray(session?.user?.user_metadata?.cantoa_moments)
      ? (session!.user.user_metadata.cantoa_moments as SavedMoment[]).filter((item) => item?.title).slice(0, 50) : [];
    const merge = <T extends { id: string; updatedAt: number }>(localItems: T[], cloudItems: T[]) => {
      const items = new Map<string, T>();
      [...localItems, ...cloudItems].forEach((item) => {
        const prior = items.get(item.id);
        if (!prior || Number(item.updatedAt || 0) >= Number(prior.updatedAt || 0)) items.set(item.id, item);
      });
      return [...items.values()].sort((a,b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
    };
    setSavedPeople(merge(localPeople, cloudPeople));
    setSavedMoments(merge(localMoments, cloudMoments));
  }, [sessionReady, session?.user?.id]);
  useEffect(() => {
    if (!song) { setPronunciationFixOpen(false); setResultLyricLines([]); return; }
    setPronunciationFixOpen(false);
    setResultLyricLines((song.generatedLyrics || "").split(/\r?\n/));
    setResultPronunciationTarget("");
    setResultPronunciationReading("");
  }, [song?.id, song?.createdAt]);
  const effectiveUserBrief = useMemo(() => canonicalUserBrief(prompt, sourceKind, sourceText), [prompt, sourceKind, sourceText]);
  const intentPlan = useMemo(() => inferIntentPlan(`${effectiveUserBrief}\n${personalDetails}\n${dedication}`, momentId, memoryPhotos.length, Boolean(videoSourceFile || visualScoreFile)), [effectiveUserBrief, personalDetails, dedication, momentId, memoryPhotos.length, videoSourceFile, visualScoreFile]);
  const smartCreateChips = useMemo(() => {
    const brief = `${effectiveUserBrief} ${personalDetails} ${dedication}`.trim();
    const chips: string[] = [];
    const momentLabel = MOMENTS.find((item) => item.id === momentId)?.label || inferMomentFromBrief(brief);
    if (momentLabel && momentLabel !== "Anything → music") chips.push(momentLabel);

    const explicitStyle = compactSmartCreateLabel(style);
    const inferredStyle = inferStyleFromBrief(brief);
    const styleLabel = explicitStyle || (inferredStyle !== "Prompt-led" ? inferredStyle : "");
    if (styleLabel) chips.push(styleLabel);

    const explicitEmotion = compactSmartCreateLabel(emotion);
    const inferredEmotion = inferEmotionFromBrief(brief);
    const emotionLabel = smartDirection === "heartfelt" ? "Heartfelt" : smartDirection === "cinematic" ? "Cinematic" : smartDirection === "fun" ? "Fun" : inferredEmotion !== "Prompt-led" ? inferredEmotion : (momentId !== "anything" ? explicitEmotion : "");
    if (emotionLabel) chips.push(emotionLabel);

    const explicitLanguage = compactSmartCreateLabel(language);
    const inferredLanguage = inferNaturalLanguageMix(brief) || "";
    const languageLabel = explicitLanguage || inferredLanguage;
    if (languageLabel) chips.push(languageLabel);

    if (videoSourceFile) chips.push("Video soundtrack");
    else if (visualScoreFile || memoryPhotos.length) chips.push("Visual inspiration");
    else if (sourceKind === "link" && sourceUrl.trim()) chips.push("Webpage");
    else if (sourceMode && sourceFile) chips.push("Audio reference");

    chips.push(mode === "instrumental" ? "Instrumental" : "Vocals");
    return Array.from(new Set(chips)).slice(0, 4);
  }, [effectiveUserBrief, personalDetails, dedication, momentId, style, emotion, language, smartDirection, videoSourceFile, visualScoreFile, memoryPhotos.length, sourceKind, sourceUrl, sourceMode, sourceFile, mode]);
  const suggestedRevisionActions = useMemo(() => {
    if (song) {
      return smartRevisionActions({
        momentId: inferMomentIdFromBrief(song.prompt),
        mode: song.mode,
        prompt: song.prompt,
        language: inferNaturalLanguageMix(song.prompt) || "Auto — follow my prompt",
        lyrics: song.generatedLyrics || "",
      });
    }
    return smartRevisionActions({ momentId, mode, prompt: effectiveUserBrief, language, lyrics });
  }, [song, momentId, mode, effectiveUserBrief, language, lyrics]);
  const resultIntentPlan = useMemo(() => song ? inferIntentPlan(song.prompt, inferMomentIdFromBrief(song.prompt), 0, false) : intentPlan, [song, intentPlan]);
  const activeMoment = MOMENTS.find((item) => item.id === momentId) || MOMENTS[0];
  const filteredLibrary = useMemo(() => {
    const query = libraryQuery.trim().toLowerCase();
    return library.filter((item) => {
      const matchesQuery = !query || `${item.title} ${item.prompt} ${item.versionLabel || ""}`.toLowerCase().includes(query);
      const itemHasVocals = item.mode === "vocals" || Boolean(item.generatedLyrics?.trim()) || Boolean(item.remoteLyricsUrl);
      const matchesFilter = libraryFilter === "all"
        || (libraryFilter === "vocal" && itemHasVocals)
        || (libraryFilter === "instrumental" && !itemHasVocals)
        || (libraryFilter === "revised" && Boolean(item.parentId));
      return matchesQuery && matchesFilter;
    });
  }, [library, libraryQuery, libraryFilter]);
  const versionFamily = useMemo(() => {
    if (!song?.id) return [] as SavedSong[];
    const byId = new Map(library.map((item) => [item.id, item]));
    if (!byId.has(song.id)) {
      byId.set(song.id, {
        id: song.id, title: song.title, prompt: song.prompt, mode: song.mode, duration: song.duration,
        createdAt: song.createdAt || Date.now(), blob: song.blob, parentId: song.parentId,
        versionLabel: song.versionLabel || (song.parentId ? "Revised version" : "Original"), generatedLyrics: song.generatedLyrics,
        ownerId: session?.user?.id,
      });
    }
    const connected = new Set<string>([song.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of byId.values()) {
        if (connected.has(item.id)) continue;
        if ((item.parentId && connected.has(item.parentId)) || Array.from(connected).some((id) => byId.get(id)?.parentId === item.id)) {
          connected.add(item.id); changed = true;
        }
      }
    }
    const family = Array.from(connected).map((id) => byId.get(id)!).filter(Boolean);
    const originals = family.filter((item) => !item.parentId).sort((a,b) => a.createdAt-b.createdAt);
    const revisions = family.filter((item) => item.parentId).sort((a,b) => a.createdAt-b.createdAt);
    if (originals.length) return [originals[0], ...revisions.slice(-2)];
    return revisions.slice(-3);
  }, [library, song, session?.user?.id]);
  const versionFamilyKey = versionFamily.find((item) => !item.parentId)?.id || versionFamily[0]?.id || song?.id || "song";
  const freeCreationsRemaining = accountInfo?.plan === "Explore" ? (accountInfo.freeSongsRemaining ?? 2) : 2;
  const showFreeOffer = !accountInfo || accountInfo.plan === "Explore";
  // All exported Cantoa videos carry visible branding, regardless of plan.
  const showExportBranding = true;

  useEffect(() => {
    const urls = memoryPhotos.map((file) => URL.createObjectURL(file));
    setMemoryPhotoUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [memoryPhotos]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const staleAuthKeys = ["error", "error_code", "error_description"];
    let changed = false;
    for (const key of staleAuthKeys) {
      if (url.searchParams.has(key)) { url.searchParams.delete(key); changed = true; }
    }
    if (changed) window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const authorizeFeature = useCallback(async (feature: CantoaFeature, options?: { openMembership?: boolean }) => {
    if (!sessionReady) {
      setMessage("Checking your Cantoa account…");
      return false;
    }
    if (!session) {
      // Do not force-open the account modal from a download/feature action. The user can open
      // Account explicitly; this also prevents transient auth checks from covering the song page.
      setMessage("Sign in to use this feature.");
      return false;
    }
    if (accountInfo?.plan && planAllowsFeature(accountInfo.plan, feature)) return true;
    try {
      const response = await fetch("/api/feature-access", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ feature }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.allowed) {
        if (options?.openMembership !== false) setMembershipOpen(true);
        setMessage(`${data.minimumPlan || "Creator"} membership includes this feature.`);
        return false;
      }
      return true;
    } catch { setMessage("Cantoa could not verify feature access. Try again."); return false; }
  }, [session, sessionReady, accountInfo?.plan]);

  const completePrompt = useMemo(() => {
    const structuredPronunciation = pronunciationEntries
      .filter((entry) => entry.target.trim() && entry.reading.trim())
      .map((entry) => `${entry.section}: “${entry.target.trim()}” → ${entry.reading.trim()}`)
      .join("\n");
    const pronunciationSearchText = `${effectiveUserBrief}\n${lyrics}\n${sourceText}\n${recipient}\n${personalDetails}\n${dedication}`.toLocaleLowerCase();
    const rememberedGuide = rememberedPronunciations
      .filter((entry) => pronunciationSearchText.includes(entry.target.toLocaleLowerCase()))
      .slice(0, 20)
      .map((entry) => `Remembered pronunciation: “${entry.target}” → ${entry.reading}`)
      .join("\n");
    const sectionLanguagePlan = [
      sectionLanguages.verse.trim() && `Verses: ${sectionLanguages.verse.trim()}`,
      sectionLanguages.chorus.trim() && `Choruses: ${sectionLanguages.chorus.trim()}`,
      sectionLanguages.bridge.trim() && `Bridge/outro: ${sectionLanguages.bridge.trim()}`,
    ].filter(Boolean).join("; ");
    const advancedMode = createMode === "advanced";
    const promptVoice = mode === "instrumental" ? null : inferPromptVoiceDirection(effectiveUserBrief);
    const naturalLanguageMix = inferNaturalLanguageMix(effectiveUserBrief);
    // Voice direction is an Advanced-only control. In Create mode, only explicit
    // wording in the current prompt may constrain the singer; stale Advanced/My Sound
    // state must never silently override a fresh Create request.
    const selectedVoice = advancedMode && voice.trim() && !/^auto\b/i.test(voice.trim()) ? voice.trim() : null;
    const effectiveVoice = mode === "instrumental"
      ? "none, instrumental"
      : promptVoice || selectedVoice || "follow the user’s prompt; if unspecified, choose the vocal character that best fits the song";
    // Finish quality is also Advanced-only. Quick Create gets a stable neutral
    // production baseline rather than inheriting a hidden Creative/Release setting.
    const production = advancedMode
      ? quality === "release"
        ? "Release-ready production: balanced mix, controlled dynamics, clear lead vocal, clean low end, wide but mono-compatible image, polished transitions and a definitive ending."
        : "Creative demo with expressive, surprising arrangement choices."
      : "Polished, balanced production that follows the current prompt without adding hidden Advanced preferences.";
    const direction = blendDirections
      ? "Creative direction: blend the strongest qualities of both explored directions—keep the faithful version's clarity, structure and emotional coherence while borrowing the bold version's most distinctive production, rhythmic or instrumental idea. The result should feel unified, not stitched together."
      : creativeDirection === "faithful"
        ? "Creative direction: faithful to the brief, emotionally coherent, memorable and accessible."
        : "Creative direction: a clearly bolder interpretation with an unexpected but tasteful arrangement, distinctive rhythm or instrumentation, while preserving the requested meaning.";
    const scratchQuick = createMode === "quick" && momentId === "anything";
    const styleInstruction = style.trim() && !/^auto\b/i.test(style.trim()) ? `Style: ${style.trim()}.` : "";
    const languageInstruction = language.trim() && !/^auto\b/i.test(language.trim()) ? `Language: ${language.trim()}.` : "";
    const voiceInstruction = promptVoice || selectedVoice ? `Voice: ${effectiveVoice}.` : "";
    return [
      effectiveUserBrief,
      !scratchQuick && `Purpose: ${occasion}. Emotional direction: ${emotion}. Structure: ${structure}.`,
      [styleInstruction, languageInstruction, voiceInstruction, createMode === "advanced" ? `Style influence: ${influence}%. Creative variation: ${weirdness}%.` : ""].filter(Boolean).join(" "),
      createMode === "advanced" && direction,
      `Define the production intentionally: genre, mood, instrumentation, tempo and production era should feel specific rather than generic.`,
      naturalLanguageMix && `Natural multilingual handling: use ${naturalLanguageMix} as a musically natural code-switch rather than a literal translation exercise. Keep proper names intact, make section transitions feel intentional, and favor idiomatic phrasing in each language.`,
      advancedMode && sectionLanguagePlan && `Section-by-section language plan (follow exactly unless the supplied lyrics require otherwise): ${sectionLanguagePlan}. Keep transitions natural and do not translate sections assigned to a specific language.`,
      (rememberedGuide || (advancedMode && (pronunciation.trim() || structuredPronunciation))) &&
        `Pronunciation guide (follow carefully):\n${[rememberedGuide, advancedMode ? pronunciation.trim() : "", advancedMode ? structuredPronunciation : ""].filter(Boolean).join("\n")}`,
      advancedMode && exclude && `Exclude: ${exclude}.`,
      smartDirection === "heartfelt" && "Creative feel: keep this close, warm and emotionally specific; favor intimacy over spectacle.",
      smartDirection === "cinematic" && "Creative feel: build a clear cinematic arc with dynamic lift, contrast and a memorable payoff.",
      smartDirection === "fun" && "Creative feel: keep this bright, catchy and playful with an early hook and easy momentum.",
      production,
      intentPlan.preserveWords && "Word-preservation request: keep the user’s supplied wording as intact as possible. Adapt only where necessary for singability and preserve the meaning exactly.",
      culturalProductionHints(effectiveUserBrief) && `Cultural intelligence: ${culturalProductionHints(effectiveUserBrief)}`,
      (sourceKind === "text" || /story|memory|message|vows|notes|journal|letter/i.test(effectiveUserBrief)) && "Story-to-chorus: identify the emotional center of the source first, then make the chorus express that core idea in one memorable, singable phrase rather than summarizing every detail.",
      /duet|two singers|male and female|female and male|alternating voices|call and response/i.test(effectiveUserBrief) && "Duet intelligence: make the two vocal roles meaningfully distinct, alternate sections intentionally, and let shared sections feel like a musical conversation rather than duplicated vocals.",
      `Cantoa quality gate: before finalizing the musical brief, reconcile conflicts in favor of the user’s newest explicit request. Preserve proper names exactly, keep requested vocal type and language consistent, avoid singing production instructions or section labels, prevent accidental phrase repetition at section boundaries, make the first memorable musical idea arrive promptly, and end cleanly rather than abruptly.`,
      lyrics.trim() && `Use these lyrics exactly where appropriate:\n${lyrics}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [
    effectiveUserBrief,
    createMode,
    momentId,
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
    smartDirection,
    blendDirections,
    pronunciation,
    pronunciationEntries,
    rememberedPronunciations,
    sectionLanguages,
    exclude,
    quality,
    lyrics,
    intentPlan.preserveWords,
    sourceKind,
    sourceText,
    recipient,
    personalDetails,
    dedication,
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
    setDerivedContext("");
    setPrompt(moment.prompt);
    if (id === "creator") { setDuration(30); setQuality("release"); }
    if (id === "business") { setDuration(30); setQuality("release"); }
    if (id === "relax") { setMode("instrumental"); setDuration(180); }
    else setMode("vocals");
    setSurpriseDirection("");
    setSmartDirection(null);
    setBlendDirections(false);
    setMessage(`${moment.label} selected. Cantoa has prepared the song direction for you.`);
  };

  const applyStarterIdea = (idea: (typeof STARTER_IDEAS)[number]) => {
    setMomentId(idea.momentId);
    setCreateMode("quick");
    setCustom(false);
    setPrompt(idea.prompt);
    setStyle(idea.style);
    setEmotion(idea.emotion);
    setLanguage(idea.language);
    setDuration(idea.duration);
    setMode(idea.mode);
    setSourceMode(false);
    setSourceKind("idea");
    setSourceUrl("");
    setDerivedContext("");
    setSurpriseDirection("");
    setSmartDirection(null);
    setBlendDirections(false);
    setMessage(`${idea.title} starter applied. Edit anything you want before creating the song.`);
    requestAnimationFrame(() => document.getElementById("idea")?.focus());
  };

  const applySmartCreateDirection = (direction: "heartfelt" | "cinematic" | "fun") => {
    setCreateMode("quick");
    setSmartDirection(direction);
    if (direction === "heartfelt") {
      setEmotion("Intimate and heartfelt");
      if (!style.trim() || /^auto/i.test(style.trim())) setStyle("Acoustic pop");
      setCreativeDirection("faithful");
      setMessage("Heartfelt direction applied. Cantoa will keep the story close and personal.");
    } else if (direction === "cinematic") {
      setEmotion("Dramatic and cinematic");
      setStyle("Cinematic");
      setCreativeDirection("bold");
      setMessage("Cinematic direction applied. Cantoa will build a bigger emotional arc.");
    } else {
      setEmotion("Joyful and energetic");
      if (!style.trim() || /^auto/i.test(style.trim()) || /cinematic/i.test(style)) setStyle("Pop");
      setCreativeDirection("bold");
      setMessage("Fun direction applied. Cantoa will keep it catchy, bright and easy to enjoy.");
    }
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
    setStyle(pick[0]); setEmotion(pick[1]); setCreativeDirection("bold"); setSmartDirection(null);
    setSurpriseDirection(`${pick[0]} · ${pick[1]}`);
    setMessage(`Surprise direction: ${pick[0]} · ${pick[1]}.`);
  };

  const buildStoryInterviewBrief = () => {
    const story = storyInterview.story.trim();
    if (!story) {
      setMessage("Tell Cantoa one thing that happened or matters — one sentence is enough.");
      return;
    }
    const parts = [
      `The real moment or story: ${story}.`,
      storyInterview.vibe.trim() && `Desired feeling or vibe: ${storyInterview.vibe.trim()}.`,
    ].filter(Boolean);
    setMomentId("someone");
    setPrompt(`Turn this real moment into an original song that feels personal, natural and fun. ${parts.join(" ")} Keep the lyrics singable and emotionally specific; do not sound like a questionnaire.`);
    setSourceKind("idea"); setSourceMode(false); setDerivedContext(""); setActiveSourcePanel(null);
    setMessage("Got it — your song idea is ready. Change anything you want, then create.");
    requestAnimationFrame(() => document.getElementById("idea")?.focus());
  };

  const transcribeStoryFile = async (file: File) => {
    if (!session) { setAccountOpen(true); setMessage("Sign in to turn a voice memo into a song."); return; }
    setTranscribing(true); setMessage("Listening to your voice memo…");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/transcribe", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Voice memo transcription failed.");
      const text = String(data.text || "").trim();
      if (!text) throw new Error("No clear speech was found in that voice memo.");
      setPrompt(`Turn this spoken story into an original song. Keep the emotional meaning and important details, but write natural singable lyrics instead of copying speech word-for-word. Story: ${text}`);
      setSourceKind("idea"); setSourceMode(false); setDerivedContext("");
      setMessage(`Voice memo understood${data.language ? ` · detected ${String(data.language).toUpperCase()}` : ""}. Review the brief before creating.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Voice memo transcription failed."); }
    finally { setTranscribing(false); }
  };

  const clearSourcePanelState = (panel: SourcePanel | null) => {
    if (panel === "website") { setSourceKind("idea"); setSourceUrl(""); }
    if (panel === "photo") setVisualScoreFile(null);
    if (panel === "video") setVideoSourceFile(null);
  };

  const selectSourcePanel = (panel: SourcePanel) => {
    // One primary source at a time. Switching source tools clears hidden source state so
    // an old audio/text/video attachment can never silently override the newly selected tool.
    setMessage("");
    if (activeSourcePanel === panel) {
      clearSourcePanelState(panel);
      setActiveSourcePanel(null);
      return;
    }
    clearSourcePanelState(activeSourcePanel);
    setSourceFile(null);
    setSourceMode(false);
    setSourceText("");
    setMemoryPhotos([]);
    setVisualScoreFile(null);
    setVideoSourceFile(null);
    setSourceUrl("");
    setSourceKind(panel === "website" ? "link" : "idea");
    setActiveSourcePanel(panel);
    if (panel === "website") {
      requestAnimationFrame(() => document.getElementById("cantoa-source-url-panel")?.focus());
    }
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
      setPrompt("Create an original song inspired by this webpage.");
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
      if (looksLikeCreationInstruction(pasted)) {
        setPrompt(pasted.slice(0, 12000));
        setSourceText("");
        setSourceKind("idea");
        setSourceMode(false);
        setMessage("Detailed song direction detected. Cantoa will use it as your creation brief.");
      } else {
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
            headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
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
      const audioInfo = audioFileInfo(blob);
      form.append(
        "file",
        new File([blob], `${saved.id}.${audioInfo.extension}`, { type: audioInfo.type }),
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
    let generationPrompt = base.trim();
    if (sourceKind === "link" && (!generationPrompt || /^https:\/\/\S+$/i.test(generationPrompt))) {
      generationPrompt = "Create an original song inspired by this webpage. Let the page's subject, mood and purpose guide the lyrics and production.";
    }
    if (sourceKind === "text" && sourceText.trim() && !looksLikeCreationInstruction(sourceText))
      generationPrompt += `\n\nSource material to transform into an original song:\n${sourceText.slice(0, 12000)}`;
    if (sourceKind === "link" && sourceUrl.trim()) {
      const sourceResponse = await fetch("/api/source", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ url: sourceUrl }),
      });
      const sourceData = await sourceResponse.json();
      if (!sourceResponse.ok)
        throw new Error(sourceData.error || "The webpage could not be read.");
      const sourceLead = `\n\nCreate an original song inspired by this webpage. Do not copy protected wording unless supplied by the user. Page: ${sourceData.title}. Source material: `;
      const maxPromptChars = 3800;
      const availableForSource = Math.max(320, maxPromptChars - generationPrompt.length - sourceLead.length);
      const sourceExcerpt = String(sourceData.text || "").slice(0, availableForSource).trim();
      generationPrompt = `${generationPrompt}${sourceLead}${sourceExcerpt}`.slice(0, maxPromptChars);
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
      const base = await resolveGenerationPrompt(`${derivedContext ? `${derivedContext}\n\n` : ""}${completePrompt}`);
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
    const hasSourceInput = Boolean(
      (sourceKind === "link" && sourceUrl.trim()) ||
      (sourceMode && sourceFile) ||
      visualScoreFile ||
      videoSourceFile
    );
    if (prompt.trim().length < 8 && !hasSourceInput) {
      setMessage("Describe the song in a little more detail, or choose something real to turn into music.");
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
        `${derivedContext ? `${derivedContext}\n\n` : ""}${override || completePrompt}`,
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
        const planData = await planResponse.json().catch(() => ({}));
        if (!planResponse.ok) {
          if ([400, 422, 500, 502, 503].includes(planResponse.status)) {
            compositionPlan = undefined;
            generatedLyrics = "";
            setMessage("Cantoa could not pre-plan the lyrics, so it is creating the song directly instead…");
          } else {
            throw new Error(
              planData.error || "The song plan could not be created.",
            );
          }
        } else {
          compositionPlan = planData.compositionPlan;
          generatedLyrics = lyricsFromPlan(compositionPlan) || generatedLyrics;
          setMessage("Lyrics and structure are ready. Generating the audio…");
        }
      } else if (mode === "vocals" && lyrics.trim()) {
        generatedLyrics = lyrics.trim();
        setMessage("Using your lyrics as provided. Creating the music around them…");
      } else if (sourceMode && sourceFile) {
        generatedLyrics = song?.generatedLyrics || lyrics.trim();
      }
      let response: Response;
      const progressTimers: ReturnType<typeof setTimeout>[] = [];
      const queueProgress = () => {
        progressTimers.push(setTimeout(() => setMessage("Creating your music… this can take a little time for a full song."), 18000));
        progressTimers.push(setTimeout(() => setMessage("Still creating your song. Some generations take longer while Cantoa completes the best compatible music path."), 45000));
        progressTimers.push(setTimeout(() => setMessage("This creation is taking longer than usual, but it is still processing. Keep this page open."), 75000));
      };
      setMessage("Creating your music…");
      queueProgress();
      try {
      if (intentPlan.soundtrack && (videoSourceFile || visualScoreFile)) {
        const form = new FormData();
        form.append("file", (videoSourceFile || visualScoreFile)!);
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
      } finally {
        progressTimers.forEach(clearTimeout);
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "The song could not be created.");
      }
      setMessage("Finalizing your song…");
      const blob = await response.blob();
      if (song?.url) URL.revokeObjectURL(song.url);
      const songTitle = title.trim() || titleFrom(effectiveUserBrief, generatedLyrics);
      const parentId = song?.id;
      const savedSong: SavedSong = {
        id: crypto.randomUUID(),
        title: songTitle,
        prompt: effectiveUserBrief,
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
      resetPerSongTools();
      setSong({ ...savedSong, blob, url: objectUrl });
      setView("song");
      setPlaying(false);
      setMessage("");
      try {
        await localPut(savedSong as SavedSong & { blob: Blob });
      } catch {
        setMessage("Your song was created, but this browser could not save it to the device library. Download the MP3 now and retry cloud save if needed.");
      }
      await cloudSave(savedSong, blob);
      await loadLibrary();
    } catch (error) {
      setMessage(
        friendlyGenerationError(
          error instanceof Error ? error.message : "The song could not be created.",
        ),
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
    setSourceText("");
    setSourceUrl("");
    setVisualScoreFile(null);
    setVideoSourceFile(null);
    setMemoryPhotos([]);
    setTurnAnythingOpen(false);
    setActiveSourcePanel(null);
    setStarterIdeasExpanded(false);
    setSmartDirection(null);
    setStoryInterview({ story: "", vibe: "" });
    setPrompt("");
    setMomentId("anything");
    setTitle("");
    setLyrics("");
    setPublicShareUrl("");
    setDerivedContext("");
    setCloudStatus("");
    setCloudSaveFailed(false);
    resetPerSongTools();
  };
  const download = () => {
    if (!song) return;
    // Basic file downloads are never membership-gated. Also clear any stale modal left by a
    // previous premium action so clicking MP3 can never appear to trigger an upgrade screen.
    setAccountOpen(false);
    setMembershipOpen(false);
    setMessage("");
    const audioInfo = audioFileInfo(song.blob);
    downloadBlob(song.blob, `${song.title.replace(/\s+/g, "-").toLowerCase()}.${audioInfo.extension}`);
  };
  const saveText = (content: string, suffix: string, type = "text/plain") => {
    if (!song) return;
    setAccountOpen(false);
    setMembershipOpen(false);
    armDownloadClickGuard();
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${song.title.replace(/\s+/g, "-").toLowerCase()}-${suffix}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const currentSongDNA = useMemo(() => song ? songDNAFrom(song) : null, [song]);
  const songHasVocals = !!song && (song.mode === "vocals" || Boolean(song.generatedLyrics?.trim()));
  const whyThisWorks = useMemo(() => song ? whyThisWorksFrom(song) : [], [song]);

  const resetPerSongTools = () => {
    setBestClipOffset(null);
    setGroupCollectUrl("");
    setSecretDropAt("");
    setEmotionLock(false);
    setMomentLabOpen(false);
    setPublicShareUrl("");
    setShareStatus("");
    setSocialVideoRendering(false);
    setSocialVideoBlob(null);
    setSocialVideoFormat("vertical");
    setMemoryMovieRendering(false);
    setMemoryMovieBlob(null);
    setJinglePackBuilding(false);
    if (socialVideoUrl) URL.revokeObjectURL(socialVideoUrl);
    if (memoryMovieUrl) URL.revokeObjectURL(memoryMovieUrl);
    if (jinglePackUrl) URL.revokeObjectURL(jinglePackUrl);
    setSocialVideoUrl("");
    setMemoryMovieUrl("");
    setJinglePackUrl("");
    setAction("");
    setSingAlongOpen(false);
    setPlaybackTime(0);
    setBackingTrackBlob(null);
    setBackingTrackStatus("idle");
    setKaraokeBuilding(false);
    setInstrumentalBuilding(false);
    setSixStemStatus("idle");
    backingTrackBlobRef.current = null;
    backingTrackSourceRef.current = null;
    sixStemArchiveRef.current = null;
    backingTrackPromiseRef.current = null;
    sixStemPromiseRef.current = null;
    exportSessionRef.current = null;
  };

  const prepareDerivedMoment = (kind: "dna" | "next" | "time" | "daily" | "reply" | "group") => {
    if (!song) return;
    const dna = currentSongDNA;
    const base = dna ? `Keep this Song DNA: ${dna.mode}; ${dna.language}; ${dna.voice}; ${dna.style}; ${dna.emotion}. Preserve the recognizable emotional identity of “${song.title}”.` : `Preserve the recognizable emotional identity of “${song.title}”.`;
    const hiddenInstructions = {
      dna: `${base} Create a new original song that feels related, not copied. Keep the emotional and production identity while writing a fresh hook and fresh lyrics.`,
      next: `${base} Living Song: continue the story at a later life moment. Keep the emotional continuity, but write a genuinely new chapter rather than repeating the old lyrics.`,
      time: `${base} Time Machine: reimagine the same emotional story at a different point in time. Preserve the core relationship and feeling, while the arrangement and lyrics reflect the new era or milestone.`,
      daily: `${base} Daily Soundtrack: create a short personal soundtrack that is immediately engaging, emotionally clear and suitable for an ordinary day.`,
      reply: `${base} Song Reply: answer the emotional message of the original with a new song. Respond to its feeling and story without copying lyrics or melody.`,
      group: `${base} Group Song: combine several people’s memories into one coherent song. Give each contribution a fair emotional role, find the shared theme and build one memorable chorus for the whole group.`,
    } as const;
    const visibleBriefs = {
      dna: "Make another original song with the same overall feeling and musical identity, but with a fresh hook and new lyrics.",
      next: "Create the next chapter of this song. I’ll add the new milestone or memory below, and Cantoa should keep the same emotional feeling.",
      time: "Reimagine this song at a different milestone or point in time while keeping its emotional heart.",
      daily: "Turn the feeling of this song into a short personal soundtrack for today.",
      reply: "Create a new song that replies to the feeling and story of the original without copying it.",
      group: "Create one original song from several people’s memories, finding the shared story and a chorus that belongs to everyone.",
    } as const;
    setDerivedContext(hiddenInstructions[kind]);
    setView("create");
    setCreateMode("quick");
    setSourceMode(false);
    setSourceKind("idea");
    setPrompt(visibleBriefs[kind]);
    setTitle("");
    setLyrics("");
    if (kind === "group") setMomentId("family");
    else if (kind === "daily") setMomentId("anything");
    else setMomentId(momentId);
    setMessage(kind === "next" ? "Add the new milestone or memory, then create the next chapter." : kind === "group" ? "Add the memories you want included, then create the group song." : "Cantoa is preserving the useful identity in the background. Edit the brief naturally before generating.");
  };

  const copyGroupContributionRequest = async () => {
    const text = `Help me make a Cantoa Group Song. Send me a short memory, message or song idea, plus the feeling you want the song to leave us with. If you use the private Cantoa link, you can also add a photo and vote on the ideas that matter most.`;
    try { await navigator.clipboard.writeText(text); notify("Group contribution request copied."); }
    catch { setMessage(text); }
  };


  const refreshGroupCollectionStatus = async () => {
    if (!song?.id || !session) return;
    setGroupStatusLoading(true);
    try {
      const response = await fetch(`/api/library/${song.id}/collect`, { headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not refresh group activity.");
      const contributions = Array.isArray(data.contributions) ? data.contributions : [];
      setGroupContributionCount(contributions.length);
      setGroupVoteCount(contributions.reduce((sum: number, item: { votes?: number }) => sum + (Number(item.votes) || 0), 0));
      if (data.url) setGroupCollectUrl(data.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not refresh group activity.");
    } finally { setGroupStatusLoading(false); }
  };

  const createGroupCollection = async () => {
    if (!requirePremiumTool("Group Song 2.0")) return;
    if (!song?.id || !session) { setAccountOpen(true); setMessage("Sign in and save this song to the cloud before collecting group memories."); return; }
    try {
      const response = await fetch(`/api/library/${song.id}/collect`, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not create the group contribution link.");
      setGroupCollectUrl(data.url || "");
      setGroupContributionCount(0);
      setGroupVoteCount(0);
      if (data.url) await navigator.clipboard?.writeText(data.url).catch(() => undefined);
      notify("Private Group Song page ready and link copied.");
      void refreshGroupCollectionStatus();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create the group contribution link."); }
  };

  const useCollectedMemories = async () => {
    if (!requirePremiumTool("Build from group ideas")) return;
    if (!song?.id || !session) { setAccountOpen(true); return; }
    try {
      const response = await fetch(`/api/library/${song.id}/collect`, { headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load contributions.");
      const contributions = Array.isArray(data.contributions) ? data.contributions : [];
      if (!contributions.length) { setMessage("No group memories have been added yet."); return; }
      const ordered = [...contributions].sort((a: { votes?: number }, b: { votes?: number }) => (b.votes || 0) - (a.votes || 0));
      const lines = ordered.map((item: { contributor?: string; memory?: string; kind?: string; feeling?: string; votes?: number; hasPhoto?: boolean }, index: number) => {
        const kindLabel = item.kind === "idea" ? "Song idea" : item.kind === "message" ? "Message" : "Memory";
        const extras = [item.feeling ? `Feeling: ${item.feeling}` : "", item.votes ? `Group votes: ${item.votes}` : "", item.hasPhoto ? "Photo contributed for context" : ""].filter(Boolean).join(" · ");
        return `${index + 1}. ${kindLabel} from ${item.contributor || "Someone"}: ${item.memory || ""}${extras ? ` (${extras})` : ""}`;
      }).join("\n");
      setView("create"); setCreateMode("quick"); setMomentId("family"); setSourceMode(false); setSourceKind("idea"); setTitle(""); setLyrics("");
      setPrompt(`Group Song 2.0: weave these structured contributions into one coherent original song. Respect memories and messages, use song ideas selectively, and treat higher-voted ideas as stronger group signals without ignoring quieter voices. Use the listed feelings to shape the emotional arc. Do not list contributions mechanically or copy private details verbatim unless they naturally belong in lyrics.\n\n${lines}`);
      setMessage(`${contributions.length} Group Song contribution${contributions.length === 1 ? "" : "s"} loaded. Higher-voted ideas are prioritized while every contributor remains represented.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load contributions."); }
  };

  const scheduleSecretDrop = async () => {
    if (!song?.id || !session) { setAccountOpen(true); setMessage("Sign in and save the song before scheduling a Secret Drop."); return; }
    if (!secretDropAt) { setMessage("Choose a future date and time for the Secret Drop."); return; }
    try {
      let shareUrl = publicShareUrl;
      if (!shareUrl) {
        const shareResponse = await fetch(`/api/library/${song.id}/share`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ giftTo: recipient, dedication, giftFrom: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Someone special" }) });
        const shareData = await shareResponse.json().catch(() => ({}));
        if (!shareResponse.ok) throw new Error(shareData.error || "Could not create the gift page.");
        shareUrl = shareData.url || ""; setPublicShareUrl(shareUrl);
      }
      const response = await fetch(`/api/library/${song.id}/drop`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ unlockAt: new Date(secretDropAt).toISOString() }) });
      const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Could not schedule the Secret Drop.");
      if (shareUrl) await navigator.clipboard?.writeText(shareUrl).catch(() => undefined);
      notify("Secret Drop scheduled. Gift link copied.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not schedule the Secret Drop."); }
  };

  const exportSongPassport = () => {
    if (!song || !currentSongDNA) return;
    const passport = [
      "CANTOA SONG PASSPORT",
      "",
      `Title: ${song.title}`,
      `Created: ${new Date(song.createdAt || Date.now()).toISOString()}`,
      `Version: ${song.versionLabel || "Original"}`,
      `Moment: ${currentSongDNA.moment}`,
      `Mode: ${currentSongDNA.mode}`,
      `Language identity: ${currentSongDNA.language}`,
      `Vocal identity: ${currentSongDNA.voice}`,
      `Style identity: ${currentSongDNA.style}`,
      `Emotional identity: ${currentSongDNA.emotion}`,
      `Duration: ${song.duration} seconds`,
      "",
      "SONG DNA",
      currentSongDNA.identity,
      "",
      "WHY THIS WORKS",
      ...whyThisWorks.map((item, index) => `${index + 1}. ${item}`),
      "",
      "PROVENANCE",
      "This passport records the Cantoa creation context and does not constitute copyright registration or a legal determination.",
    ].join("\n");
    saveText(passport, "song-passport.txt");
  };

  const createMemoryCapsule = async () => {
    if (!song) return;
    setAction("Building Memory Capsule…");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const slug = song.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "cantoa-moment";
      zip.file(`${slug}.mp3`, song.blob);
      zip.file(`${slug}-lyrics.txt`, song.generatedLyrics?.trim() || lyrics.trim() || "No written lyrics were stored for this version.");
      if (currentSongDNA) zip.file(`${slug}-song-dna.json`, JSON.stringify(currentSongDNA, null, 2));
      zip.file(`${slug}-story.txt`, [recipient && `For: ${recipient}`, dedication && `Dedication: ${dedication}`, personalDetails && `Story / details: ${personalDetails}`, `Creation brief: ${song.prompt}`].filter(Boolean).join("\n\n"));
      memoryPhotos.forEach((file, index) => zip.file(`photos/${String(index + 1).padStart(2, "0")}-${file.name}`, file));
      if (memoryMovieBlob) zip.file(`${slug}-memory-movie.webm`, memoryMovieBlob);
      if (socialVideoBlob) zip.file(`${slug}-${socialVideoFormat}-video.webm`, socialVideoBlob);
      zip.file("README.txt", "Cantoa Memory Capsule\n\nA private package containing the finished song, story context, optional photos, lyrics and any already-created visual exports. No new music generation was used to build this package.");
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${slug}-memory-capsule.zip`; armDownloadClickGuard(); a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      notify("Memory Capsule created.");
    } catch (error) {
      setMessage(error instanceof Error ? `Memory Capsule could not be created: ${error.message}` : "Memory Capsule could not be created.");
    } finally { setAction(""); }
  };

  const findBestClipOffset = async () => {
    if (!song) return 0;
    if (bestClipOffset !== null) return bestClipOffset;
    try {
      const context = new AudioContext();
      const decoded = await context.decodeAudioData(await song.blob.arrayBuffer());
      const data = decoded.getChannelData(0);
      const rate = decoded.sampleRate;
      const clip = Math.max(4, Math.min(15, decoded.duration));
      const windowSamples = Math.max(1, Math.floor(clip * rate));
      const step = Math.max(1, Math.floor(rate * 2));
      const startMin = decoded.duration > 35 ? Math.floor(6 * rate) : 0;
      const endMax = Math.max(startMin, data.length - windowSamples - Math.floor(Math.min(3, decoded.duration * .05) * rate));
      let bestStart = 0, bestScore = -1;
      for (let start = startMin; start <= endMax; start += step) {
        let sum = 0, peak = 0, count = 0;
        const stride = 64;
        for (let i = start; i < Math.min(data.length, start + windowSamples); i += stride) {
          const v = Math.abs(data[i]); sum += v * v; peak = Math.max(peak, v); count++;
        }
        const rms = count ? Math.sqrt(sum / count) : 0;
        const position = start / Math.max(1, data.length);
        const centerBonus = 1 - Math.abs(position - .55) * .35;
        const score = (rms * .85 + peak * .15) * centerBonus;
        if (score > bestScore) { bestScore = score; bestStart = start; }
      }
      await context.close();
      const seconds = Math.max(0, Math.min(decoded.duration - clip, bestStart / rate));
      setBestClipOffset(seconds);
      return seconds;
    } catch { setBestClipOffset(0); return 0; }
  };

  const createAllShareFormats = async () => {
    if (!song) return;
    if (!socialVideoSupported) { setMessage("This browser cannot render social videos. Try current Chrome, Edge or Firefox."); return; }
    setMessage("Creating share format 1 of 3: Best Moment Reel. This reuses the finished song and does not generate new music.");
    await renderSocialVideo("vertical", true);
    setMessage("Creating share format 2 of 3: square video.");
    await renderSocialVideo("square", true);
    if (song.generatedLyrics?.trim() || lyrics.trim()) {
      setMessage("Creating share format 3 of 3: lyric video.");
      await renderSocialVideo("lyrics", true);
    }
    setMessage("Your share formats are ready. You can run these exports again anytime.");
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
    setAccountOpen(false);
    setMembershipOpen(false);
    if (!(await authorizeFeature("wav_export", { openMembership: false }))) return;
    setAction("Creating WAV…");
    setMessage("");
    try {
      const AudioContextClass = window.AudioContext;
      const context = new AudioContextClass();
      const decoded = await context.decodeAudioData(
        await song.blob.arrayBuffer(),
      );
      let peak = 0, energy = 0, count = 0;
      for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
        const data = decoded.getChannelData(channel);
        const stride = Math.max(1, Math.floor(data.length / 16000));
        for (let i = 0; i < data.length; i += stride) { const v = Math.abs(data[i]); peak = Math.max(peak, v); energy += v * v; count += 1; }
      }
      const rms = count ? Math.sqrt(energy / count) : 0;
      if (decoded.duration < 1 || peak < 0.001 || rms < 0.00008) throw new Error("The source audio decoded as silent, so Cantoa did not create an empty WAV.");
      // Keep PCM WAV structurally simple for maximum editor/player compatibility.
      // Embedded cover-art support in WAV is not standardized and can break or be ignored by Windows players.
      const wav = pcmWav(decoded);
      armDownloadClickGuard();
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

  const songExportKey = (value: Song) =>
    value.id || `${value.createdAt || 0}:${value.title}:${value.url}`;

  const getExportSession = () => {
    if (!song) throw new Error("Open a finished song first.");
    const current = exportSessionRef.current;
    const key = songExportKey(song);
    if (current?.songId === key) return current;
    const created: SongExportSession = { songId: key, providerQueue: Promise.resolve() };
    exportSessionRef.current = created;
    return created;
  };

  const runStemProviderJob = async (sessionForSong: SongExportSession, job: () => Promise<Blob>) => {
    // ElevenLabs stem separation is expensive and can be rate/concurrency limited. Serialize provider
    // calls per opened song so random-order clicks cannot launch competing 2-stem/6-stem jobs.
    const previous = sessionForSong.providerQueue.catch(() => undefined);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    sessionForSong.providerQueue = previous.then(() => gate);
    await previous;
    try {
      if (exportSessionRef.current !== sessionForSong || !song || songExportKey(song) !== sessionForSong.songId) {
        throw new Error("The opened song changed before this export started. Please try the export again on the current song.");
      }
      return await job();
    } finally {
      release();
    }
  };

  const requestStemArchive = async (variation: "two_stems_v1" | "six_stems_v1" = "six_stems_v1") => {
    if (!song) throw new Error("Open a finished song first.");
    const sessionForSong = getExportSession();
    const sourceSong = song;
    return runStemProviderJob(sessionForSong, async () => {
      const form = new FormData();
      // Cloud/object-storage downloads can lose their original MIME type. Sniff the actual audio
      // container so the stem provider receives a filename + Content-Type that match the bytes.
      const head = new Uint8Array(await sourceSong.blob.slice(0, 16).arrayBuffer());
      const ascii = String.fromCharCode(...head);
      const isWav = ascii.startsWith("RIFF") && ascii.includes("WAVE");
      const isOgg = ascii.startsWith("OggS");
      const isMp4Family = head.length >= 8 && String.fromCharCode(...head.slice(4, 8)) === "ftyp";
      const isMp3 = ascii.startsWith("ID3") || (head.length >= 2 && head[0] === 0xff && (head[1] & 0xe0) === 0xe0);
      const declared = sourceSong.blob.type || "";
      const sourceExt = isWav ? "wav" : isOgg ? "ogg" : isMp4Family ? "m4a" : isMp3 ? "mp3"
        : /wav/i.test(declared) ? "wav" : /ogg/i.test(declared) ? "ogg" : /mp4|m4a|aac/i.test(declared) ? "m4a" : "mp3";
      const sourceType = sourceExt === "wav" ? "audio/wav" : sourceExt === "ogg" ? "audio/ogg" : sourceExt === "m4a" ? "audio/mp4" : "audio/mpeg";
      form.append("file", new File([sourceSong.blob], `song.${sourceExt}`, { type: sourceType }));
      form.append("variation", variation);
      const response = await fetch("/api/music/stems", {
        method: "POST",
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: form,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Stem separation could not be completed.");
      }
      const blob = await response.blob();
      if (exportSessionRef.current !== sessionForSong || !song || songExportKey(song) !== sessionForSong.songId) {
        throw new Error("The opened song changed while this export was being prepared. No stale file was downloaded.");
      }
      return blob;
    });
  };

  const validateStemArchive = async (blob: Blob, requireInstrumental = false, requireAudible = false) => {
    if (blob.size < 2048) throw new Error("The stem service returned an empty or incomplete archive.");
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(blob);
    const entries = Object.values(zip.files).filter((entry) => !entry.dir && /\.(wav|mp3|m4a|aac|ogg|flac)$/i.test(entry.name));
    if (entries.length < 2) throw new Error("The stem service did not return the expected audio stems.");
    const populated: typeof entries = [];
    for (const entry of entries) {
      const bytes = await entry.async("uint8array");
      if (bytes.byteLength > 2048) populated.push(entry);
    }
    if (populated.length < 2) throw new Error("The separated stem files were empty.");
    if (requireInstrumental && !populated.some((entry) => /instrumental|accompaniment|music/i.test(entry.name))) {
      const nonVocal = populated.filter((entry) => !/(^|[\/\-_\s])(vocal|vocals|voice)([\/\-_\s.]|$)/i.test(entry.name));
      if (!nonVocal.length) throw new Error("The stem service did not return a usable instrumental track.");
    }
    if (requireAudible) {
      const context = new AudioContext();
      let audible = false;
      for (const entry of populated.slice(0, 6)) {
        const bytes = await entry.async("uint8array");
        const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
        try {
          const decoded = await context.decodeAudioData(data);
          for (let channel = 0; channel < decoded.numberOfChannels && !audible; channel += 1) {
            const samples = decoded.getChannelData(channel);
            const stride = Math.max(1, Math.floor(samples.length / 6000));
            for (let i = 0; i < samples.length; i += stride) { if (Math.abs(samples[i]) > 0.0005) { audible = true; break; } }
          }
        } catch { /* another entry may still be decodable */ }
        if (audible) break;
      }
      await context.close();
      if (!audible) throw new Error("The provider returned silent stem audio. No empty ZIP was downloaded; please try again.");
    }
    return { zip, entries: populated };
  };

  const getTwoStemArchive = async () => {
    if (!song) throw new Error("Open a finished song first.");
    const sessionForSong = getExportSession();
    if (sessionForSong.twoStemArchive) return sessionForSong.twoStemArchive;
    if (sessionForSong.twoStemPromise) return sessionForSong.twoStemPromise;
    const job = (async () => {
      const blob = await requestStemArchive("two_stems_v1");
      await validateStemArchive(blob, true, true);
      if (exportSessionRef.current !== sessionForSong || !song || songExportKey(song) !== sessionForSong.songId) {
        throw new Error("The opened song changed while its backing track was being prepared.");
      }
      sessionForSong.twoStemArchive = blob;
      return blob;
    })();
    sessionForSong.twoStemPromise = job;
    try { return await job; }
    finally { if (sessionForSong.twoStemPromise === job) sessionForSong.twoStemPromise = undefined; }
  };

  const sanitizeSixStemArchive = async (blob: Blob, sourceLabel = "six-stem") => {
    const JSZip = (await import("jszip")).default;
    const source = await JSZip.loadAsync(blob);
    const output = new JSZip();
    const audioEntries = Object.values(source.files).filter((entry) => !entry.dir && /\.(wav|mp3|m4a|aac|ogg|flac)$/i.test(entry.name));
    const available: string[] = [];
    const omitted: string[] = [];
    const context = new AudioContext();
    for (const entry of audioEntries) {
      const bytes = await entry.async("uint8array");
      if (bytes.byteLength < 2048) { omitted.push(`${entry.name} — empty`); continue; }
      let decoded: AudioBuffer | null = null;
      try {
        const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
        decoded = await context.decodeAudioData(data.slice(0));
      } catch {
        omitted.push(`${entry.name} — browser could not decode this provider file`);
        continue;
      }
      let peak = 0, energy = 0, count = 0;
      for (let c = 0; c < decoded.numberOfChannels; c += 1) {
        const samples = decoded.getChannelData(c);
        const stride = Math.max(1, Math.floor(samples.length / 16000));
        for (let i = 0; i < samples.length; i += stride) {
          const v = Math.abs(samples[i]); peak = Math.max(peak, v); energy += v * v; count += 1;
        }
      }
      const rms = count ? Math.sqrt(energy / count) : 0;
      const audible = decoded.duration >= 1 && peak >= 0.001 && rms >= 0.00008;
      if (!audible) {
        omitted.push(`${entry.name} — no meaningful isolated audio detected in this source song`);
        continue;
      }
      const filename = entry.name.split("/").pop() || entry.name;
      const rawBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      // Preserve the provider's exact audio bytes inside the ZIP. Re-wrapping/tagging every stem
      // can make otherwise-valid provider files unplayable in some desktop players.
      output.file(filename, rawBuffer);
      available.push(filename);
    }
    await context.close();
    if (available.length < 2) throw new Error("The provider did not return at least two audible, decodable stems for this song.");
    output.file("STEM-MANIFEST.txt", `Cantoa stem package\n\nSource mode: ${sourceLabel}\n\nAudible stems included:\n${available.map((x) => `- ${x}`).join("\n")}\n\n${omitted.length ? `Silent/unused/unreadable stem categories omitted:\n${omitted.map((x) => `- ${x}`).join("\n")}\n\n` : ""}Cantoa verifies that included tracks are decodable and contain audible signal before download, then preserves the provider audio bytes unchanged in the ZIP. Some songs naturally have little isolated content in a given stem category.`);
    return await output.generateAsync({ type: "blob" });
  };

  const getSixStemArchive = async () => {
    if (!song) throw new Error("Open a finished song first.");
    const sessionForSong = getExportSession();
    if (sessionForSong.sixStemArchive) return sessionForSong.sixStemArchive;
    if (sessionForSong.sixStemPromise) return sessionForSong.sixStemPromise;
    const job = (async () => {
      setSixStemStatus("building");
      try {
        let blob: Blob;
        try {
          const providerBlob = await requestStemArchive("six_stems_v1");
          await validateStemArchive(providerBlob, false, true);
          blob = await sanitizeSixStemArchive(providerBlob, "six-stem separation");
        } catch {
          // Reuse (or await) the same 2-stem result used by Karaoke/Instrumental. Never launch a
          // second independent 2-stem request merely because six-stem fallback happened first.
          const providerBlob = await getTwoStemArchive();
          blob = await sanitizeSixStemArchive(providerBlob, "two-stem fallback (vocals + instrumental)");
          setMessage("The detailed six-stem split was not usable for this mix, so Cantoa prepared a verified vocal + instrumental stem package instead.");
        }
        if (exportSessionRef.current !== sessionForSong || !song || songExportKey(song) !== sessionForSong.songId) {
          throw new Error("The opened song changed before the stem package finished. No stale ZIP was downloaded.");
        }
        sessionForSong.sixStemArchive = blob;
        sixStemArchiveRef.current = blob;
        setSixStemStatus("ready");
        return blob;
      } catch (error) {
        setSixStemStatus("error");
        throw error;
      }
    })();
    sessionForSong.sixStemPromise = job;
    sixStemPromiseRef.current = job;
    try { return await job; }
    finally {
      if (sessionForSong.sixStemPromise === job) sessionForSong.sixStemPromise = undefined;
      if (sixStemPromiseRef.current === job) sixStemPromiseRef.current = null;
    }
  };

  const exportStems = async () => {
    if (!song) return;
    setAccountOpen(false);
    setMembershipOpen(false);
    const expectedSongId = songExportKey(song);
    if (!(await authorizeFeature("stems", { openMembership: false }))) return;
    setAction("Separating six stems…");
    setMessage(sixStemStatus === "ready" ? "Preparing your cached stem package…" : "Separating six stems… this provider step can take longer than a normal file download.");
    try {
      const blob = await getSixStemArchive();
      if (!song || songExportKey(song) !== expectedSongId) throw new Error("The opened song changed before this export completed. Please export again from the current song.");
      downloadBlob(blob, `${song.title.replace(/\s+/g, "-").toLowerCase()}-stems.zip`);
      notify("Six-stem package ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Stem export failed.");
    } finally {
      setAction("");
    }
  };

  const makeBackingTrack = async () => {
    if (!song) throw new Error("Open a finished vocal song first.");
    const sessionForSong = getExportSession();
    if (sessionForSong.backingBlob) return sessionForSong.backingBlob;
    if (sessionForSong.backingPromise) return sessionForSong.backingPromise;

    const job = (async () => {
      setBackingTrackStatus("building");
      try {
        const archive = await getTwoStemArchive();
        const { entries } = await validateStemArchive(archive, true, true);
        const instrumentalEntry = entries.find((entry) => /instrumental|accompaniment|music/i.test(entry.name))
          || entries.find((entry) => !/(^|[\/\-_\s])(vocal|vocals|voice)([\/\-_\s.]|$)/i.test(entry.name));
        if (!instrumentalEntry) throw new Error("The stem service did not return a usable instrumental track.");

        const bytes = await instrumentalEntry.async("uint8array");
        const sourceType = /\.wav$/i.test(instrumentalEntry.name) ? "audio/wav" : "audio/mpeg";
        const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
        const sourceBlob = new Blob([buffer], { type: sourceType });
        const decodeContext = new AudioContext();
        let decoded: AudioBuffer;
        try { decoded = await decodeContext.decodeAudioData(buffer.slice(0)); }
        catch { await decodeContext.close(); throw new Error("Cantoa could not decode the instrumental track returned by the provider."); }
        let peak = 0, energy = 0, count = 0;
        for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
          const data = decoded.getChannelData(channel);
          const stride = Math.max(1, Math.floor(data.length / 16000));
          for (let i = 0; i < data.length; i += stride) { const v = Math.abs(data[i]); peak = Math.max(peak, v); energy += v * v; count += 1; }
        }
        const rms = count ? Math.sqrt(energy / count) : 0;
        if (peak < 0.001 || rms < 0.00008 || decoded.duration < 1) {
          await decodeContext.close();
          throw new Error("The provider returned a silent instrumental track. Cantoa stopped the download instead of giving you an empty file.");
        }
        await decodeContext.close();
        // MP3 metadata/artwork is broadly supported. Keep provider WAV byte-for-byte standard instead
        // of appending non-standard artwork chunks that some players render as a black square.
        let verified = sourceBlob;
        if (sourceType === "audio/mpeg") {
          const tagged = await mp3WithCantoaArtwork(sourceBlob, `${song.title} · Instrumental`);
          // The raw provider MP3 has already passed the audio check above. Only keep the artwork-tagged
          // copy if the browser can still decode it; otherwise preserve the known-good provider bytes.
          try {
            const taggedContext = new AudioContext();
            const taggedDecoded = await taggedContext.decodeAudioData(await tagged.arrayBuffer());
            const taggedOk = taggedDecoded.duration >= 1;
            await taggedContext.close();
            if (taggedOk) verified = tagged;
          } catch { verified = sourceBlob; }
        }
        if (exportSessionRef.current !== sessionForSong || !song || songExportKey(song) !== sessionForSong.songId) {
          throw new Error("The opened song changed before the instrumental was ready. No stale file was downloaded.");
        }
        sessionForSong.backingBlob = verified;
        backingTrackSourceRef.current = verified;
        backingTrackBlobRef.current = verified;
        setBackingTrackBlob(verified);
        setBackingTrackStatus("ready");
        return verified;
      } catch (error) {
        setBackingTrackStatus("error");
        throw error;
      }
    })();

    sessionForSong.backingPromise = job;
    backingTrackPromiseRef.current = job;
    try { return await job; }
    finally {
      if (sessionForSong.backingPromise === job) sessionForSong.backingPromise = undefined;
      if (backingTrackPromiseRef.current === job) backingTrackPromiseRef.current = null;
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    armDownloadClickGuard();
    // Downloads are local file actions; never leave an account/auth or stale membership surface
    // covering the result page. Premium authorization happens before this helper is called.
    setAccountOpen(false);
    setMembershipOpen(false);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const exportInstrumentalVersion = async () => {
    if (!song || !(song.mode === "vocals" || song.generatedLyrics?.trim()) || instrumentalBuilding) return;
    setAccountOpen(false);
    setMembershipOpen(false);
    const expectedSongId = songExportKey(song);
    if (!(await authorizeFeature("stems", { openMembership: false }))) return;
    setInstrumentalBuilding(true);
    setMessage("");
    try {
      const blob = await makeBackingTrack();
      if (!song || songExportKey(song) !== expectedSongId) throw new Error("The opened song changed before this export completed. Please export again from the current song.");
      const extension = blob.type === "audio/mpeg" ? "mp3" : "wav";
      downloadBlob(blob, `${song.title.replace(/\s+/g, "-").toLowerCase()}-instrumental.${extension}`);
      notify("Instrumental version ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Instrumental version could not be created.");
    } finally { setInstrumentalBuilding(false); }
  };

  const exportKaraokePackage = async () => {
    if (!song || !(song.mode === "vocals" || song.generatedLyrics?.trim()) || karaokeBuilding) return;
    setAccountOpen(false);
    setMembershipOpen(false);
    const expectedSongId = songExportKey(song);
    if (!(await authorizeFeature("stems", { openMembership: false }))) return;
    setKaraokeBuilding(true);
    setMessage("");
    try {
      const backing = await makeBackingTrack();
      if (!song || songExportKey(song) !== expectedSongId) throw new Error("The opened song changed before this export completed. Please export again from the current song.");
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const slug = song.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "cantoa-song";
      const lyricText = song.generatedLyrics?.trim() || "Lyrics were not stored for this version.";
      const lyricLines = lyricText.split(/\n+/).map((line) => line.trim()).filter(Boolean);
      const perLine = Math.max(1, song.duration / Math.max(1, lyricLines.length));
      const stamp = (seconds: number) => { const min = Math.floor(seconds / 60); const sec = (seconds % 60).toFixed(2).padStart(5, "0"); return `[${String(min).padStart(2, "0")}:${sec}]`; };
      const lrc = lyricLines.map((line, index) => `${stamp(index * perLine)}${line}`).join("\n");
      const safeLines = JSON.stringify(lyricLines).replace(/</g, "\u003c");
      const embeddedAudio = await blobToDataUrl(backingTrackSourceRef.current || backing);
      const playerHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${slug} · Cantoa Karaoke</title><style>body{margin:0;background:#120f16;color:#fff;font:16px system-ui,sans-serif;display:grid;place-items:center;min-height:100vh}.card{width:min(760px,92vw);background:#211a27;border:1px solid #45384e;border-radius:24px;padding:24px;box-shadow:0 24px 70px #0008}h1{margin:0 0 8px;font-size:28px}.note{color:#d8d0de;margin:0 0 18px}audio{width:100%;margin:10px 0 18px}.lyrics{max-height:55vh;overflow:auto}.line{padding:10px 12px;border-radius:10px;color:#d8d0de}.line.active{background:#6a3159;color:#fff;font-weight:750}.status{font-size:13px;color:#f0b7cf;margin:0 0 8px}</style></head><body><main class="card"><h1>Cantoa Karaoke</h1><p class="note">Estimated lyric timing. Play the backing track and sing along.</p><p id="status" class="status">Audio is embedded in this player, so it works even when opened directly from the ZIP.</p><audio id="a" controls preload="metadata" src="${embeddedAudio}"></audio><div id="lyrics" class="lyrics"></div></main><script>const lines=${safeLines};const a=document.getElementById('a'),box=document.getElementById('lyrics'),status=document.getElementById('status');lines.forEach((t,i)=>{const p=document.createElement('div');p.className='line';p.textContent=t;p.dataset.i=i;box.appendChild(p)});function paint(){const d=a.duration||${song.duration};const i=Math.min(lines.length-1,Math.floor((a.currentTime/Math.max(1,d))*lines.length));[...box.children].forEach((el,n)=>el.classList.toggle('active',n===i));const el=box.children[i];if(el)el.scrollIntoView({block:'nearest'})}a.addEventListener('loadedmetadata',()=>{status.textContent='Backing track ready · press Play.'});a.addEventListener('error',()=>{status.textContent='The embedded backing track could not be decoded in this browser. Open the included WAV instead.'});a.addEventListener('timeupdate',paint);a.addEventListener('seeked',paint);</script></body></html>`;
      const backingExt = backing.type === "audio/mpeg" ? "mp3" : "wav";
      zip.file(`${slug}-karaoke.${backingExt}`, backing);
      zip.file(`${slug}-lyrics.txt`, lyricText);
      zip.file(`${slug}-lyrics.lrc`, lrc);
      zip.file(`${slug}-karaoke-player.html`, playerHtml);
      zip.file("README.txt", "Cantoa Karaoke Package\n\n1. Open karaoke-player.html. Its backing audio is embedded, so Play works even if Windows opens the HTML from a temporary ZIP folder.\n2. A separate karaoke backing audio file is included. Cantoa keeps the provider's native separated audio whenever possible so it does not lose sound through unnecessary conversion.\n3. Audio-file artwork depends on the media player. Use karaoke-player.html for the guaranteed Cantoa visual and on-screen lyrics.\n4. lyrics.lrc contains estimated timestamps for compatible karaoke/lyrics players.\n\nStem separation quality depends on the source mix and provider output.");
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${slug}-karaoke.zip`);
      notify("Karaoke package ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Karaoke package could not be created.");
    } finally { setKaraokeBuilding(false); }
  };
  const reviseSong = (instruction: string, label: string, lyricsOverride?: string) => {
    if (!song) return;
    if (!accountInfo?.isOwner && accountInfo?.plan === "Explore") {
      setMembershipOpen(true);
      setMessage("Revisions create a new audio generation and are available with Creator or Studio after your free creations.");
      return;
    }
    setView("create");
    setQuality("release");
    setMode(song.mode === "instrumental" && song.generatedLyrics?.trim() ? "vocals" : song.mode);
    setDuration(song.duration);
    setLyrics(lyricsOverride ?? song.generatedLyrics ?? "");
    setSourceMode(true);
    setSourceKind("audio");
    const audioInfo = audioFileInfo(song.blob);
    setSourceFile(
      new File([song.blob], `${song.title}.${audioInfo.extension}`, { type: audioInfo.type }),
    );
    setPrompt(`${revisionStrengthText(revisionStrength)}\n\n${emotionLock ? "Emotion Lock: preserve the original emotional identity, intimacy/energy balance and overall feeling unless the requested change explicitly requires otherwise.\n\n" : ""}Requested change: ${instruction}`);
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
    const audioInfo = audioFileInfo(song.blob);
    const file = new File([song.blob], `${song.title}.${audioInfo.extension}`, {
      type: audioInfo.type,
    });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: song.title,
          text: contextualShareText(song.title, momentId, recipient, dedication),
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
    const text = contextualShareText(song.title, momentId, recipient, dedication);
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
  const persistRememberedPronunciations = async (items: RememberedPronunciation[]) => {
    const compact = items
      .filter((item) => item.target.trim() && item.reading.trim())
      .slice(0, 100);
    setRememberedPronunciations(compact);
    const userId = session?.user?.id || "guest";
    try { localStorage.setItem(`cantoa-pronunciation-memory:${userId}`, JSON.stringify(compact)); } catch {}
    if (session?.user) {
      try {
        const supabase = getSupabaseBrowser();
        await supabase?.auth.updateUser({ data: { cantoa_pronunciations: compact } });
      } catch {}
    }
  };
  const rememberPronunciation = async () => {
    const target = resultPronunciationTarget.trim();
    const reading = resultPronunciationReading.trim();
    if (!target || !reading) { setMessage("Enter both the written word and how it should sound."); return; }
    const key = target.toLocaleLowerCase();
    const next = [
      { id: `remember-${Date.now()}`, target, reading, updatedAt: Date.now() },
      ...rememberedPronunciations.filter((item) => item.target.toLocaleLowerCase() !== key),
    ].slice(0, 100);
    await persistRememberedPronunciations(next);
    setResultPronunciationTarget("");
    setResultPronunciationReading("");
    notify(`Cantoa will remember how to pronounce “${target}”.`);
  };
  const forgetPronunciation = async (id: string) => {
    await persistRememberedPronunciations(rememberedPronunciations.filter((item) => item.id !== id));
  };
  const openPronunciationFix = () => {
    if (!song) return;
    setResultLyricLines((song.generatedLyrics || "").split(/\r?\n/));
    setPronunciationFixOpen((open) => !open);
  };
  const applyPronunciationAndLyricRevision = () => {
    if (!song) return;
    const original = (song.generatedLyrics || "").split(/\r?\n/);
    const edited = resultLyricLines;
    const changedLines = edited
      .map((line, index) => ({ index, before: original[index] ?? "", after: line }))
      .filter((row) => row.before !== row.after);
    const relevantMemory = rememberedPronunciations
      .filter((entry) => `${song.prompt}\n${edited.join("\n")}`.toLocaleLowerCase().includes(entry.target.toLocaleLowerCase()))
      .map((entry) => `“${entry.target}” → ${entry.reading}`);
    if (!changedLines.length && !relevantMemory.length) {
      setMessage("Edit a lyric line or save a pronunciation first.");
      return;
    }
    const changeSummary = changedLines.length
      ? `Use these edited lyrics exactly, preserving all unchanged lines:\n${edited.join("\n")}`
      : "Keep the current lyrics unchanged.";
    const pronunciationSummary = relevantMemory.length
      ? `Pronunciation memory to follow carefully:\n${relevantMemory.join("\n")}`
      : "";
    reviseSong(`${changeSummary}\n\n${pronunciationSummary}\n\nPreserve the melody, emotional identity, singer type, language mix and arrangement unless a tiny adjustment is necessary to make the corrected words sing naturally.`, changedLines.length ? "Lyrics & pronunciation" : "Pronunciation fix", edited.join("\n"));
  };

  const loadMyVoiceProfiles = useCallback(async () => {
    if (!session?.access_token) { setMyVoiceProfiles([]); setMyVoiceLimit(0); return; }
    try {
      const response = await fetch("/api/my-voice", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const profiles = Array.isArray(data.profiles) ? data.profiles : [];
        setMyVoiceProfiles(profiles);
        setMyVoiceSelectedId((current) => current && profiles.some((profile: MyVoiceProfile) => profile.id === current) ? current : profiles[0]?.id || null);
        setMyVoiceLimit(Number(data.limit || 0));
      }
    } catch {}
  }, [session?.access_token]);

  useEffect(() => { void loadMyVoiceProfiles(); }, [loadMyVoiceProfiles]);

  const startMyVoiceRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMessage("Voice recording is not available in this browser. Upload an audio sample instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const recorderInstance = new MediaRecorder(stream);
      myVoiceChunksRef.current = [];
      recorderInstance.ondataavailable = (event) => { if (event.data.size) myVoiceChunksRef.current.push(event.data); };
      recorderInstance.onstop = () => {
        const blob = new Blob(myVoiceChunksRef.current, { type: recorderInstance.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        if (myVoiceRecordTimerRef.current) { clearInterval(myVoiceRecordTimerRef.current); myVoiceRecordTimerRef.current = null; }
        if (blob.size > 0) { setMyVoiceSample(blob); setMyVoiceSampleName(`Recorded voice sample · ${myVoiceRecordSeconds || 1}s`); }
        setMyVoiceRecording(false);
      };
      myVoiceRecorderRef.current = recorderInstance;
      recorderInstance.start(500);
      setMyVoiceRecordSeconds(0);
      setMyVoiceRecording(true);
      const startedAt = Date.now();
      myVoiceRecordTimerRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - startedAt) / 1000);
        setMyVoiceRecordSeconds(seconds);
        if (seconds >= 60 && recorderInstance.state === "recording") recorderInstance.stop();
      }, 250);
      notify("Recording… Say the short message you want to add. About 5–20 seconds is usually enough.");
    } catch {
      setMessage("Microphone access was not available. You can upload a voice sample instead.");
    }
  };
  const stopMyVoiceRecording = () => {
    if (myVoiceRecorderRef.current?.state === "recording") myVoiceRecorderRef.current.stop();
    if (myVoiceRecordTimerRef.current) { clearInterval(myVoiceRecordTimerRef.current); myVoiceRecordTimerRef.current = null; }
  };
  const previewRecordedVoiceMessage = async () => {
    if (!myVoiceSample) { setMessage("Record or upload a short voice message first."); return; }
    try {
      const url = URL.createObjectURL(myVoiceSample);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.onerror = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch { setMessage("Cantoa could not play this recording. Try recording it again."); }
  };
  const createSongWithRecordedVoiceMessage = async () => {
    if (!myVoiceSample) { setMessage("Record or upload a short voice message first."); return; }
    if (myVoiceUse === "message") {
      const extension = myVoiceSample.type.includes("mpeg") ? "mp3" : myVoiceSample.type.includes("wav") ? "wav" : "webm";
      downloadBlob(myVoiceSample, `cantoa-voice-message.${extension}`);
      notify("Voice message downloaded.");
      return;
    }
    if (!song) { setMessage("Open a finished song before adding a spoken intro or outro."); return; }
    setMyVoiceCombining(true); setMessage("");
    try {
      const audioContext = new AudioContext();
      const [songBuffer, voiceBuffer] = await Promise.all([
        audioContext.decodeAudioData(await song.blob.arrayBuffer()),
        audioContext.decodeAudioData(await myVoiceSample.arrayBuffer()),
      ]);
      await audioContext.close();
      const sampleRate = 44100;
      const gapSeconds = 0.6;
      const songSeconds = songBuffer.duration;
      const voiceSeconds = voiceBuffer.duration;
      const totalSeconds = songSeconds + voiceSeconds + gapSeconds;
      const offline = new OfflineAudioContext(2, Math.ceil(totalSeconds * sampleRate), sampleRate);
      const songSource = offline.createBufferSource(); songSource.buffer = songBuffer; songSource.connect(offline.destination);
      const voiceSource = offline.createBufferSource(); voiceSource.buffer = voiceBuffer; voiceSource.connect(offline.destination);
      if (myVoiceUse === "intro") { voiceSource.start(0); songSource.start(voiceSeconds + gapSeconds); }
      else { songSource.start(0); voiceSource.start(songSeconds + gapSeconds); }
      const rendered = await offline.startRendering();
      downloadBlob(pcmWav(rendered), `${song.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "cantoa-song"}-with-${myVoiceUse}.wav`);
      notify(`Song with your recorded ${myVoiceUse} downloaded. Your original stays unchanged.`);
    } catch { setMessage("Cantoa could not combine this recording with the song. Try a clean recording or uploaded audio file."); }
    finally { setMyVoiceCombining(false); }
  };

  const createMyVoice = async () => {
    if (!session?.access_token) { setMessage("Sign in to create My Voice."); return; }
    if (!myVoiceSample) { setMessage("Record or upload a clear voice sample first."); return; }
    if (!myVoiceConsent) { setMessage("Confirm that this is your own voice before creating a private voice profile."); return; }
    setMyVoiceCreating(true); setMessage("");
    try {
      const form = new FormData();
      const file = myVoiceSample instanceof File ? myVoiceSample : new File([myVoiceSample], "my-voice-sample.webm", { type: myVoiceSample.type || "audio/webm" });
      form.append("file", file);
      form.append("name", myVoiceName.trim() || "My Voice");
      form.append("consent", "true");
      const response = await fetch("/api/my-voice", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(data.error || "My Voice could not be created."));
      const profiles = Array.isArray(data.profiles) ? data.profiles : [];
      setMyVoiceProfiles(profiles);
      setMyVoiceSelectedId(data.profile?.id || profiles[0]?.id || null);
      setMyVoiceLimit(Number(data.limit || myVoiceLimit));
      setMyVoiceSample(null); setMyVoiceSampleName(""); setMyVoiceConsent(false);
      notify("My Voice is ready for spoken messages.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "My Voice could not be created."); }
    finally { setMyVoiceCreating(false); }
  };
  const generateMyVoiceBlob = async (profile: MyVoiceProfile) => {
    if (!session?.access_token) throw new Error("Sign in to use My Voice.");
    const response = await fetch("/api/my-voice/preview", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ id: profile.id, text: myVoiceText.trim() || "A special message, made with love in my own voice." }) });
    if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(String(data.error || "Voice message could not be created.")); }
    return response.blob();
  };
  const previewMyVoice = async (profile: MyVoiceProfile, downloadClip = false) => {
    setMyVoicePreviewingId(profile.id); setMessage("");
    try {
      const blob = await generateMyVoiceBlob(profile);
      const url = URL.createObjectURL(blob);
      if (downloadClip) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `${profile.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "my-voice"}-spoken-message.mp3`;
        document.body.appendChild(link); link.click(); link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1200);
        notify("Spoken voice message downloaded.");
      } else {
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        audio.onerror = () => URL.revokeObjectURL(url);
        await audio.play();
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Voice message could not be created."); }
    finally { setMyVoicePreviewingId(null); }
  };
  const createSongWithMyVoice = async (profile: MyVoiceProfile) => {
    if (!song) { setMessage("Open a finished song before adding a spoken intro or outro."); return; }
    if (myVoiceUse === "message") { await previewMyVoice(profile, true); return; }
    setMyVoiceCombining(true); setMessage("");
    try {
      const voiceBlob = await generateMyVoiceBlob(profile);
      const audioContext = new AudioContext();
      const [songBuffer, voiceBuffer] = await Promise.all([
        audioContext.decodeAudioData(await song.blob.arrayBuffer()),
        audioContext.decodeAudioData(await voiceBlob.arrayBuffer()),
      ]);
      await audioContext.close();
      const sampleRate = 44100;
      const gapSeconds = 0.6;
      const songSeconds = songBuffer.duration;
      const voiceSeconds = voiceBuffer.duration;
      const totalSeconds = songSeconds + voiceSeconds + gapSeconds;
      const offline = new OfflineAudioContext(2, Math.ceil(totalSeconds * sampleRate), sampleRate);
      const songSource = offline.createBufferSource(); songSource.buffer = songBuffer; songSource.connect(offline.destination);
      const voiceSource = offline.createBufferSource(); voiceSource.buffer = voiceBuffer; voiceSource.connect(offline.destination);
      if (myVoiceUse === "intro") { voiceSource.start(0); songSource.start(voiceSeconds + gapSeconds); }
      else { songSource.start(0); voiceSource.start(songSeconds + gapSeconds); }
      const rendered = await offline.startRendering();
      const combined = pcmWav(rendered);
      downloadBlob(combined, `${song.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "cantoa-song"}-with-${myVoiceUse}.wav`);
      notify(`Song with spoken ${myVoiceUse} downloaded. Your original stays unchanged.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Cantoa could not combine the voice message with this song."); }
    finally { setMyVoiceCombining(false); }
  };
  const deleteMyVoice = async (profile: MyVoiceProfile) => {
    if (!session?.access_token || !confirm(`Delete ${profile.name}? This also requests deletion from the voice provider.`)) return;
    try {
      const response = await fetch("/api/my-voice", { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ id: profile.id }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(data.error || "Voice could not be deleted."));
      const profiles = Array.isArray(data.profiles) ? data.profiles : [];
      setMyVoiceProfiles(profiles);
      setMyVoiceSelectedId((current) => current === profile.id ? profiles[0]?.id || null : current);
      notify(`${profile.name} deleted.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Voice could not be deleted."); }
  };

  const persistPeopleMoments = async (people: SavedPerson[], moments: SavedMoment[]) => {
    const compactPeople = people.filter((item) => item.name.trim()).slice(0, 50);
    const compactMoments = moments.filter((item) => item.title.trim()).slice(0, 50);
    setSavedPeople(compactPeople);
    setSavedMoments(compactMoments);
    const userId = session?.user?.id || "guest";
    try { localStorage.setItem(`cantoa-people-moments:${userId}`, JSON.stringify({ people: compactPeople, moments: compactMoments })); } catch {}
    if (session?.user) {
      try {
        const supabase = getSupabaseBrowser();
        await supabase?.auth.updateUser({ data: { cantoa_people: compactPeople, cantoa_moments: compactMoments } });
      } catch {}
    }
  };
  const savePersonMemory = async () => {
    const name = personDraft.name.trim();
    if (!name) { setMessage("Add the person's name before saving."); return; }
    const person: SavedPerson = { id: `person-${Date.now()}`, ...personDraft, name, updatedAt: Date.now() };
    await persistPeopleMoments([person, ...savedPeople].slice(0, 50), savedMoments);
    setPersonDraft({ name: "", relationship: "", language: "", musicStyle: "", details: "", importantDate: "" });
    notify(`${name} saved privately.`);
  };
  const saveMomentMemory = async () => {
    const title = momentDraft.title.trim();
    if (!title) { setMessage("Add a name for the moment before saving."); return; }
    const moment: SavedMoment = { id: `moment-${Date.now()}`, ...momentDraft, title, updatedAt: Date.now() };
    await persistPeopleMoments(savedPeople, [moment, ...savedMoments].slice(0, 50));
    setMomentDraft({ title: "", kind: "", date: "", details: "", people: "" });
    notify(`${title} saved privately.`);
  };
  const deletePersonMemory = async (id: string) => { await persistPeopleMoments(savedPeople.filter((item) => item.id !== id), savedMoments); };
  const deleteMomentMemory = async (id: string) => { await persistPeopleMoments(savedPeople, savedMoments.filter((item) => item.id !== id)); };
  const usePersonMemory = (person: SavedPerson) => {
    const context = [
      `Saved person: ${person.name}${person.relationship ? ` (${person.relationship})` : ""}.`,
      person.language && `Preferred language: ${person.language}.`,
      person.musicStyle && `Music preference: ${person.musicStyle}.`,
      person.importantDate && `Important date: ${person.importantDate}.`,
      person.details && `Personal details: ${person.details}.`,
    ].filter(Boolean).join(" ");
    setPrompt((current) => `${current.trim()}\n\nUse these private saved details only where they naturally help this song:\n${context}`.trim());
    notify(`Added saved details for ${person.name}.`);
  };
  const useMomentMemory = (moment: SavedMoment) => {
    const context = [
      `Saved moment: ${moment.title}${moment.kind ? ` (${moment.kind})` : ""}.`,
      moment.date && `Date: ${moment.date}.`,
      moment.people && `People: ${moment.people}.`,
      moment.details && `Details: ${moment.details}.`,
    ].filter(Boolean).join(" ");
    setPrompt((current) => `${current.trim()}\n\nUse these private saved details only where they naturally help this song:\n${context}`.trim());
    notify(`Added saved moment “${moment.title}”.`);
  };
  const suggestedPeople = savedPeople.filter((person) => {
    const haystack = prompt.toLocaleLowerCase();
    return [person.name, person.relationship].filter(Boolean).some((value) => haystack.includes(String(value).toLocaleLowerCase()));
  }).slice(0, 3);
  const suggestedMoments = savedMoments.filter((moment) => {
    const haystack = prompt.toLocaleLowerCase();
    return [moment.title, moment.kind].filter(Boolean).some((value) => haystack.includes(String(value).toLocaleLowerCase()));
  }).slice(0, 3);

  const waitForMediaEvent = (target: EventTarget, eventName: string, timeoutMs = 8000) =>
    new Promise<void>((resolve, reject) => {
      let finished = false;
      const cleanup = () => { target.removeEventListener(eventName, onEvent); clearTimeout(timer); };
      const onEvent = () => { if (finished) return; finished = true; cleanup(); resolve(); };
      const timer = window.setTimeout(() => { if (finished) return; finished = true; cleanup(); reject(new Error(`Timed out waiting for ${eventName}.`)); }, timeoutMs);
      target.addEventListener(eventName, onEvent, { once: true });
    });

  const renderSocialVideo = async (format: SocialVideoFormat, downloadAfter = true) => {
    if (!song) return null;
    if (!(await authorizeFeature(format === "lyrics" ? "lyric_video" : "social_video"))) return null;
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      setMessage("Social video rendering is not supported by this browser. Try current Chrome, Edge or Firefox.");
      return null;
    }
    setSocialVideoRendering(true);
    setSocialVideoFormat(format);
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

      const clipOffset = format === "vertical" ? await findBestClipOffset() : 0;
      if (audio.readyState < 1) { audio.load(); await waitForMediaEvent(audio, "loadedmetadata", 8000).catch(() => undefined); }
      if (clipOffset > 0 && Number.isFinite(audio.duration)) audio.currentTime = clipOffset;
      await audioContext.resume(); recorder.start(500); await audio.play(); draw();
      await new Promise((resolve)=>setTimeout(resolve,clipSeconds*1000)); audio.pause(); recorder.stop();
      const blob = await Promise.race([done, new Promise<Blob>((_, reject) => window.setTimeout(() => reject(new Error("Video finalization timed out. Please try again.")), 8000))]);
      source.disconnect();capture.disconnect();canvasStream.getTracks().forEach((track)=>track.stop());capture.stream.getTracks().forEach((track)=>track.stop());await audioContext.close();
      if (socialVideoUrl) URL.revokeObjectURL(socialVideoUrl); const url=URL.createObjectURL(blob);setSocialVideoBlob(blob);setSocialVideoUrl(url);setSocialVideoFormat(format);
      if(downloadAfter){const a=document.createElement("a");a.href=url;const slug=song.title.replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").toLowerCase()||"cantoa-song";a.download=`${slug}-${format==="vertical"?"reel":format==="lyrics"?"lyric-video":"square"}.webm`;armDownloadClickGuard();a.click();notify(`${format==="vertical"?"15-second Reel":format==="lyrics"?"Lyric video":"Square social video"} created and downloaded.`)}
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
      zip.file("README.txt","Cantoa Business Jingle Pack\n\nContains 15-, 30- and 60-second generated variants. Each is a separate provider-backed generation and consumes generation minutes."); const blob=await zip.generateAsync({type:"blob"}); if(jinglePackUrl)URL.revokeObjectURL(jinglePackUrl); const url=URL.createObjectURL(blob);setJinglePackUrl(url);const a=document.createElement("a");a.href=url;a.download=`${song.title.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}-jingle-pack.zip`;armDownloadClickGuard();a.click();notify("15/30/60 jingle pack created and downloaded.");void refreshAccount();
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
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${slug}-creator-pack.zip`; armDownloadClickGuard(); a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  const stopCompareAudio = useCallback(() => {
    if (compareAudio.current) { compareAudio.current.pause(); compareAudio.current = null; }
    setComparePlayingId(null);
  }, []);
  const compareVersionLabel = (item: SavedSong, index: number) => {
    if (!item.parentId) return "Original";
    const label = item.versionLabel?.trim();
    if (label && label !== "Revised version") return label;
    return `Revision ${Math.max(1, index)}`;
  };
  const playComparedVersion = async (item: SavedSong) => {
    if (comparePlayingId === item.id && compareAudio.current) {
      compareAudio.current.pause(); setComparePlayingId(null); return;
    }
    const resumeAt = compareAudio.current?.currentTime || comparePosition || 0;
    if (compareAudio.current) compareAudio.current.pause();
    try {
      let url = compareObjectUrls.current.get(item.id);
      if (!url) {
        if (song?.id === item.id) url = song.url;
        else if (item.blob) { url = URL.createObjectURL(item.blob); compareObjectUrls.current.set(item.id, url); }
        else if (item.remoteUrl) url = item.remoteUrl;
        else throw new Error("Audio unavailable");
      }
      const audio = new Audio(url);
      compareAudio.current = audio;
      audio.addEventListener("loadedmetadata", () => { audio.currentTime = Math.min(resumeAt, Math.max(0, audio.duration - 0.25)); });
      audio.addEventListener("timeupdate", () => setComparePosition(audio.currentTime));
      audio.addEventListener("ended", () => setComparePlayingId(null));
      await audio.play();
      setComparePlayingId(item.id);
    } catch { setMessage("This version could not be played for comparison. Refresh the library and try again."); }
  };
  const keepComparedVersion = (item: SavedSong) => {
    setPreferredVersionId(item.id);
    if (typeof window !== "undefined") localStorage.setItem(`cantoa-preferred-version:${session?.user?.id || "guest"}:${versionFamilyKey}`, item.id);
    notify(`${item.versionLabel || (item.parentId ? "Revision" : "Original")} marked as your preferred version.`);
  };
  useEffect(() => {
    if (!song?.id || typeof window === "undefined") { setPreferredVersionId(null); return; }
    const stored = localStorage.getItem(`cantoa-preferred-version:${session?.user?.id || "guest"}:${versionFamilyKey}`);
    setPreferredVersionId(stored);
    return () => stopCompareAudio();
  }, [song?.id, session?.user?.id, versionFamilyKey, stopCompareAudio]);
  useEffect(() => () => {
    for (const url of compareObjectUrls.current.values()) URL.revokeObjectURL(url);
    compareObjectUrls.current.clear();
  }, []);

  const openSaved = async (saved: SavedSong) => {
    setMessage("");
    resetPerSongTools();
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
        mode: saved.mode === "instrumental" && generatedLyrics.trim() ? "vocals" : saved.mode,
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
    if (!confirm("Delete this song permanently from your Cantoa library?")) return;
    if (session) {
      const response = await fetch(`/api/library/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessage(data.error || "This song could not be deleted from your cloud library. Nothing was removed locally.");
        return;
      }
    }
    await localDelete(id);
    if (song?.id === id) { setSong(null); setView("library"); }
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
    if (response.status === 409 && data.manageMembershipUrl) {
      setPlanMessage(data.error || "Manage your existing membership to change plans.");
      const portalResponse = await fetch(data.manageMembershipUrl, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
      const portalData = await portalResponse.json().catch(() => ({}));
      if (portalResponse.ok && portalData.url) { location.href = portalData.url; return; }
      setPlanMessage(portalData.error || data.error || "Membership management could not be opened.");
      return;
    }
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
        <button className="profile" onClick={openAccountPanel} onDoubleClick={(event) => { event.preventDefault(); event.stopPropagation(); }}>
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
              onClick={openAccountPanel}
              onDoubleClick={(event) => { event.preventDefault(); event.stopPropagation(); }}
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
              onClick={openMembershipPanel}
              onDoubleClick={(event) => { event.preventDefault(); event.stopPropagation(); }}
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
              <span>Start with a moment, a story, or anything you already have. Cantoa does the music work, then helps you refine and share it.</span>
            </div>
            <section className="moment-launcher" aria-label="Start with a moment">
              <div className="moment-launcher-head"><div><b>What are you making today?</b><span>Pick a moment, add one detail, and Cantoa handles the rest.</span></div><div className="surprise-wrap"><button onClick={surpriseMe}><Sparkles /> {surpriseDirection ? "Surprise me again" : "Surprise me"}</button>{surpriseDirection && <small aria-live="polite">{surpriseDirection}</small>}</div></div>
              {showFreeOffer && <div className="free-moment-banner"><Sparkles /><span><b>{session ? `${freeCreationsRemaining} free music creation${freeCreationsRemaining === 1 ? "" : "s"} remaining` : "Your first 2 music creations are free"}</b><small>Any 2 Moments · up to 2 minutes each · including Video / Reel.</small></span></div>}
              <div className="moment-grid">{MOMENTS.map((item) => <button key={item.id} className={momentId === item.id ? "active" : ""} onClick={() => applyMoment(item.id)}><span>{item.icon}</span><b>{item.label}</b></button>)}</div>
              {/* Keep inspiration discoverable after a choice without leaving a large permanent card wall. */}
              <div className={`starter-ideas ${prompt.trim() ? "has-idea" : ""}`} aria-label="Not sure what to make">
                <div className="starter-ideas-head">
                  <div><span className="starter-bulb">💡</span><span><b>{prompt.trim() ? "Want a different direction?" : "Not sure what to make?"}</b><small>{prompt.trim() ? "Your idea is safe. Try another starter only if you want to." : "Try one idea. You can change everything after."}</small></span></div>
                  <button type="button" className="starter-more" onClick={() => setStarterIdeasExpanded((value) => !value)}>{starterIdeasExpanded ? "Hide ideas" : prompt.trim() ? "Try another idea" : "More ideas"}</button>
                </div>
                {(!prompt.trim() || starterIdeasExpanded) && <div className="starter-ideas-grid">
                  {(starterIdeasExpanded ? STARTER_IDEAS : STARTER_IDEAS.slice(0, 3)).map((idea) => (
                    <button key={idea.id} type="button" onClick={() => { applyStarterIdea(idea); setStarterIdeasExpanded(false); }}>
                      <span className="starter-icon">{idea.icon}</span>
                      <b>{idea.title}</b>
                      <small>{idea.description}</small>
                      <span className="starter-use">Use this idea</span>
                    </button>
                  ))}
                </div>}
              </div>
              <div className="cantoa-source-launcher">
                <div className="cantoa-source-launcher-head">
                  <div><span>✨</span><span><b>Start with something real</b><small>Choose one. Only the selected tool opens.</small></span></div>
                  <button type="button" onClick={() => { if (turnAnythingOpen) clearSourcePanelState(activeSourcePanel); setTurnAnythingOpen((open) => !open); setActiveSourcePanel(null); setMessage(""); }}>{turnAnythingOpen ? "Hide" : "Add something"}</button>
                </div>
                {turnAnythingOpen && <>
                  <div className="cantoa-source-grid">
                    <button type="button" className={activeSourcePanel === "story" ? "active" : ""} onClick={() => selectSourcePanel("story")}><span>💬</span><b>Tell me the story</b><small>One moment is enough. Cantoa does the prompt work.</small></button>
                    <button type="button" className={activeSourcePanel === "website" ? "active" : ""} onClick={() => selectSourcePanel("website")}><span>🌐</span><b>Website</b><small>Turn a public webpage into a song idea.</small></button>
                    <button type="button" className={activeSourcePanel === "photo" ? "active" : ""} onClick={() => selectSourcePanel("photo")}><span>🖼️</span><b>Photo or screenshot</b><small>Make music for the mood of a visual.</small></button>
                    <button type="button" className={activeSourcePanel === "video" ? "active" : ""} onClick={() => selectSourcePanel("video")}><span>🎬</span><b>Video</b><small>Create a soundtrack that follows the clip.</small></button>
                  </div>

                  {/* Nothing is generated until you press Create complete song; this helper only builds the editable brief. */}
                  {activeSourcePanel === "story" && <div className="source-focus-panel story-interview" role="region" aria-label="Tell Cantoa the story">
                    <div className="story-interview-head"><span><b>Tell Cantoa one good thing</b><small>No survey. A sentence or two is enough.</small></span><button type="button" onClick={() => selectSourcePanel("story")} aria-label="Close story"><X /></button></div>
                    <div className="story-one-box">
                      <label><span className="story-question">What happened or what matters?</span><small className="story-question-help">One moment, feeling or detail is enough.</small><textarea rows={3} value={storyInterview.story} onChange={(e)=>setStoryInterview((v)=>({...v,story:e.target.value}))} placeholder="Example: We always sit on the porch after a long day and laugh about everything…" /></label>
                      <div className="story-vibe-picks" aria-label="Optional vibe">
                        <span>Optional vibe</span>
                        {["Warm", "Romantic", "Fun", "Proud", "Surprise me"].map((vibe) => <button type="button" key={vibe} className={storyInterview.vibe === vibe ? "active" : ""} onClick={() => setStoryInterview((value) => ({ ...value, vibe: value.vibe === vibe ? "" : vibe }))}>{vibe}</button>)}
                      </div>
                    </div>
                    <div className="story-interview-actions"><small>One sentence is enough — or use <b>Speak your idea</b> below.</small><button type="button" onClick={buildStoryInterviewBrief}><Sparkles /> Make it a song</button></div>
                  </div>}

                  {activeSourcePanel === "website" && <div className="source-focus-panel">
                    <div className="source-focus-head"><span><b>Website → song</b><small>Paste one public HTTPS link.</small></span><button type="button" onClick={() => selectSourcePanel("website")} aria-label="Close website"><X /></button></div>
                    <label className="source-focus-field"><span>Public webpage</span><input id="cantoa-source-url-panel" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://example.com/article" /><small>Readable public pages work best. Paywalls or sign-in pages may need pasted text instead.</small></label>
                  </div>}

                  {activeSourcePanel === "photo" && <div className="source-focus-panel">
                    <div className="source-focus-head"><span><b>Photo → music</b><small>Choose one image, then add any context in the main idea box.</small></span><button type="button" onClick={() => selectSourcePanel("photo")} aria-label="Close photo"><X /></button></div>
                    <label className="source-focus-upload"><span>🖼️</span><b>{visualScoreFile ? visualScoreFile.name : "Choose photo or screenshot"}</b><small>JPG, PNG or WebP · For a text-message screenshot, paste the text in the main idea box for lyric-level understanding.</small><input type="file" accept="image/*" onChange={(e) => { const file=e.target.files?.[0]||null; setVisualScoreFile(file); if(file){ setVideoSourceFile(null); setMode("instrumental"); if (!prompt.trim()) setPrompt("Create a cinematic instrumental soundtrack inspired by this image; match its mood, energy and sense of occasion."); setMomentId("anything"); setMessage(""); } }} /></label>
                  </div>}

                  {activeSourcePanel === "video" && <div className="source-focus-panel">
                    <div className="source-focus-head"><span><b>Video → soundtrack</b><small>Choose a clip and Cantoa will use the existing video soundtrack flow.</small></span><button type="button" onClick={() => selectSourcePanel("video")} aria-label="Close video"><X /></button></div>
                    <label className="source-focus-upload"><span>🎬</span><b>{videoSourceFile ? videoSourceFile.name : "Choose video"}</b><small>MP4, WebM or MOV</small><input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => { const file=e.target.files?.[0]||null; setVideoSourceFile(file); if(file){ setVisualScoreFile(null); setMode("instrumental"); setMomentId("creator"); if (!prompt.trim()) setPrompt("Create music for this video that follows its mood, pacing and emotional arc."); setMessage(""); } }} /></label>
                  </div>}
                </>}
              </div>
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
                <label className={`memory-attach ${memoryPhotos.length || visualScoreFile || videoSourceFile || (sourceMode && sourceFile) ? "has-files" : ""}`} title="Add photos, video or audio. Cantoa will detect what you attached.">
                  <Paperclip /><b>{sourceMode && sourceFile ? `Audio attached · ${sourceFile.name}` : videoSourceFile ? `Video attached${memoryPhotos.length ? ` · ${memoryPhotos.length} photos` : ""}` : visualScoreFile ? `Image attached · ${visualScoreFile.name}` : memoryPhotos.length ? `${memoryPhotos.length} photo${memoryPhotos.length === 1 ? "" : "s"}` : "Add media"}</b>
                  <input type="file" accept="image/*,audio/*,video/mp4,video/webm,video/quicktime" multiple onChange={(e) => {
                    const files = Array.from(e.target.files || []) as File[];
                    const images = files.filter((file) => file.type.startsWith("image/")).slice(0, 20);
                    const video = files.find((file) => file.type.startsWith("video/")) || null;
                    const audio = files.find((file) => file.type.startsWith("audio/")) || null;
                    setActiveSourcePanel(null);
                    setSourceText("");
                    setSourceUrl("");
                    setVisualScoreFile(null);
                    if (audio) {
                      setMemoryPhotos([]);
                      setVideoSourceFile(null);
                      setSourceFile(audio);
                      setSourceKind("audio");
                      setSourceMode(true);
                      setMessage(files.length > 1 ? "Audio selected as the primary source. Other selected media were ignored to avoid mixing creation modes." : "Audio attached. Describe the cover, remix or transformation you want.");
                    } else if (video) {
                      setMemoryPhotos([]);
                      setVideoSourceFile(video);
                      setSourceFile(null);
                      setSourceKind("idea");
                      setSourceMode(false);
                      setMessage(files.length > 1 ? "Video selected as the primary source. Add photos later for a Memory Movie." : "Video attached. Describe how the music should follow the moment.");
                    } else if (images.length) {
                      setMemoryPhotos(images);
                      setVideoSourceFile(null);
                      setSourceFile(null);
                      setSourceKind("idea");
                      setSourceMode(false);
                      setMessage(`${images.length} photo${images.length === 1 ? "" : "s"} attached for your Memory Movie.`);
                    }
                  }} />
                </label>
                <span>{prompt.length}/4000</span>
              </div>
              {(prompt.trim() || sourceUrl.trim() || sourceFile || visualScoreFile || videoSourceFile || memoryPhotos.length > 0) && (
                <div className="smart-create-summary" aria-live="polite">
                  <div className="smart-create-understood"><Sparkles /><span><b>Cantoa understood</b><small>You can change anything below.</small></span></div>
                  <div className="smart-create-chips">{smartCreateChips.map((label) => <i key={label}>{label}</i>)}</div>
                  <div className="smart-create-directions" aria-label="Quick creative directions">
                    <span>Make it</span>
                    <button type="button" className={smartDirection === "heartfelt" ? "active" : ""} onClick={() => applySmartCreateDirection("heartfelt")}>♥ Heartfelt</button>
                    <button type="button" className={smartDirection === "cinematic" ? "active" : ""} onClick={() => applySmartCreateDirection("cinematic")}>✦ Cinematic</button>
                    <button type="button" className={smartDirection === "fun" ? "active" : ""} onClick={() => applySmartCreateDirection("fun")}>☀ Fun</button>
                  </div>
                </div>
              )}
              {(savedPeople.length > 0 || savedMoments.length > 0 || session) && (
                <div className="people-moments-shell">
                  {hasPremiumTools && (suggestedPeople.length > 0 || suggestedMoments.length > 0) && (
                    <div className="people-moments-suggestions" aria-label="Relevant saved details">
                      <span><Sparkles /> Saved details match this idea</span>
                      {suggestedPeople.map((person) => <button type="button" key={person.id} onClick={() => usePersonMemory(person)}>Use {person.name}</button>)}
                      {suggestedMoments.map((moment) => <button type="button" key={moment.id} onClick={() => useMomentMemory(moment)}>Use {moment.title}</button>)}
                    </div>
                  )}
                  <button type="button" className="people-moments-toggle" onClick={() => { if (!requirePremiumTool("Saved people & moments")) return; setPeopleMomentsOpen((open) => !open); }} aria-expanded={peopleMomentsOpen}>
                    <UserCircle /><span><b>Saved people & moments <em className="creator-badge">Creator+</em></b><small>Reuse private details without retyping them</small></span><ChevronDown />
                  </button>
                  {peopleMomentsOpen && (
                    <section className="people-moments-panel">
                      <div className="people-moments-tabs">
                        <button type="button" className={peopleMomentsTab === "people" ? "active" : ""} onClick={() => setPeopleMomentsTab("people")}>People</button>
                        <button type="button" className={peopleMomentsTab === "moments" ? "active" : ""} onClick={() => setPeopleMomentsTab("moments")}>Moments</button>
                      </div>
                      {peopleMomentsTab === "people" ? (
                        <div className="people-moments-body">
                          <div className="people-moments-form">
                            <input value={personDraft.name} onChange={(e) => setPersonDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Name · e.g. Mom or Meena" />
                            <input value={personDraft.relationship} onChange={(e) => setPersonDraft((d) => ({ ...d, relationship: e.target.value }))} placeholder="Relationship · e.g. Mother" />
                            <input value={personDraft.language} onChange={(e) => setPersonDraft((d) => ({ ...d, language: e.target.value }))} placeholder="Preferred language · optional" />
                            <input value={personDraft.musicStyle} onChange={(e) => setPersonDraft((d) => ({ ...d, musicStyle: e.target.value }))} placeholder="Music style · optional" />
                            <input value={personDraft.importantDate} onChange={(e) => setPersonDraft((d) => ({ ...d, importantDate: e.target.value }))} placeholder="Important date · optional" />
                            <textarea value={personDraft.details} onChange={(e) => setPersonDraft((d) => ({ ...d, details: e.target.value }))} placeholder="Memories, sayings, interests or details Cantoa may use" rows={3} />
                            <button type="button" onClick={() => void savePersonMemory()}><Plus /> Save person</button>
                          </div>
                          {savedPeople.length > 0 && <div className="people-moments-list">{savedPeople.slice(0, 12).map((person) => <div key={person.id}><span><b>{person.name}</b><small>{[person.relationship, person.language, person.musicStyle].filter(Boolean).join(" · ") || "Saved person"}</small></span><button type="button" onClick={() => usePersonMemory(person)}>Use</button><button type="button" className="remove" onClick={() => void deletePersonMemory(person.id)} aria-label={`Delete ${person.name}`}><X /></button></div>)}</div>}
                        </div>
                      ) : (
                        <div className="people-moments-body">
                          <div className="people-moments-form">
                            <input value={momentDraft.title} onChange={(e) => setMomentDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Moment · e.g. Our first trip" />
                            <input value={momentDraft.kind} onChange={(e) => setMomentDraft((d) => ({ ...d, kind: e.target.value }))} placeholder="Type · birthday, wedding, graduation…" />
                            <input value={momentDraft.date} onChange={(e) => setMomentDraft((d) => ({ ...d, date: e.target.value }))} placeholder="Date · optional" />
                            <input value={momentDraft.people} onChange={(e) => setMomentDraft((d) => ({ ...d, people: e.target.value }))} placeholder="People involved · optional" />
                            <textarea value={momentDraft.details} onChange={(e) => setMomentDraft((d) => ({ ...d, details: e.target.value }))} placeholder="What happened, why it matters, favorite details" rows={3} />
                            <button type="button" onClick={() => void saveMomentMemory()}><Plus /> Save moment</button>
                          </div>
                          {savedMoments.length > 0 && <div className="people-moments-list">{savedMoments.slice(0, 12).map((moment) => <div key={moment.id}><span><b>{moment.title}</b><small>{[moment.kind, moment.date, moment.people].filter(Boolean).join(" · ") || "Saved moment"}</small></span><button type="button" onClick={() => useMomentMemory(moment)}>Use</button><button type="button" className="remove" onClick={() => void deleteMomentMemory(moment.id)} aria-label={`Delete ${moment.title}`}><X /></button></div>)}</div>}
                        </div>
                      )}
                      <small className="people-moments-privacy">Private by default. Saving or editing memories uses no generation minutes. Cantoa adds a saved detail to a song only when you choose Use.</small>
                    </section>
                  )}
                </div>
              )}
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
              {sourceKind === "link" && activeSourcePanel !== "website" && (
                <div className="source-entry">
                  <label>Public webpage link</label>
                  <input
                    id="cantoa-source-url"
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
                        placeholder="Auto — follow my prompt"
                      />
                      <small>
                        If your prompt explicitly names a voice (for example, male vocals), the prompt takes priority. {" "}
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
                    {intentPlan.soundtrack && (videoSourceFile || visualScoreFile)
                      ? videoSourceFile ? "Score this video" : "Score this image"
                      : sourceKind === "audio"
                        ? "Create remix"
                        : "Create complete song"}{" "}
                    <span>
                      {quality === "release" ? "STRUCTURED HQ" : "CREATIVE"}
                    </span>
                  </>
                )}
              </button>
              {message && <p className={/could not|failed|error|not supported|unavailable|sign in|used\. choose|shorten it|try again|requires|must |cannot /i.test(message) ? "error" : "app-status"}>{message}</p>}
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
                <button onClick={openMembershipPanel}>
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
                <span className="song-prompt">{descriptionFrom(song.prompt, song.generatedLyrics)}</span>
                {song.versionLabel && (
                  <span className="version-badge">{song.versionLabel}</span>
                )}
                <audio
                  ref={songAudio}
                  src={song.url}
                  onTimeUpdate={(event) => setPlaybackTime(event.currentTarget.currentTime)}
                  onSeeked={(event) => setPlaybackTime(event.currentTarget.currentTime)}
                  onEnded={() => { setPlaying(false); setPlaybackTime(0); }}
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
                  <section className="export-panel" onDoubleClick={(event) => { event.preventDefault(); event.stopPropagation(); }}>
                    <div className="export-song-summary">
                      <div className="export-song-art"><Music4 /></div>
                      <div><small>DOWNLOADING FROM</small><b>{song.title}</b><span>{songHasVocals ? `${song.versionLabel === "Revised version" ? "Revised version" : "Original song"} · Vocals` : `${song.versionLabel === "Revised version" ? "Revised version" : "Original"} instrumental`} · {Math.ceil(song.duration / 60)} min</span></div>
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
                      <button type="button" onClick={download}>
                        <Music4 />
                        <span>
                          <b>MP3 audio</b>
                          <small>Complete song · ready to play</small>
                        </span>
                      </button>
                      {songHasVocals && Boolean(song.generatedLyrics?.trim()) && (
                        <button type="button" onClick={() => setSingAlongOpen((value) => !value)}>
                          <Mic2 />
                          <span>
                            <b>Lyrics · Sing Along</b>
                            <small>Follow the lyrics while the finished song plays</small>
                          </span>
                        </button>
                      )}
                      {songHasVocals && (
                        <button onClick={() => void exportKaraokePackage()} disabled={karaokeBuilding}>
                          <Mic2 />
                          <span>
                            <b>{karaokeBuilding ? "Preparing karaoke…" : backingTrackStatus === "ready" ? "Download karaoke package · Creator" : "Karaoke package · Creator"}</b>
                            <small>{backingTrackStatus === "building" && !karaokeBuilding ? "Shared backing track is already being prepared · click to queue this package" : "Backing track + stored lyrics · no new song generation"}</small>
                          </span>
                        </button>
                      )}
                      {songHasVocals && (
                        <button onClick={() => void exportInstrumentalVersion()} disabled={instrumentalBuilding}>
                          <Music4 />
                          <span>
                            <b>{instrumentalBuilding ? "Preparing instrumental…" : backingTrackStatus === "ready" ? "Download instrumental version · Creator" : "Instrumental version · Creator"}</b>
                            <small>{backingTrackStatus === "building" && !instrumentalBuilding ? "Shared backing track is already being prepared · click to download when ready" : "Non-vocal backing track from separated stems"}</small>
                          </span>
                        </button>
                      )}
                      <button type="button" onClick={exportStems} disabled={sixStemStatus === "building"}>
                        <Waves />
                        <span>
                          <b>{sixStemStatus === "building" ? "Preparing six stems…" : sixStemStatus === "ready" ? "Download six stems ZIP · Creator" : "Six stems ZIP · Creator"}</b>
                          <small>Verified audible stems only · automatically falls back to vocals + instrumental if the detailed split is unusable</small>
                        </span>
                      </button>
                      <button type="button" onClick={exportLyrics}>
                        <FileAudio />
                        <span>
                          <b>Lyrics TXT</b>
                          <small>Exact planned lyrics for this version</small>
                        </span>
                      </button>
                      <button type="button" onClick={exportWav} title="WAV export" disabled={action === "Creating WAV…"}>
                        <Waves />
                        <span>
                          <b>
                            {action === "Creating WAV…" ? action : "PCM WAV · Creator"}
                          </b>
                          <small>Clean PCM WAV for editing · audio verified before download · player artwork is not standardized for WAV</small>
                        </span>
                      </button>
                    </div>
                  </section>
                )}
                {singAlongOpen && songHasVocals && Boolean(song.generatedLyrics?.trim()) && (
                  <section className="sing-along-panel">
                    <div className="panel-heading">
                      <span><Mic2 /></span>
                      <div><b>Sing Along</b><small>Follow-along timing is estimated from song progress; exact word-level timing is not claimed.</small></div>
                    </div>
                    <div className="sing-along-lines">
                      {(song.generatedLyrics?.trim() || "").split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line, index, rows) => {
                        const active = Math.min(rows.length - 1, Math.floor((playbackTime / Math.max(1, song.duration)) * rows.length)) === index;
                        return <p key={`${index}-${line}`} className={active && playing ? "active" : ""}>{line}</p>;
                      })}
                    </div>
                    <small className="sing-along-note">Play or seek the song above to follow along. Section labels remain visible when they are part of the stored lyrics.</small>
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
                  {hasPremiumTools && versionFamily.length > 1 && (
                    <section className="version-compare" aria-label="Compare song versions">
                      <div className="version-compare-head">
                        <div><b>Compare versions</b><span>Switch between versions at the same playback position. Comparing is free.</span></div>
                        <small>{versionFamily.length} linked versions</small>
                      </div>
                      <div className="version-compare-grid">
                        {versionFamily.map((item, index) => {
                          const active = comparePlayingId === item.id;
                          const preferred = preferredVersionId === item.id;
                          return (
                            <article key={item.id} className={`version-compare-card${preferred ? " preferred" : ""}`}>
                              <div className="version-compare-card-head">
                                <span>{compareVersionLabel(item, index)}</span>
                                {preferred && <em><Check /> Preferred</em>}
                              </div>
                              <b>{item.title}</b>
                              <small>{item.versionLabel && item.versionLabel !== "Revised version" ? item.versionLabel : item.parentId ? "A saved revision" : "The original song"}</small>
                              <div className="version-compare-actions">
                                <button type="button" onClick={() => void playComparedVersion(item)}>{active ? <CircleStop /> : <Play />}{active ? "Pause" : "Play"}</button>
                                <button type="button" className="keep-version" onClick={() => keepComparedVersion(item)} disabled={preferred}>{preferred ? "Kept" : "Keep this one"}</button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                      <div className="version-compare-position"><span>Comparison position</span><b>{Math.floor(comparePosition / 60)}:{String(Math.floor(comparePosition % 60)).padStart(2, "0")}</b></div>
                    </section>
                  )}
                  <div className="smart-revision-actions">
                    <div className="smart-revision-head">
                      <span><Sparkles /> Suggested for this song</span>
                      <small>Three relevant improvements, chosen from this song’s brief.</small>
                    </div>
                    <div className="revision-actions smart">
                      {suggestedRevisionActions.map((item) => (
                        <button key={`${item.label}-${item.versionLabel}`} onClick={() => item.label === "Fix pronunciation" ? openPronunciationFix() : reviseSong(item.prompt, item.versionLabel)}>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <details className="revision-more">
                    <summary>More changes</summary>
                    <div className="revision-actions">
                      <button onClick={openPronunciationFix}>
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
                  </details>
                  {pronunciationFixOpen && song?.mode !== "instrumental" && (
                    <section className="result-pronunciation-fix" aria-label="Edit lyrics and pronunciation">
                      <div className="result-pronunciation-head">
                        <div><b>Fix words & pronunciation</b><span>Edit only what needs changing. Your original song stays untouched.</span></div>
                        <button type="button" onClick={() => setPronunciationFixOpen(false)} aria-label="Close pronunciation editor"><X /></button>
                      </div>
                      <div className="result-lyric-editor">
                        <div className="result-editor-label"><b>Lyrics</b><span>Line-by-line editing</span></div>
                        {resultLyricLines.length ? resultLyricLines.map((line, index) => (
                          <label key={`result-lyric-${index}`} className="result-lyric-line">
                            <span>{index + 1}</span>
                            <input value={line} onChange={(event) => setResultLyricLines((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} aria-label={`Lyric line ${index + 1}`} />
                          </label>
                        )) : <p className="result-empty-lyrics">Lyrics were not stored for this version. You can still teach Cantoa pronunciations below.</p>}
                      </div>
                      <div className="result-pronunciation-memory">
                        <div className="result-editor-label"><b>Pronunciation memory</b><span>Saved privately to your Cantoa account when signed in</span></div>
                        <div className="result-pronunciation-add">
                          <input value={resultPronunciationTarget} onChange={(event) => setResultPronunciationTarget(event.target.value)} placeholder="Written word or name · e.g. Divya" />
                          <input value={resultPronunciationReading} onChange={(event) => setResultPronunciationReading(event.target.value)} placeholder="How it should sound · e.g. Div-yaa" />
                          <button type="button" onClick={() => void rememberPronunciation()}><Plus /> Remember</button>
                        </div>
                        {rememberedPronunciations.length > 0 && (
                          <div className="result-pronunciation-list">
                            {rememberedPronunciations.slice(0, 12).map((entry) => (
                              <span key={entry.id}><b>{entry.target}</b><em>→ {entry.reading}</em><button type="button" onClick={() => void forgetPronunciation(entry.id)} aria-label={`Forget ${entry.target}`}><X /></button></span>
                            ))}
                          </div>
                        )}
                        <small>Cantoa automatically applies remembered pronunciations only when the matching word appears in a future song. You can remove any memory here.</small>
                      </div>
                      <div className="result-pronunciation-actions">
                        <span>Saving a pronunciation does not use generation minutes. Creating the revised audio does.</span>
                        <button type="button" onClick={applyPronunciationAndLyricRevision}><WandSparkles /> Create revised version</button>
                      </div>
                    </section>
                  )}
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

                <details className="moment-lab" open={momentLabOpen} onToggle={(event) => setMomentLabOpen((event.currentTarget as HTMLDetailsElement).open)}>
                  <summary><span><Sparkles /> More with this song</span><small>Cantoa Moments · powerful tools stay tucked away until you want them</small></summary>
                  <div className="moment-lab-body">
                    <div className="moment-lab-intro">
                      <div><b>Cantoa Moments</b><span>Turn one finished song into a memory, a new chapter, a social moment or a reusable creative identity.</span></div>
                      <button className={emotionLock ? "active" : ""} onClick={(e) => { e.preventDefault(); setEmotionLock((value) => !value); notify(emotionLock ? "Emotion Lock turned off." : "Emotion Lock is on for future revisions."); }}><Heart /> {emotionLock ? "Feeling locked" : "Keep this feeling"}</button>
                    </div>
                    <div className="moment-lab-recommended">
                      <div className="moment-lab-recommended-head"><span><b>Try next</b><small>A few useful choices — everything else stays under More tools.</small></span></div>
                      <div className="moment-lab-recommended-grid">
                        <button onClick={() => void renderSocialVideo("vertical")} disabled={!socialVideoSupported || socialVideoRendering}><Video /><span><b>{socialVideoRendering && socialVideoFormat === "vertical" ? "Finding best moment…" : "Best Moment AI"}</b><small>Find a strong 15-second Reel moment automatically.</small></span></button>
                        <button onClick={() => void createMemoryCapsule()} disabled={!!action}><Gift /><span><b>Memory Capsule</b><small>Keep the song, story, photos and finished visuals together.</small></span></button>
                        <button onClick={() => prepareDerivedMoment("dna")}><Waves /><span><b>Song DNA</b><small>Reuse this song's creative identity in something new.</small></span></button>
                        <button onClick={() => void createGroupCollection()}><UserCircle /><span><b>Group Song <em className="creator-badge">Creator+</em></b><small>Invite people to add memories, ideas and votes privately.</small></span></button>
                      </div>
                    </div>
                    <details className="moment-lab-more-tools">
                      <summary><span><Sparkles /> More tools</span><small>Open only when you want extra creative, sharing or collaboration options.</small></summary>
                      <div className="moment-lab-grid">
                        <section>
                          <p>REMEMBER & REUSE</p>
                          <button onClick={exportSongPassport}><ShieldCheck /><span><b>Song Passport</b><small>Export identity, provenance and creation context.</small></span></button>
                          <button onClick={() => prepareDerivedMoment("next")}><Sparkles /><span><b>Living Song</b><small>Add a new life chapter without losing the feeling.</small></span></button>
                          <button onClick={() => prepareDerivedMoment("time")}><Sun /><span><b>Time Machine</b><small>Reimagine the same story at another milestone or era.</small></span></button>
                          <button onClick={() => prepareDerivedMoment("daily")}><Moon /><span><b>Daily Soundtrack</b><small>Carry this mood into a short soundtrack for today.</small></span></button>
                        </section>
                        <section>
                          <p>SHARE & REMIX</p>
                          <button onClick={() => void createAllShareFormats()} disabled={!socialVideoSupported || socialVideoRendering}><Share2 /><span><b>{socialVideoRendering ? "Video export in progress…" : "One song → many formats"}</b><small>Prepare Reel, square and lyric video when available.</small></span></button>
                          <button onClick={() => prepareDerivedMoment("reply")}><Send /><span><b>Song Reply</b><small>Answer this song with another original song.</small></span></button>
                          <button onClick={() => { if (!requirePremiumTool("My Voice")) return; setMyVoiceOpen((value) => !value); }}><Mic2 /><span><b>My Voice <em className="creator-badge">Creator+</em></b><small>Add a private spoken dedication or reusable voice profile.</small></span></button>
                          {songHasVocals && /hindi|spanish|punjabi|arabic|english|bilingual|multilingual/i.test(song.prompt) && <button onClick={() => reviseSong("Preserve the song and turn the vocal arrangement into a tasteful duet. Give each voice a distinct role, alternate sections naturally, and bring them together only where it strengthens the emotional payoff.", "Duet version")}><Mic2 /><span><b>Duet across languages</b><small>Turn multilingual vocals into a musical conversation.</small></span></button>}
                        </section>
                        <section>
                          <p>CREATE TOGETHER</p>
                          {groupCollectUrl && <button onClick={() => void useCollectedMemories()}><Download /><span><b>Build from group ideas <em className="creator-badge">Creator+</em></b><small>Use contributions and prioritize the ideas your group voted for.</small></span></button>}
                          {!groupCollectUrl && <button onClick={() => void copyGroupContributionRequest()}><Copy /><span><b>Collect by message</b><small>Copy a simple request for chat or email.</small></span></button>}
                          <button onClick={() => void createGroupCollection()}><UserCircle /><span><b>Create another Group Song <em className="creator-badge">Creator+</em></b><small>Start a private collection page for another group.</small></span></button>
                        </section>
                      </div>
                    </details>
                    {hasPremiumTools && myVoiceOpen && (
                      <section className="my-voice-panel">
                        <div className="my-voice-heading"><div><Mic2 /><span><b>My Voice</b><small>Add your own spoken message to this song now, or create a reusable voice profile for future messages.</small></span></div><button type="button" onClick={() => setMyVoiceOpen(false)} aria-label="Close My Voice"><X /></button></div>
                        <div className="my-voice-purpose"><b>Where should your voice go?</b><div><button type="button" className={myVoiceUse === "intro" ? "active" : ""} onClick={() => setMyVoiceUse("intro")}>Before the song</button><button type="button" className={myVoiceUse === "outro" ? "active" : ""} onClick={() => setMyVoiceUse("outro")}>After the song</button><button type="button" className={myVoiceUse === "message" ? "active" : ""} onClick={() => setMyVoiceUse("message")}>Standalone voice message</button></div><small>{myVoiceUse === "intro" ? "Your recording plays first, then the song starts." : myVoiceUse === "outro" ? "The song plays first, then your recording closes it." : "Creates a standalone voice message."}</small></div>
                        <div className="my-voice-quick">
                          <div className="my-voice-quick-head"><b>Quick voice message</b><small>No voice cloning required. Record the actual message you want to attach.</small></div>
                          <div className="my-voice-source"><button type="button" onClick={() => myVoiceRecording ? stopMyVoiceRecording() : void startMyVoiceRecording()}>{myVoiceRecording ? <CircleStop /> : <Mic2 />}{myVoiceRecording ? `Stop · ${myVoiceRecordSeconds}s` : "Record message"}</button><label className="my-voice-upload"><Upload /> Upload audio<input type="file" accept="audio/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setMyVoiceSample(file); setMyVoiceSampleName(file.name); setMyVoiceRecordSeconds(0); } event.currentTarget.value = ""; }} /></label><span>{myVoiceSampleName || "5–20 seconds is usually enough · 60 seconds max"}</span></div>
                          <small className="my-voice-quick-tip">Say something natural, for example: “Happy birthday, Mom. This song is for you.” By recording or uploading, you confirm you have permission to use this audio.</small>
                          {myVoiceSample && <div className="my-voice-actions"><button type="button" onClick={() => void previewRecordedVoiceMessage()}><Play /> Hear recording</button><button type="button" className="primary" onClick={() => void createSongWithRecordedVoiceMessage()} disabled={myVoiceCombining}>{myVoiceCombining ? "Combining…" : myVoiceUse === "message" ? "Download message" : `Create song + ${myVoiceUse}`}</button></div>}
                        </div>
                        <details className="my-voice-reusable" open={myVoiceProfiles.length > 0}>
                          <summary><Sparkles /><span><b>Reusable My Voice</b><small>Optional · create once, then type new spoken messages without recording again.</small></span></summary>
                          <div className="my-voice-reusable-body">
                            <div className="my-voice-clip"><label><span>Your spoken message</span><textarea value={myVoiceText} maxLength={300} onChange={(event) => setMyVoiceText(event.target.value)} rows={3} placeholder="e.g. Happy birthday, Mom. This song is for you." /></label><small>{myVoiceProfiles.length ? "Type anything here, then use Hear message or attach it to the song." : "This text becomes active after you create a reusable voice profile below."}</small></div>
                            {myVoiceProfiles.length > 0 && <div className="my-voice-ready"><div className="my-voice-profile-picker"><b>Voice profile</b>{myVoiceProfiles.map((profile) => <button type="button" key={profile.id} className={myVoiceSelectedId === profile.id ? "active" : ""} onClick={() => setMyVoiceSelectedId(profile.id)}>{profile.name}</button>)}</div>{(() => { const profile = myVoiceProfiles.find((item) => item.id === myVoiceSelectedId) || myVoiceProfiles[0]; return profile ? <div className="my-voice-actions"><button type="button" onClick={() => void previewMyVoice(profile)} disabled={myVoicePreviewingId === profile.id}><Play /> {myVoicePreviewingId === profile.id ? "Creating…" : "Hear message"}</button><button type="button" onClick={() => void previewMyVoice(profile, true)} disabled={myVoicePreviewingId === profile.id}><Download /> Download message</button><button type="button" className="primary" onClick={() => void createSongWithMyVoice(profile)} disabled={myVoiceCombining || myVoicePreviewingId === profile.id}>{myVoiceCombining ? "Combining…" : myVoiceUse === "message" ? "Download voice message" : `Create song + ${myVoiceUse}`}</button></div> : null; })()}<div className="my-voice-list">{myVoiceProfiles.map((profile) => <div key={profile.id}><span><b>{profile.name}</b><small>Private reusable voice</small></span><button type="button" className="remove" onClick={() => void deleteMyVoice(profile)}><Trash2 /> Delete</button></div>)}</div></div>}
                            {myVoiceProfiles.length < myVoiceLimit && <div className="my-voice-create"><label><span>Voice profile name</span><input value={myVoiceName} maxLength={60} onChange={(event) => setMyVoiceName(event.target.value)} placeholder="e.g. My Voice" /></label><small className="my-voice-clone-note">For a reusable cloned voice, a clean sample matters most. Around 30 seconds can work; longer clean audio may improve consistency. This is optional—the quick message above works without cloning.</small><label className="my-voice-consent"><input type="checkbox" checked={myVoiceConsent} onChange={(event) => setMyVoiceConsent(event.target.checked)} /><span>I confirm this is <b>my own voice</b> and I consent to Cantoa creating a private reusable voice profile from this sample.</span></label><button type="button" className="my-voice-create-button" onClick={() => void createMyVoice()} disabled={myVoiceCreating || !myVoiceSample || !myVoiceConsent}><Sparkles /> {myVoiceCreating ? "Creating voice…" : "Create reusable voice"}</button></div>}
                          </div>
                        </details>
                        {myVoiceLimit > 0 && <small className="my-voice-limit">{selectedPlan === "Studio" ? "Studio" : accountInfo?.isOwner ? "Owner" : "Creator"}: {myVoiceProfiles.length} of {myVoiceLimit} reusable voice profile{myVoiceLimit === 1 ? "" : "s"} used.</small>}
                      </section>
                    )}
                    <div className="secret-drop-row"><div><Gift /><span><b>Secret Song Drop</b><small>Schedule the gift page to stay locked until a future date and time.</small></span></div><input type="datetime-local" value={secretDropAt} min={new Date(Date.now()+120000).toISOString().slice(0,16)} onChange={(e)=>setSecretDropAt(e.target.value)} /><button onClick={() => void scheduleSecretDrop()} disabled={!secretDropAt}>Schedule drop</button></div>
                    {groupCollectUrl && <section className="group-share-card" aria-label="Group Song sharing page">
                      <div className="group-share-card-head">
                        <div className="group-share-icon"><UserCircle /></div>
                        <div><span className="group-share-eyebrow">GROUP SONG 2.0</span><b>Your Group Song page is ready</b><small>Share this unlisted page with friends or family. They can add memories, messages, song ideas, one photo and vote on what matters most.</small></div>
                      </div>
                      <div className="group-share-actions">
                        <button className="group-share-primary" onClick={() => void navigator.clipboard?.writeText(groupCollectUrl).then(()=>notify("Unlisted Group Song link copied.")).catch(()=>setMessage("Could not copy the group link."))}><Copy /> Copy unlisted link</button>
                        <button onClick={() => window.open(groupCollectUrl,"_blank","noopener,noreferrer")}><ExternalLink /> Open group page</button>
                      </div>
                      <div className="group-share-url"><span>{groupCollectUrl}</span><button aria-label="Copy Group Song link" onClick={() => void navigator.clipboard?.writeText(groupCollectUrl).then(()=>notify("Unlisted Group Song link copied.")).catch(()=>setMessage("Could not copy the group link."))}><Copy /></button></div>
                      <div className="group-share-steps" aria-label="How Group Song works">
                        <div><span>1</span><p><b>Share the link</b><small>Send the unlisted page to your group.</small></p></div>
                        <div><span>2</span><p><b>Collect ideas</b><small>They add memories, messages, song ideas and photos.</small></p></div>
                        <div><span>3</span><p><b>Build the song</b><small>Come back and choose Build from group ideas.</small></p></div>
                      </div>
                      <div className="group-share-footer">
                        <div className="group-share-stats"><span><b>{groupContributionCount}</b> contribution{groupContributionCount===1?"":"s"}</span><span><b>{groupVoteCount}</b> vote{groupVoteCount===1?"":"s"}</span></div>
                        <button className="group-share-refresh" onClick={() => void refreshGroupCollectionStatus()} disabled={groupStatusLoading}>{groupStatusLoading ? "Refreshing…" : "Refresh activity"}</button>
                        <small>Only people with this link can contribute. Your song stays private until you choose to share it elsewhere.</small>
                      </div>
                    </section>}
                    {currentSongDNA && <details className="song-dna-preview"><summary>See this song’s DNA</summary><div><span><b>Moment</b>{currentSongDNA.moment}</span><span><b>Language</b>{currentSongDNA.language}</span><span><b>Voice</b>{currentSongDNA.voice}</span><span><b>Style</b>{currentSongDNA.style}</span><span><b>Feeling</b>{currentSongDNA.emotion}</span></div></details>}
                    <small className="moment-lab-note">Cultural intelligence, story-to-chorus planning and quality checks run in the background. Actions that create a new song or revision can use generation minutes; packaging and social exports reuse your finished song.</small>
                  </div>
                </details>
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
                  <div className="v17-finish-actions finish-primary-actions">
                    <button className="finish-pack" onClick={exportCreatorPack} disabled={!!action}><Download /> Creator Pack</button>
                    <button className="finish-video" aria-label="15-sec Reel video" onClick={() => void renderSocialVideo("vertical")} disabled={socialVideoRendering || !song || !socialVideoSupported} title={!socialVideoSupported ? "Video rendering needs a browser with MediaRecorder and canvas capture support." : undefined}><Video /> {socialVideoRendering ? "Rendering video…" : socialVideoSupported ? "Make a Reel" : "Reel unavailable"}</button>
                    <button className="finish-gift" onClick={createGiftLink} disabled={shareCreating || accountInfo?.cloudConfigured === false}><Gift /> {shareCreating ? "Creating…" : accountInfo?.cloudConfigured === false ? "Gift page · setup needed" : publicShareUrl ? "Refresh gift page" : "Create gift page"}</button>
                    <button className="finish-record" onClick={exportRightsRecord}><ShieldCheck /> Creation record</button>
                  </div>
                  <details className="finish-more">
                    <summary><span>More export & sharing options</span><small>Square, lyric, memory, business and gift-link tools.</small></summary>
                    <div className="v17-finish-actions finish-secondary-actions">
                      <button className="finish-video-alt" aria-label="Square social video" onClick={() => void renderSocialVideo("square")} disabled={socialVideoRendering || !song || !socialVideoSupported} title={!socialVideoSupported ? "Video rendering needs a browser with MediaRecorder and canvas capture support." : undefined}><Video /> {socialVideoSupported ? "Square video" : "Square unavailable"}</button>
                      {resultIntentPlan.lyricVideo && <button className="finish-lyric-video" onClick={() => void renderSocialVideo("lyrics")} disabled={socialVideoRendering || !song || !socialVideoSupported}><Video /> Lyric video</button>}
                      {memoryPhotos.length > 0 && <button className="finish-memory" onClick={() => void renderMemoryMovie()} disabled={memoryMovieRendering || !song || !socialVideoSupported}><Sparkles /> {memoryMovieRendering ? "Creating Memory Movie…" : "Memory Movie"}</button>}
                      {(inferMomentIdFromBrief(song.prompt) === "business" || resultIntentPlan.jinglePack) && <button className="finish-jingle" onClick={() => void createJinglePack()} disabled={jinglePackBuilding || !song}><Building2 /> {jinglePackBuilding ? "Creating jingle pack…" : "15/30/60 jingle pack"}</button>}
                      {publicShareUrl && <button className="finish-copy" onClick={() => {void navigator.clipboard?.writeText(publicShareUrl).then(() => notify("Share link copied")).catch(() => setMessage("Could not copy the share link in this browser."));}}><Copy /> Copy gift link</button>}
                      {publicShareUrl && <button className="finish-open" onClick={() => window.open(publicShareUrl,"_blank","noopener,noreferrer")}><ExternalLink /> Open gift page</button>}
                    </div>
                  </details>
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
                {message && <p className={/could not|failed|error|not supported|unavailable|sign in|used\. choose|shorten it|try again|requires|must |cannot /i.test(message) ? "error" : "app-status"}>{message}</p>}
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
                  <button onClick={openAccountPanel}>
                    <UserCircle /> Sign in to sync
                  </button>
                )}
                <button onClick={newSong}>
                  <Plus /> Create a song
                </button>
              </div>
            </div>
            {library.length > 0 && (
              <div className="library-tools" aria-label="Library search and filters">
                <input
                  type="search"
                  value={libraryQuery}
                  onChange={(event) => setLibraryQuery(event.target.value)}
                  placeholder="Search your songs…"
                  aria-label="Search your songs"
                />
                <select value={libraryFilter} onChange={(event) => setLibraryFilter(event.target.value as typeof libraryFilter)} aria-label="Filter library">
                  <option value="all">All songs</option>
                  <option value="vocal">Vocals</option>
                  <option value="instrumental">Instrumentals</option>
                  <option value="revised">Revised versions</option>
                </select>
              </div>
            )}
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
            ) : filteredLibrary.length === 0 ? (
              <div className="library-empty compact">
                <Music2 />
                <h2>No songs match</h2>
                <span>Try a different search or filter.</span>
              </div>
            ) : (
              <div className="library-grid">
                {filteredLibrary.map((item) => (
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
            {message && <p className={/could not|failed|error|not supported|unavailable|sign in|used\. choose|shorten it|try again|requires|must |cannot /i.test(message) ? "error" : "app-status"}>{message}</p>}
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
                  <button onClick={() => choosePlan("Explore")} disabled={accountInfo?.plan === "Explore"}>
                    {accountInfo?.plan === "Explore" ? <><Check /> Current plan</> : <>Use Explore</>}
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
                  <button onClick={() => choosePlan("Creator")} disabled={accountInfo?.plan === "Creator"}>
                    {accountInfo?.plan === "Creator" ? <><Check /> Current plan</> : <><Crown /> Subscribe securely</>}
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
                  <button onClick={() => choosePlan("Studio")} disabled={accountInfo?.plan === "Studio"}>
                    {accountInfo?.plan === "Studio" ? <><Check /> Current plan</> : <><Crown /> Subscribe securely</>}
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
