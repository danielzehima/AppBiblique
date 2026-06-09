/**
 * Annotations personnelles locales : surlignages, notes, marque-pages.
 * Tables créées dans initBible() (toujours présentes, jamais effacées au ré-import).
 */
import { getDb } from '@/db/bible';

export type ChapterAnnotations = {
  highlights: Record<number, string>; // verse -> color key
  notes: Record<number, string>; // verse -> contenu
  bookmarks: Set<number>; // versets marqués
};

export type NoteItem = {
  book: number;
  chapter: number;
  verse: number;
  content: string;
  updated_at: number;
};
export type BookmarkItem = {
  book: number;
  chapter: number;
  verse: number;
  created_at: number;
};

/** Charge toutes les annotations d'un chapitre en une fois. */
export async function getChapterAnnotations(
  book: number,
  chapter: number,
): Promise<ChapterAnnotations> {
  const db = await getDb();
  const [hl, nt, bm] = await Promise.all([
    db.getAllAsync<{ verse: number; color: string }>(
      `SELECT verse, color FROM highlights WHERE book = ? AND chapter = ?`,
      [book, chapter],
    ),
    db.getAllAsync<{ verse: number; content: string }>(
      `SELECT verse, content FROM notes WHERE book = ? AND chapter = ?`,
      [book, chapter],
    ),
    db.getAllAsync<{ verse: number }>(
      `SELECT verse FROM bookmarks WHERE book = ? AND chapter = ?`,
      [book, chapter],
    ),
  ]);

  const highlights: Record<number, string> = {};
  for (const h of hl) highlights[h.verse] = h.color;
  const notes: Record<number, string> = {};
  for (const n of nt) notes[n.verse] = n.content;
  const bookmarks = new Set<number>(bm.map((b) => b.verse));

  return { highlights, notes, bookmarks };
}

/** Définit (ou retire si color = null) le surlignage d'un verset. */
export async function setHighlight(
  book: number,
  chapter: number,
  verse: number,
  color: string | null,
): Promise<void> {
  const db = await getDb();
  if (color) {
    await db.runAsync(
      `INSERT OR REPLACE INTO highlights (book, chapter, verse, color) VALUES (?, ?, ?, ?)`,
      [book, chapter, verse, color],
    );
  } else {
    await db.runAsync(`DELETE FROM highlights WHERE book = ? AND chapter = ? AND verse = ?`, [
      book,
      chapter,
      verse,
    ]);
  }
}

/** Crée/met à jour (ou supprime si vide) la note d'un verset. */
export async function saveNote(
  book: number,
  chapter: number,
  verse: number,
  content: string,
): Promise<void> {
  const db = await getDb();
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    await db.runAsync(`DELETE FROM notes WHERE book = ? AND chapter = ? AND verse = ?`, [
      book,
      chapter,
      verse,
    ]);
  } else {
    await db.runAsync(
      `INSERT OR REPLACE INTO notes (book, chapter, verse, content, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [book, chapter, verse, trimmed, Date.now()],
    );
  }
}

/** Bascule le marque-page d'un verset. Renvoie le nouvel état. */
export async function toggleBookmark(
  book: number,
  chapter: number,
  verse: number,
): Promise<boolean> {
  const db = await getDb();
  const existing = await db.getFirstAsync(
    `SELECT 1 FROM bookmarks WHERE book = ? AND chapter = ? AND verse = ?`,
    [book, chapter, verse],
  );
  if (existing) {
    await db.runAsync(`DELETE FROM bookmarks WHERE book = ? AND chapter = ? AND verse = ?`, [
      book,
      chapter,
      verse,
    ]);
    return false;
  }
  await db.runAsync(
    `INSERT INTO bookmarks (book, chapter, verse, created_at) VALUES (?, ?, ?, ?)`,
    [book, chapter, verse, Date.now()],
  );
  return true;
}

export async function getAllNotes(): Promise<NoteItem[]> {
  const db = await getDb();
  return db.getAllAsync<NoteItem>(
    `SELECT book, chapter, verse, content, updated_at FROM notes ORDER BY updated_at DESC`,
  );
}

export async function getAllBookmarks(): Promise<BookmarkItem[]> {
  const db = await getDb();
  return db.getAllAsync<BookmarkItem>(
    `SELECT book, chapter, verse, created_at FROM bookmarks ORDER BY created_at DESC`,
  );
}
