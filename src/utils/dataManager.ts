import { supabase } from '@/lib/supabaseClient';
import { SurahData, Goals, RevisionData, TodaysRevision, Profile } from '@/types/revision';
import { SURAHS } from './surahData';

// --- Data Fetching Functions ---

/**
 * Fetches all revision data for the currently logged-in user.
 */
export const getSurahRevisions = async (): Promise<SurahData[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found.");

  const { data, error } = await supabase
    .from('surah_revisions')
    .select('*')
    .eq('user_id', user.id)
    .order('surah_number', { ascending: true });

  if (error) {
    console.error("Error fetching surah revisions:", error);
    throw error;
  }
  
  // The data from supabase will have snake_case keys, we map it to our camelCase type
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

// --- Data Mutation Functions ---

/**
 * Updates a specific surah's revision data.
 */
const updateSurahRevision = async (surahNumber: number, updates: Partial<SurahData>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found.");

    // Map from camelCase to snake_case for the database
    const dbUpdates = {
      memorized: updates.memorized,
      last_revision: updates.lastRevision,
      next_revision: updates.nextRevision,
      interval: updates.interval,
      ease_factor: updates.easeFactor,
      learning_step: updates.learningStep,
      consecutive_correct: updates.consecutiveCorrect,
    };

    const { error } = await supabase
        .from('surah_revisions')
        .update(dbUpdates)
        .eq('user_id', user.id)
        .eq('surah_number', surahNumber);

    if (error) {
        console.error("Error updating surah revision:", error);
        throw error;
    }
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
    }
    // For 'medium', easeFactor remains unchanged.
    
    if (interval === 1) {
        interval = 6;
    } else {
        interval = Math.ceil(interval * easeFactor);
    }
  }

  const nextRevisionDate = new Date(today);
  nextRevisionDate.setDate(today.getDate() + interval);

  const updates: Partial<SurahData> = {
    lastRevision: today.toISOString(),
    nextRevision: nextRevisionDate.toISOString(),
    interval,
    easeFactor,
  };

  // Perform database operations
  await updateSurahRevision(surahNumber, updates);
  await addRevisionHistory(surahNumber, difficulty);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found.");

    const { error } = await supabase
        .from('user_profiles')
        .update({ goals: newGoals })
        .eq('user_id', user.id);

    if (error) {
        console.error("Error updating goals:", error);
        throw error;
    }
};

/**
 * Calculates the user's current revision streak.
 */
export const getStreak = async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
        .from('revision_history')
        .select('revision_date')
        .eq('user_id', user.id)
        .order('revision_date', { ascending: false });

    if (error) {
        console.error("Error fetching revision history for streak:", error);
        return 0;
    }

    if (!data || data.length === 0) {
        return 0;
    }

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const revisionDates = [...new Set(data.map(r => new Date(r.revision_date).toDateString()))]
        .map(d => new Date(d));

    if (revisionDates.length === 0) return 0;

    const mostRecentRevision = new Date(revisionDates[0]);
    mostRecentRevision.setHours(0, 0, 0, 0);

    const diff = today.getTime() - mostRecentRevision.getTime();
    const daysSinceLast = diff / (1000 * 60 * 60 * 24);

    if (daysSinceLast > 1) {
        return 0; // Streak is broken
    }

    if (daysSinceLast <= 1) {
        streak = 1;
        for (let i = 1; i < revisionDates.length; i++) {
            const current = new Date(revisionDates[i-1]);
            const previous = new Date(revisionDates[i]);
            current.setHours(0, 0, 0, 0);
            previous.setHours(0, 0, 0, 0);
            
            const dayDiff = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

            if (dayDiff === 1) {
                streak++;
            } else {
                break; // Gap in dates, streak ends
            }
        }
    }
    
    return streak;
};

// --- Profile Functions ---

/**
 * Updates the user's onboarding status and memorized surahs.
 */
export const updateUserOnboarding = async (memorisedSurahs: number[]): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found.");

  // Use upsert to robustly handle profile updates, creating the profile if it doesn't exist.
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      has_completed_onboarding: true,
      memorised_surahs: memorisedSurahs,
    });

  if (profileError) {
    console.error("Error updating user profile during onboarding:", JSON.stringify(profileError, null, 2));
    throw profileError;
  }

  // Then, create records for all 114 surahs, marking the selected ones as memorized.
  // This ensures that other parts of the app that rely on these records will function correctly.
  const today = new Date();
  const nextRevision = new Date(today);
  nextRevision.setDate(today.getDate() + 1);

  const allSurahNumbers = Array.from({ length: 114 }, (_, i) => i + 1);

  const surahRevisionData = allSurahNumbers.map(surahNumber => {
    const isMemorized = memorisedSurahs.includes(surahNumber);
    return {
      user_id: user.id,
      surah_number: surahNumber,
      memorized: isMemorized,
      // Only set revision dates for surahs that are actually memorized
      last_revision: isMemorized ? today.toISOString() : null,
      next_revision: isMemorized ? nextRevision.toISOString() : null,
      interval: 1, // Default interval
      ease_factor: 2.5, // Default ease factor
      learning_step: isMemorized ? 2 : 0, // 2 for 'review', 0 for 'new'
      consecutive_correct: 0,
    };
  });

  // Use upsert to either insert new records or update existing ones if the user re-onboards
  const { error: revisionError } = await supabase
    .from('surah_revisions')
    .upsert(surahRevisionData, { onConflict: 'user_id,surah_number' });


  if (revisionError) {
    console.error("Error initializing surah revisions:", revisionError);
    throw revisionError;
  }
};

/**
 * Gets the revision history for a specific surah.
 */
export const getRevisionHistoryForSurah = async (surahNumber: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found.");

  const { data, error } = await supabase
    .from('revision_history')
    .select('*')
    .eq('user_id', user.id)
    .eq('surah_number', surahNumber)
    .order('revision_date', { ascending: false });

  if (error) {
    console.error(`Error fetching revision history for surah ${surahNumber}:`, error);
    throw error;
  }

  return data || [];
};
