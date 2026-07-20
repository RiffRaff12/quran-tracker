import React, { useState } from 'react';
import { getLearningPhaseStatus } from '@/utils/dataManager';
import { TodaysRevision } from '@/types/revision';
import { SURAHS } from '@/utils/surahData';
import RevisionDifficultyDialog from '@/components/RevisionDifficultyDialog';
import { CheckCircle } from 'lucide-react';

interface RevisionCardProps {
  revision: TodaysRevision;
  onComplete: (difficulty: 'easy' | 'medium' | 'hard') => void;
  isCompleted: boolean;
  learningStep?: number;
  ratedDifficulty?: 'easy' | 'medium' | 'hard';
}

const difficultyBadge: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
};

const RevisionCard = ({ revision, onComplete, isCompleted, learningStep = 0, ratedDifficulty }: RevisionCardProps) => {
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [removing, setRemoving] = useState(false);
  const surah = SURAHS.find(s => s.number === revision.surahNumber);
  if (!surah) return null;

  const learningStatus = getLearningPhaseStatus(learningStep);

  const handleRevisionComplete = (difficulty: 'easy' | 'medium' | 'hard') => {
    // Animate card out, then propagate
    setRemoving(true);
    setTimeout(() => {
      onComplete(difficulty);
    }, 300);
  };

  const openDialog = () => {
    if (!isCompleted && !removing) setShowDifficultyDialog(true);
  };

  return (
    <>
      <div
        role={isCompleted ? undefined : 'button'}
        tabIndex={isCompleted ? undefined : 0}
        aria-label={isCompleted ? undefined : `Mark ${surah.transliteration} as revised`}
        className={`bg-white rounded-2xl shadow-sm transition-all duration-300 ${
          removing
            ? 'opacity-0 -translate-y-2 pointer-events-none'
            : isCompleted
            ? 'opacity-60'
            : 'active:scale-[0.98] cursor-pointer hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500'
        }`}
        onClick={openDialog}
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ' ') && !isCompleted && !removing) {
            e.preventDefault();
            setShowDifficultyDialog(true);
          }
        }}
      >
        <div className="flex items-center gap-3 p-4">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
            isCompleted ? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-600'
          }`}>
            {surah.number}
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base text-gray-900 leading-tight">{surah.transliteration}</div>
            <div className="text-sm text-gray-500 mt-0.5">{surah.name}</div>
            {learningStep > 0 && !isCompleted && (
              <div className="text-xs text-emerald-600 mt-0.5">{learningStatus.status}</div>
            )}
          </div>

          {isCompleted ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              {ratedDifficulty && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${difficultyBadge[ratedDifficulty]}`}>
                  {ratedDifficulty}
                </span>
              )}
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
          ) : (
            <button
              className="border border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-700 text-sm font-medium px-4 h-9 rounded-xl flex-shrink-0 transition-all duration-150 bg-white"
              onClick={e => { e.stopPropagation(); setShowDifficultyDialog(true); }}
            >
              Mark revised
            </button>
          )}
        </div>
      </div>

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
