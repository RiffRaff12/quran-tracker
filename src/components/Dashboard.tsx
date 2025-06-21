import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Calendar, Target, TrendingUp, Clock } from 'lucide-react';
import { getSurahRevisions, getStreak, getTodaysRevisions, completeRevision } from '@/utils/dataManager';
import { SurahData, TodaysRevision } from '@/types/revision';
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

  const isLoading = isLoadingRevisions || isLoadingStreak || isLoadingToday;

  if (isLoading) {
    return <div>Loading dashboard...</div>; // Replace with a skeleton loader for better UX
  }

  const memorizedSurahs = revisionData.filter(s => s.memorized).length;
  const memorizedPercentage = (memorizedSurahs / 114) * 100;
  
  const dueTodayCount = todaysRevisions.length;
  const completedTodayCount = completedInSession.length;
  const todaysProgress = dueTodayCount > 0 ? (completedTodayCount / dueTodayCount) * 100 : 0;
  
  const dueRevisions = todaysRevisions.filter(r => !completedInSession.includes(r.surahNumber));

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
    </div>
  );
};

export default Dashboard;
