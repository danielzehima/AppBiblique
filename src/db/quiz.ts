/**
 * Progression de lecture + résultats de quiz (locaux).
 */
import { getDb } from '@/db/bible';

/** Marque un chapitre comme lu (idempotent). */
export async function markChapterRead(book: number, chapter: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO reading_progress (book, chapter, read_at) VALUES (?, ?, ?)`,
    [book, chapter, Date.now()],
  );
}

/** Dernier chapitre ouvert (pour « Continuer la lecture »), ou null. */
export async function getLastRead(): Promise<{ book: number; chapter: number } | null> {
  const db = await getDb();
  return db.getFirstAsync<{ book: number; chapter: number }>(
    `SELECT book, chapter FROM reading_progress ORDER BY read_at DESC LIMIT 1`,
  );
}

/** Nombre de chapitres lus dans un livre. */
export async function getReadCount(book: number): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM reading_progress WHERE book = ?`,
    [book],
  );
  return row?.n ?? 0;
}

/** Enregistre un résultat de quiz. */
export async function saveQuizAttempt(
  book: number,
  score: number,
  total: number,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO quiz_attempts (book, score, total, completed_at) VALUES (?, ?, ?, ?)`,
    [book, score, total, Date.now()],
  );
}

export type BestScore = { score: number; total: number };

/** Meilleur score obtenu pour un livre (ou null). */
export async function getBestScore(book: number): Promise<BestScore | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<BestScore>(
    `SELECT score, total FROM quiz_attempts WHERE book = ? ORDER BY score DESC, completed_at DESC LIMIT 1`,
    [book],
  );
  return row ?? null;
}
