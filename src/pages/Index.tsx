import React, { useState } from 'react';
import { Calendar, List, Target, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Dashboard from '@/components/Dashboard';
import SurahManager from '@/components/SurahManager';
import RevisionCalendar from '@/components/RevisionCalendar';
import GoalSetting from '@/components/GoalSetting';
import RecommendedRevisions from '@/components/RecommendedRevisions';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'recommendations', label: 'Today', icon: Target },
    { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
    { id: 'surahs', label: 'Surahs', icon: List },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'recommendations':
        return <RecommendedRevisions />;
      case 'dashboard':
        return <Dashboard />;
      case 'surahs':
        return <SurahManager />;
      case 'calendar':
        return <RevisionCalendar />;
      default:
        return <RecommendedRevisions />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-emerald-100 px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-emerald-800">Quran Tracker</h1>
            <p className="text-sm text-emerald-600">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block text-center py-8">
        <h1 className="text-4xl font-bold text-emerald-800 mb-2">
          Quran Revision Tracker
        </h1>
        <p className="text-emerald-600 text-lg">
          Strengthen your memorization with intelligent spaced repetition
        </p>
      </div>

      <div className="container mx-auto px-4 pb-24 md:pb-6 max-w-6xl">
        {/* Desktop Navigation */}
        <div className="hidden md:grid grid-cols-4 gap-4 mb-8 bg-white rounded-lg shadow-sm p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className="flex items-center gap-2 h-12"
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Content */}
        <div className="pb-safe">
          {renderContent()}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-emerald-100 px-4 py-2 md:hidden z-40">
        <div className="grid grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={`flex flex-col items-center gap-1 h-16 px-2 ${
                  isActive 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-gray-600'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : 'text-gray-500'}`} />
                <span className="text-xs font-medium">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
