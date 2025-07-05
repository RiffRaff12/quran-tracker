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
import { getSurahRevisions, addMemorizedSurah, removeMemorizedSurah, getRevisionHistoryForSurah } from '@/utils/dataManager';
import { SurahData } from '@/types/revision';
import { List, CheckCircle, Circle, Loader2, History } from 'lucide-react';

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

const SurahManager = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'memorized' | 'unmemorized'>('all');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);

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

  const filteredSurahs = SURAHS.filter(surah => {
    const isMemorized = memorizedSurahNumbers.has(surah.number);
    if (filter === 'memorized') return isMemorized;
    if (filter === 'unmemorized') return !isMemorized;
    return true;
  });

  if (isLoading) return <div>Loading Surah data...</div>;

  return (
    <div className="space-y-4 w-full max-w-full p-2 sm:p-4 pb-20">
      <div className="flex flex-row gap-2 w-full">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
          className="h-12 px-4"
        >
          All
        </Button>
        <Button
          variant={filter === 'memorized' ? 'default' : 'outline'}
          onClick={() => setFilter('memorized')}
          size="sm"
          className="h-12 px-4"
        >
          Memorized
        </Button>
        <Button
          variant={filter === 'unmemorized' ? 'default' : 'outline'}
          onClick={() => setFilter('unmemorized')}
          size="sm"
          className="h-12 px-4"
        >
          Unmemorized
        </Button>
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
                className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border cursor-pointer transition-all w-full touch-manipulation ${
                  isMemorized
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-white hover:bg-gray-50'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <DialogTrigger asChild>
                  <div className="flex items-center gap-2 sm:gap-3 flex-grow min-w-0" onClick={() => setSelectedSurah(surah)}>
                    <div
                      className={`text-xs sm:text-sm h-8 w-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                        isMemorized ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {surah.number}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base truncate">{`${surah.transliteration} (${surah.name})`}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{`${surah.verses} verses`}</p>
                    </div>
                  </div>
                </DialogTrigger>
                <div onClick={() => !isUpdating && handleToggle(surah.number, isMemorized)} className="p-2 -mr-2">
                  {isUpdating ? (
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  ) : isMemorized ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              {selectedSurah && selectedSurah.number === surah.number && (
                 <DialogContent>
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
    </div>
  );
};

export default SurahManager;
