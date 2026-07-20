import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Plus, CalendarClock, Trash2 } from 'lucide-react';
import { SURAHS, Surah } from '@/utils/surahData';
import {
  getSurahRevisions,
  addMemorizedSurah,
  removeMemorizedSurah,
  getRevisionHistoryForSurah,
  getLearningPhaseStatus,
} from '@/utils/dataManager';
import { SurahData } from '@/types/revision';

const SurahStatistics = ({ surah, surahData, onRemove }: { surah: Surah; surahData?: SurahData; onRemove: () => void }) => {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['surahHistory', surah.number],
    queryFn: () => getRevisionHistoryForSurah(surah.number),
  });

  const learningStatus = getLearningPhaseStatus(surahData?.learningStep || 0);
  const nextRevision = surahData?.nextRevision
    ? new Date(surahData.nextRevision).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div>
      {/* Schedule summary */}
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 mb-3">
        <CalendarClock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <div className="text-sm">
          <span className="font-medium text-emerald-800">{learningStatus.status}</span>
          {nextRevision && <span className="text-emerald-700"> · next due {nextRevision}</span>}
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading history…</p>}
      {!isLoading && history.length === 0 && <p className="text-sm text-gray-500">No revision history yet.</p>}
      {!isLoading && history.length > 0 && (
        <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
          {history.map(entry => (
            <div key={entry.id} className="flex justify-between items-center p-2 border-b border-gray-50">
              <p className="text-sm text-gray-700">
                {new Date(entry.revision_date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <span className={`capitalize text-xs font-semibold px-2 py-1 rounded-full ${
                entry.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                entry.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {entry.difficulty}
              </span>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        onClick={onRemove}
        className="w-full mt-4 h-11 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Remove from memorised
      </Button>
    </div>
  );
};

type LearningStepFilter = 'all' | '1' | '2' | '3' | '4' | 'unmemorised';

const learningStepOptions: { value: LearningStepFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: '1', label: 'Just Memorised' },
  { value: '2', label: 'Quick Review' },
  { value: '3', label: 'Settling In' },
  { value: '4', label: 'Regular Practice' },
  { value: 'unmemorised', label: 'Not memorised' },
];

const phaseDescriptions: Record<string, string> = {
  '1': 'Revised daily — just added to your memory.',
  '2': 'Coming back every couple of days.',
  '3': 'Spacing out as it settles into memory.',
  '4': 'On a long-term schedule, revised occasionally.',
};

const SurahManager = () => {
  const queryClient = useQueryClient();
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [learningStepFilter, setLearningStepFilter] = useState<LearningStepFilter>('all');
  const [search, setSearch] = useState('');
  const [pendingRemove, setPendingRemove] = useState<Surah | null>(null);

  const { data: revisionData = [], isLoading } = useQuery<SurahData[]>({
    queryKey: ['surahRevisions'],
    queryFn: getSurahRevisions,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['surahRevisions'] });
    queryClient.invalidateQueries({ queryKey: ['todaysRevisions'] });
    queryClient.invalidateQueries({ queryKey: ['upcomingRevisions'] });
  };

  const addSurahMutation = useMutation({
    mutationFn: addMemorizedSurah,
    onMutate: async (surahNumber: number) => {
      await queryClient.cancelQueries({ queryKey: ['surahRevisions'] });
      const previousData = queryClient.getQueryData<SurahData[]>(['surahRevisions']);
      if (previousData) {
        queryClient.setQueryData<SurahData[]>(['surahRevisions'], prev =>
          prev?.map(surah =>
            surah.surahNumber === surahNumber ? { ...surah, memorized: true } : surah
          )
        );
      }
      return { previousData };
    },
    onError: (_err, _surahNumber, context) => {
      if (context?.previousData) queryClient.setQueryData(['surahRevisions'], context.previousData);
    },
    onSettled: invalidate,
  });

  const removeSurahMutation = useMutation({
    mutationFn: removeMemorizedSurah,
    onMutate: async (surahNumber: number) => {
      await queryClient.cancelQueries({ queryKey: ['surahRevisions'] });
      const previousData = queryClient.getQueryData<SurahData[]>(['surahRevisions']);
      if (previousData) {
        queryClient.setQueryData<SurahData[]>(['surahRevisions'], prev =>
          prev?.map(surah =>
            surah.surahNumber === surahNumber ? { ...surah, memorized: false } : surah
          )
        );
      }
      return { previousData };
    },
    onError: (_err, _surahNumber, context) => {
      if (context?.previousData) queryClient.setQueryData(['surahRevisions'], context.previousData);
    },
    onSettled: invalidate,
  });

  const memorizedSurahNumbers = new Set(
    revisionData.filter(r => r.memorized).map(r => r.surahNumber)
  );

  const surahRevByNumber = new Map(revisionData.map(r => [r.surahNumber, r]));

  const learningStepOf = (surahNumber: number) => surahRevByNumber.get(surahNumber)?.learningStep || 0;

  const matchesSearch = (surah: Surah) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      surah.transliteration.toLowerCase().includes(q) ||
      surah.name.includes(search.trim()) ||
      String(surah.number) === q
    );
  };

  const countFor = (value: LearningStepFilter) => {
    if (value === 'unmemorised') return SURAHS.filter(s => !memorizedSurahNumbers.has(s.number)).length;
    const memorized = SURAHS.filter(s => memorizedSurahNumbers.has(s.number));
    if (value === 'all') return memorized.length;
    if (value === '4') return memorized.filter(s => learningStepOf(s.number) >= 4).length;
    return memorized.filter(s => String(learningStepOf(s.number)) === value).length;
  };

  const filteredSurahs = SURAHS.filter(surah => {
    if (!matchesSearch(surah)) return false;
    const isMemorized = memorizedSurahNumbers.has(surah.number);
    if (learningStepFilter === 'unmemorised') return !isMemorized;
    if (!isMemorized) return false;
    if (learningStepFilter === 'all') return true;
    if (learningStepFilter === '4') return learningStepOf(surah.number) >= 4;
    return String(learningStepOf(surah.number)) === learningStepFilter;
  });

  const isUnmemorisedView = learningStepFilter === 'unmemorised';

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );

  return (
    <div className="space-y-4 pb-28">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search surah by name or number"
          className="w-full border border-gray-200 rounded-xl pl-9 pr-3 h-11 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Search surahs"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
        {learningStepOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setLearningStepFilter(opt.value)}
            className={`text-sm whitespace-nowrap pb-1 transition-colors font-medium ${
              learningStepFilter === opt.value
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {opt.label} ({countFor(opt.value)})
          </button>
        ))}
      </div>

      {/* Phase legend */}
      {phaseDescriptions[learningStepFilter] && (
        <p className="text-xs text-gray-500 -mt-1 px-1">{phaseDescriptions[learningStepFilter]}</p>
      )}

      {filteredSurahs.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <p className="text-sm text-gray-500">
            {search.trim()
              ? 'No surahs match your search.'
              : isUnmemorisedView
              ? 'You have memorised every surah, mashaAllah!'
              : 'No surahs in this category yet.'}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {filteredSurahs.map(surah => {
          const surahRev = surahRevByNumber.get(surah.number);
          const learningStep = surahRev?.learningStep || 0;
          const learningStatus = getLearningPhaseStatus(learningStep);
          const isUpdating =
            (addSurahMutation.isPending && addSurahMutation.variables === surah.number) ||
            (removeSurahMutation.isPending && removeSurahMutation.variables === surah.number);

          if (isUnmemorisedView) {
            return (
              <div
                key={surah.number}
                className={`bg-white rounded-2xl shadow-sm flex items-center gap-3 p-4 ${isUpdating ? 'opacity-50' : ''}`}
              >
                <div className="h-9 w-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {surah.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base text-gray-700 leading-tight">{surah.transliteration}</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    <bdi>{surah.name}</bdi> · {surah.verses} verses
                  </div>
                </div>
                <Button
                  onClick={() => addSurahMutation.mutate(surah.number)}
                  disabled={isUpdating}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-xl flex-shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            );
          }

          return (
            <div
              key={surah.number}
              role="button"
              tabIndex={0}
              aria-label={`View ${surah.transliteration} details`}
              className={`bg-white rounded-2xl shadow-sm transition-all cursor-pointer active:scale-[0.98] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 ${isUpdating ? 'opacity-50' : ''}`}
              onClick={() => setSelectedSurah(surah)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedSurah(surah);
                }
              }}
            >
              <div className="flex items-center gap-3 p-4">
                <div className="h-9 w-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {surah.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base text-gray-900 leading-tight">{surah.transliteration}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{surah.name}</div>
                  {learningStep > 0 && (
                    <div className="text-xs text-emerald-600 mt-0.5">{learningStatus.status}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Surah detail dialog */}
      <Dialog open={!!selectedSurah} onOpenChange={isOpen => !isOpen && setSelectedSurah(null)}>
        {selectedSurah && (
          <DialogContent className="max-w-[92vw] w-full rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900">
                {selectedSurah.transliteration} · {selectedSurah.name}
              </DialogTitle>
            </DialogHeader>
            <SurahStatistics
              surah={selectedSurah}
              surahData={surahRevByNumber.get(selectedSurah.number)}
              onRemove={() => { setPendingRemove(selectedSurah); setSelectedSurah(null); }}
            />
          </DialogContent>
        )}
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog open={!!pendingRemove} onOpenChange={isOpen => !isOpen && setPendingRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pendingRemove?.transliteration}?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears its revision schedule and removes it from your memorised list. Your past
              revision history is kept. You can add it back any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (pendingRemove) removeSurahMutation.mutate(pendingRemove.number);
                setPendingRemove(null);
                setSelectedSurah(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SurahManager;
