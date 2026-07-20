import { SurahData, RevisionData, TodaysRevision, Profile } from '@/types/revision';
import * as idbManager from './idbManager';
import * as pushNotifications from './pushNotifications';

// --- Offline-Only Data Fetching Functions ---

export const getSurahRevisions = async (): Promise<SurahData[]> => {
  const local = await idbManager.getAllSurahRevisions();
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
  const currentDate = new Date(today);
  
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
  const todayStr = today.toISOString().split('T')[0];

  const todaysRevisions = surahRevisions
    .filter(surah => {
      const isMemorized = surah.memorized;
      const hasNextRevision = surah.nextRevision;
      // Compare date strings only (YYYY-MM-DD) so time-of-day doesn't affect due status
      const nextRevisionStr = hasNextRevision ? surah.nextRevision.split('T')[0] : null;
      const isDueToday = nextRevisionStr !== null && nextRevisionStr <= todayStr;
      return isMemorized && hasNextRevision && isDueToday;
    })
    .map(surah => ({
      surahNumber: surah.surahNumber!,
      nextRevision: surah.nextRevision!,
      completed: false
    }));

  return todaysRevisions;
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
      new Date(surah.nextRevision) >= today &&
      new Date(surah.nextRevision) <= futureDate
    )
    .map(surah => ({
      surahNumber: surah.surahNumber!,
      nextRevision: surah.nextRevision!
    }))
    .sort((a, b) => new Date(a.nextRevision).getTime() - new Date(b.nextRevision).getTime());
};

export interface RevisionHistoryEntry {
  id: string;
  revision_date: string;
  difficulty: 'easy' | 'medium' | 'hard';
  surahNumber: number;
}

/**
 * Gets revision history for a specific surah
 */
export const getRevisionHistoryForSurah = async (surahNumber: number): Promise<RevisionHistoryEntry[]> => {
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

export interface CompletedTodayEntry {
  surahNumber: number;
  date: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Gets revisions completed today (local time), most recent first.
 * Derived from persisted revision logs so it survives tab switches and reloads.
 */
export const getTodaysCompletedRevisions = async (): Promise<CompletedTodayEntry[]> => {
  const revisionLogs = await idbManager.getAllRevisionLogs();
  const now = new Date();
  const isToday = (iso: string) => {
    const d = new Date(iso);
    return d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
  };

  return revisionLogs
    .flatMap(log => log.revisionHistory || [])
    .filter(entry => isToday(entry.date))
    .map(entry => ({
      surahNumber: entry.surahNumber,
      date: entry.date,
      difficulty: entry.difficulty,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * Undoes the most recent revision of a surah: restores the scheduling state
 * captured when the revision was logged and removes the log entry.
 * Returns false if there is nothing to undo.
 */
export const undoRevision = async (surahNumber: number): Promise<boolean> => {
  const revisionLogs = await idbManager.getAllRevisionLogs();
  const latest = revisionLogs
    .filter(log =>
      log.id &&
      log.previousState &&
      (log.revisionHistory || []).some(entry => entry.surahNumber === surahNumber)
    )
    .sort((a, b) =>
      new Date(b.lastRevisionDate || 0).getTime() - new Date(a.lastRevisionDate || 0).getTime()
    )[0];

  if (!latest) return false;

  const current = (await getSurahRevisions()).find(s => s.surahNumber === surahNumber);
  await updateSurahRevision(surahNumber, latest.previousState!);
  await idbManager.removeRevisionLog(latest.id!);

  // Best-effort cleanup of the notification scheduled for the undone revision
  if (current?.nextRevision) {
    await pushNotifications.cancelLocalNotification(
      `${surahNumber}_${new Date(current.nextRevision).getTime()}`
    );
  }

  return true;
};

// --- Sync Logic (disabled for offline-only) ---
// export async function syncSurahRevisions() {
//   // Supabase sync disabled for offline mode
// }

// --- Data Mutation Functions (Offline-Only) ---

const updateSurahRevision = async (surahNumber: number, updates: Partial<SurahData>) => {
  const all = await idbManager.getAllSurahRevisions();
  const idx = all.findIndex(s => s.surahNumber === surahNumber);

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
      hasCompletedOnboarding: false,
      memorisedSurahs: [],
      goals: { dailyRevisions: 5, weeklyRevisions: 20, memorizePerMonth: 1 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  return profile;
};

/**
 * Marks a surah as memorized and sets its initial revision state.
 */
export const addMemorizedSurah = async (surahNumber: number) => {
  // Use local date string (YYYY-MM-DD) to avoid UTC offset shifting the date to yesterday
  const todayLocal = new Date();
  const localDateStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;
  const nextRevision = new Date(`${localDateStr}T00:00:00`);

  const updates: Partial<SurahData> = {
    memorized: true,
    lastRevision: undefined, // No previous revision for newly memorized surahs
    nextRevision: nextRevision.toISOString(),
    interval: 1, // 1 day interval
    easeFactor: 2.5,
    learningStep: 1, // Start in early repetition phase, step 1
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
    interval: 1,
    easeFactor: 2.5,
    learningStep: 0,
    consecutiveCorrect: 0,
    lapses: 0,
    dueDate: undefined,
  };
  await updateSurahRevision(surahNumber, updates);
};

/**
 * Applies the Quran-appropriate SM-2 algorithm to a surah's current scheduling
 * state and returns the new state.
 *
 * - Early Repetition Phase (steps 1-3): fixed intervals of 1/2/3 days; easy
 *   advances the step (graduating at step 4), medium repeats it, hard resets
 *   to step 1.
 * - Main Schedule Phase (step 4+): interval scales by the ease factor; hard
 *   counts as a lapse and returns the surah to the early phase.
 */
const applySm2 = (
  surahData: SurahData,
  difficulty: 'easy' | 'medium' | 'hard'
): { interval: number; easeFactor: number; learningStep: number; lapses: number } => {
  let interval = surahData.interval || 1;
  let easeFactor = surahData.easeFactor || 2.5;
  let learningStep = surahData.learningStep || 1;
  let lapses = surahData.lapses || 0;

  if (learningStep < 4) {
    // Early Repetition Phase (steps 1-3) - all intervals in days
    if (difficulty === 'easy') {
      learningStep++;
      interval = learningStep; // 2, 3, or 4 (graduated) days
    } else if (difficulty === 'medium') {
      interval = learningStep; // repeat current step's interval
    } else {
      learningStep = 1;
      interval = 1;
      easeFactor = Math.max(easeFactor - 0.2, 1.3);
    }
  } else {
    // Main Schedule Phase (graduated cards)
    if (difficulty === 'easy') {
      easeFactor = Math.max(easeFactor + 0.15, 1.3);
      interval = Math.round(interval * easeFactor);
    } else if (difficulty === 'medium') {
      easeFactor = Math.max(easeFactor - 0.15, 1.3);
      interval = Math.round(interval * easeFactor);
    } else {
      // Lapse: return to early repetition phase
      lapses++;
      learningStep = 1;
      easeFactor = Math.max(easeFactor - 0.2, 1.3);
      interval = 1;
    }
  }

  return { interval, easeFactor, learningStep, lapses };
};

/**
 * Records a revision made on `revisionDate`: updates the surah's scheduling
 * state via SM-2, logs the revision, and schedules the next notification.
 */
const logRevision = async (
  surahNumber: number,
  difficulty: 'easy' | 'medium' | 'hard',
  revisionDate: Date
) => {
  const surahRevisions = await getSurahRevisions();
  const surahData = surahRevisions.find(s => s.surahNumber === surahNumber);

  if (!surahData) {
    throw new Error(`Surah ${surahNumber} not found in revisions`);
  }

  const { interval, easeFactor, learningStep, lapses } = applySm2(surahData, difficulty);

  // Calculate next revision date (always in days)
  const nextRevision = new Date(revisionDate);
  nextRevision.setDate(revisionDate.getDate() + interval);

  // For backdated revisions the next revision may land in the past; bump it to today
  const today = new Date();
  if (nextRevision < today) {
    nextRevision.setTime(today.getTime());
  }

  const updates: Partial<SurahData> = {
    lastRevision: revisionDate.toISOString(),
    nextRevision: nextRevision.toISOString(),
    interval,
    easeFactor,
    learningStep,
    lapses,
    dueDate: nextRevision.toISOString(),
    consecutiveCorrect: difficulty !== 'hard' ? (surahData.consecutiveCorrect || 0) + 1 : 0,
  };

  await updateSurahRevision(surahNumber, updates);

  // Add to revision history, capturing prior scheduling state so it can be undone
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
    goals: { dailyRevisions: 5, weeklyRevisions: 20, memorizePerMonth: 1 },
    previousState: { ...surahData }
  };

  await idbManager.addRevisionLog(revisionLog);

  // Schedule next notification
  await pushNotifications.scheduleLocalNotification({
    id: `${surahNumber}_${nextRevision.getTime()}`,
    surahNumber,
    fireDate: nextRevision.toISOString(),
    title: 'Revision Reminder',
    body: `Time to revise Surah ${surahNumber}!`,
    delivered: false,
  });

  return { success: true };
};

/**
 * Processes a revision done today, calculates the next date using the
 * Quran-appropriate SM-2 algorithm, and updates the database.
 */
export const completeRevision = async (
  surahNumber: number,
  difficulty: 'easy' | 'medium' | 'hard'
) => {
  return logRevision(surahNumber, difficulty, new Date());
};

/**
 * Updates user onboarding status and saves memorized surahs
 */
export const updateUserOnboarding = async (memorizedSurahs: number[]) => {
  const profile = await getUserProfile();
  const updatedProfile = {
    ...profile,
    hasCompletedOnboarding: true,
    memorisedSurahs: memorizedSurahs,
    updatedAt: new Date().toISOString(),
  };
  await idbManager.setUserProfileOffline(updatedProfile);
  
  // Also add each surah to the surah revisions table
  for (const surahNumber of memorizedSurahs) {
    await addMemorizedSurah(surahNumber);
  }
  
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

/**
 * Records a revision that happened on a past date. The next revision is
 * scheduled relative to that date, bumped to today if it lands in the past.
 */
export const addBackdatedRevision = async (
  surahNumber: number,
  difficulty: 'easy' | 'medium' | 'hard',
  revisionDate: Date
) => {
  return logRevision(surahNumber, difficulty, revisionDate);
};

/**
 * Gets a human-readable description of the learning phase status
 */
export const getLearningPhaseStatus = (learningStep: number): { status: string; description: string; color: string } => {
  if (learningStep === 0) {
    return { status: 'New', description: 'Not yet started', color: 'text-gray-500' };
  } else if (learningStep === 1) {
    return { status: 'Just Memorised', description: 'Early Repetition 1', color: 'text-gray-500' };
  } else if (learningStep === 2) {
    return { status: 'Quick Review', description: 'Early Repetition 2', color: 'text-gray-500' };
  } else if (learningStep === 3) {
    return { status: 'Settling In', description: 'Early Repetition 3', color: 'text-gray-500' };
  } else {
    return { status: 'Regular Practice', description: 'Graduated', color: 'text-gray-500' };
  }
};
