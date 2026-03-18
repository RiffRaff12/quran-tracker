import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { getSurahRevisions, getStreak, getTodaysRevisions, completeRevision, getUpcomingRevisions, getAllRevisionLogs } from '@/utils/dataManager';
import { SurahData, TodaysRevision } from '@/types/revision';
import { SURAHS } from '@/utils/surahData';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [completedInSession, setCompletedInSession] = useState<number[]>([]);

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
  
  const revisionMutation = useMutation({
    mutationFn: ({ surahNumber, difficulty }: { surahNumber: number; difficulty: 'easy' | 'medium' | 'hard' }) =>
      completeRevision(surahNumber, difficulty),
    onSuccess: (data, variables) => {
      toast({
        title: `Revision Rated!`,
        description: `Your revision has been logged.`,
      });
      setCompletedInSession(prev => [...prev, variables.surahNumber]);
      // Invalidate all relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['todaysRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['surahRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['revisionHistory'] });
    },
    onError: (error) => {
       toast({
        variant: 'destructive',
        title: 'Error completing revision',
        description: error.message,
      });
    }
  });

  const handleMarkComplete = (surahNumber: number, difficulty: 'easy' | 'medium' | 'hard') => {
    revisionMutation.mutate({ surahNumber, difficulty });
  };

  const isLoading = isLoadingRevisions || isLoadingStreak || isLoadingToday || isLoadingUpcoming || isLoadingHistory;

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
  const memorizedPercentage = (memorizedSurahs / 114) * 100;
  
  const dueTodayCount = todaysRevisions.length;
  const completedTodayCount = completedInSession.length;
  const todaysProgress = dueTodayCount > 0 ? (completedTodayCount / dueTodayCount) * 100 : 0;
  
  const dueRevisions = todaysRevisions.filter(r => !completedInSession.includes(r.surahNumber));

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
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Memorised</div>
          <div className="text-2xl font-bold text-gray-900">{memorizedSurahs}</div>
          <div className="text-xs text-gray-400">of 114</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm col-span-1">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Streak</div>
          <div className="text-2xl font-bold text-gray-900">{streak}</div>
          <div className="text-xs text-gray-400">days</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm col-span-1">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Today</div>
          <div className="text-2xl font-bold text-gray-900">{completedTodayCount}/{dueTodayCount}</div>
          <div className="text-xs text-gray-400">done</div>
        </div>
      </div>

      {/* Upcoming Revisions */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">Upcoming Revisions</h2>
          <p className="text-xs text-gray-400 mt-0.5">Next 30 days</p>
        </div>
        {sortedDates.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Calendar className="h-8 w-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No upcoming revisions scheduled.</p>
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
                            <div className="text-sm font-medium text-gray-900 truncate">{surah.name}</div>
                            <div className="text-xs text-gray-400">{surah.transliteration}</div>
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
          <p className="text-xs text-gray-400 mt-0.5">Last 10 revisions</p>
        </div>
        {revisionHistory.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="text-sm text-gray-400">No revision history yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {revisionHistory.map((rev: any, idx: number) => {
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
                    <div className="text-sm font-medium text-gray-900 truncate">{surah.name}</div>
                    <div className="text-xs text-gray-400">
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
