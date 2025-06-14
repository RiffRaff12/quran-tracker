
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar, Trophy } from 'lucide-react';
import { getGoals, updateGoals, getGoalProgress } from '@/utils/dataManager';
import { toast } from '@/hooks/use-toast';

const GoalSetting = () => {
  const [goals, setGoals] = useState({
    dailyRevisions: 3,
    weeklyRevisions: 20,
    memorizePerMonth: 2
  });
  const [progress, setProgress] = useState({
    dailyProgress: 0,
    weeklyProgress: 0,
    monthlyProgress: 0
  });

  useEffect(() => {
    loadGoals();
    loadProgress();
  }, []);

  const loadGoals = () => {
    const savedGoals = getGoals();
    setGoals(savedGoals);
  };

  const loadProgress = () => {
    const progressData = getGoalProgress();
    setProgress(progressData);
  };

  const handleSaveGoals = () => {
    updateGoals(goals);
    toast({
      title: "Goals Updated",
      description: "Your revision goals have been saved successfully.",
    });
    loadProgress(); // Refresh progress after updating goals
  };

  const handleGoalChange = (goalType, value) => {
    setGoals(prev => ({
      ...prev,
      [goalType]: parseInt(value) || 0
    }));
  };

  const dailyProgressPercentage = goals.dailyRevisions > 0 ? (progress.dailyProgress / goals.dailyRevisions) * 100 : 0;
  const weeklyProgressPercentage = goals.weeklyRevisions > 0 ? (progress.weeklyProgress / goals.weeklyRevisions) * 100 : 0;
  const monthlyProgressPercentage = goals.memorizePerMonth > 0 ? (progress.monthlyProgress / goals.memorizePerMonth) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Goal Setting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Set Your Goals
          </CardTitle>
          <CardDescription>
            Define your daily, weekly, and monthly targets to stay motivated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dailyRevisions">Daily Revisions</Label>
              <Input
                id="dailyRevisions"
                type="number"
                min="1"
                max="20"
                value={goals.dailyRevisions}
                onChange={(e) => handleGoalChange('dailyRevisions', e.target.value)}
                placeholder="3"
              />
              <p className="text-xs text-muted-foreground">
                Number of surahs to revise daily
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weeklyRevisions">Weekly Revisions</Label>
              <Input
                id="weeklyRevisions"
                type="number"
                min="1"
                max="50"
                value={goals.weeklyRevisions}
                onChange={(e) => handleGoalChange('weeklyRevisions', e.target.value)}
                placeholder="20"
              />
              <p className="text-xs text-muted-foreground">
                Total revisions to complete weekly
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memorizePerMonth">New Surahs/Month</Label>
              <Input
                id="memorizePerMonth"
                type="number"
                min="1"
                max="10"
                value={goals.memorizePerMonth}
                onChange={(e) => handleGoalChange('memorizePerMonth', e.target.value)}
                placeholder="2"
              />
              <p className="text-xs text-muted-foreground">
                New surahs to memorize monthly
              </p>
            </div>
          </div>

          <Button onClick={handleSaveGoals} className="w-full">
            Save Goals
          </Button>
        </CardContent>
      </Card>

      {/* Progress Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Daily Goal
              </span>
              <Trophy className={`h-4 w-4 ${dailyProgressPercentage >= 100 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress.dailyProgress}/{goals.dailyRevisions}</span>
              </div>
              <Progress value={Math.min(dailyProgressPercentage, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {dailyProgressPercentage >= 100 ? 'Goal achieved! 🎉' : 
                 `${Math.max(0, goals.dailyRevisions - progress.dailyProgress)} more to go`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Weekly Goal
              </span>
              <Trophy className={`h-4 w-4 ${weeklyProgressPercentage >= 100 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress.weeklyProgress}/{goals.weeklyRevisions}</span>
              </div>
              <Progress value={Math.min(weeklyProgressPercentage, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {weeklyProgressPercentage >= 100 ? 'Goal achieved! 🎉' : 
                 `${Math.max(0, goals.weeklyRevisions - progress.weeklyProgress)} more to go`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Monthly Goal
              </span>
              <Trophy className={`h-4 w-4 ${monthlyProgressPercentage >= 100 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>New Surahs</span>
                <span>{progress.monthlyProgress}/{goals.memorizePerMonth}</span>
              </div>
              <Progress value={Math.min(monthlyProgressPercentage, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {monthlyProgressPercentage >= 100 ? 'Goal achieved! 🎉' : 
                 `${Math.max(0, goals.memorizePerMonth - progress.monthlyProgress)} more to go`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoalSetting;
