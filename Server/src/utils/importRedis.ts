import { redis } from "../config/redis.js";
import type { ImportSession } from "../types/import.js";

const TTL_SECONDS = 60 * 60 * 24; // 24 hours — abandoned sessions expire on their own

function importKey(workspaceId: string, sessionId: string): string {
  return `import:${workspaceId}:${sessionId}`;
}

export async function saveImportSession(
  workspaceId: string,
  sessionId: string,
  session: ImportSession
): Promise<void> {
  await redis.set(importKey(workspaceId, sessionId), JSON.stringify(session), "EX", TTL_SECONDS);
}

export async function getImportSession(
  workspaceId: string,
  sessionId: string
): Promise<ImportSession | null> {
  const raw = await redis.get(importKey(workspaceId, sessionId));
  return raw ? (JSON.parse(raw) as ImportSession) : null;
}

export async function deleteImportSession(workspaceId: string, sessionId: string): Promise<void> {
  await redis.del(importKey(workspaceId, sessionId));
}