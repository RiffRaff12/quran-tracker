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

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );

  return (
    <div className="space-y-4 pb-28">
      {/* Filter tabs */}
      <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
        {learningStepOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setLearningStepFilter(opt.value as any)}
            className={`text-sm whitespace-nowrap pb-1 transition-colors font-medium ${
              learningStepFilter === opt.value
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filteredSurahs.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <p className="text-sm text-gray-400">No surahs in this category yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {filteredSurahs.map(surah => {
          const isMemorized = memorizedSurahNumbers.has(surah.number);
          const isUpdating =
            (addSurahMutation.isPending && addSurahMutation.variables === surah.number) ||
            (removeSurahMutation.isPending && removeSurahMutation.variables === surah.number);
          const surahRev = revisionData.find(r => r.surahNumber === surah.number);
          const learningStep = surahRev?.learningStep || 0;
          const learningStatus = getLearningPhaseStatus(learningStep);

          return (
            <Dialog key={surah.number} onOpenChange={isOpen => !isOpen && setSelectedSurah(null)}>
              <DialogTrigger asChild>
                <div
                  className={`bg-white rounded-2xl shadow-sm transition-all cursor-pointer active:scale-[0.98] ${isUpdating ? 'opacity-50' : ''}`}
                  onClick={() => setSelectedSurah(surah)}
                >
                  <div className="flex items-center gap-3 p-4">
                    <div className="h-9 w-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {surah.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base text-gray-900 leading-tight">{surah.name}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{surah.transliteration}</div>
                      {learningStep > 0 && (
                        <div className="text-xs text-emerald-600 mt-0.5">{learningStatus.status}</div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              {selectedSurah && selectedSurah.number === surah.number && (
                <DialogContent className="max-w-[92vw] w-full rounded-2xl p-6">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-gray-900">
                      {selectedSurah.name} · {selectedSurah.transliteration}
                    </DialogTitle>
                  </DialogHeader>
                  <SurahStatistics surah={selectedSurah} />
                </DialogContent>
              )}
            </Dialog>
          );
        })}
      </div>

      {/* no local FAB — handled by global SpeedDial in Index */}
    </div>
  );
};

export default SurahManager;
