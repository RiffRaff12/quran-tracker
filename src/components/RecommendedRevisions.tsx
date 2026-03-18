import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, AlertTriangle, Plus, BookOpen } from 'lucide-react';
import { getTodaysRevisions, getUpcomingRevisions, completeRevision, addBackdatedRevision, getSurahRevisions } from '@/utils/dataManager';
import { SURAHS } from '@/utils/surahData';
import RevisionCard from '@/components/RevisionCard';
import { useToast } from '@/hooks/use-toast';
import { TodaysRevision, SurahData } from '@/types/revision';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AddMemorisationDialog from '@/components/AddMemorisationDialog';

const RecommendedRevisions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State to track which revisions have been completed in the current session
  const [completedInSession, setCompletedInSession] = useState<number[]>([]);
  const [showAddMemorisation, setShowAddMemorisation] = useState(false);

  // State for Add Missed Revision dialog
  const [open, setOpen] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<number | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [submitting, setSubmitting] = useState(false);

  const handleAddMissedRevision = async () => {
    if (!selectedSurah || !selectedDate || !selectedDifficulty) return;
    setSubmitting(true);
    try {
      await addBackdatedRevision(selectedSurah, selectedDifficulty, selectedDate);
      toast({ title: 'Missed revision added', description: 'Your backdated revision was logged.' });
      setOpen(false);
      setSelectedSurah(undefined);
      setSelectedDate(undefined);
      setSelectedDifficulty('easy');
      queryClient.invalidateQueries({ queryKey: ['todaysRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['surahRevisions'] });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch revisions using React Query
  const { data: todaysRevisions = [], isLoading: isLoadingToday } = useQuery<TodaysRevision[]>({
    queryKey: ['todaysRevisions'],
    queryFn: getTodaysRevisions,
  });

  const { data: upcomingRevisions = [], isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['upcomingRevisions'],
    queryFn: () => getUpcomingRevisions(7),
  });

  // Fetch surah revisions data to get learning step information
  const { data: surahRevisions = [], isLoading: isLoadingSurahRevisions } = useQuery<SurahData[]>({
    queryKey: ['surahRevisions'],
    queryFn: getSurahRevisions,
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

  const getLearningStep = (surahNumber: number): number => {
    const surahData = surahRevisions.find(s => s.surahNumber === surahNumber);
    return surahData?.learningStep || 0;
  };

  const dueRevisions = todaysRevisions.filter(
    r => !completedInSession.includes(r.surahNumber)
  );
  
  const completedRevisions = todaysRevisions.filter(
    r => completedInSession.includes(r.surahNumber)
  );

  // Split dueRevisions into overdue and due today
  // A surah is only overdue if it has been revised before (lastRevision exists) AND the next date is in the past
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueRevisions = dueRevisions.filter(revision => {
    const surahData = surahRevisions.find(s => s.surahNumber === revision.surahNumber);
    const hasBeenRevisedBefore = !!surahData?.lastRevision;
    return hasBeenRevisedBefore && revision.nextRevision.split('T')[0] < todayStr;
  });
  const dueTodayRevisions = dueRevisions.filter(revision => {
    const surahData = surahRevisions.find(s => s.surahNumber === revision.surahNumber);
    const hasBeenRevisedBefore = !!surahData?.lastRevision;
    const dateStr = revision.nextRevision.split('T')[0];
    // Show as "today" if: due today, OR never revised before (newly added)
    return dateStr === todayStr || !hasBeenRevisedBefore;
  });

  // Group overdue revisions by days overdue
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
    // Sort by most overdue first
    return Object.entries(groups).sort((a, b) => Number(b[0]) - Number(a[0]));
  };
  const overdueGroups: [string, TodaysRevision[]][] = groupOverdueRevisions();

  if (isLoadingToday || isLoadingSurahRevisions) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const hasMemorizedSurahs = surahRevisions.some(s => s.memorized);

  if (!hasMemorizedSurahs) {
    return (
      <>
        <Card className="text-center p-8 mt-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-emerald-800 mb-2">
            Get started
          </h3>
          <p className="text-gray-600 mb-6">
            Add your memorised surahs to get started
          </p>
          <Button
            onClick={() => setShowAddMemorisation(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Memorisation
          </Button>
        </Card>
        <AddMemorisationDialog open={showAddMemorisation} onOpenChange={setShowAddMemorisation} />
      </>
    );
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
    <div className="space-y-6 pb-20">
      {/* Today's Revisions */}
      {dueRevisions.length > 0 && (
        <div className="mt-1">
          {overdueGroups.length > 0 && overdueGroups.map(([days, revisions]) => (
            <div key={days} className="mb-6">
              <div className="text-sm font-medium text-red-500 px-1 mb-2">{days} day{Number(days) > 1 ? 's' : ''} overdue</div>
              <div className="space-y-3">
                {revisions.map((revision) => (
                  <RevisionCard
                    key={revision.surahNumber}
                    revision={revision}
                    onComplete={(difficulty) => handleMarkComplete(revision.surahNumber, difficulty)}
                    isCompleted={false}
                    learningStep={getLearningStep(revision.surahNumber)}
                  />
                ))}
              </div>
            </div>
          ))}
          {dueTodayRevisions.length > 0 && (
            <>
              <div className="text-sm font-medium text-muted-foreground px-1 mb-2">Today</div>
              <div className="space-y-3">
                {dueTodayRevisions.map((revision) => (
                  <RevisionCard
                    key={revision.surahNumber}
                    revision={revision}
                    onComplete={(difficulty) => handleMarkComplete(revision.surahNumber, difficulty)}
                    isCompleted={false}
                    learningStep={getLearningStep(revision.surahNumber)}
                  />
                ))}
              </div>
            </>
          )}
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
                learningStep={getLearningStep(revision.surahNumber)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecommendedRevisions;
