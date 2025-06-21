import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Circle } from 'lucide-react';
import { SURAHS } from '@/utils/surahData';
import { completeRevision } from '@/utils/dataManager';
import { TodaysRevision } from '@/types/revision';
import RevisionDifficultyDialog from '@/components/RevisionDifficultyDialog';

interface RevisionCardProps {
  revision: TodaysRevision;
  onComplete: (difficulty: 'easy' | 'medium' | 'hard') => void;
  isCompleted: boolean;
}

const RevisionCard = ({ revision, onComplete, isCompleted }: RevisionCardProps) => {
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

  return (
    <>
      <Card
        className={`transition-all hover:shadow-md touch-manipulation p-3 ${
          isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-white'
        }`}
        onClick={() => !isCompleted && setShowDifficultyDialog(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`text-sm h-8 w-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {surah.number}
            </div>
            <div>
              <h3 className="font-semibold">{`${surah.transliteration} (${surah.name})`}</h3>
              <p className="text-sm text-muted-foreground">{`${surah.verses} verses`}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-3">
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
