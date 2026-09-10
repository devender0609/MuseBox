export function isCantoaOwner(email?: string | null) {
  if (!email) return false;
  const owners = [
    "devender0309@gmail.com",
    ...(process.env.CANTOA_OWNER_EMAILS || "").split(","),
  ]
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return owners.includes(email.trim().toLowerCase());
}
