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

/**
 * Gets the user's current streak of consecutive days with revisions
 */
export const getStreak = async (): Promise<number> => {
  const revisionLogs = await idbManager.getAllRevisionLogs();
  if (!revisionLogs || revisionLogs.length === 0) return 0;
  
  // Sort logs by date and calculate streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const hasRevisionOnDate = revisionLogs.some(log => 
      log.lastRevisionDate && log.lastRevisionDate.startsWith(dateStr)
    );
    
    if (hasRevisionOnDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

/**
 * Gets today's recommended revisions based on spaced repetition algorithm
 */
export const getTodaysRevisions = async (): Promise<TodaysRevision[]> => {
  const surahRevisions = await getSurahRevisions();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return surahRevisions
    .filter(surah => 
      surah.memorized && 
      surah.nextRevision && 
      new Date(surah.nextRevision) <= today
    )
    .map(surah => ({
      surahNumber: surah.surahNumber!,
      nextRevision: surah.nextRevision!,
      completed: false
    }));
};

/**
 * Gets upcoming revisions for the next N days
 */
export const getUpcomingRevisions = async (days: number = 7): Promise<import('@/types/revision').UpcomingRevision[]> => {
  const surahRevisions = await getSurahRevisions();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days);
  
  return surahRevisions
    .filter(surah => 
      surah.memorized && 
      surah.nextRevision && 
      new Date(surah.nextRevision) > today &&
      new Date(surah.nextRevision) <= futureDate
    )
    .map(surah => ({
      surahNumber: surah.surahNumber!,
      nextRevision: surah.nextRevision!
    }))
    .sort((a, b) => new Date(a.nextRevision).getTime() - new Date(b.nextRevision).getTime());
};

/**
 * Gets revision history for a specific surah
 */
export const getRevisionHistoryForSurah = async (surahNumber: number): Promise<any[]> => {
  const revisionLogs = await idbManager.getAllRevisionLogs();
  
  return revisionLogs
    .flatMap(log => log.revisionHistory || [])
    .filter(entry => entry.surahNumber === surahNumber)
    .map(entry => ({
      id: `${surahNumber}_${entry.date}`,
      revision_date: entry.date,
      difficulty: entry.difficulty,
      surahNumber: entry.surahNumber
    }))
    .sort((a, b) => new Date(b.revision_date).getTime() - new Date(a.revision_date).getTime());
};

/**
 * Gets all revision logs (alias for idbManager function)
 */
export const getAllRevisionLogs = async () => {
  return idbManager.getAllRevisionLogs();
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
  nextRevision.setMinutes(today.getMinutes() + 1); // First learning step: 1 minute

  const updates: Partial<SurahData> = {
    memorized: true,
    lastRevision: today.toISOString(),
    nextRevision: nextRevision.toISOString(),
    interval: 0, // No interval in learning phase
    easeFactor: 2.5,
    learningStep: 1, // Start in learning phase, step 1
    consecutiveCorrect: 0,
    lapses: 0,
    dueDate: nextRevision.toISOString(),
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
    interval: 0,
    easeFactor: 2.5,
    learningStep: 0,
    consecutiveCorrect: 0,
    lapses: 0,
    dueDate: undefined,
  };
  await updateSurahRevision(surahNumber, updates);
};

/**
 * Processes a revision, calculates the next date using Anki's SM-2 algorithm, and updates the database.
 */
export const completeRevision = async (
  surahNumber: number,
  difficulty: 'easy' | 'medium' | 'hard'
) => {
  const surahRevisions = await getSurahRevisions();
  const surahData = surahRevisions.find(s => s.surahNumber === surahNumber);
  
  if (!surahData) {
    throw new Error(`Surah ${surahNumber} not found in revisions`);
  }

  const today = new Date();
  const lastRevision = surahData.lastRevision ? new Date(surahData.lastRevision) : today;
  
  let newInterval = surahData.interval || 0;
  let newEaseFactor = surahData.easeFactor || 2.5;
  let newLearningStep = surahData.learningStep || 1;
  let newLapses = surahData.lapses || 0;
  let nextRevision: Date;
  
  // Anki's SM-2 Algorithm with Learning Phase
  if (newLearningStep < 5) {
    // Learning Phase (steps 1-4)
    if (difficulty === 'easy') {
      // Graduate to review phase
      newLearningStep = 5;
      newInterval = 4; // First interval after graduating
      nextRevision = new Date(today);
      nextRevision.setDate(today.getDate() + newInterval);
    } else if (difficulty === 'medium') {
      // Move to next learning step
      newLearningStep++;
      if (newLearningStep === 2) {
        nextRevision = new Date(today);
        nextRevision.setMinutes(today.getMinutes() + 10); // 10 minutes
      } else if (newLearningStep === 3) {
        nextRevision = new Date(today);
        nextRevision.setHours(today.getHours() + 1); // 1 hour
      } else if (newLearningStep === 4) {
        nextRevision = new Date(today);
        nextRevision.setDate(today.getDate() + 1); // 1 day
      }
    } else if (difficulty === 'hard') {
      // Reset to first learning step
      newLearningStep = 1;
      nextRevision = new Date(today);
      nextRevision.setMinutes(today.getMinutes() + 1); // 1 minute
    }
  } else {
    // Review Phase (graduated cards)
    if (difficulty === 'easy') {
      // Anki's ease factor calculation
      newEaseFactor = Math.max(newEaseFactor + 0.15, 1.3);
      newInterval = Math.round(newInterval * newEaseFactor);
      nextRevision = new Date(today);
      nextRevision.setDate(today.getDate() + newInterval);
    } else if (difficulty === 'medium') {
      // Anki's ease factor calculation
      newEaseFactor = Math.max(newEaseFactor - 0.15, 1.3);
      newInterval = Math.round(newInterval * newEaseFactor);
      nextRevision = new Date(today);
      nextRevision.setDate(today.getDate() + newInterval);
    } else if (difficulty === 'hard') {
      // Lapse: return to learning phase
      newLapses++;
      newLearningStep = 1;
      newEaseFactor = Math.max(newEaseFactor - 0.2, 1.3);
      newInterval = 0;
      nextRevision = new Date(today);
      nextRevision.setMinutes(today.getMinutes() + 1); // 1 minute
    }
  }
  
  // Update surah data
  const updates: Partial<SurahData> = {
    lastRevision: today.toISOString(),
    nextRevision: nextRevision.toISOString(),
    interval: newInterval,
    easeFactor: newEaseFactor,
    learningStep: newLearningStep,
    lapses: newLapses,
    dueDate: nextRevision.toISOString(),
    consecutiveCorrect: difficulty !== 'hard' ? (surahData.consecutiveCorrect || 0) + 1 : 0,
  };
  
  await updateSurahRevision(surahNumber, updates);
  
  // Add to revision history
  const revisionLog: RevisionData & { id: string } = {
    id: `${surahNumber}_${today.getTime()}`,
    surahs: {},
    revisionHistory: [{
      surahNumber,
      date: today.toISOString(),
      difficulty
    }],
    streak: 0,
    lastRevisionDate: today.toISOString(),
    goals: { dailyRevisions: 5, weeklyRevisions: 20, memorizePerMonth: 1 }
  };
  
  await idbManager.addRevisionLog(revisionLog);
  
  // Schedule next notification
  const notification = {
    id: `${surahNumber}_${nextRevision.getTime()}`,
    surahNumber,
    fireDate: nextRevision.toISOString(),
    title: 'Revision Reminder',
    body: `Time to revise Surah ${surahNumber}!`,
    delivered: false,
  };
  await pushNotifications.scheduleLocalNotification(notification);
  
  return { success: true };
};

/**
 * Updates user onboarding status
 */
export const updateUserOnboarding = async (hasCompleted: boolean) => {
  const profile = await getUserProfile();
  const updatedProfile = {
    ...profile,
    hasCompletedOnboarding: hasCompleted,
    updatedAt: new Date().toISOString(),
  };
  await idbManager.setUserProfileOffline(updatedProfile);
  return updatedProfile;
};

/**
 * Updates user goals
 */
export const updateGoals = async (goals: import('@/types/revision').Goals) => {
  const profile = await getUserProfile();
  const updatedProfile = {
    ...profile,
    goals,
    updatedAt: new Date().toISOString(),
  };
  await idbManager.setUserProfileOffline(updatedProfile);
  return updatedProfile;
};

export const addBackdatedRevision = async (
  surahNumber: number,
  difficulty: 'easy' | 'medium' | 'hard',
  revisionDate: Date
) => {
  const surahRevisions = await getSurahRevisions();
  const surahData = surahRevisions.find(s => s.surahNumber === surahNumber);
  
  if (!surahData) {
    throw new Error(`Surah ${surahNumber} not found in revisions`);
  }

  let newInterval = surahData.interval || 0;
  let newEaseFactor = surahData.easeFactor || 2.5;
  let newLearningStep = surahData.learningStep || 1;
  let newLapses = surahData.lapses || 0;
  let nextRevision: Date;

  // Anki's SM-2 Algorithm with Learning Phase (same as completeRevision)
  if (newLearningStep < 5) {
    // Learning Phase (steps 1-4)
    if (difficulty === 'easy') {
      // Graduate to review phase
      newLearningStep = 5;
      newInterval = 4; // First interval after graduating
      nextRevision = new Date(revisionDate);
      nextRevision.setDate(revisionDate.getDate() + newInterval);
    } else if (difficulty === 'medium') {
      // Move to next learning step
      newLearningStep++;
      if (newLearningStep === 2) {
        nextRevision = new Date(revisionDate);
        nextRevision.setMinutes(revisionDate.getMinutes() + 10); // 10 minutes
      } else if (newLearningStep === 3) {
        nextRevision = new Date(revisionDate);
        nextRevision.setHours(revisionDate.getHours() + 1); // 1 hour
      } else if (newLearningStep === 4) {
        nextRevision = new Date(revisionDate);
        nextRevision.setDate(revisionDate.getDate() + 1); // 1 day
      }
    } else if (difficulty === 'hard') {
      // Reset to first learning step
      newLearningStep = 1;
      nextRevision = new Date(revisionDate);
      nextRevision.setMinutes(revisionDate.getMinutes() + 1); // 1 minute
    }
  } else {
    // Review Phase (graduated cards)
    if (difficulty === 'easy') {
      // Anki's ease factor calculation
      newEaseFactor = Math.max(newEaseFactor + 0.15, 1.3);
      newInterval = Math.round(newInterval * newEaseFactor);
      nextRevision = new Date(revisionDate);
      nextRevision.setDate(revisionDate.getDate() + newInterval);
    } else if (difficulty === 'medium') {
      // Anki's ease factor calculation
      newEaseFactor = Math.max(newEaseFactor - 0.15, 1.3);
      newInterval = Math.round(newInterval * newEaseFactor);
      nextRevision = new Date(revisionDate);
      nextRevision.setDate(revisionDate.getDate() + newInterval);
    } else if (difficulty === 'hard') {
      // Lapse: return to learning phase
      newLapses++;
      newLearningStep = 1;
      newEaseFactor = Math.max(newEaseFactor - 0.2, 1.3);
      newInterval = 0;
      nextRevision = new Date(revisionDate);
      nextRevision.setMinutes(revisionDate.getMinutes() + 1); // 1 minute
    }
  }

  // If the next revision is in the past, bump it to today
  const today = new Date();
  if (nextRevision < today) {
    nextRevision.setTime(today.getTime());
  }

  // Update surah data
  const updates: Partial<SurahData> = {
    lastRevision: revisionDate.toISOString(),
    nextRevision: nextRevision.toISOString(),
    interval: newInterval,
    easeFactor: newEaseFactor,
    learningStep: newLearningStep,
    lapses: newLapses,
    dueDate: nextRevision.toISOString(),
    consecutiveCorrect: difficulty !== 'hard' ? (surahData.consecutiveCorrect || 0) + 1 : 0,
  };

  await updateSurahRevision(surahNumber, updates);

  // Add to revision history
  const revisionLog: RevisionData & { id: string } = {
    id: `${surahNumber}_${revisionDate.getTime()}`,
    surahs: {},
    revisionHistory: [{
      surahNumber,
      date: revisionDate.toISOString(),
      difficulty
    }],
    streak: 0,
    lastRevisionDate: revisionDate.toISOString(),
    goals: { dailyRevisions: 5, weeklyRevisions: 20, memorizePerMonth: 1 }
  };

  await idbManager.addRevisionLog(revisionLog);

  // Schedule next notification
  const notification = {
    id: `${surahNumber}_${nextRevision.getTime()}`,
    surahNumber,
    fireDate: nextRevision.toISOString(),
    title: 'Revision Reminder',
    body: `Time to revise Surah ${surahNumber}!`,
    delivered: false,
  };
  await pushNotifications.scheduleLocalNotification(notification);

  return { success: true };
};

/**
 * Gets a human-readable description of the learning phase status
 */
export const getLearningPhaseStatus = (learningStep: number): { status: string; description: string; color: string } => {
  if (learningStep === 0) {
    return { status: 'New', description: 'Not yet started', color: 'text-gray-500' };
  } else if (learningStep < 5) {
    const stepNames = ['', 'Learning Step 1', 'Learning Step 2', 'Learning Step 3', 'Learning Step 4'];
    const descriptions = ['', '1 minute interval', '10 minute interval', '1 hour interval', '1 day interval'];
    const colors = ['', 'text-blue-600', 'text-blue-600', 'text-blue-600', 'text-blue-600'];
    return { 
      status: stepNames[learningStep], 
      description: descriptions[learningStep], 
      color: colors[learningStep] 
    };
  } else {
    return { status: 'Graduated', description: 'In review phase', color: 'text-green-600' };
  }
};

// --- The rest of the file should be similarly refactored to use only idbManager and local storage. ---
// --- Comment out or remove all Supabase and online sync logic. ---
