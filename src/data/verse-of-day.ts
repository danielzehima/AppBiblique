/** Versets du jour (références bien connues). Sélection déterministe selon le jour. */
export type VerseRef = { book: number; chapter: number; verse: number };

const VERSES: VerseRef[] = [
  { book: 43, chapter: 3, verse: 16 }, // Jean 3:16
  { book: 19, chapter: 23, verse: 1 }, // Psaumes 23:1
  { book: 20, chapter: 3, verse: 5 }, // Proverbes 3:5
  { book: 50, chapter: 4, verse: 13 }, // Philippiens 4:13
  { book: 45, chapter: 8, verse: 28 }, // Romains 8:28
  { book: 23, chapter: 41, verse: 10 }, // Ésaïe 41:10
  { book: 6, chapter: 1, verse: 9 }, // Josué 1:9
  { book: 24, chapter: 29, verse: 11 }, // Jérémie 29:11
  { book: 40, chapter: 11, verse: 28 }, // Matthieu 11:28
  { book: 19, chapter: 119, verse: 105 }, // Psaumes 119:105
  { book: 48, chapter: 2, verse: 20 }, // Galates 2:20
  { book: 50, chapter: 4, verse: 6 }, // Philippiens 4:6
  { book: 45, chapter: 12, verse: 2 }, // Romains 12:2
  { book: 23, chapter: 40, verse: 31 }, // Ésaïe 40:31
  { book: 46, chapter: 13, verse: 4 }, // 1 Corinthiens 13:4
  { book: 43, chapter: 14, verse: 6 }, // Jean 14:6
  { book: 40, chapter: 6, verse: 33 }, // Matthieu 6:33
  { book: 19, chapter: 27, verse: 1 }, // Psaumes 27:1
  { book: 58, chapter: 11, verse: 1 }, // Hébreux 11:1
  { book: 55, chapter: 1, verse: 7 }, // 2 Timothée 1:7
  { book: 43, chapter: 8, verse: 12 }, // Jean 8:12
  { book: 19, chapter: 37, verse: 4 }, // Psaumes 37:4
  { book: 33, chapter: 6, verse: 8 }, // Michée 6:8
  { book: 60, chapter: 5, verse: 7 }, // 1 Pierre 5:7
  { book: 59, chapter: 1, verse: 5 }, // Jacques 1:5
  { book: 45, chapter: 5, verse: 8 }, // Romains 5:8
  { book: 19, chapter: 1, verse: 1 }, // Psaumes 1:1
  { book: 19, chapter: 91, verse: 1 }, // Psaumes 91:1
  { book: 19, chapter: 121, verse: 1 }, // Psaumes 121:1
  { book: 19, chapter: 139, verse: 14 }, // Psaumes 139:14
  { book: 19, chapter: 34, verse: 8 }, // Psaumes 34:8
  { book: 19, chapter: 103, verse: 1 }, // Psaumes 103:1
  { book: 20, chapter: 3, verse: 6 }, // Proverbes 3:6
  { book: 20, chapter: 18, verse: 10 }, // Proverbes 18:10
  { book: 23, chapter: 26, verse: 3 }, // Ésaïe 26:3
  { book: 23, chapter: 53, verse: 5 }, // Ésaïe 53:5
  { book: 25, chapter: 3, verse: 22 }, // Lamentations 3:22
  { book: 40, chapter: 5, verse: 16 }, // Matthieu 5:16
  { book: 40, chapter: 28, verse: 19 }, // Matthieu 28:19
  { book: 40, chapter: 7, verse: 7 }, // Matthieu 7:7
  { book: 43, chapter: 1, verse: 1 }, // Jean 1:1
  { book: 43, chapter: 10, verse: 10 }, // Jean 10:10
  { book: 43, chapter: 15, verse: 5 }, // Jean 15:5
  { book: 47, chapter: 5, verse: 17 }, // 2 Corinthiens 5:17
  { book: 48, chapter: 5, verse: 22 }, // Galates 5:22
  { book: 49, chapter: 2, verse: 8 }, // Éphésiens 2:8
  { book: 51, chapter: 3, verse: 23 }, // Colossiens 3:23
  { book: 52, chapter: 5, verse: 16 }, // 1 Thessaloniciens 5:16
  { book: 58, chapter: 13, verse: 8 }, // Hébreux 13:8
  { book: 62, chapter: 4, verse: 8 }, // 1 Jean 4:8
  { book: 66, chapter: 3, verse: 20 }, // Apocalypse 3:20
  { book: 5, chapter: 31, verse: 6 }, // Deutéronome 31:6
];

/** Renvoie la référence du jour (change chaque jour). */
export function getVerseOfDay(): VerseRef {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return VERSES[dayOfYear % VERSES.length];
}
