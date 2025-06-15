
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, Target, TrendingUp } from 'lucide-react';
import { getRevisionData, getStreak, getTodaysRevisions } from '@/utils/dataManager';
import { SurahData } from '@/types/revision';
import RevisionCard from '@/components/RevisionCard';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSurahs: 114,
    memorizedSurahs: 0,
    currentStreak: 0,
    todaysRevisions: 0,
    completedToday: 0
  });

  const [todaysRevisions, setTodaysRevisions] = useState([]);

  useEffect(() => {
    updateStats();
    loadTodaysRevisions();
  }, []);

  const updateStats = () => {
    const data = getRevisionData();
    const memorizedCount = Object.values(data.surahs).filter((s: SurahData) => s.memorized).length;
    const streak = getStreak();
    const todaysRevisions = getTodaysRevisions();
    
    setStats({
      totalSurahs: 114,
      memorizedSurahs: memorizedCount,
      currentStreak: streak,
      todaysRevisions: todaysRevisions.length,
      completedToday: todaysRevisions.filter(r => r.completed).length
    });
  };

  const loadTodaysRevisions = () => {
    setTodaysRevisions(getTodaysRevisions());
  };

  const memorizedPercentage = (stats.memorizedSurahs / stats.totalSurahs) * 100;
  const todaysProgress = stats.todaysRevisions > 0 ? (stats.completedToday / stats.todaysRevisions) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memorized Surahs</CardTitle>
            <BookOpen className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.memorizedSurahs}/114</div>
            <p className="text-xs text-emerald-100">
              {memorizedPercentage.toFixed(1)}% of Quran
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <p className="text-xs text-amber-100">days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
            <Target className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}/{stats.todaysRevisions}</div>
            <p className="text-xs text-blue-100">revisions completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
            <Calendar className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5/7</div>
            <p className="text-xs text-purple-100">days this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Memorization Progress</CardTitle>
            <CardDescription>
              Overall progress through the Quran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={memorizedPercentage} className="w-full h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {stats.memorizedSurahs} of 114 surahs memorized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Revisions</CardTitle>
            <CardDescription>
              Complete your daily revision goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={todaysProgress} className="w-full h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {stats.completedToday} of {stats.todaysRevisions} revisions completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Revisions */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Revisions</CardTitle>
          <CardDescription>
            Complete these revisions to maintain your streak
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaysRevisions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No revisions scheduled for today. Great job! 🎉
            </p>
          ) : (
            <div className="space-y-3">
              {todaysRevisions.map((revision) => (
                <RevisionCard
                  key={revision.surahNumber}
                  revision={revision}
                  onComplete={() => {
                    updateStats();
                    loadTodaysRevisions();
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
