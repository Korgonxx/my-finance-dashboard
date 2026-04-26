"use client";

const API_KEY_STORAGE = "fv_api_key";

// In-memory key
let apiKey = "";

// FIX: Initialise key synchronously on module load so it is available
// before any useEffect fires in app/page.tsx.
if (typeof window !== "undefined") {
  apiKey = sessionStorage.getItem(API_KEY_STORAGE) || "";
}

export function setApiKey(key: string) {
  apiKey = key;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(API_KEY_STORAGE, key);
  }
}

export function getApiKey(): string {
  // Re-read from sessionStorage if in-memory value is empty (e.g. after SSR hydration)
  if (!apiKey && typeof window !== "undefined") {
    apiKey = sessionStorage.getItem(API_KEY_STORAGE) || "";
  }
  return apiKey;
}

export function clearApiKey() {
  apiKey = "";
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(API_KEY_STORAGE);
  }
}

// Authenticated fetch wrapper
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const key = getApiKey();
  const headers = new Headers(options.headers || {});
  if (key) headers.set("x-api-key", key);

  return fetch(url, { ...options, headers });
}