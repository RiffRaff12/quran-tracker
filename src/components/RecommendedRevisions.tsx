import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, Flame, CheckCircle, Bell } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import {
  getTodaysRevisions,
  completeRevision,
  undoRevision,
  getSurahRevisions,
  getStreak,
  getTodaysCompletedRevisions,
  CompletedTodayEntry,
} from '@/utils/dataManager';
import { SURAHS } from '@/utils/surahData';
import RevisionCard from '@/components/RevisionCard';
import RevisionToast from '@/components/RevisionToast';
import { TodaysRevision, SurahData } from '@/types/revision';
import { Button } from '@/components/ui/button';
import AddMemorisationDialog from '@/components/AddMemorisationDialog';
import { trackRevisionLogged } from '@/utils/analytics';
import * as pushNotifications from '@/utils/pushNotifications';

const NOTIF_PROMPT_KEY = 'notification-prompt-shown';

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-gray-100" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="h-10 w-20 bg-gray-100 rounded-xl" />
    </div>
  </div>
);

const HowItWorks = () => (
  <div className="text-left bg-emerald-50/60 rounded-xl p-4 mt-6">
    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-2">How it works</p>
    <ul className="text-sm text-gray-600 space-y-1.5 leading-relaxed">
      <li>1. Add the surahs you already know.</li>
      <li>2. Each day, revise the surahs we surface and rate your recall.</li>
      <li>3. Strong surahs come back less often; weak ones come back sooner — right before you'd forget them.</li>
    </ul>
  </div>
);

const RecommendedRevisions = () => {
  const queryClient = useQueryClient();
  const [completedInSession, setCompletedInSession] = useState<number[]>([]);
  const [showAddMemorisation, setShowAddMemorisation] = useState(false);
  const [activeToast, setActiveToast] = useState<{ surahNumber: number; surahName: string; difficulty: 'easy' | 'medium' | 'hard' } | null>(null);
  const [activeMemToast, setActiveMemToast] = useState<{ count: number } | null>(null);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  const { data: todaysRevisions = [], isLoading: isLoadingToday } = useQuery<TodaysRevision[]>({
    queryKey: ['todaysRevisions'],
    queryFn: getTodaysRevisions,
  });

  const { data: surahRevisions = [], isLoading: isLoadingSurahRevisions } = useQuery<SurahData[]>({
    queryKey: ['surahRevisions'],
    queryFn: getSurahRevisions,
  });

  const { data: streak = 0 } = useQuery<number>({
    queryKey: ['streak'],
    queryFn: getStreak,
  });

  const { data: completedToday = [] } = useQuery<CompletedTodayEntry[]>({
    queryKey: ['completedToday'],
    queryFn: getTodaysCompletedRevisions,
  });

  const invalidateRevisionQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['todaysRevisions'] });
    queryClient.invalidateQueries({ queryKey: ['upcomingRevisions'] });
    queryClient.invalidateQueries({ queryKey: ['surahRevisions'] });
    queryClient.invalidateQueries({ queryKey: ['streak'] });
    queryClient.invalidateQueries({ queryKey: ['completedToday'] });
    queryClient.invalidateQueries({ queryKey: ['revisionHistory'] });
  };

  const revisionMutation = useMutation({
    mutationFn: ({ surahNumber, difficulty }: { surahNumber: number; difficulty: 'easy' | 'medium' | 'hard' }) =>
      completeRevision(surahNumber, difficulty),
    onSuccess: (_, variables) => {
      const surahInfo = SURAHS.find(s => s.number === variables.surahNumber);
      const surahName = surahInfo?.transliteration || `Surah ${variables.surahNumber}`;
      setActiveToast({
        surahNumber: variables.surahNumber,
        surahName,
        difficulty: variables.difficulty,
      });
      setCompletedInSession(prev => [...prev, variables.surahNumber]);
      trackRevisionLogged(variables.difficulty, surahName);
      invalidateRevisionQueries();

      // Ask about reminders once, in context, right after the first completed revision
      if (
        Capacitor.isNativePlatform() &&
        completedToday.length === 0 &&
        !localStorage.getItem(NOTIF_PROMPT_KEY)
      ) {
        setShowNotifPrompt(true);
      }
    },
    onError: () => {
      // silent — card stays in list if mutation fails
    }
  });

  const undoMutation = useMutation({
    mutationFn: (surahNumber: number) => undoRevision(surahNumber),
    onSuccess: (_, surahNumber) => {
      setCompletedInSession(prev => prev.filter(n => n !== surahNumber));
      invalidateRevisionQueries();
    },
  });

  const handleMarkComplete = (surahNumber: number, difficulty: 'easy' | 'medium' | 'hard') => {
    revisionMutation.mutate({ surahNumber, difficulty });
  };

  const dismissNotifPrompt = () => {
    localStorage.setItem(NOTIF_PROMPT_KEY, 'true');
    setShowNotifPrompt(false);
  };

  const handleEnableNotifications = async () => {
    await pushNotifications.requestNotificationPermission();
    dismissNotifPrompt();
  };

  const getLearningStep = (surahNumber: number): number => {
    const surahData = surahRevisions.find(s => s.surahNumber === surahNumber);
    return surahData?.learningStep || 0;
  };

  const dueRevisions = todaysRevisions.filter(r => !completedInSession.includes(r.surahNumber));
  const dueSurahNumbers = new Set(dueRevisions.map(r => r.surahNumber));

  // Latest completion per surah today, excluding anything still due (persisted, so
  // it survives tab switches and reloads)
  const completedRevisions = completedToday
    .filter(entry => !dueSurahNumbers.has(entry.surahNumber))
    .filter((entry, idx, arr) => arr.findIndex(e => e.surahNumber === entry.surahNumber) === idx);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueRevisions = dueRevisions.filter(revision => {
    const surahData = surahRevisions.find(s => s.surahNumber === revision.surahNumber);
    return !!surahData?.lastRevision && revision.nextRevision.split('T')[0] < todayStr;
  });
  const dueTodayRevisions = dueRevisions.filter(revision => {
    const surahData = surahRevisions.find(s => s.surahNumber === revision.surahNumber);
    const dateStr = revision.nextRevision.split('T')[0];
    return dateStr === todayStr || !surahData?.lastRevision;
  });

  const groupOverdueRevisions = () => {
    const groups: Record<number, TodaysRevision[]> = {};
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    overdueRevisions.forEach(revision => {
      const dueDate = new Date(revision.nextRevision.split('T')[0] + 'T00:00:00');
      const daysOverdue = Math.round((todayMidnight.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (!groups[daysOverdue]) groups[daysOverdue] = [];
      groups[daysOverdue].push(revision);
    });
    return Object.entries(groups).sort((a, b) => Number(b[0]) - Number(a[0]));
  };
  const overdueGroups = groupOverdueRevisions();

  const memorizedCount = surahRevisions.filter(s => s.memorized).length;

  if (isLoadingToday || isLoadingSurahRevisions) {
    return (
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm animate-pulse h-24" />
          <div className="bg-white rounded-2xl p-4 shadow-sm animate-pulse h-24" />
        </div>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const hasMemorizedSurahs = surahRevisions.some(s => s.memorized);

  if (!hasMemorizedSurahs) {
    return (
      <>
        {/* Stats row still visible as context */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Streak</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <div className="text-xs text-gray-500 mt-0.5">days</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Memorised</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <div className="text-xs text-gray-500 mt-0.5">of 114 surahs</div>
          </div>
        </div>

        {/* Empty state */}
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
              <circle cx="32" cy="32" r="32" fill="#f0fdf4"/>
              <path d="M20 44 C20 44 24 28 32 24 C40 20 44 28 44 28" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M32 24 L32 44" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M26 30 C26 30 29 32 32 30" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
              <path d="M32 30 C32 30 35 32 38 30" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Start your journey</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Add the surahs you've memorised and we'll build your revision schedule.
          </p>
          <Button
            onClick={() => setShowAddMemorisation(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-6 rounded-xl text-base font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Memorisation
          </Button>
          <HowItWorks />
        </div>
        <AddMemorisationDialog open={showAddMemorisation} onOpenChange={setShowAddMemorisation} onSuccess={(count) => setActiveMemToast({ count })} />
      </>
    );
  }

  return (
    <>
      {/* Custom toast — fixed below header, above content */}
      {activeMemToast && (
        <div className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="pointer-events-auto">
            <RevisionToast
              title="Memorisation saved"
              subtitle={`${activeMemToast.count} surah${activeMemToast.count > 1 ? 's' : ''} added`}
              variant="memorisation"
              onDismiss={() => setActiveMemToast(null)}
            />
          </div>
        </div>
      )}
      {activeToast && (
        <div className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="pointer-events-auto">
            <RevisionToast
              title={activeToast.surahName}
              subtitle={`Rated ${activeToast.difficulty.charAt(0).toUpperCase() + activeToast.difficulty.slice(1)}`}
              variant={activeToast.difficulty}
              actionLabel="Undo"
              onAction={() => undoMutation.mutate(activeToast.surahNumber)}
              onDismiss={() => setActiveToast(null)}
            />
          </div>
        </div>
      )}
      <div className="space-y-5 pb-24">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Streak</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{streak}</div>
          <div className="text-xs text-gray-500 mt-0.5">day{streak !== 1 ? 's' : ''}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Memorised</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{memorizedCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">of 114 surahs</div>
        </div>
      </div>

      {/* Contextual notification prompt (shown once, after first completion) */}
      {showNotifPrompt && (
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Nice work — want a reminder next time?</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              We can notify you when a surah is due for revision.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleEnableNotifications}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg"
              >
                Enable reminders
              </Button>
              <Button
                variant="ghost"
                onClick={dismissNotifPrompt}
                className="h-9 px-3 text-sm text-gray-500"
              >
                Not now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* All done state */}
      {dueRevisions.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
              <circle cx="32" cy="32" r="32" fill="#f0fdf4"/>
              <path d="M20 32 L28 40 L44 24" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">All done for today</h3>
          <p className="text-gray-500 text-sm">Your next revisions are scheduled. Come back tomorrow.</p>
        </div>
      )}

      {/* Due revisions */}
      {dueRevisions.length > 0 && (
        <div className="space-y-4">
          {overdueGroups.length > 0 && overdueGroups.map(([days, revisions]) => (
            <div key={days}>
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2 px-1">
                {days} day{Number(days) > 1 ? 's' : ''} overdue
              </p>
              <div className="space-y-2">
                {revisions.map(revision => (
                  <RevisionCard
                    key={revision.surahNumber}
                    revision={revision}
                    onComplete={difficulty => handleMarkComplete(revision.surahNumber, difficulty)}
                    isCompleted={false}
                    learningStep={getLearningStep(revision.surahNumber)}
                  />
                ))}
              </div>
            </div>
          ))}

          {dueTodayRevisions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Today</p>
              <div className="space-y-2">
                {dueTodayRevisions.map(revision => (
                  <RevisionCard
                    key={revision.surahNumber}
                    revision={revision}
                    onComplete={difficulty => handleMarkComplete(revision.surahNumber, difficulty)}
                    isCompleted={false}
                    learningStep={getLearningStep(revision.surahNumber)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed today — persisted, so it survives tab switches and reloads */}
      {completedRevisions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 px-1 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Completed today
          </p>
          <div className="space-y-2">
            {completedRevisions.map(entry => (
              <RevisionCard
                key={entry.surahNumber}
                revision={{ surahNumber: entry.surahNumber, nextRevision: entry.date, completed: true }}
                onComplete={() => {}}
                isCompleted={true}
                ratedDifficulty={entry.difficulty}
                learningStep={getLearningStep(entry.surahNumber)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default RecommendedRevisions;
