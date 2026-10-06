const encoder = new TextEncoder();

function getSecret() {
  return process.env.SESSION_SECRET || process.env.API_KEY || (process.env.NODE_ENV === "development" ? "local-development-session-secret" : "");
}

function toBase64Url(value: ArrayBuffer | string) {
  const bytes = typeof value === "string" ? encoder.encode(value) : new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
}

async function sign(value: string) {
  const secret = getSecret();
  if (!secret) return "";
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export async function createSessionToken(ttlSeconds = 60 * 60 * 12) {
  const payload = `${Date.now() + ttlSeconds * 1000}`;
  const signature = await sign(payload);
  return signature ? `${toBase64Url(payload)}.${signature}` : "";
}

export async function verifySessionToken(token?: string | null) {
  if (!token) return false;
  const [encodedExpiry, signature] = token.split(".");
  if (!encodedExpiry || !signature) return false;
  try {
    const expiry = Number(fromBase64Url(encodedExpiry));
    if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
    const payload = fromBase64Url(encodedExpiry);
    const expected = await sign(payload);
    return Boolean(expected) && expected === signature;
  } catch {
    return false;
  }
}
