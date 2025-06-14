
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const RevisionDifficultyDialog = ({ open, onOpenChange, surah, onComplete }) => {
  const difficulties = [
    {
      level: 'easy',
      title: 'Easy',
      description: 'I recalled it perfectly with no mistakes',
      color: 'bg-emerald-500 hover:bg-emerald-600',
      nextRevision: '4 days'
    },
    {
      level: 'medium',
      title: 'Medium',
      description: 'I recalled it with minor hesitation or mistakes',
      color: 'bg-amber-500 hover:bg-amber-600',
      nextRevision: '2 days'
    },
    {
      level: 'hard',
      title: 'Hard',
      description: 'I struggled or made significant mistakes',
      color: 'bg-red-500 hover:bg-red-600',
      nextRevision: '1 day'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How was your revision?</DialogTitle>
          <DialogDescription>
            Rate the difficulty of revising <strong>{surah?.name}</strong> ({surah?.transliteration})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {difficulties.map((difficulty) => (
            <Card key={difficulty.level} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Button
                  onClick={() => onComplete(difficulty.level)}
                  className={`w-full ${difficulty.color} text-white`}
                  size="lg"
                >
                  <div className="text-left w-full">
                    <div className="font-semibold">{difficulty.title}</div>
                    <div className="text-sm opacity-90">{difficulty.description}</div>
                    <div className="text-xs opacity-75 mt-1">
                      Next revision in {difficulty.nextRevision}
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RevisionDifficultyDialog;
