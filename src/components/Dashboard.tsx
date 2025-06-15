
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
    <div className="space-y-4 md:space-y-6">
      {/* Mobile Welcome Card */}
      <Card className="md:hidden bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
        <CardContent className="p-4">
          <h2 className="text-xl font-bold mb-1">Welcome back!</h2>
          <p className="text-emerald-100 text-sm">
            Continue your Quran revision journey
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="h-4 w-4 md:h-5 w-5" />
            </div>
            <div className="text-lg md:text-2xl font-bold">{stats.memorizedSurahs}/114</div>
            <p className="text-xs text-emerald-100">
              {memorizedPercentage.toFixed(0)}% memorized
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-4 w-4 md:h-5 w-5" />
            </div>
            <div className="text-lg md:text-2xl font-bold">{stats.currentStreak}</div>
            <p className="text-xs text-amber-100">day streak</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-4 w-4 md:h-5 w-5" />
            </div>
            <div className="text-lg md:text-2xl font-bold">{stats.completedToday}/{stats.todaysRevisions}</div>
            <p className="text-xs text-blue-100">today's goal</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-4 w-4 md:h-5 w-5" />
            </div>
            <div className="text-lg md:text-2xl font-bold">5/7</div>
            <p className="text-xs text-purple-100">this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bars - Stacked on Mobile */}
      <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Memorization Progress</CardTitle>
            <CardDescription className="text-sm">
              Overall progress through the Quran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={memorizedPercentage} className="w-full h-2 md:h-3" />
            <p className="text-xs md:text-sm text-muted-foreground mt-2">
              {stats.memorizedSurahs} of 114 surahs memorized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Today's Revisions</CardTitle>
            <CardDescription className="text-sm">
              Complete your daily revision goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={todaysProgress} className="w-full h-2 md:h-3" />
            <p className="text-xs md:text-sm text-muted-foreground mt-2">
              {stats.completedToday} of {stats.todaysRevisions} revisions completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Revisions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Today's Revisions</CardTitle>
          <CardDescription className="text-sm">
            Complete these revisions to maintain your streak
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaysRevisions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-muted-foreground">
                No revisions scheduled for today. Great job!
              </p>
            </div>
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
