// cloudSync.ts
// Cloud sync is handled via Firestore. This module is a stub until
// Firebase integration is fully wired. Data is persisted in Vercel
// Postgres via /api/entries for local storage.

export async function saveDashboardState(_id: string, _payload: unknown): Promise<void> {
  // TODO: Implement Firestore sync
  // await setDoc(doc(db, "syncs", id), { payload, updatedAt: serverTimestamp() });
  console.warn("[cloudSync] saveDashboardState is not yet implemented");
}

export async function loadDashboardState(_id: string): Promise<any | null> {
  // TODO: Implement Firestore sync
  // const snap = await getDoc(doc(db, "syncs", id));
  // return snap.exists() ? snap.data().payload : null;
  console.warn("[cloudSync] loadDashboardState is not yet implemented");
  return null;
}