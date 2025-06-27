import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, Target, TrendingUp, Clock } from 'lucide-react';
import { getSurahRevisions, getStreak, getTodaysRevisions, completeRevision, getUpcomingRevisions, getAllRevisionLogs } from '@/utils/dataManager';
import { SurahData, TodaysRevision } from '@/types/revision';
import { SURAHS } from '@/utils/surahData';
import RevisionCard from '@/components/RevisionCard';
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
    return <div>Loading dashboard...</div>; // Replace with a skeleton loader for better UX
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
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Card>
          <CardHeader className="p-3 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Memorized</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">{memorizedSurahs}/114</div>
            <p className="text-xs text-muted-foreground">
              {memorizedPercentage.toFixed(0)}% of Quran
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">{streak} Days</div>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
           <CardHeader className="p-3 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Goal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">{completedTodayCount}/{dueTodayCount}</div>
            <p className="text-xs text-muted-foreground">Revisions completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Memorization Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={memorizedPercentage} className="w-full h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {memorizedSurahs} of 114 surahs memorized
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Today's Revisions</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={todaysProgress} className="w-full h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedTodayCount} of {dueTodayCount} revisions completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Revisions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Revisions
          </CardTitle>
          <CardDescription className="text-sm">
            Next 30 days of scheduled revisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedDates.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <Calendar className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-2 md:mb-4" />
              <p className="text-muted-foreground text-sm md:text-base">
                No upcoming revisions scheduled.
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {sortedDates.slice(0, 5).map(dateKey => {
                const date = new Date(dateKey);
                const revisions = revisionsByDate[dateKey];
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div key={dateKey} className="space-y-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <h3 className={`font-semibold text-sm md:text-base ${
                        isToday ? 'text-emerald-600' : 'text-foreground'
                      }`}>
                        {formatDate(dateKey)}
                      </h3>
                      {isToday && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-xs">
                          Today
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 pl-2">
                      {revisions.map(revision => {
                        const surah = SURAHS.find(s => s.number === revision.surahNumber);
                        if (!surah) return null;

                        return (
                          <div
                            key={revision.surahNumber}
                            className="flex items-center justify-between p-3 rounded-lg border bg-white"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-sm h-8 w-8 rounded-full flex items-center justify-center font-medium bg-gray-100 text-gray-600">
                                {surah.number}
                              </div>
                              <div>
                                <h3 className="font-semibold">{`${surah.transliteration} (${surah.name})`}</h3>
                                <p className="text-sm text-muted-foreground">{`${surah.verses} verses`}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Due on</p>
                              <p className="text-xs font-medium">
                                {new Date(revision.nextRevision).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
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
        </CardContent>
      </Card>

      {/* Recent Revision History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Revision History
          </CardTitle>
          <CardDescription className="text-sm">
            Your last 10 completed revisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {revisionHistory.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <p className="text-muted-foreground text-sm md:text-base">
                No revision history yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {revisionHistory.map((rev: any, idx: number) => {
                const surah = SURAHS.find(s => s.number === rev.surahNumber);
                if (!surah) return null;
                
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm h-8 w-8 rounded-full flex items-center justify-center font-medium bg-gray-100 text-gray-600">
                        {surah.number}
                      </div>
                      <div>
                        <h3 className="font-semibold">{`${surah.transliteration} (${surah.name})`}</h3>
                        <p className="text-sm text-muted-foreground">{`${surah.verses} verses`}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Revised on {new Date(rev.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <Badge className="text-xs capitalize mt-1" variant="outline">
                        {rev.difficulty}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
