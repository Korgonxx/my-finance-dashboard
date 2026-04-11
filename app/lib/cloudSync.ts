// cloudSync.ts — stub, data is now persisted in Vercel Postgres via /api/entries

export async function saveDashboardState(id: string, payload: unknown): Promise<void> {
  await fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ syncId: id, payload }),
  }).catch(() => {});
}

export async function loadDashboardState(id: string): Promise<any | null> {
  return null;
}
