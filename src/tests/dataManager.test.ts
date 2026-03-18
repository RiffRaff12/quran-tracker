import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as idbManager from '@/utils/idbManager';
import * as pushNotifications from '@/utils/pushNotifications';
import {
  completeRevision,
  getTodaysRevisions,
  getStreak,
  addMemorizedSurah,
  getUserProfile,
  updateUserOnboarding,
  getLearningPhaseStatus,
} from '@/utils/dataManager';
import { SurahData, RevisionData } from '@/types/revision';

vi.mock('@/utils/idbManager');
vi.mock('@/utils/pushNotifications');

// Returns midnight local time for today + daysOffset.
// This matches how getStreak and getTodaysRevisions compute their reference date.
const localMidnight = (daysOffset = 0): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysOffset);
  return d;
};

// The "today" date string as computed by getTodaysRevisions / getStreak
const todayStr = () => localMidnight(0).toISOString().split('T')[0];

const makeSurah = (overrides: Partial<SurahData> = {}): SurahData => ({
  surahNumber: 1,
  memorized: true,
  interval: 1,
  easeFactor: 2.5,
  learningStep: 1,
  consecutiveCorrect: 0,
  lapses: 0,
  // Default nextRevision = today as the functions see it
  nextRevision: localMidnight(0).toISOString(),
  ...overrides,
});

// Build a revision log whose lastRevisionDate starts with the UTC date string
// that getStreak uses for the given day offset.
const makeLog = (daysOffset = 0): RevisionData & { id: string } => {
  const d = localMidnight(daysOffset);
  return {
    id: `log_${d.getTime()}`,
    lastRevisionDate: d.toISOString(),
    surahs: {},
    revisionHistory: [],
    streak: 0,
    goals: { dailyRevisions: 5, weeklyRevisions: 20, memorizePerMonth: 1 },
  };
};

beforeEach(() => {
  vi.mocked(idbManager.setSurahRevisions).mockResolvedValue(undefined);
  vi.mocked(idbManager.addRevisionLog).mockResolvedValue(undefined);
  vi.mocked(pushNotifications.scheduleLocalNotification).mockResolvedValue(undefined);
});

// ─── getLearningPhaseStatus ───────────────────────────────────────────────────

describe('getLearningPhaseStatus', () => {
  it('step 0 → New', () => expect(getLearningPhaseStatus(0).status).toBe('New'));
  it('step 1 → Just Memorised', () => expect(getLearningPhaseStatus(1).status).toBe('Just Memorised'));
  it('step 2 → Quick Review', () => expect(getLearningPhaseStatus(2).status).toBe('Quick Review'));
  it('step 3 → Settling In', () => expect(getLearningPhaseStatus(3).status).toBe('Settling In'));
  it('step 4 → Regular Practice', () => expect(getLearningPhaseStatus(4).status).toBe('Regular Practice'));
  it('step 10 → Regular Practice', () => expect(getLearningPhaseStatus(10).status).toBe('Regular Practice'));
});

// ─── completeRevision — Early Repetition Phase (steps 1–3) ───────────────────

describe('completeRevision — Early Repetition Phase', () => {
  const getSaved = () => {
    const calls = vi.mocked(idbManager.setSurahRevisions).mock.calls;
    return calls[calls.length - 1][0].find((s: SurahData) => s.surahNumber === 1)!;
  };

  it('Easy at step 1 → step 2, interval 2', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([makeSurah({ learningStep: 1, interval: 1 })]);
    await completeRevision(1, 'easy');
    const u = getSaved();
    expect(u.learningStep).toBe(2);
    expect(u.interval).toBe(2);
  });

  it('Easy at step 2 → step 3, interval 3', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([makeSurah({ learningStep: 2, interval: 2 })]);
    await completeRevision(1, 'easy');
    const u = getSaved();
    expect(u.learningStep).toBe(3);
    expect(u.interval).toBe(3);
  });

  it('Easy at step 3 → graduates to step 4, interval 4', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([makeSurah({ learningStep: 3, interval: 3 })]);
    await completeRevision(1, 'easy');
    const u = getSaved();
    expect(u.learningStep).toBe(4);
    expect(u.interval).toBe(4);
  });

  it('Medium at step 1 → stays step 1, interval 1', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([makeSurah({ learningStep: 1, interval: 1 })]);
    await completeRevision(1, 'medium');
    const u = getSaved();
    expect(u.learningStep).toBe(1);
    expect(u.interval).toBe(1);
  });

  it('Medium at step 2 → stays step 2, interval 2', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([makeSurah({ learningStep: 2, interval: 2 })]);
    await completeRevision(1, 'medium');
    const u = getSaved();
    expect(u.learningStep).toBe(2);
    expect(u.interval).toBe(2);
  });

  it('Hard at step 2 → resets to step 1, interval 1, easeFactor decreases', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([makeSurah({ learningStep: 2, interval: 2, easeFactor: 2.5 })]);
    await completeRevision(1, 'hard');
    const u = getSaved();
    expect(u.learningStep).toBe(1);
    expect(u.interval).toBe(1);
    expect(u.easeFactor).toBeCloseTo(2.3);
  });

  it('Hard with easeFactor at 1.3 → does not go below 1.3', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([makeSurah({ learningStep: 1, easeFactor: 1.3 })]);
    await completeRevision(1, 'hard');
    expect(getSaved().easeFactor).toBe(1.3);
  });

  it('next revision date is interval days from today', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([makeSurah({ learningStep: 1, interval: 1 })]);
    await completeRevision(1, 'easy'); // easy at step 1 → interval 2
    const nextRev = new Date(getSaved().nextRevision!);
    const expected = new Date();
    expected.setDate(expected.getDate() + 2);
    expect(nextRev.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
  });

  it('throws if surah not found', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([]);
    await expect(completeRevision(999, 'easy')).rejects.toThrow('Surah 999 not found');
  });
});

// ─── completeRevision — Main Schedule Phase (step 4+) ────────────────────────

describe('completeRevision — Main Schedule Phase', () => {
  const getSaved = () => {
    const calls = vi.mocked(idbManager.setSurahRevisions).mock.calls;
    return calls[calls.length - 1][0].find((s: SurahData) => s.surahNumber === 1)!;
  };

  it('Easy at step 4 → easeFactor increases, interval scales up', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([makeSurah({ learningStep: 4, interval: 10, easeFactor: 2.5 })]);
    await completeRevision(1, 'easy');
    const u = getSaved();
    expect(u.easeFactor).toBeCloseTo(2.65);
    expect(u.interval).toBe(Math.round(10 * 2.65));
  });

  it('Medium at step 4 → easeFactor decreases, interval still scales', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([makeSurah({ learningStep: 4, interval: 10, easeFactor: 2.5 })]);
    await completeRevision(1, 'medium');
    const u = getSaved();
    expect(u.easeFactor).toBeCloseTo(2.35);
    expect(u.interval).toBe(Math.round(10 * 2.35));
  });

  it('Hard at step 4 → lapses increments, resets to step 1, interval 1', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([makeSurah({ learningStep: 4, interval: 10, easeFactor: 2.5, lapses: 0 })]);
    await completeRevision(1, 'hard');
    const u = getSaved();
    expect(u.learningStep).toBe(1);
    expect(u.interval).toBe(1);
    expect(u.lapses).toBe(1);
    expect(u.easeFactor).toBeCloseTo(2.3);
  });

  it('consecutiveCorrect increments on easy, resets to 0 on hard', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([makeSurah({ learningStep: 4, consecutiveCorrect: 3 })]);
    await completeRevision(1, 'easy');
    expect(getSaved().consecutiveCorrect).toBe(4);

    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([makeSurah({ learningStep: 4, consecutiveCorrect: 3 })]);
    await completeRevision(1, 'hard');
    expect(getSaved().consecutiveCorrect).toBe(0);
  });

  it('easeFactor never drops below 1.3 on repeated hard ratings', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([makeSurah({ learningStep: 4, easeFactor: 1.3 })]);
    await completeRevision(1, 'hard');
    expect(getSaved().easeFactor).toBe(1.3);
  });
});

// ─── getTodaysRevisions ───────────────────────────────────────────────────────

describe('getTodaysRevisions', () => {
  it('returns empty array when no surahs', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([]);
    expect(await getTodaysRevisions()).toEqual([]);
  });

  it('returns surah due today', async () => {
    // Use the same date string the function computes for "today"
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([
      makeSurah({ surahNumber: 1, nextRevision: localMidnight(0).toISOString() }),
    ]);
    const result = await getTodaysRevisions();
    expect(result).toHaveLength(1);
    expect(result[0].surahNumber).toBe(1);
  });

  it('returns overdue surah (nextRevision 5 days in the past)', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([
      makeSurah({ surahNumber: 2, nextRevision: localMidnight(-5).toISOString() }),
    ]);
    const result = await getTodaysRevisions();
    expect(result).toHaveLength(1);
    expect(result[0].surahNumber).toBe(2);
  });

  it('does not return surah due tomorrow', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([
      makeSurah({ nextRevision: localMidnight(1).toISOString() }),
    ]);
    expect(await getTodaysRevisions()).toHaveLength(0);
  });

  it('does not return non-memorized surah', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([
      makeSurah({ memorized: false }),
    ]);
    expect(await getTodaysRevisions()).toHaveLength(0);
  });

  it('does not return surah with no nextRevision', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([
      makeSurah({ nextRevision: undefined }),
    ]);
    expect(await getTodaysRevisions()).toHaveLength(0);
  });
});

// ─── Overdue logic — newly added surah ───────────────────────────────────────

describe('Overdue logic — newly added surah', () => {
  it('addMemorizedSurah sets nextRevision to today (local date), lastRevision undefined', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([]);
    await addMemorizedSurah(1);
    const saved = vi.mocked(idbManager.setSurahRevisions).mock.calls[0][0];
    const surah = saved.find((s: SurahData) => s.surahNumber === 1)!;

    // addMemorizedSurah uses local date string — compare against local date
    const localToday = new Date();
    const localTodayStr = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(localToday.getDate()).padStart(2, '0')}`;
    // nextRevision is stored as ISO string of midnight local time
    const nextRevLocal = new Date(surah.nextRevision!);
    const nextRevLocalStr = `${nextRevLocal.getFullYear()}-${String(nextRevLocal.getMonth() + 1).padStart(2, '0')}-${String(nextRevLocal.getDate()).padStart(2, '0')}`;

    expect(nextRevLocalStr).toBe(localTodayStr);
    expect(surah.lastRevision).toBeUndefined();
  });

  it('newly added surah appears in today\'s revisions', async () => {
    // Simulate what addMemorizedSurah stores: nextRevision = midnight local today
    const localToday = new Date();
    const localDateStr = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(localToday.getDate()).padStart(2, '0')}`;
    const nextRevision = new Date(`${localDateStr}T00:00:00`);

    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([
      makeSurah({ surahNumber: 1, nextRevision: nextRevision.toISOString(), lastRevision: undefined }),
    ]);
    const result = await getTodaysRevisions();
    expect(result).toHaveLength(1);
  });

  it('newly added surah has lastRevision=undefined (never overdue on first add)', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([]);
    await addMemorizedSurah(5);
    const saved = vi.mocked(idbManager.setSurahRevisions).mock.calls[0][0];
    const surah = saved.find((s: SurahData) => s.surahNumber === 5)!;
    expect(surah.lastRevision).toBeUndefined();
  });

  it('addMemorizedSurah sets learningStep to 1', async () => {
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([]);
    await addMemorizedSurah(1);
    const saved = vi.mocked(idbManager.setSurahRevisions).mock.calls[0][0];
    expect(saved.find((s: SurahData) => s.surahNumber === 1)!.learningStep).toBe(1);
  });
});

// ─── getStreak ────────────────────────────────────────────────────────────────

describe('getStreak', () => {
  it('returns 0 with no revision logs', async () => {
    vi.mocked(idbManager.getAllRevisionLogs).mockResolvedValue([]);
    expect(await getStreak()).toBe(0);
  });

  it('returns 1 when only today has a revision', async () => {
    vi.mocked(idbManager.getAllRevisionLogs).mockResolvedValue([makeLog(0)]);
    expect(await getStreak()).toBe(1);
  });

  it('returns 2 when today and yesterday both have revisions', async () => {
    vi.mocked(idbManager.getAllRevisionLogs).mockResolvedValue([makeLog(0), makeLog(-1)]);
    expect(await getStreak()).toBe(2);
  });

  it('returns 0 when only yesterday has a revision (streak broken today)', async () => {
    vi.mocked(idbManager.getAllRevisionLogs).mockResolvedValue([makeLog(-1)]);
    expect(await getStreak()).toBe(0);
  });

  it('stops counting at a gap in history', async () => {
    // today + yesterday = 2, then gap (no day -2), then day -3
    vi.mocked(idbManager.getAllRevisionLogs).mockResolvedValue([makeLog(0), makeLog(-1), makeLog(-3)]);
    expect(await getStreak()).toBe(2);
  });

  it('counts multiple revisions on the same day as 1 streak day', async () => {
    // Two logs both on "today" (same UTC date prefix)
    const log1 = makeLog(0);
    const log2 = { ...makeLog(0), id: 'log_duplicate' };
    vi.mocked(idbManager.getAllRevisionLogs).mockResolvedValue([log1, log2]);
    expect(await getStreak()).toBe(1);
  });
});

// ─── getUserProfile — onboarding state ───────────────────────────────────────

describe('getUserProfile — onboarding state', () => {
  it('returns default profile with hasCompletedOnboarding=false when no profile exists', async () => {
    vi.mocked(idbManager.getUserProfileOffline).mockResolvedValue(undefined);
    const profile = await getUserProfile();
    expect(profile.hasCompletedOnboarding).toBe(false);
    expect(profile.id).toBe('local-profile');
    expect(profile.memorisedSurahs).toEqual([]);
  });

  it('returns stored profile when it exists', async () => {
    vi.mocked(idbManager.getUserProfileOffline).mockResolvedValue({
      id: 'local-profile',
      hasCompletedOnboarding: true,
      memorisedSurahs: [1, 2, 3],
      goals: { dailyRevisions: 5, weeklyRevisions: 20, memorizePerMonth: 1 },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
    const profile = await getUserProfile();
    expect(profile.hasCompletedOnboarding).toBe(true);
    expect(profile.memorisedSurahs).toEqual([1, 2, 3]);
  });
});

// ─── updateUserOnboarding ─────────────────────────────────────────────────────

describe('updateUserOnboarding', () => {
  it('sets hasCompletedOnboarding=true and saves memorised surahs', async () => {
    vi.mocked(idbManager.getUserProfileOffline).mockResolvedValue(undefined);
    vi.mocked(idbManager.setUserProfileOffline).mockResolvedValue(undefined);
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([]);

    const result = await updateUserOnboarding([1, 2]);

    expect(result.hasCompletedOnboarding).toBe(true);
    expect(result.memorisedSurahs).toEqual([1, 2]);
    expect(idbManager.setUserProfileOffline).toHaveBeenCalledWith(
      expect.objectContaining({ hasCompletedOnboarding: true, memorisedSurahs: [1, 2] })
    );
  });

  it('calls addMemorizedSurah for each surah in the list', async () => {
    vi.mocked(idbManager.getUserProfileOffline).mockResolvedValue(undefined);
    vi.mocked(idbManager.setUserProfileOffline).mockResolvedValue(undefined);
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([]);

    await updateUserOnboarding([3, 7, 114]);

    // setSurahRevisions is called once per surah (via addMemorizedSurah)
    expect(idbManager.setSurahRevisions).toHaveBeenCalledTimes(3);
  });

  it('empty list → hasCompletedOnboarding=true with no surahs', async () => {
    vi.mocked(idbManager.getUserProfileOffline).mockResolvedValue(undefined);
    vi.mocked(idbManager.setUserProfileOffline).mockResolvedValue(undefined);
    vi.mocked(idbManager.getAllSurahRevisions).mockResolvedValue([]);

    const result = await updateUserOnboarding([]);
    expect(result.hasCompletedOnboarding).toBe(true);
    expect(result.memorisedSurahs).toEqual([]);
  });
});
