import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, AlertTriangle } from 'lucide-react';
import { getTodaysRevisions, getUpcomingRevisions, completeRevision } from '@/utils/dataManager';
import { SURAHS } from '@/utils/surahData';
import RevisionCard from '@/components/RevisionCard';
import { useToast } from '@/hooks/use-toast';
import { TodaysRevision } from '@/types/revision';

const RecommendedRevisions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State to track which revisions have been completed in the current session
  const [completedInSession, setCompletedInSession] = useState<number[]>([]);

  // Fetch revisions using React Query
  const { data: todaysRevisions = [], isLoading: isLoadingToday } = useQuery<TodaysRevision[]>({
    queryKey: ['todaysRevisions'],
    queryFn: getTodaysRevisions,
  });

  const { data: upcomingRevisions = [], isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['upcomingRevisions'],
    queryFn: () => getUpcomingRevisions(7),
  });

  // Mutation for completing a revision
  const revisionMutation = useMutation({
    mutationFn: ({ surahNumber, difficulty }: { surahNumber: number; difficulty: 'easy' | 'medium' | 'hard' }) =>
      completeRevision(surahNumber, difficulty),
    onSuccess: (data, variables) => {
      const surahInfo = getSurahInfo(variables.surahNumber);
      toast({
        title: `Revision Rated`,
        description: `You rated ${surahInfo?.name} (${surahInfo?.transliteration}) as "${variables.difficulty}".`,
      });
      // Mark as completed in the local UI state
      setCompletedInSession(prev => [...prev, variables.surahNumber]);
      // Invalidate queries to refetch data from the server
      queryClient.invalidateQueries({ queryKey: ['todaysRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['surahRevisions'] }); // For the surahs tab
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
  
  const getSurahInfo = (surahNumber: number) => {
    return SURAHS.find(s => s.number === surahNumber);
  };

  const dueRevisions = todaysRevisions.filter(
    r => !completedInSession.includes(r.surahNumber)
  );
  
  const completedRevisions = todaysRevisions.filter(
    r => completedInSession.includes(r.surahNumber)
  );

  if (isLoadingToday) {
    return <div>Loading revisions...</div>; // Or a nice skeleton loader
  }

  if (todaysRevisions.length === 0) {
    return (
      <Card className="text-center p-8 mt-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-emerald-800 mb-2">
          All Set for Today!
        </h3>
        <p className="text-gray-600 mb-4">
          You don't have any revisions due today. Check the Surahs tab to add more memorized surahs.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Revisions */}
      {dueRevisions.length > 0 && (
        <div className="mt-8">
          <div className="text-sm font-medium text-muted-foreground px-1 mb-2">Today</div>
          <div className="space-y-3">
            {dueRevisions.map((revision) => (
              <RevisionCard
                key={revision.surahNumber}
                revision={revision}
                onComplete={(difficulty) => handleMarkComplete(revision.surahNumber, difficulty)}
                isCompleted={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Today Section */}
      {completedRevisions.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Target className="w-5 h-5" />
              Completed Today
              <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-800">
                {completedRevisions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedRevisions.map((revision) => (
              <RevisionCard
                key={revision.surahNumber}
                revision={revision}
                onComplete={() => {}}
                isCompleted={true}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecommendedRevisions;
