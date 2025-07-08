import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SURAHS, Surah } from '@/utils/surahData';
import { getSurahRevisions, addMemorizedSurah, removeMemorizedSurah, getRevisionHistoryForSurah, getLearningPhaseStatus } from '@/utils/dataManager';
import { SurahData } from '@/types/revision';
import { List, CheckCircle, Circle, Loader2, History, Plus } from 'lucide-react';

const SurahStatistics = ({ surah }: { surah: Surah }) => {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['surahHistory', surah.number],
    queryFn: () => getRevisionHistoryForSurah(surah.number),
  });

  return (
    <div>
      {isLoading && <p>Loading history...</p>}
      {!isLoading && history.length === 0 && <p>No revision history found for this surah.</p>}
      {!isLoading && history.length > 0 && (
        <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
          {history.map((entry: any) => (
            <div key={entry.id} className="flex justify-between items-center p-2 border-b">
              <p className="text-sm">
                {new Date(entry.revision_date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <span className={`capitalize text-xs px-2 py-1 rounded-full ${
                entry.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                entry.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {entry.difficulty}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const learningStepOptions = [
  { value: 'all', label: 'All' },
  { value: '1', label: 'Just Memorised' },
  { value: '2', label: 'Quick Review' },
  { value: '3', label: 'Settling In' },
  { value: '4', label: 'Regular Practice' },
];

const SurahManager = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'memorized' | 'unmemorized'>('all');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [learningStepFilter, setLearningStepFilter] = useState<'all' | '1' | '2' | '3' | '4'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const { data: revisionData = [], isLoading } = useQuery<SurahData[]>({
    queryKey: ['surahRevisions'],
    queryFn: getSurahRevisions,
  });

  const addSurahMutation = useMutation({
    mutationFn: addMemorizedSurah,
    onMutate: async (surahNumber: number) => {
      await queryClient.cancelQueries({ queryKey: ['surahRevisions'] });
      const previousData = queryClient.getQueryData<SurahData[]>(['surahRevisions']);
      if (previousData) {
        queryClient.setQueryData<SurahData[]>(['surahRevisions'], prev =>
          prev?.map(surah =>
            surah.surahNumber === surahNumber
              ? { ...surah, memorized: true }
              : surah
          )
        );
      }
      return { previousData };
    },
    onError: (err, surahNumber, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(['surahRevisions'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['surahRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['todaysRevisions'] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surahRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['todaysRevisions'] });
    },
  });

  const removeSurahMutation = useMutation({
    mutationFn: removeMemorizedSurah,
    onMutate: async (surahNumber: number) => {
      await queryClient.cancelQueries({ queryKey: ['surahRevisions'] });
      const previousData = queryClient.getQueryData<SurahData[]>(['surahRevisions']);
      if (previousData) {
        queryClient.setQueryData<SurahData[]>(['surahRevisions'], prev =>
          prev?.map(surah =>
            surah.surahNumber === surahNumber
              ? { ...surah, memorized: false }
              : surah
          )
        );
      }
      return { previousData };
    },
    onError: (err, surahNumber, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(['surahRevisions'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['surahRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['todaysRevisions'] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surahRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['todaysRevisions'] });
    },
  });

  const handleToggle = (surahNumber: number, isCurrentlyMemorized: boolean) => {
    if (isCurrentlyMemorized) {
      removeSurahMutation.mutate(surahNumber);
    } else {
      addSurahMutation.mutate(surahNumber);
    }
  };

  const memorizedSurahNumbers = new Set(
    revisionData.filter(r => r.memorized).map(r => r.surahNumber)
  );

  const memorizedSurahsData = revisionData.filter(r => r.memorized);
  const filteredSurahs = SURAHS.filter(surah => {
    const surahRev = memorizedSurahsData.find(r => r.surahNumber === surah.number);
    if (!surahRev) return false;
    if (learningStepFilter === 'all') return true;
    if (learningStepFilter === '4') return (surahRev.learningStep || 0) >= 4;
    return String(surahRev.learningStep || 0) === learningStepFilter;
  });

  if (isLoading) return <div>Loading Surah data...</div>;

  return (
    <div className="space-y-4 w-full max-w-full p-2 sm:p-4 pb-20">
      <div className="flex flex-row gap-3 w-full overflow-x-auto pb-1 items-center">
        {learningStepOptions.map((opt, idx) => (
          <span
            key={opt.value}
            onClick={() => setLearningStepFilter(opt.value as any)}
            className={
              `cursor-pointer text-xs sm:text-sm select-none transition-colors whitespace-nowrap ` +
              (learningStepFilter === opt.value
                ? 'text-emerald-700 font-semibold underline underline-offset-4'
                : 'text-muted-foreground hover:text-emerald-600')
            }
          >
            {opt.label}
          </span>
        ))}
      </div>
      <div className="space-y-2 overflow-y-auto w-full">
        {filteredSurahs.map(surah => {
          const isMemorized = memorizedSurahNumbers.has(surah.number);
          const isUpdating =
            (addSurahMutation.isPending && addSurahMutation.variables === surah.number) ||
            (removeSurahMutation.isPending && removeSurahMutation.variables === surah.number);

          return (
            <Dialog key={surah.number} onOpenChange={(isOpen) => !isOpen && setSelectedSurah(null)}>
              <div
                className={
                  `flex items-center justify-between p-2 sm:p-3 rounded-lg border cursor-pointer transition-all w-full touch-manipulation bg-white hover:bg-gray-50${isUpdating ? ' opacity-50 cursor-not-allowed' : ''}`
                }
              >
                <DialogTrigger asChild>
                  <div className="flex items-center gap-2 sm:gap-3 flex-grow min-w-0" onClick={() => setSelectedSurah(surah)}>
                    <div
                      className={
                        `text-xs sm:text-sm h-8 w-8 rounded-full flex items-center justify-center font-medium transition-colors bg-gray-100 text-gray-600`
                      }
                    >
                      {surah.number}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base truncate">{`${surah.transliteration} (${surah.name})`}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {`${surah.verses} verses • ${surah.pages} pages • Juz ${surah.juz}`}
                        {(() => {
                          const surahRev = revisionData.find(r => r.surahNumber === surah.number);
                          const learningStep = surahRev?.learningStep || 0;
                          if (learningStep > 0) {
                            const learningStatus = getLearningPhaseStatus(learningStep);
                            return <><span className="mx-1">•</span><span className="text-xs sm:text-sm text-muted-foreground">{learningStatus.status}</span></>;
                          }
                          return null;
                        })()}
                      </p>
                    </div>
                  </div>
                </DialogTrigger>
              </div>
              {selectedSurah && selectedSurah.number === surah.number && (
                 <DialogContent className="max-w-[95vw] w-full rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Revision History: {selectedSurah.transliteration}
                      </DialogTitle>
                    </DialogHeader>
                    <SurahStatistics surah={selectedSurah} />
                  </DialogContent>
              )}
            </Dialog>
          );
        })}
      </div>
      {/* Floating Add New Memorisation Button */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <button
            className="fixed z-[100] right-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg flex items-center gap-2 px-5 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label="Add new memorisation"
            onClick={() => setShowAddDialog(true)}
            style={{ bottom: 'calc(max(env(safe-area-inset-bottom, 34px), 34px) + 72px)', position: 'fixed' }}
          >
            <Plus className="w-6 h-6 mr-1" />
            Add New Memorisation
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] w-full rounded-2xl">
          <DialogHeader>
            <DialogTitle>Select Memorized Surahs</DialogTitle>
          </DialogHeader>
          <div className="mb-2 text-xs text-gray-500">Only unmemorized surahs are shown. You can select multiple.</div>
          <div className="flex-1 overflow-y-auto space-y-2 max-h-96 min-h-0">
            {SURAHS.filter(s => !memorizedSurahsData.some(r => r.surahNumber === s.number)).map((surah) => {
              const isSelected = selectedToAdd.has(surah.number);
              return (
                <div
                  key={surah.number}
                  onClick={() => {
                    const newSet = new Set(selectedToAdd);
                    if (isSelected) newSet.delete(surah.number);
                    else newSet.add(surah.number);
                    setSelectedToAdd(newSet);
                  }}
                  className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-all touch-manipulation w-full flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div
                      className={`text-xs sm:text-sm h-8 w-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                        isSelected
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {surah.number}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base truncate">{surah.transliteration} ({surah.name})</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{surah.verses} verses • {surah.pages} pages • Juz {surah.juz}</p>
                    </div>
                  </div>
                  {isSelected ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 ml-2 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
                  )}
                </div>
              );
            })}
            {SURAHS.filter(s => !memorizedSurahsData.some(r => r.surahNumber === s.number)).length === 0 && (
              <div className="text-center text-gray-400 py-8">All surahs are already memorized!</div>
            )}
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setSelectedToAdd(new Set()); }} disabled={isAdding}>Cancel</Button>
            <Button
              onClick={async () => {
                if (selectedToAdd.size === 0) return;
                setIsAdding(true);
                for (const surahNumber of selectedToAdd) {
                  await addSurahMutation.mutateAsync(surahNumber);
                }
                setIsAdding(false);
                setShowAddDialog(false);
                setSelectedToAdd(new Set());
              }}
              disabled={selectedToAdd.size === 0 || isAdding}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : null}
              Add New Memorisation{selectedToAdd.size > 0 ? ` (${selectedToAdd.size})` : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SurahManager;
