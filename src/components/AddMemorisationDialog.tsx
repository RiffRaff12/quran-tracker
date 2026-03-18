import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { SURAHS, JUZS } from '@/utils/surahData';
import { getSurahRevisions, addMemorizedSurah } from '@/utils/dataManager';
import { SurahData } from '@/types/revision';
import { CheckCircle, Circle, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddMemorisationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddMemorisationDialog = ({ open, onOpenChange }: AddMemorisationDialogProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedToAdd, setSelectedToAdd] = useState<Set<number>>(new Set());
  const [selectionMode, setSelectionMode] = useState<'surah' | 'juz'>('surah');
  const [selectedJuz, setSelectedJuz] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const { data: revisionData = [] } = useQuery<SurahData[]>({
    queryKey: ['surahRevisions'],
    queryFn: getSurahRevisions,
  });

  const memorizedSurahNumbers = new Set(
    revisionData.filter(r => r.memorized).map(r => r.surahNumber)
  );

  const addSurahMutation = useMutation({
    mutationFn: addMemorizedSurah,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['surahRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['todaysRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  const handleJuzToggle = (juzNumber: number) => {
    const juz = JUZS.find(j => j.number === juzNumber);
    if (!juz) return;
    const surahNumbers = SURAHS
      .filter(s => s.number >= juz.startSurah && s.number <= juz.endSurah && !memorizedSurahNumbers.has(s.number))
      .map(s => s.number);
    const newSelectedJuz = new Set(selectedJuz);
    const newSelectedToAdd = new Set(selectedToAdd);
    if (newSelectedJuz.has(juzNumber)) {
      newSelectedJuz.delete(juzNumber);
      surahNumbers.forEach(n => newSelectedToAdd.delete(n));
    } else {
      newSelectedJuz.add(juzNumber);
      surahNumbers.forEach(n => newSelectedToAdd.add(n));
    }
    setSelectedJuz(newSelectedJuz);
    setSelectedToAdd(newSelectedToAdd);
  };

  const handleClose = () => {
    if (selectedToAdd.size > 0) {
      setShowExitConfirm(true);
    } else {
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setSelectedToAdd(new Set());
    setSelectedJuz(new Set());
    setSelectionMode('surah');
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (selectedToAdd.size === 0) return;
    setIsAdding(true);
    try {
      for (const surahNumber of selectedToAdd) {
        await addSurahMutation.mutateAsync(surahNumber);
      }
      toast({ title: 'Memorisation saved', description: `${selectedToAdd.size} surah${selectedToAdd.size > 1 ? 's' : ''} added.` });
      resetAndClose();
    } finally {
      setIsAdding(false);
    }
  };

  const unmemorizedSurahs = SURAHS.filter(s => !memorizedSurahNumbers.has(s.number));

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
        <DialogContent className="max-w-[95vw] w-full rounded-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <DialogTitle>Add Memorisation</DialogTitle>
            </div>
          </DialogHeader>

          {/* Surah / Juz toggle */}
          <div className="flex justify-center gap-2 flex-shrink-0">
            <Button
              variant={selectionMode === 'surah' ? 'default' : 'outline'}
              onClick={() => setSelectionMode('surah')}
              className="px-4 py-2 text-sm"
            >
              Surah
            </Button>
            <Button
              variant={selectionMode === 'juz' ? 'default' : 'outline'}
              onClick={() => setSelectionMode('juz')}
              className="px-4 py-2 text-sm"
            >
              Juz
            </Button>
          </div>

          <div className="text-xs text-gray-500 flex-shrink-0">
            {selectedToAdd.size > 0 ? `${selectedToAdd.size} selected` : 'Select surahs you have memorised'}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {selectionMode === 'surah' ? (
              <>
                {unmemorizedSurahs.map((surah) => {
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
                        isSelected ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className={`text-xs sm:text-sm h-8 w-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                          isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {surah.number}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base truncate">{surah.transliteration} ({surah.name})</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">{surah.verses} verses</p>
                        </div>
                      </div>
                      {isSelected
                        ? <CheckCircle className="w-5 h-5 text-emerald-600 ml-2 flex-shrink-0" />
                        : <Circle className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
                      }
                    </div>
                  );
                })}
                {unmemorizedSurahs.length === 0 && (
                  <div className="text-center text-gray-400 py-8">All surahs are already memorised!</div>
                )}
              </>
            ) : (
              JUZS.map((juz) => {
                const isSelected = selectedJuz.has(juz.number);
                const surahRange =
                  (SURAHS.find(s => s.number === juz.startSurah)?.transliteration ?? '') +
                  (juz.startSurah !== juz.endSurah
                    ? ` - ${SURAHS.find(s => s.number === juz.endSurah)?.transliteration ?? ''}`
                    : '');
                return (
                  <div
                    key={juz.number}
                    onClick={() => handleJuzToggle(juz.number)}
                    className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-all touch-manipulation w-full flex items-center justify-between gap-2 ${
                      isSelected ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`text-xs sm:text-sm h-8 w-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                        isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {juz.number}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base truncate">Juz {juz.number} ({surahRange})</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">Surahs {juz.startSurah} – {juz.endSurah}</p>
                      </div>
                    </div>
                    {isSelected
                      ? <CheckCircle className="w-5 h-5 text-emerald-600 ml-2 flex-shrink-0" />
                      : <Circle className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
                    }
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 flex-shrink-0 pt-2 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isAdding}>Cancel</Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedToAdd.size === 0 || isAdding}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isAdding && <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />}
              Add Memorisation{selectedToAdd.size > 0 ? ` (${selectedToAdd.size})` : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit confirmation */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard selection?</AlertDialogTitle>
            <AlertDialogDescription>
              You have {selectedToAdd.size} surah{selectedToAdd.size > 1 ? 's' : ''} selected but not saved. Are you sure you want to go back?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowExitConfirm(false)}>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowExitConfirm(false); resetAndClose(); }}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AddMemorisationDialog;
