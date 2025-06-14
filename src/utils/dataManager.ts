
// Local storage keys
const REVISION_DATA_KEY = 'quran_revision_data';
const GOALS_KEY = 'quran_revision_goals';

// Default data structure
const getDefaultData = () => ({
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
export const getRevisionData = () => {
  try {
    const data = localStorage.getItem(REVISION_DATA_KEY);
    return data ? JSON.parse(data) : getDefaultData();
  } catch (error) {
    console.error('Error loading revision data:', error);
    return getDefaultData();
  }
};

// Save revision data to localStorage
export const saveRevisionData = (data) => {
  try {
    localStorage.setItem(REVISION_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving revision data:', error);
  }
};

// Update surah memorization status
export const updateSurahStatus = (surahNumber, memorized) => {
  const data = getRevisionData();
  
  if (!data.surahs[surahNumber]) {
    data.surahs[surahNumber] = {};
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
const calculateNextRevision = (difficulty, currentInterval = 1) => {
  let multiplier;
  
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
export const completeRevision = (surahNumber, difficulty) => {
  const data = getRevisionData();
  
  if (!data.surahs[surahNumber]) {
    data.surahs[surahNumber] = {};
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
const updateStreak = (data) => {
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
export const getStreak = () => {
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
export const getTodaysRevisions = () => {
  const data = getRevisionData();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaysRevisions = [];
  
  Object.entries(data.surahs).forEach(([surahNumber, surahData]) => {
    if (surahData.memorized && surahData.nextRevision) {
      const nextRevisionDate = new Date(surahData.nextRevision);
      nextRevisionDate.setHours(0, 0, 0, 0);
      
      if (nextRevisionDate <= today) {
        // Check if already completed today
        const lastRevision = surahData.lastRevision ? new Date(surahData.lastRevision) : null;
        const completedToday = lastRevision && lastRevision.toDateString() === today.toDateString();
        
        todaysRevisions.push({
          surahNumber: parseInt(surahNumber),
          nextRevision: surahData.nextRevision,
          completed: completedToday
        });
      }
    }
  });
  
  return todaysRevisions.sort((a, b) => a.surahNumber - b.surahNumber);
};

// Get upcoming revisions
export const getUpcomingRevisions = (days = 30) => {
  const data = getRevisionData();
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + days);
  
  const upcomingRevisions = [];
  
  Object.entries(data.surahs).forEach(([surahNumber, surahData]) => {
    if (surahData.memorized && surahData.nextRevision) {
      const nextRevisionDate = new Date(surahData.nextRevision);
      
      if (nextRevisionDate >= today && nextRevisionDate <= endDate) {
        upcomingRevisions.push({
          surahNumber: parseInt(surahNumber),
          nextRevision: surahData.nextRevision
        });
      }
    }
  });
  
  return upcomingRevisions.sort((a, b) => new Date(a.nextRevision) - new Date(b.nextRevision));
};

// Goals management
export const getGoals = () => {
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

export const updateGoals = (goals) => {
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
  const monthlyProgress = Object.values(data.surahs).filter(surah => {
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
