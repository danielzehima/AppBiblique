/**
 * Couche d'accès à la Bible via SQLite (lecture hors-ligne + recherche).
 * Import du texte Segond au premier lancement, puis requêtes livres/chapitres/versets.
 */
import * as SQLite from 'expo-sqlite';

import { segond } from '@/data/segond';

const DB_NAME = 'demeure.db';
/** Incrémenter pour forcer un ré-import (changement de schéma ou de données). */
const DATA_VERSION = 2;

export type BookRow = {
  nr: number;
  name: string;
  testament: 'AT' | 'NT';
  chapter_count: number;
};
export type VerseRow = { verse: number; text: string };
export type SearchResult = {
  book: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};
export type Reference = { book: number; name: string; chapter: number; verse?: number };

/** Minuscule + suppression des accents (recherche insensible accents/casse). */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

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
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);

    -- Annotations personnelles (persistantes, jamais effacées au ré-import du texte)
    CREATE TABLE IF NOT EXISTS highlights (
      book INTEGER NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL,
      color TEXT NOT NULL,
      PRIMARY KEY (book, chapter, verse)
    );
    CREATE TABLE IF NOT EXISTS notes (
      book INTEGER NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL,
      content TEXT NOT NULL, updated_at INTEGER NOT NULL,
      PRIMARY KEY (book, chapter, verse)
    );
    CREATE TABLE IF NOT EXISTS bookmarks (
      book INTEGER NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (book, chapter, verse)
    );
    CREATE TABLE IF NOT EXISTS reading_progress (
      book INTEGER NOT NULL, chapter INTEGER NOT NULL,
      read_at INTEGER NOT NULL,
      PRIMARY KEY (book, chapter)
    );
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book INTEGER NOT NULL, score INTEGER NOT NULL, total INTEGER NOT NULL,
      completed_at INTEGER NOT NULL
    );
  `);

  const meta = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = 'data_version'`,
  );
  if (meta?.value === String(DATA_VERSION)) {
    onProgress?.(1);
    return; // déjà importé
  }

  // (Ré)import complet : on repart d'un schéma propre.
  await db.execAsync(`
    DROP TABLE IF EXISTS verses;
    DROP TABLE IF EXISTS books;
    CREATE TABLE books (
      nr INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      testament TEXT NOT NULL,
      chapter_count INTEGER NOT NULL
    );
    CREATE TABLE verses (
      book INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      text_norm TEXT NOT NULL
    );
    CREATE INDEX idx_verses_ref ON verses(book, chapter, verse);
  `);

  // Aplatissement des versets pour des insertions groupées (rapides).
  const verseRows: [number, number, number, string, string][] = [];
  for (const b of segond.books) {
    for (const c of b.chapters) {
      for (const v of c.verses) verseRows.push([b.nr, c.c, v.n, v.t, normalize(v.t)]);
    }
  }

  const CHUNK = 150; // 150 lignes * 5 paramètres = 750 (< limite SQLite de 999)
  await db.withTransactionAsync(async () => {
    for (const b of segond.books) {
      await db.runAsync(
        `INSERT OR REPLACE INTO books (nr, name, testament, chapter_count) VALUES (?, ?, ?, ?)`,
        [b.nr, b.name, b.testament, b.chapters.length],
      );
    }
    for (let i = 0; i < verseRows.length; i += CHUNK) {
      const slice = verseRows.slice(i, i + CHUNK);
      const placeholders = slice.map(() => '(?, ?, ?, ?, ?)').join(', ');
      const args = slice.flat();
      await db.runAsync(
        `INSERT INTO verses (book, chapter, verse, text, text_norm) VALUES ${placeholders}`,
        args,
      );
      onProgress?.(Math.min(1, (i + CHUNK) / verseRows.length));
    }
    await db.runAsync(`INSERT OR REPLACE INTO meta (key, value) VALUES ('data_version', ?)`, [
      String(DATA_VERSION),
    ]);
  });
  onProgress?.(1);
}

let booksCache: BookRow[] | null = null;

export async function getBooks(): Promise<BookRow[]> {
  if (booksCache) return booksCache;
  const db = await getDb();
  booksCache = await db.getAllAsync<BookRow>(
    `SELECT nr, name, testament, chapter_count FROM books ORDER BY nr`,
  );
  return booksCache;
}

export async function getBook(nr: number): Promise<BookRow | null> {
  const books = await getBooks();
  return books.find((b) => b.nr === nr) ?? null;
}

export async function getChapterVerses(book: number, chapter: number): Promise<VerseRow[]> {
  const db = await getDb();
  return db.getAllAsync<VerseRow>(
    `SELECT verse, text FROM verses WHERE book = ? AND chapter = ? ORDER BY verse`,
    [book, chapter],
  );
}

/** Recherche plein-texte (par mot), insensible aux accents et à la casse. */
export async function searchVersesByWord(query: string, limit = 200): Promise<SearchResult[]> {
  const q = normalize(query);
  if (q.length < 2) return [];
  const db = await getDb();
  return db.getAllAsync<SearchResult>(
    `SELECT v.book AS book, b.name AS bookName, v.chapter AS chapter, v.verse AS verse, v.text AS text
     FROM verses v JOIN books b ON b.nr = v.book
     WHERE v.text_norm LIKE ?
     ORDER BY v.book, v.chapter, v.verse
     LIMIT ?`,
    [`%${q}%`, limit],
  );
}

/** Interprète une référence type « Jean 3:16 » ou « Genèse 1 ». */
export async function resolveReference(query: string): Promise<Reference | null> {
  const m = query.trim().match(/^(\d?\s?[^\d]+?)\s+(\d{1,3})(?:\s*[:.\s]\s*(\d{1,3}))?\s*$/u);
  if (!m) return null;
  const nameNorm = normalize(m[1]);
  if (nameNorm.length < 2) return null;
  const chapter = Number(m[2]);
  const verse = m[3] ? Number(m[3]) : undefined;

  const books = await getBooks();
  const found =
    books.find((b) => normalize(b.name).startsWith(nameNorm)) ??
    books.find((b) => normalize(b.name).includes(nameNorm));
  if (!found) return null;
  if (chapter < 1 || chapter > found.chapter_count) return null;

  return { book: found.nr, name: found.name, chapter, verse };
}
