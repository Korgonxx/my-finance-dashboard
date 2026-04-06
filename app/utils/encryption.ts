/**
 * Encryption utilities using Web Crypto API
 * For secure client-side encryption of sensitive data
 */

/**
 * Generate a key from a passcode using PBKDF2
 */
async function deriveKeyFromPasscode(
  passcode: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passcode),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    passphraseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt data with a passcode
 * Returns a JSON object with encrypted data, IV, and salt (all base64 encoded)
 */
export async function encryptData(
  data: string,
  passcode: string
): Promise<{
  encryptedData: string;
  iv: string;
  salt: string;
}> {
  try {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key from passcode
    const key = await deriveKeyFromPasscode(passcode, salt);

    // Encrypt the data
    const encoder = new TextEncoder();
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoder.encode(data)
    );

    // Convert to base64 for storage
    const encryptedData = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    const saltStr = btoa(String.fromCharCode(...salt));
    const ivStr = btoa(String.fromCharCode(...iv));

    return {
      encryptedData,
      iv: ivStr,
      salt: saltStr,
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt data with a passcode
 */
export async function decryptData(
  encryptedData: string,
  passcode: string,
  salt: string,
  iv: string
): Promise<string> {
  try {
    // Convert from base64
    const encryptedBuffer = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
    const saltBuffer = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0));
    const ivBuffer = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));

    // Derive key from passcode using the same salt
    const key = await deriveKeyFromPasscode(passcode, saltBuffer);

    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer },
      key,
      encryptedBuffer
    );

    // Convert buffer to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data - incorrect passcode or corrupted data");
  }
}

/**
 * Hash a passcode for verification (using SHA-256)
 * Used to verify master passcode without storing it in plaintext
 */
export async function hashPasscode(passcode: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passcode);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify a passcode against a hash
 */
export async function verifyPasscode(
  passcode: string,
  hash: string
): Promise<boolean> {
  const computed = await hashPasscode(passcode);
  return computed === hash;
}

/**
 * Generate a masked version of data
 * Shows only first and last 4 characters, rest are replaced with asterisks
 */
export function maskData(data: string): string {
  if (data.length <= 8) {
    return data.replace(/./g, "*");
  }
  const first = data.slice(0, 4);
  const last = data.slice(-4);
  const middle = "*".repeat(data.length - 8);
  return `${first}${middle}${last}`;
}
