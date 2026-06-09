/**
 * Couche d'accès à la Bible via SQLite (lecture hors-ligne).
 * Import du texte Segond au premier lancement, puis requêtes livres/chapitres/versets.
 */
import * as SQLite from 'expo-sqlite';

import { segond } from '@/data/segond';

const DB_NAME = 'demeure.db';
/** Incrémenter pour forcer un ré-import (changement de données). */
const DATA_VERSION = 1;

export type BookRow = {
  nr: number;
  name: string;
  testament: 'AT' | 'NT';
  chapter_count: number;
};
export type VerseRow = { verse: number; text: string };

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  return dbPromise;
}

/**
 * Crée le schéma et importe le texte si nécessaire.
 * @param onProgress 0 → 1 pendant l'import initial.
 */
export async function initBible(onProgress?: (p: number) => void): Promise<void> {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS books (
      nr INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      testament TEXT NOT NULL,
      chapter_count INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS verses (
      book INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_verses_ref ON verses(book, chapter, verse);
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
  `);

  const meta = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = 'data_version'`,
  );
  if (meta?.value === String(DATA_VERSION)) {
    onProgress?.(1);
    return; // déjà importé
  }

  // (Ré)import complet
  await db.execAsync(`DELETE FROM verses; DELETE FROM books;`);

  // Aplatissement des versets pour des insertions groupées (rapides).
  const verseRows: [number, number, number, string][] = [];
  for (const b of segond.books) {
    for (const c of b.chapters) {
      for (const v of c.verses) verseRows.push([b.nr, c.c, v.n, v.t]);
    }
  }

  const CHUNK = 200; // 200 lignes * 4 paramètres = 800 (< limite SQLite de 999)
  await db.withTransactionAsync(async () => {
    for (const b of segond.books) {
      await db.runAsync(
        `INSERT OR REPLACE INTO books (nr, name, testament, chapter_count) VALUES (?, ?, ?, ?)`,
        [b.nr, b.name, b.testament, b.chapters.length],
      );
    }
    for (let i = 0; i < verseRows.length; i += CHUNK) {
      const slice = verseRows.slice(i, i + CHUNK);
      const placeholders = slice.map(() => '(?, ?, ?, ?)').join(', ');
      const args = slice.flat();
      await db.runAsync(
        `INSERT INTO verses (book, chapter, verse, text) VALUES ${placeholders}`,
        args,
      );
      onProgress?.(Math.min(1, (i + CHUNK) / verseRows.length));
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO meta (key, value) VALUES ('data_version', ?)`,
      [String(DATA_VERSION)],
    );
  });
  onProgress?.(1);
}

export async function getBooks(): Promise<BookRow[]> {
  const db = await getDb();
  return db.getAllAsync<BookRow>(`SELECT nr, name, testament, chapter_count FROM books ORDER BY nr`);
}

export async function getBook(nr: number): Promise<BookRow | null> {
  const db = await getDb();
  return db.getFirstAsync<BookRow>(
    `SELECT nr, name, testament, chapter_count FROM books WHERE nr = ?`,
    [nr],
  );
}

export async function getChapterVerses(book: number, chapter: number): Promise<VerseRow[]> {
  const db = await getDb();
  return db.getAllAsync<VerseRow>(
    `SELECT verse, text FROM verses WHERE book = ? AND chapter = ? ORDER BY verse`,
    [book, chapter],
  );
}
