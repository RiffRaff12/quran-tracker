
export interface SurahData {
  memorized: boolean;
  lastRevision?: string;
  nextRevision?: string;
  interval?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface RevisionHistory {
  surahNumber: number;
  date: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Goals {
  dailyRevisions: number;
  weeklyRevisions: number;
  memorizePerMonth: number;
}

export interface RevisionData {
  surahs: Record<number, SurahData>;
  revisionHistory: RevisionHistory[];
  streak: number;
  lastRevisionDate: string | null;
  goals: Goals;
}

export interface TodaysRevision {
  surahNumber: number;
  nextRevision: string;
  completed: boolean;
}

export interface UpcomingRevision {
  surahNumber: number;
  nextRevision: string;
}
