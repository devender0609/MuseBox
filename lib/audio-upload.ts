export const CANTOA_AUDIO_MIME_TYPES = new Set([
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave",
  "audio/webm", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/flac", "audio/x-flac",
]);

export function isSupportedAudioFile(file: File) {
  const type = String(file.type || "").toLowerCase();
  if (type && CANTOA_AUDIO_MIME_TYPES.has(type)) return true;
  const name = String(file.name || "").toLowerCase();
  return /\.(mp3|wav|webm|ogg|m4a|mp4|aac|flac)$/.test(name);
}
