export interface SurahData {
  surahNumber?: number;
  memorized: boolean;
  lastRevision?: string;
  nextRevision?: string;
  interval?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  easeFactor?: number;  // Starts at 2.5, adjusts based on performance
  learningStep?: number;  // 0 = new, 1-3 = early repetitions (days), 4+ = graduated to main schedule
  consecutiveCorrect?: number;  // Number of consecutive correct reviews
  lapses?: number;  // Number of times card has lapsed (failed after graduating)
  dueDate?: string;  // When the card is due for review
}

export interface Profile {
  id: string;
  hasCompletedOnboarding: boolean;
  memorisedSurahs: number[];
  goals: Goals;
  createdAt: string;
  updatedAt: string;
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

export interface ScheduledNotification {
  id: string; // unique identifier for the notification
  surahNumber: number;
  fireDate: string; // ISO string for when to trigger
  title: string;
  body: string;
  delivered: boolean; // whether the notification has been delivered
}
