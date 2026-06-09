/**
 * Construit le fichier compact de la Bible Segond 1910 embarqué dans l'app.
 *
 * Source : API publique getBible (https://api.getbible.net/v2/ls1910.json)
 * Texte Louis Segond 1910 — domaine public.
 *
 * Usage :
 *   1) curl -s https://api.getbible.net/v2/ls1910.json -o scripts/_raw_ls1910.json
 *   2) node scripts/build-bible.mjs
 *
 * Sortie : assets/bibles/segond1910.json
 */
import fs from 'node:fs';
import path from 'node:path';

const RAW = 'scripts/_raw_ls1910.json';
const OUT_DIR = 'assets/bibles';
const OUT = path.join(OUT_DIR, 'segond1910.json');

const clean = (s) =>
  String(s)
    .replace(/\s+/g, ' ') // espaces multiples -> simple
    .replace(/\s+([;:!?.,»])/g, '$1') // espace avant ponctuation simple
    .trim();

const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));

let totalVerses = 0;
let gaps = 0;

const books = raw.books.map((b) => {
  const testament = b.nr <= 39 ? 'AT' : 'NT';
  const chapters = b.chapters.map((c) => {
    let expected = 1;
    const verses = c.verses.map((v) => {
      if (v.verse !== expected) gaps++;
      expected = v.verse + 1;
      totalVerses++;
      return { n: v.verse, t: clean(v.text) };
    });
    return { c: c.chapter, verses };
  });
  return { nr: b.nr, name: b.name, testament, chapters };
});

const out = {
  code: 'LSG1910',
  name: 'Louis Segond 1910',
  lang: 'fr',
  source: 'getBible v2 (ls1910) — texte domaine public',
  books,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));

const size = fs.statSync(OUT).size / 1048576;
console.log(`OK -> ${OUT}`);
console.log(`Livres: ${books.length} | Versets: ${totalVerses} | Gaps de numérotation: ${gaps}`);
console.log(`Taille: ${size.toFixed(2)} MB`);
