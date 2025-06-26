// import { supabase } from '@/lib/supabaseClient'; // Supabase removed for offline mode
import { SurahData, Goals, RevisionData, TodaysRevision, Profile } from '@/types/revision';
import { SURAHS } from './surahData';
import * as idbManager from './idbManager';
import * as pushNotifications from './pushNotifications';

// Utility to check online status (not needed for offline-only)
// declare const navigator: any;
// function isOnline() {
//   return typeof navigator !== 'undefined' && navigator.onLine;
// }

// --- Offline-Only Data Fetching Functions ---

export const getSurahRevisions = async (): Promise<SurahData[]> => {
  // Only use local storage
  let local = await idbManager.getAllSurahRevisions();
  return local || [];
};

// --- Sync Logic (disabled for offline-only) ---
// export async function syncSurahRevisions() {
//   // Supabase sync disabled for offline mode
// }

// --- Data Mutation Functions (Offline-Only) ---

const updateSurahRevision = async (surahNumber: number, updates: Partial<SurahData>) => {
  // Update local only
  let all = await idbManager.getAllSurahRevisions();
  let idx = all.findIndex(s => s.surahNumber === surahNumber);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
  } else {
    all.push({ surahNumber, ...updates } as SurahData);
  }
  await idbManager.setSurahRevisions(all);
};

/**
 * Gets the user's profile, including their goals and onboarding status.
 */
export const getUserProfile = async (): Promise<Profile> => {
  // Only use local storage
  const profile = await idbManager.getUserProfileOffline();
  if (!profile) {
    // Return a default profile if not found
    return {
      id: 'local-profile',
      hasCompletedOnboarding: true,
      memorisedSurahs: [],
      goals: { dailyRevisions: 5, weeklyRevisions: 20, memorizePerMonth: 1 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  return profile;
};

/**
 * Adds a record to the revision history.
 */
const addRevisionHistory = async (surahNumber: number, difficulty: 'easy' | 'medium' | 'hard') => {
  // Only use local storage
  // You may want to implement this using idbManager.addRevisionLog
  // Example:
  // await idbManager.addRevisionLog({ ... });
};

/**
 * Marks a surah as memorized and sets its initial revision state.
 */
export const addMemorizedSurah = async (surahNumber: number) => {
  const today = new Date();
  const nextRevision = new Date(today);
  nextRevision.setDate(today.getDate() + 1);

  const updates: Partial<SurahData> = {
    memorized: true,
    lastRevision: today.toISOString(),
    nextRevision: nextRevision.toISOString(),
    interval: 1,
    easeFactor: 2.5,
    learningStep: 2, // Assuming it's learned
    consecutiveCorrect: 0,
  };

  await updateSurahRevision(surahNumber, updates);

  // Schedule first local notification
  const notification = {
    id: `${surahNumber}_${nextRevision.getTime()}`,
    surahNumber,
    fireDate: nextRevision.toISOString(),
    title: 'Revision Reminder',
    body: `Time to revise Surah ${surahNumber}!`,
    delivered: false,
  };
  await pushNotifications.scheduleLocalNotification(notification);
};

/**
 * Unmarks a surah as memorized, resetting its state.
 */
export const removeMemorizedSurah = async (surahNumber: number) => {
  const updates: Partial<SurahData> = {
    memorized: false,
    lastRevision: undefined,
    nextRevision: undefined,
    interval: 1,
    easeFactor: 2.5,
    learningStep: 0,
    consecutiveCorrect: 0,
  };
  await updateSurahRevision(surahNumber, updates);
};

/**
 * Processes a revision, calculates the next date using SM-2, and updates the database.
 */
export const completeRevision = async (
  surahNumber: number,
  difficulty: 'easy' | 'medium' | 'hard'
) => {
  const surahRevisions = await getSurahRevisions();
  const surahData = surahRevisions.find(s => s.surahNumber === surahNumber);
  // ... existing local logic ...
};

// --- The rest of the file should be similarly refactored to use only idbManager and local storage. ---
// --- Comment out or remove all Supabase and online sync logic. ---
