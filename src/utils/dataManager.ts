
import { RevisionData, SurahData, Goals, TodaysRevision, UpcomingRevision, RevisionHistory } from '@/types/revision';

// Local storage keys
const REVISION_DATA_KEY = 'quran_revision_data';
const GOALS_KEY = 'quran_revision_goals';

// Demo data for testing
const getDemoData = (): RevisionData => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const inThreeDays = new Date(today);
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  const inFiveDays = new Date(today);
  inFiveDays.setDate(inFiveDays.getDate() + 5);

  return {
    surahs: {
      // Overdue surahs
      1: { 
        memorized: true, 
        lastRevision: twoDaysAgo.toISOString(),
        nextRevision: yesterday.toISOString(),
        interval: 2,
        difficulty: 'medium'
      },
      67: { 
        memorized: true, 
        lastRevision: '2024-06-10T10:00:00.000Z',
        nextRevision: twoDaysAgo.toISOString(),
        interval: 3,
        difficulty: 'hard'
      },
      // Due today
      112: { 
        memorized: true, 
        lastRevision: yesterday.toISOString(),
        nextRevision: today.toISOString(),
        interval: 1,
        difficulty: 'easy'
      },
      113: { 
        memorized: true, 
        lastRevision: '2024-06-12T08:00:00.000Z',
        nextRevision: today.toISOString(),
        interval: 2,
        difficulty: 'medium'
      },
      // Upcoming revisions
      114: { 
        memorized: true, 
        lastRevision: today.toISOString(),
        nextRevision: tomorrow.toISOString(),
        interval: 1,
        difficulty: 'easy'
      },
      78: { 
        memorized: true, 
        lastRevision: yesterday.toISOString(),
        nextRevision: inThreeDays.toISOString(),
        interval: 4,
        difficulty: 'medium'
      },
      36: { 
        memorized: true, 
        lastRevision: '2024-06-10T15:00:00.000Z',
        nextRevision: inFiveDays.toISOString(),
        interval: 7,
        difficulty: 'easy'
      },
      // Recently memorized but not yet revised
      103: { 
        memorized: true, 
        lastRevision: null,
        nextRevision: tomorrow.toISOString(),
        interval: 1,
        difficulty: 'medium'
      }
    },
    revisionHistory: [
      {
        surahNumber: 114,
        date: today.toISOString(),
        difficulty: 'easy'
      },
      {
        surahNumber: 112,
        date: yesterday.toISOString(),
        difficulty: 'easy'
      },
      {
        surahNumber: 78,
        date: yesterday.toISOString(),
        difficulty: 'medium'
      }
    ],
    streak: 2,
    lastRevisionDate: today.toISOString(),
    goals: {
      dailyRevisions: 3,
      weeklyRevisions: 20,
      memorizePerMonth: 2
    }
  };
};

// Default data structure
const getDefaultData = (): RevisionData => ({
  surahs: {},
  revisionHistory: [],
  streak: 0,
  lastRevisionDate: null,
  goals: {
    dailyRevisions: 3,
    weeklyRevisions: 20,
    memorizePerMonth: 2
  }
});

// Get revision data from localStorage
export const getRevisionData = (): RevisionData => {
  try {
    const data = localStorage.getItem(REVISION_DATA_KEY);
    if (data) {
      return JSON.parse(data);
    } else {
      // If no data exists, create demo data
      const demoData = getDemoData();
      saveRevisionData(demoData);
      // Also mark onboarding as complete for demo
      localStorage.setItem('quran_onboarding_complete', 'true');
      return demoData;
    }
  } catch (error) {
    console.error('Error loading revision data:', error);
    return getDefaultData();
  }
};

// Save revision data to localStorage
export const saveRevisionData = (data: RevisionData): void => {
  try {
    localStorage.setItem(REVISION_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving revision data:', error);
  }
};

// Update surah memorization status
export const updateSurahStatus = (surahNumber: number, memorized: boolean): void => {
  const data = getRevisionData();
  
  if (!data.surahs[surahNumber]) {
    data.surahs[surahNumber] = { memorized: false };
  }
  
  data.surahs[surahNumber].memorized = memorized;
  
  // If memorized, schedule first revision
  if (memorized && !data.surahs[surahNumber].nextRevision) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    data.surahs[surahNumber].nextRevision = tomorrow.toISOString();
    data.surahs[surahNumber].interval = 1;
    data.surahs[surahNumber].difficulty = 'medium';
  }
  
  saveRevisionData(data);
};

// Spaced repetition algorithm
const calculateNextRevision = (difficulty: 'easy' | 'medium' | 'hard', currentInterval: number = 1) => {
  let multiplier: number;
  
  switch (difficulty) {
    case 'easy':
      multiplier = 2.5;
      break;
    case 'medium':
      multiplier = 1.8;
      break;
    case 'hard':
      multiplier = 1.2;
      break;
    default:
      multiplier = 1.8;
  }
  
  const newInterval = Math.max(1, Math.round(currentInterval * multiplier));
  const nextRevisionDate = new Date();
  nextRevisionDate.setDate(nextRevisionDate.getDate() + newInterval);
  
  return {
    nextRevision: nextRevisionDate.toISOString(),
    interval: newInterval
  };
};

// Complete a revision
export const completeRevision = (surahNumber: number, difficulty: 'easy' | 'medium' | 'hard'): void => {
  const data = getRevisionData();
  
  if (!data.surahs[surahNumber]) {
    data.surahs[surahNumber] = { memorized: true };
  }
  
  const currentInterval = data.surahs[surahNumber].interval || 1;
  const { nextRevision, interval } = calculateNextRevision(difficulty, currentInterval);
  
  data.surahs[surahNumber] = {
    ...data.surahs[surahNumber],
    lastRevision: new Date().toISOString(),
    nextRevision,
    interval,
    difficulty
  };
  
  // Add to revision history
  data.revisionHistory.push({
    surahNumber,
    date: new Date().toISOString(),
    difficulty
  });
  
  // Update streak
  updateStreak(data);
  
  saveRevisionData(data);
};

// Update streak based on revision activity
const updateStreak = (data: RevisionData): void => {
  const today = new Date().toDateString();
  const lastRevisionDate = data.lastRevisionDate ? new Date(data.lastRevisionDate).toDateString() : null;
  
  if (lastRevisionDate === today) {
    // Already revised today, don't change streak
    return;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  
  if (lastRevisionDate === yesterdayStr) {
    // Continued streak
    data.streak += 1;
  } else if (lastRevisionDate === null) {
    // First revision
    data.streak = 1;
  } else {
    // Streak broken, restart
    data.streak = 1;
  }
  
  data.lastRevisionDate = new Date().toISOString();
};

// Get current streak
export const getStreak = (): number => {
  const data = getRevisionData();
  
  // Check if streak is still valid (revised within last 2 days)
  if (data.lastRevisionDate) {
    const lastRevision = new Date(data.lastRevisionDate);
    const daysSinceLastRevision = Math.floor((Date.now() - lastRevision.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastRevision > 1) {
      // Streak broken
      return 0;
    }
  }
  
  return data.streak || 0;
};

// Get today's revisions
export const getTodaysRevisions = (): TodaysRevision[] => {
  const data = getRevisionData();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaysRevisions: TodaysRevision[] = [];
  
  Object.entries(data.surahs).forEach(([surahNumberStr, surahData]) => {
    const surahNumber = parseInt(surahNumberStr);
    if (surahData.memorized && surahData.nextRevision) {
      const nextRevisionDate = new Date(surahData.nextRevision);
      nextRevisionDate.setHours(0, 0, 0, 0);
      
      if (nextRevisionDate <= today) {
        // Check if already completed today
        const lastRevision = surahData.lastRevision ? new Date(surahData.lastRevision) : null;
        const completedToday = lastRevision && lastRevision.toDateString() === today.toDateString();
        
        todaysRevisions.push({
          surahNumber,
          nextRevision: surahData.nextRevision,
          completed: !!completedToday
        });
      }
    }
  });
  
  return todaysRevisions.sort((a, b) => a.surahNumber - b.surahNumber);
};

// Get upcoming revisions
export const getUpcomingRevisions = (days: number = 30): UpcomingRevision[] => {
  const data = getRevisionData();
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + days);
  
  const upcomingRevisions: UpcomingRevision[] = [];
  
  Object.entries(data.surahs).forEach(([surahNumberStr, surahData]) => {
    const surahNumber = parseInt(surahNumberStr);
    if (surahData.memorized && surahData.nextRevision) {
      const nextRevisionDate = new Date(surahData.nextRevision);
      
      if (nextRevisionDate >= today && nextRevisionDate <= endDate) {
        upcomingRevisions.push({
          surahNumber,
          nextRevision: surahData.nextRevision
        });
      }
    }
  });
  
  return upcomingRevisions.sort((a, b) => new Date(a.nextRevision).getTime() - new Date(b.nextRevision).getTime());
};

// Goals management
export const getGoals = (): Goals => {
  try {
    const goals = localStorage.getItem(GOALS_KEY);
    return goals ? JSON.parse(goals) : {
      dailyRevisions: 3,
      weeklyRevisions: 20,
      memorizePerMonth: 2
    };
  } catch (error) {
    console.error('Error loading goals:', error);
    return {
      dailyRevisions: 3,
      weeklyRevisions: 20,
      memorizePerMonth: 2
    };
  }
};

export const updateGoals = (goals: Goals): void => {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch (error) {
    console.error('Error saving goals:', error);
  }
};

// Get goal progress
export const getGoalProgress = () => {
  const data = getRevisionData();
  const today = new Date();
  
  // Daily progress
  const todaysRevisions = getTodaysRevisions();
  const dailyProgress = todaysRevisions.filter(r => r.completed).length;
  
  // Weekly progress
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const weeklyProgress = data.revisionHistory.filter(revision => {
    const revisionDate = new Date(revision.date);
    return revisionDate >= weekStart;
  }).length;
  
  // Monthly progress (new surahs memorized this month)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlyProgress = Object.values(data.surahs).filter((surah: SurahData) => {
    if (!surah.memorized || !surah.lastRevision) return false;
    const memorizedDate = new Date(surah.lastRevision);
    return memorizedDate >= monthStart;
  }).length;
  
  return {
    dailyProgress,
    weeklyProgress,
    monthlyProgress
  };
};
