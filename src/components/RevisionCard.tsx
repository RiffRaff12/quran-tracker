import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Circle, BookOpen } from 'lucide-react';
import { SURAHS } from '@/utils/surahData';
import { completeRevision, getLearningPhaseStatus } from '@/utils/dataManager';
import { TodaysRevision } from '@/types/revision';
import RevisionDifficultyDialog from '@/components/RevisionDifficultyDialog';

interface RevisionCardProps {
  revision: TodaysRevision;
  onComplete: (difficulty: 'easy' | 'medium' | 'hard') => void;
  isCompleted: boolean;
  learningStep?: number;
}

const RevisionCard = ({ revision, onComplete, isCompleted, learningStep = 0 }: RevisionCardProps) => {
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  
  const surah = SURAHS.find(s => s.number === revision.surahNumber);
  
  if (!surah) return null;

  const handleRevisionComplete = (difficulty: 'easy' | 'medium' | 'hard') => {
    completeRevision(revision.surahNumber, difficulty);
    setShowDifficultyDialog(false);
    if (surah) {
      onComplete(difficulty);
    }
  };

  const getDaysUntilDue = () => {
    const today = new Date();
    const dueDate = new Date(revision.nextRevision);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();
  const isOverdue = daysUntilDue < 0;
  const isDueToday = daysUntilDue === 0;
  
  // Get learning phase status
  const learningStatus = getLearningPhaseStatus(learningStep);

  return (
    <>
      <Card
        className={`transition-all hover:shadow-md touch-manipulation p-2 sm:p-3 w-full max-w-full cursor-pointer ${
          isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-white'
        }`}
        onClick={() => !isCompleted && setShowDifficultyDialog(true)}
      >
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div
              className={`text-sm h-10 w-10 sm:h-8 sm:w-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {surah.number}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base truncate">{`${surah.transliteration} (${surah.name})`}</h3>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">
                  {`${surah.verses} verses • ${surah.pages} pages • Juz ${surah.juz}`}
                  {learningStep > 0 && (
                    <span className="mx-1">•</span>
                  )}
                  {learningStep > 0 && (
                    <span className="text-xs text-muted-foreground">{learningStatus.status}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-2">
            {isCompleted ? (
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            ) : (
              <Circle className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        </div>
      </Card>

      <RevisionDifficultyDialog
        open={showDifficultyDialog}
        onOpenChange={setShowDifficultyDialog}
        surah={surah}
        onComplete={handleRevisionComplete}
      />
    </>
  );
};

export default RevisionCard;
