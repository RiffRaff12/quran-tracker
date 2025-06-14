
import React, { useState } from 'react';
import { Calendar, List, Target, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Dashboard from '@/components/Dashboard';
import SurahManager from '@/components/SurahManager';
import RevisionCalendar from '@/components/RevisionCalendar';
import GoalSetting from '@/components/GoalSetting';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-800 mb-2">
            Quran Revision Tracker
          </h1>
          <p className="text-emerald-600 text-lg">
            Strengthen your memorization with intelligent spaced repetition
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="surahs" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Surahs
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Goals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="surahs">
            <SurahManager />
          </TabsContent>

          <TabsContent value="calendar">
            <RevisionCalendar />
          </TabsContent>

          <TabsContent value="goals">
            <GoalSetting />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
