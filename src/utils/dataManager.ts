import { supabase } from '@/lib/supabaseClient';
import { SurahData, Goals, RevisionData, TodaysRevision, Profile } from '@/types/revision';
import { SURAHS } from './surahData';
import * as idbManager from './idbManager';
import * as pushNotifications from './pushNotifications';

// Utility to check online status
declare const navigator: any;
function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

// --- Offline-First Data Fetching Functions ---

export const getSurahRevisions = async (): Promise<SurahData[]> => {
  // Try local first
  let local = await idbManager.getAllSurahRevisions();
  if (local && local.length > 0) {
    // If online, trigger background sync
    if (isOnline()) syncSurahRevisions();
    return local;
  }
  // If not in local, fetch from Supabase and cache
  if (isOnline()) {
    const remote = await fetchSurahRevisionsFromSupabase();
    await idbManager.setSurahRevisions(remote);
    return remote;
  }
  return [];
};

async function fetchSurahRevisionsFromSupabase(): Promise<SurahData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found.");
  const { data, error } = await supabase
    .from('surah_revisions')
    .select('*')
    .eq('user_id', user.id)
    .order('surah_number', { ascending: true });
  if (error) throw error;
  return data.map(item => ({
    surahNumber: item.surah_number,
    memorized: item.memorized,
    lastRevision: item.last_revision,
    nextRevision: item.next_revision,
    interval: item.interval,
    easeFactor: item.ease_factor,
    learningStep: item.learning_step,
    consecutiveCorrect: item.consecutive_correct,
  }));
}

// --- Sync Logic ---

export async function syncSurahRevisions() {
  // Always favor local changes
  const local = await idbManager.getAllSurahRevisions();
  if (!isOnline() || !local.length) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // Upsert all local to Supabase
  const upserts = local.map(l => ({
    user_id: user.id,
    surah_number: l.surahNumber,
    memorized: l.memorized,
    last_revision: l.lastRevision,
    next_revision: l.nextRevision,
    interval: l.interval,
    ease_factor: l.easeFactor,
    learning_step: l.learningStep,
    consecutive_correct: l.consecutiveCorrect,
  }));
  await supabase.from('surah_revisions').upsert(upserts, { onConflict: 'user_id,surah_number' });
  await idbManager.setLastSynced(new Date().toISOString());
}

// --- Data Mutation Functions (Offline-First) ---

const updateSurahRevision = async (surahNumber: number, updates: Partial<SurahData>) => {
  // Update local first
  let all = await idbManager.getAllSurahRevisions();
  let idx = all.findIndex(s => s.surahNumber === surahNumber);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
  } else {
    all.push({ surahNumber, ...updates } as SurahData);
  }
  await idbManager.setSurahRevisions(all);
  // Sync if online
  if (isOnline()) syncSurahRevisions();
};

/**
 * Gets the user's profile, including their goals and onboarding status.
 */
export const getUserProfile = async (): Promise<Profile> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found.");

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: "object not found"
    console.error("Error fetching user profile:", error);
    throw error;
  }

  return {
    id: data.id,
    hasCompletedOnboarding: data.has_completed_onboarding,
    memorisedSurahs: data.memorised_surahs || [],
    goals: data.goals || { dailyRevisions: 5, weeklyRevisions: 20, memorizePerMonth: 1 },
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Adds a record to the revision history.
 */
const addRevisionHistory = async (surahNumber: number, difficulty: 'easy' | 'medium' | 'hard') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found.");

    const { error } = await supabase
        .from('revision_history')
        .insert({
            user_id: user.id,
            surah_number: surahNumber,
            difficulty: difficulty,
        });
    
    if (error) {
        console.error("Error adding to revision history:", error);
        throw error;
    }
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

  if (!surahData) throw new Error("Surah not found in revision data.");

  let { interval = 1, easeFactor = 2.5 } = surahData;
  const today = new Date();

  // SM-2 Algorithm Logic
  if (difficulty === 'hard') {
    interval = 1; // Reset interval
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    if (difficulty === 'easy') {
      easeFactor += 0.1;
    } else {
      // medium
      easeFactor = Math.max(1.3, easeFactor - 0.1);
    }
    interval = Math.round(interval * easeFactor);
  }

  const nextRevisionDate = new Date(today);
  nextRevisionDate.setDate(today.getDate() + interval);

  const updates: Partial<SurahData> = {
    lastRevision: today.toISOString(),
    nextRevision: nextRevisionDate.toISOString(),
    interval,
    easeFactor,
  };

  await updateSurahRevision(surahNumber, updates);

  // Add revision log offline
  await addRevisionLogOffline({
    surahs: { [surahNumber]: surahData },
    revisionHistory: [{ surahNumber, date: today.toISOString(), difficulty }],
    streak: 0,
    lastRevisionDate: today.toISOString(),
    goals: { dailyRevisions: 0, weeklyRevisions: 0, memorizePerMonth: 0 },
  });

  // Cancel previous notification(s) for this surah
  const scheduled = await idbManager.getAllScheduledNotifications();
  for (const notif of scheduled) {
    if (notif.surahNumber === surahNumber && !notif.delivered) {
      await pushNotifications.cancelLocalNotification(notif.id);
    }
  }

  // Schedule new notification for next revision
  const notification = {
    id: `${surahNumber}_${nextRevisionDate.getTime()}`,
    surahNumber,
    fireDate: nextRevisionDate.toISOString(),
    title: 'Revision Reminder',
    body: `Time to revise Surah ${surahNumber}!`,
    delivered: false,
  };
  await pushNotifications.scheduleLocalNotification(notification);
};


// --- Data Querying Functions (to be used by components) ---

/**
 * Gets revisions that are due today or overdue.
 */
export const getTodaysRevisions = async (): Promise<TodaysRevision[]> => {
    const allRevisions = await getSurahRevisions();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allRevisions
        .filter(r => r.memorized && r.nextRevision)
        .map(r => ({
            surahNumber: r.surahNumber!,
            nextRevision: r.nextRevision!,
            completed: false, // This will be handled in UI state, not DB
        }))
        .filter(r => {
            const dueDate = new Date(r.nextRevision);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate <= today;
        });
};

/**
 * Gets revisions coming up in the next `days` number of days.
 */
export const getUpcomingRevisions = async (days: number) => {
    const allRevisions = await getSurahRevisions();
    const today = new Date();
    const upcomingDate = new Date();
    upcomingDate.setDate(today.getDate() + days);

    return allRevisions
        .filter(r => r.memorized && r.nextRevision)
        .filter(r => {
            const dueDate = new Date(r.nextRevision!);
            return dueDate > today && dueDate <= upcomingDate;
        })
        .sort((a, b) => new Date(a.nextRevision!).getTime() - new Date(b.nextRevision!).getTime());
};

/**
 * Updates the user's goals.
 */
export const updateGoals = async (newGoals: Goals) => {
    let profile = await idbManager.getUserProfileOffline();
    if (!profile) return;
    profile.goals = newGoals;
    await idbManager.setUserProfileOffline(profile);
    if (isOnline()) syncUserProfile();
};

/**
 * Calculates the user's current revision streak.
 */
export const getStreak = async (): Promise<number> => {
    // This should use revision logs from offline-first storage
    // (Implement logic as needed, or fallback to 0 if not available)
    return 0;
};

// --- Profile Functions ---

/**
 * Updates the user's onboarding status and memorized surahs.
 */
export const updateUserOnboarding = async (memorisedSurahs: number[]): Promise<void> => {
  let profile = await idbManager.getUserProfileOffline();
  if (!profile) return;
  profile.hasCompletedOnboarding = true;
  profile.memorisedSurahs = memorisedSurahs;
  await idbManager.setUserProfileOffline(profile);
  if (isOnline()) syncUserProfile();
};

/**
 * Gets the revision history for a specific surah.
 */
export const getRevisionHistoryForSurah = async (surahNumber: number) => {
  const logs = await getAllRevisionLogs();
  return logs.filter(log => log.revisionHistory.some(h => h.surahNumber === surahNumber));
};

// --- Revision Logs (Offline-First) ---

export async function getAllRevisionLogs(): Promise<RevisionData[]> {
  let local = await idbManager.getAllRevisionLogs();
  if (local && local.length > 0) {
    if (isOnline()) syncRevisionLogs();
    return local;
  }
  // If not in local, fetch from Supabase and cache
  if (isOnline()) {
    const remote = await fetchRevisionLogsFromSupabase();
    for (const log of remote) await idbManager.addRevisionLog(log);
    return remote;
  }
  return [];
}

async function fetchRevisionLogsFromSupabase(): Promise<RevisionData[]> {
  // Implement as needed, similar to fetchSurahRevisionsFromSupabase
  return [];
}

export async function syncRevisionLogs() {
  const local = await idbManager.getAllRevisionLogs();
  if (!isOnline() || !local.length) return;
  // Upsert all local to Supabase (implement as needed)
}

export async function addRevisionLogOffline(log: RevisionData) {
  await idbManager.addRevisionLog(log);
  if (isOnline()) syncRevisionLogs();
}

// --- User Profile (Offline-First) ---

export async function getUserProfileOffline(): Promise<Profile | undefined> {
  let local = await idbManager.getUserProfileOffline();
  if (local) {
    if (isOnline()) syncUserProfile();
    return local;
  }
  if (isOnline()) {
    const remote = await fetchUserProfileFromSupabase();
    await idbManager.setUserProfileOffline(remote);
    return remote;
  }
  return undefined;
}

async function fetchUserProfileFromSupabase(): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found.");
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return {
    id: data.id,
    hasCompletedOnboarding: data.has_completed_onboarding,
    memorisedSurahs: data.memorised_surahs || [],
    goals: data.goals || { dailyRevisions: 5, weeklyRevisions: 20, memorizePerMonth: 1 },
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function syncUserProfile() {
  const local = await idbManager.getUserProfileOffline();
  if (!isOnline() || !local) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('user_profiles').upsert({
    user_id: user.id,
    has_completed_onboarding: local.hasCompletedOnboarding,
    memorised_surahs: local.memorisedSurahs,
    goals: local.goals,
    created_at: local.createdAt,
    updated_at: new Date().toISOString(),
  });
  await idbManager.setLastSynced(new Date().toISOString());
}

export async function setUserProfileOffline(profile: Profile) {
  await idbManager.setUserProfileOffline(profile);
  if (isOnline()) syncUserProfile();
}
