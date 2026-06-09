/**
 * Texte Segond 1910 embarqué (domaine public).
 * Le JSON est chargé via require pour éviter une inférence de type lourde par tsc.
 */

export type Verse = { n: number; t: string };
export type Chapter = { c: number; verses: Verse[] };
export type Testament = 'AT' | 'NT';
export type Book = {
  nr: number;
  name: string;
  testament: Testament;
  chapters: Chapter[];
};
export type Bible = {
  code: string;
  name: string;
  lang: string;
  source: string;
  books: Book[];
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const segond: Bible = require('../../assets/bibles/segond1910.json');
