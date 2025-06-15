
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock } from 'lucide-react';
import { SURAHS } from '@/utils/surahData';
import { completeRevision } from '@/utils/dataManager';
import { TodaysRevision } from '@/types/revision';
import RevisionDifficultyDialog from '@/components/RevisionDifficultyDialog';

interface RevisionCardProps {
  revision: TodaysRevision;
  onComplete: () => void;
}

const RevisionCard = ({ revision, onComplete }: RevisionCardProps) => {
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  
  const surah = SURAHS.find(s => s.number === revision.surahNumber);
  
  if (!surah) return null;

  const handleRevisionComplete = (difficulty: 'easy' | 'medium' | 'hard') => {
    completeRevision(revision.surahNumber, difficulty);
    setShowDifficultyDialog(false);
    onComplete();
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
      <Card className={`transition-all hover:shadow-md active:scale-95 ${
        revision.completed ? 'bg-emerald-50 border-emerald-200' :
        isOverdue ? 'bg-red-50 border-red-200' :
        isDueToday ? 'bg-amber-50 border-amber-200' : 'bg-white'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base md:text-lg truncate">{surah.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{surah.transliteration}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  Surah {surah.number}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">
                    {Math.abs(daysUntilDue)} days overdue
                  </Badge>
                )}
                {isDueToday && (
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                    Due today
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-3">
              {revision.completed ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium hidden sm:inline">Completed</span>
                </div>
              ) : (
                <Button
                  onClick={() => setShowDifficultyDialog(true)}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 touch-manipulation h-10 px-4"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Revise</span>
                  <span className="sm:hidden">✓</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
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
