import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Target, BookOpen, Settings, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Dashboard from '@/components/Dashboard';
import SurahManager from '@/components/SurahManager';
import GoalSetting from '@/components/GoalSetting';
import RecommendedRevisions from '@/components/RecommendedRevisions';
import SettingsComponent from '@/components/Settings';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { SURAHS } from '@/utils/surahData';
import { useOnboarding } from '@/hooks/use-onboarding';

const RATINGS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const Index = () => {
  const navigate = useNavigate();
  const { hasCompletedOnboarding, isLoading } = useOnboarding();
  const [activeTab, setActiveTab] = useState('recommendations');
  const [showAddRevision, setShowAddRevision] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSurah, setSelectedSurah] = useState<number | undefined>(undefined);
  const [selectedRating, setSelectedRating] = useState<string | undefined>(undefined);

  // Redirect to onboarding if not completed
  useEffect(() => {
    console.log('Index useEffect - hasCompletedOnboarding:', hasCompletedOnboarding, 'isLoading:', isLoading);
    if (!isLoading && !hasCompletedOnboarding) {
      console.log('Redirecting to onboarding...');
      navigate('/onboarding', { replace: true });
    }
  }, [hasCompletedOnboarding, isLoading, navigate]);

  // Show loading while checking onboarding status
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-600">Loading...</p>
        </div>
      </div>
    );
  }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual submission logic here
    setShowAddRevision(false);
    setSelectedDate(undefined);
    setSelectedSurah(undefined);
    setSelectedRating(undefined);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-amber-50 w-full max-w-full relative overflow-hidden">
      {/* Mobile Header */}
      <header
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-emerald-100 px-2 sm:px-4 py-2 sm:py-3 md:hidden w-full"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 32px), 32px)' }}
      >
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-base sm:text-xl font-bold text-emerald-800 leading-tight">Quran Revision Tracker</h1>
            <p className="text-xs sm:text-sm text-emerald-600">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </p>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header
        className="hidden md:flex items-center justify-between text-center py-6 md:py-8 w-full px-8"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 32px), 32px)' }}
      >
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-emerald-800 mb-1 md:mb-2">
            Quran Revision Tracker
          </h1>
          <p className="text-emerald-600 text-base md:text-lg">
            Strengthen your memorization with intelligent spaced repetition
          </p>
        </div>
      </header>

      <main
        className="flex-1 flex flex-col w-full max-w-full overflow-y-auto"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 34px), 34px)' }}
      >
        <div className="w-full max-w-full px-2 sm:px-4 pb-20 pb-safe mx-auto">
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

      {/* Floating Add Revision Button for Today Tab */}
      {activeTab === 'recommendations' && (
        <Dialog open={showAddRevision} onOpenChange={setShowAddRevision}>
          <DialogTrigger asChild>
            <button
              className="fixed z-[100] bottom-24 right-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg flex items-center gap-2 px-5 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400"
              aria-label="Add past revision"
              onClick={() => setShowAddRevision(true)}
            >
              <Plus className="w-6 h-6 mr-1" />
              Add Revision
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Previous Revision</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Surah Selector */}
              <div>
                <label htmlFor="surah-select" className="block text-sm font-medium mb-1">Surah</label>
                <select
                  id="surah-select"
                  className="w-full border rounded px-3 py-2"
                  value={selectedSurah ?? ''}
                  onChange={e => setSelectedSurah(Number(e.target.value) || undefined)}
                  required
                >
                  <option value="" disabled>Select a surah</option>
                  {SURAHS.map(surah => (
                    <option key={surah.number} value={surah.number}>
                      {surah.number}. {surah.transliteration} ({surah.name})
                    </option>
                  ))}
                </select>
              </div>
              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  toDate={new Date()}
                />
              </div>
              {/* Rating Selector */}
              <div>
                <label className="block text-sm font-medium mb-1">Rating</label>
                <div className="flex gap-2">
                  {RATINGS.map(rating => (
                    <Button
                      key={rating.value}
                      type="button"
                      variant={selectedRating === rating.value ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setSelectedRating(rating.value)}
                    >
                      {rating.label}
                    </Button>
                  ))}
                </div>
              </div>
              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full mt-2"
                disabled={!selectedSurah || !selectedDate || !selectedRating}
              >
                Add Revision
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Bottom Navigation - Fixed Position */}
      <nav
        className="bottom-navbar bg-white border-t border-emerald-100 px-2 sm:px-4 py-1 sm:py-2 w-full shadow-lg pb-safe"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 34px), 34px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant="ghost"
              className={`flex flex-col items-center justify-center gap-0.5 h-14 w-full min-w-[44px] text-xs font-medium px-0 py-0 rounded-none border-0 focus:ring-0 focus:outline-none ${
                isActive ? 'text-emerald-700' : 'text-gray-500'
              }`}
              style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="h-6 w-6 mb-1" />
              {tab.label}
            </Button>
          );
        })}
      </nav>
    </div>
  );
};

export default Index;
