/**
 * Banque de questions de quiz (pré-rédigées), embarquée.
 * Format : { "<numéro de livre>": { questions: QuizQuestion[] } }
 * Tous les livres ne sont pas encore couverts ; ajout incrémental.
 */

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number; // index de la bonne réponse
  ref?: string; // ex. "3:16"
};

type QuizData = Record<string, { questions: QuizQuestion[] }>;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const data: QuizData = require('../../assets/quiz/quiz.json');

export function getQuiz(book: number): QuizQuestion[] | null {
  return data[String(book)]?.questions ?? null;
}

export function hasQuiz(book: number): boolean {
  return (data[String(book)]?.questions?.length ?? 0) > 0;
}
