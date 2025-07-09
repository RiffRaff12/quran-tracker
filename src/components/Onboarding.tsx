import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, BookOpen, Loader2 } from 'lucide-react';
import { SURAHS, JUZS } from '@/utils/surahData';
import { updateUserOnboarding } from '@/utils/dataManager';
import { useToast } from '@/hooks/use-toast';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedSurahs, setSelectedSurahs] = useState<Set<number>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);
  const [selectionMode, setSelectionMode] = useState<'surah' | 'juz'>('surah');
  const [selectedJuz, setSelectedJuz] = useState<Set<number>>(new Set());

  const mutation = useMutation({
    mutationFn: async (surahs: number[]) => {
      // Update user onboarding status and save memorized surahs
      await updateUserOnboarding(surahs);
    },
    onSuccess: async () => {
      console.log('Onboarding mutation success - starting cache invalidation...');
      // Invalidate and refetch user profile
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      // Also invalidate today's revisions to show the newly added surahs
      await queryClient.invalidateQueries({ queryKey: ['todaysRevisions'] });
      await queryClient.invalidateQueries({ queryKey: ['surahRevisions'] });
      console.log('Cache invalidated, refetching...');
      // Explicitly refetch the data to ensure it's updated
      await queryClient.refetchQueries({ queryKey: ['userProfile'] });
      await queryClient.refetchQueries({ queryKey: ['todaysRevisions'] });
      await queryClient.refetchQueries({ queryKey: ['surahRevisions'] });
      console.log('Data refetched, waiting for cache update...');
      // Add a small delay to ensure the cache is properly updated
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('Cache update complete, showing toast and calling onComplete...');
      toast({
        title: "Setup Complete!",
        description: "Your memorized surahs have been saved.",
      });
      onComplete();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: error.message,
      });
    }
  });

  const toggleSurah = (surahNumber: number) => {
    const newSelected = new Set(selectedSurahs);
    if (newSelected.has(surahNumber)) {
      newSelected.delete(surahNumber);
    } else {
      newSelected.add(surahNumber);
    }
    setSelectedSurahs(newSelected);
  };

  const handleJuzToggle = (juzNumber: number) => {
    const newSelectedJuz = new Set(selectedJuz);
    const juz = JUZS.find(j => j.number === juzNumber);
    if (!juz) return;
    // Get all surah numbers in this Juz
    const surahNumbers = SURAHS.filter(s => s.number >= juz.startSurah && s.number <= juz.endSurah).map(s => s.number);
    const newSelectedSurahs = new Set(selectedSurahs);
    if (newSelectedJuz.has(juzNumber)) {
      // Deselect Juz: remove all its surahs
      newSelectedJuz.delete(juzNumber);
      surahNumbers.forEach(n => newSelectedSurahs.delete(n));
    } else {
      // Select Juz: add all its surahs
      newSelectedJuz.add(juzNumber);
      surahNumbers.forEach(n => newSelectedSurahs.add(n));
    }
    setSelectedJuz(newSelectedJuz);
    setSelectedSurahs(newSelectedSurahs);
  };

  const handleComplete = () => {
    mutation.mutate(Array.from(selectedSurahs));
  };

  const steps = [
    {
      title: "Welcome to Quran Revision Tracker",
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-800">
            Strengthen Your Memorization
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Use intelligent spaced repetition to maintain and strengthen your Quran memorization.
            Let's start by selecting the surahs you've already memorized.
          </p>
          <Button 
            onClick={() => setCurrentStep(1)}
            className="h-12 w-full bg-emerald-600 hover:bg-emerald-700 text-base"
          >
            Get Started
          </Button>
        </div>
      )
    },
    {
      title: "Select Your Memorized Surahs",
      content: (
        <div className="flex flex-col h-full min-h-0">
          <div className="text-center mb-4 sm:mb-6 flex-shrink-0">
            <p className="text-xs sm:text-sm text-gray-600">
              Select all the surahs you have memorized. You can always add more later.
            </p>
          </div>
          {/* Surah/Juz Toggle */}
          <div className="flex justify-center mb-4 gap-2">
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
          <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4 flex-shrink-0">
            Selected: {selectedSurahs.size} surahs
          </div>
          {/* Surah or Juz selection */}
          {selectionMode === 'surah' ? (
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin min-h-0">
              {SURAHS.map((surah) => {
                const isSelected = selectedSurahs.has(surah.number);
                return (
                  <div
                    key={surah.number}
                    onClick={() => toggleSurah(surah.number)}
                    className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-all touch-manipulation w-full ${
                      isSelected 
                        ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div
                            className={`text-xs sm:text-sm h-8 w-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                              isSelected
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {surah.number}
                          </div>
                          <div>
                            <h3 className="font-semibold text-base truncate">
                              {surah.transliteration} ({surah.name})
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {surah.verses} verses
                            </p>
                          </div>
                        </div>
                      </div>
                      {isSelected ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 ml-2 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin min-h-0">
              {JUZS.map((juz) => {
                const isSelected = selectedJuz.has(juz.number);
                const surahRange = SURAHS.find(s => s.number === juz.startSurah)?.transliteration +
                  (juz.startSurah !== juz.endSurah ? ` - ${SURAHS.find(s => s.number === juz.endSurah)?.transliteration}` : '');
                return (
                  <div
                    key={juz.number}
                    onClick={() => handleJuzToggle(juz.number)}
                    className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-all touch-manipulation w-full ${
                      isSelected 
                        ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div
                            className={`text-xs sm:text-sm h-8 w-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                              isSelected
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {juz.number}
                          </div>
                          <div>
                            <h3 className="font-semibold text-base truncate">
                              Juz {juz.number} ({surahRange})
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Surahs {juz.startSurah} - {juz.endSurah}
                            </p>
                          </div>
                        </div>
                      </div>
                      {isSelected ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 ml-2 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Fixed Complete Setup Button */}
          <div style={{ height: '80px' }} /> {/* Spacer for fixed button */}
          <div className="fixed left-0 bottom-0 w-full z-50 bg-white border-t flex flex-col sm:flex-row gap-2 sm:gap-3 p-4"
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
              boxShadow: '0 -2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(0)}
              className="h-12 w-full text-base"
              disabled={mutation.isPending}
            >
              Back
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={selectedSurahs.size === 0 || mutation.isPending}
              className="h-12 w-full bg-emerald-600 hover:bg-emerald-700 text-base"
            >
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mutation.isPending ? 'Saving...' : 'Complete Setup'}
            </Button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={`${currentStep === 1 ? 'h-screen' : 'min-h-screen'} bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto`}>
      {currentStep === 1 ? (
        // Full height layout for surah selection
        <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-lg">
          <div className="text-center p-4 flex-shrink-0">
            <div className="flex justify-center mb-2">
              <div className="flex space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index <= currentStep ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-emerald-800 mb-1 sm:mb-2">
              {steps[currentStep].title}
            </h2>
          </div>
          <div className="flex-1 flex flex-col p-4 pt-0 min-h-0">
            {steps[currentStep].content}
          </div>
        </div>
      ) : (
        // Normal card layout for welcome step
        <Card className="w-full max-w-full sm:max-w-md p-2 sm:p-4 overflow-y-auto">
          <CardHeader className="text-center pb-2 sm:pb-4">
            <div className="flex justify-center mb-2">
              <div className="flex space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index <= currentStep ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <CardTitle className="text-base sm:text-lg">{steps[currentStep].title}</CardTitle>
          </CardHeader>
          <CardContent>
            {steps[currentStep].content}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Onboarding;
