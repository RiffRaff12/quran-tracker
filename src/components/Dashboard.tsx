import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { getSurahRevisions, getStreak, getTodaysRevisions, getUpcomingRevisions, getAllRevisionLogs, getTodaysCompletedRevisions, CompletedTodayEntry } from '@/utils/dataManager';
import { SurahData, TodaysRevision } from '@/types/revision';
import { SURAHS } from '@/utils/surahData';

const Dashboard = () => {
  // Fetch all necessary data in parallel
  const { data: revisionData = [], isLoading: isLoadingRevisions } = useQuery<SurahData[]>({
    queryKey: ['surahRevisions'],
    queryFn: getSurahRevisions
  });

  const { data: streak = 0, isLoading: isLoadingStreak } = useQuery<number>({
    queryKey: ['streak'],
    queryFn: getStreak
  });

  const { data: todaysRevisions = [], isLoading: isLoadingToday } = useQuery<TodaysRevision[]>({
    queryKey: ['todaysRevisions'],
    queryFn: getTodaysRevisions
  });

  const { data: completedToday = [], isLoading: isLoadingCompleted } = useQuery<CompletedTodayEntry[]>({
    queryKey: ['completedToday'],
    queryFn: getTodaysCompletedRevisions
  });

  const { data: upcomingRevisions = [], isLoading: isLoadingUpcoming } = useQuery<import('@/types/revision').UpcomingRevision[]>({
    queryKey: ['upcomingRevisions'],
    queryFn: () => getUpcomingRevisions(30) // Get for the next 30 days
  });

  const { data: revisionHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['revisionHistory'],
    queryFn: async () => {
      const logs = await getAllRevisionLogs();
      // Flatten and sort logs to get the 10 most recent revision history entries
      return logs
        .flatMap(log => log.revisionHistory)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    },
  });

  const isLoading = isLoadingRevisions || isLoadingStreak || isLoadingToday || isLoadingCompleted || isLoadingUpcoming || isLoadingHistory;

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
            <div className="h-8 bg-gray-100 rounded w-1/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const memorizedSurahs = revisionData.filter(s => s.memorized).length;

  // Completed revisions move their next date forward, so they leave todaysRevisions.
  // The day's total is therefore what's still due plus what's already been done today.
  const stillDueCount = todaysRevisions.length;
  const completedTodayCount = completedToday.length;
  const dueTodayCount = stillDueCount + completedTodayCount;

  // Calendar helper functions
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRevisionsByDate = () => {
    const revisionsByDate: Record<string, import('@/types/revision').UpcomingRevision[]> = {};
    upcomingRevisions.forEach(revision => {
      if (!revision.nextRevision) return;
      const dateKey = new Date(revision.nextRevision).toDateString();
      if (!revisionsByDate[dateKey]) {
        revisionsByDate[dateKey] = [];
      }
      revisionsByDate[dateKey].push(revision);
    });
    return revisionsByDate;
  };

  const revisionsByDate = getRevisionsByDate();
  const sortedDates = Object.keys(revisionsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <div className="space-y-4 pb-24">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm col-span-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Memorised</div>
          <div className="text-2xl font-bold text-gray-900">{memorizedSurahs}</div>
          <div className="text-xs text-gray-500">of 114</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm col-span-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Streak</div>
          <div className="text-2xl font-bold text-gray-900">{streak}</div>
          <div className="text-xs text-gray-500">day{streak !== 1 ? 's' : ''}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm col-span-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Today</div>
          <div className="text-2xl font-bold text-gray-900">{completedTodayCount}/{dueTodayCount}</div>
          <div className="text-xs text-gray-500">done</div>
        </div>
      </div>

      {/* Upcoming Revisions */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">Upcoming Revisions</h2>
          <p className="text-xs text-gray-500 mt-0.5">Next 30 days</p>
        </div>
        {sortedDates.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No upcoming revisions scheduled.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sortedDates.slice(0, 5).map(dateKey => {
              const date = new Date(dateKey);
              const revisions = revisionsByDate[dateKey];
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={dateKey} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold ${isToday ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {formatDate(dateKey)}
                    </span>
                    {isToday && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Today</span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {revisions.map(revision => {
                      const surah = SURAHS.find(s => s.number === revision.surahNumber);
                      if (!surah) return null;
                      return (
                        <div key={revision.surahNumber} className="flex items-center gap-3 py-1">
                          <div className="h-8 w-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {surah.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{surah.transliteration}</div>
                            <div className="text-xs text-gray-500">{surah.name}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent History */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">Recent History</h2>
          <p className="text-xs text-gray-500 mt-0.5">Last 10 revisions</p>
        </div>
        {revisionHistory.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="text-sm text-gray-500">No revision history yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {revisionHistory.map((rev, idx) => {
              const surah = SURAHS.find(s => s.number === rev.surahNumber);
              if (!surah) return null;
              const difficultyColors: Record<string, string> = {
                easy: 'bg-emerald-100 text-emerald-700',
                medium: 'bg-amber-100 text-amber-700',
                hard: 'bg-red-100 text-red-700',
              };
              return (
                <div key={idx} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-8 w-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {surah.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{surah.transliteration}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(rev.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${difficultyColors[rev.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                    {rev.difficulty}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
