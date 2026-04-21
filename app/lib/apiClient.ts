"use client";

const API_KEY_STORAGE = "fv_api_key";

// API key - verified client-side against passcode hash
let apiKey = "";

export function setApiKey(key: string) {
  apiKey = key;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(API_KEY_STORAGE, key);
  }
}

export function getApiKey(): string {
  if (apiKey) return apiKey;
  if (typeof window !== "undefined") {
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
