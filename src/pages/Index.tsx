import React, { useState } from 'react';
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
import { addBackdatedRevision } from '@/utils/dataManager';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const RATINGS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const Index = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('recommendations');
  const [showAddRevision, setShowAddRevision] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSurah, setSelectedSurah] = useState<number | undefined>(undefined);
  const [selectedRating, setSelectedRating] = useState<'easy' | 'medium' | 'hard' | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurah || !selectedDate || !selectedRating) return;
    setSubmitting(true);
    try {
      await addBackdatedRevision(selectedSurah, selectedRating, selectedDate);
      toast({ title: 'Revision added', description: 'Your past revision has been logged.' });
      setShowAddRevision(false);
      setSelectedDate(undefined);
      setSelectedSurah(undefined);
      setSelectedRating(undefined);
      queryClient.invalidateQueries({ queryKey: ['todaysRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['surahRevisions'] });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-amber-50 w-full relative overflow-hidden">
      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-emerald-100 w-full"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-emerald-800 leading-tight">Quran Revision Tracker</h1>
            <p className="text-xs text-emerald-600">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </p>
          </div>
        </div>
      </header>

      <main
        className="flex-1 flex flex-col w-full overflow-y-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="max-w-[480px] mx-auto w-full px-4 pt-4 pb-24">
          {renderContent()}
        </div>
      </main>

      {/* Floating Add Revision Button for Today Tab */}
      {activeTab === 'recommendations' && (
        <Dialog open={showAddRevision} onOpenChange={setShowAddRevision}>
          <DialogTrigger asChild>
            <button
              className="fixed z-[100] right-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg flex items-center gap-2 px-5 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400"
              aria-label="Add past revision"
              style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}
            >
              <Plus className="w-6 h-6 mr-1" />
              Add Revision
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] w-full rounded-2xl">
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
              <div className="flex flex-col items-center">
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
                      onClick={() => setSelectedRating(rating.value as 'easy' | 'medium' | 'hard')}
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
                disabled={!selectedSurah || !selectedDate || !selectedRating || submitting}
              >
                {submitting ? 'Saving...' : 'Add Revision'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 w-full z-40 bg-white border-t border-emerald-100 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="max-w-[480px] mx-auto grid grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={`flex flex-col items-center justify-center gap-0.5 h-14 w-full text-xs font-medium px-0 py-0 rounded-none border-0 focus:ring-0 focus:outline-none ${
                  isActive ? 'text-emerald-700' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-6 w-6 mb-0.5" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Index;
