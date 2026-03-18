import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, Clock, RefreshCw } from 'lucide-react';

const difficulties = [
  {
    level: 'easy' as const,
    title: 'Easy',
    description: 'Recalled perfectly with no mistakes',
    bg: 'bg-emerald-50 border-emerald-200',
    activeBg: 'bg-emerald-100',
    titleColor: 'text-emerald-800',
    descColor: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
  {
    level: 'medium' as const,
    title: 'Medium',
    description: 'Recalled with minor hesitation',
    bg: 'bg-amber-50 border-amber-200',
    activeBg: 'bg-amber-100',
    titleColor: 'text-amber-800',
    descColor: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  {
    level: 'hard' as const,
    title: 'Hard',
    description: 'Struggled or made significant mistakes',
    bg: 'bg-red-50 border-red-200',
    activeBg: 'bg-red-100',
    titleColor: 'text-red-800',
    descColor: 'text-red-600',
    dot: 'bg-red-500',
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surah: { name: string; transliteration: string } | null;
  onComplete: (level: 'easy' | 'medium' | 'hard') => void;
}

const RevisionDifficultyDialog = ({ open, onOpenChange, surah, onComplete }: Props) => {
  const [pressed, setPressed] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSelect = (level: 'easy' | 'medium' | 'hard') => {
    if (pressed) return; // prevent double-tap
    setPressed(level);
    // pulse: scale down 150ms, back up 150ms, then show success
    setTimeout(() => {
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        onComplete(level);
      }, 400);
    }, 300);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setSuccess(false);
      setPressed(null);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[92vw] w-full rounded-2xl p-6 transition-all duration-300">
        {success ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-9 h-9 text-emerald-600" />
            </div>
            <p className="text-base font-semibold text-gray-900">Revision logged</p>
          </div>
        ) : (
          <>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-bold text-gray-900">How was your revision?</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-medium text-gray-700">{surah?.name}</span>
                {surah?.transliteration ? ` · ${surah.transliteration}` : ''}
              </p>
            </DialogHeader>

            <div className="space-y-3">
              {difficulties.map(d => {
                const isPressed = pressed === d.level;
                return (
                  <button
                    key={d.level}
                    onClick={() => handleSelect(d.level)}
                    disabled={!!pressed}
                    className={`w-full text-left rounded-2xl border p-4 transition-all duration-150 ${d.bg} ${
                      isPressed ? `scale-[0.96] ${d.activeBg}` : 'scale-100 hover:brightness-95'
                    }`}
                    style={{ transitionDuration: isPressed ? '150ms' : '150ms' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${d.dot}`} />
                      <div>
                        <div className={`font-bold text-base ${d.titleColor}`}>{d.title}</div>
                        <div className={`text-sm mt-0.5 ${d.descColor}`}>{d.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RevisionDifficultyDialog;
