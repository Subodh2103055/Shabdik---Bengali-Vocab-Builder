export type Difficulty = 'basic' | 'intermediate' | 'advanced' | 'ielts' | 'gre';

export interface Word {
  word: string;
  ipa: string;
  bengaliMeaning: string;
  definition: string;
  definitionBengali: string;
  exampleSentence: string;
  exampleSentenceBengali: string;
  synonyms: string[];
  difficulty: Difficulty;
  partOfSpeech: string;
  dateSuggested?: string; // e.g. YYYY-MM-DD
}

export interface UserStats {
  streak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  completedDates: string[]; // List of YYYY-MM-DD when user checked words
  totalWordsLearned: number;
}

export interface SyncData {
  stats: UserStats;
  savedWords: Word[];
  masteredWords?: string[];
}

export interface QuizQuestion {
  word: string;
  options: string[];
  correctAnswer: string;
  meaning: string;
}
