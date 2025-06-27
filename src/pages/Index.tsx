import React, { useState } from 'react';
import { List, Target, BookOpen, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Dashboard from '@/components/Dashboard';
import SurahManager from '@/components/SurahManager';
import GoalSetting from '@/components/GoalSetting';
import RecommendedRevisions from '@/components/RecommendedRevisions';
import SettingsComponent from '@/components/Settings';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'recommendations', label: 'Today', icon: Target },
    { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
    { id: 'surahs', label: 'Surahs', icon: List },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'recommendations':
        return <RecommendedRevisions />;
      case 'dashboard':
        return <Dashboard />;
      case 'surahs':
        return <SurahManager />;
      case 'settings':
        return <SettingsComponent />;
      default:
        return <RecommendedRevisions />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-amber-50 w-full max-w-full">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-emerald-100 px-2 sm:px-4 py-2 sm:py-3 md:hidden w-full">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-base sm:text-xl font-bold text-emerald-800 leading-tight">Quran Tracker</h1>
            <p className="text-xs sm:text-sm text-emerald-600">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </p>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between text-center py-6 md:py-8 w-full px-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-emerald-800 mb-1 md:mb-2">
            Quran Revision Tracker
          </h1>
          <p className="text-emerald-600 text-base md:text-lg">
            Strengthen your memorization with intelligent spaced repetition
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full max-w-full overflow-y-auto">
        <div className="w-full max-w-full px-2 sm:px-4 pb-24 md:pb-6 mx-auto">
          {/* Desktop Navigation */}
          <nav className="hidden md:grid grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8 bg-white rounded-lg shadow-sm p-1 md:p-2 w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  className="flex items-center gap-2 h-12 w-full text-base"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </Button>
              );
            })}
          </nav>

          {/* Content */}
          <section className="w-full max-w-full pb-safe pt-2 sm:pt-4 flex flex-col">
            {renderContent()}
          </section>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-emerald-100 px-2 sm:px-4 py-1 sm:py-2 md:hidden z-40 w-full">
        <div className="grid grid-cols-4 gap-1 w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={`flex flex-col items-center justify-center gap-0.5 h-12 w-full min-w-[44px] text-xs font-medium px-0 py-0 rounded-none border-0 focus:ring-0 focus:outline-none ${
                  isActive
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-gray-600'
                }`}
                onClick={() => setActiveTab(tab.id)}
                tabIndex={0}
                aria-label={tab.label}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : 'text-gray-500'}`} />
                <span className="text-[11px] sm:text-xs leading-tight">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Index;
