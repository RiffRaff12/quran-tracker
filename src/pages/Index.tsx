import React, { useState } from 'react';
import { List, BookOpen, Settings, Target, ChevronDown } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import SurahManager from '@/components/SurahManager';
import RecommendedRevisions from '@/components/RecommendedRevisions';
import SettingsComponent from '@/components/Settings';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { SURAHS } from '@/utils/surahData';
import { addBackdatedRevision, getSurahRevisions } from '@/utils/dataManager';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import SpeedDial from '@/components/SpeedDial';
import AddMemorisationDialog from '@/components/AddMemorisationDialog';
import RevisionToast from '@/components/RevisionToast';
import { SurahData } from '@/types/revision';

const RATINGS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const startOfDay = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};
const isSameDay = (a?: Date, b?: Date) =>
  !!a && !!b && startOfDay(a).getTime() === startOfDay(b).getTime();

const Index = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('recommendations');
  const [showAddRevision, setShowAddRevision] = useState(false);
  const [showAddMemorisation, setShowAddMemorisation] = useState(false);
  const [activeMemToast, setActiveMemToast] = useState<{ count: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => startOfDay(new Date()));
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<number | undefined>(undefined);
  const [selectedRating, setSelectedRating] = useState<'easy' | 'medium' | 'hard' | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const { data: surahRevisions = [] } = useQuery<SurahData[]>({
    queryKey: ['surahRevisions'],
    queryFn: getSurahRevisions,
  });

  const memorisedSurahs = SURAHS.filter(s =>
    surahRevisions.some(r => r.surahNumber === s.number && r.memorized)
  );

  const today = startOfDay(new Date());
  const yesterday = startOfDay(new Date(Date.now() - 86400000));

  const tabs = [
    { id: 'recommendations', label: 'Today', icon: Target, title: 'Today' },
    { id: 'dashboard', label: 'Dashboard', icon: BookOpen, title: 'Dashboard' },
    { id: 'surahs', label: 'Surahs', icon: List, title: 'My Surahs' },
    { id: 'settings', label: 'Settings', icon: Settings, title: 'Settings' },
  ];
  const activeTabMeta = tabs.find(t => t.id === activeTab) ?? tabs[0];
  const showFab = activeTab === 'recommendations' || activeTab === 'surahs';

  const todayLabel = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

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

  const resetRevisionForm = () => {
    setSelectedDate(startOfDay(new Date()));
    setShowCalendar(false);
    setSelectedSurah(undefined);
    setSelectedRating(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurah || !selectedDate || !selectedRating) return;
    setSubmitting(true);
    try {
      await addBackdatedRevision(selectedSurah, selectedRating, selectedDate);
      toast({ title: 'Revision added', description: 'Your past revision has been logged.' });
      setShowAddRevision(false);
      resetRevisionForm();
      queryClient.invalidateQueries({ queryKey: ['todaysRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['surahRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      queryClient.invalidateQueries({ queryKey: ['completedToday'] });
      queryClient.invalidateQueries({ queryKey: ['revisionHistory'] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add revision.';
      toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const dateChipClass = (active: boolean) =>
    `flex-1 h-11 rounded-xl text-sm font-semibold border transition-colors ${
      active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'
    }`;

  return (
    <div className="h-screen flex flex-col bg-[#f9fafb] w-full relative overflow-hidden">
      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-white border-b border-gray-100 w-full"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-[480px] mx-auto px-4 py-3">
          <h1 className="text-base font-bold text-gray-900">{activeTabMeta.title}</h1>
          {activeTab === 'recommendations' && (
            <p className="text-xs text-gray-500 mt-0.5">{todayLabel}</p>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full overflow-y-auto">
        <div className="max-w-[480px] mx-auto w-full px-4 pt-5 pb-28">
          {renderContent()}
        </div>
      </main>

      {/* Memorisation toast */}
      {activeMemToast && (
        <div className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="pointer-events-auto">
            <RevisionToast
              title="Memorisation saved"
              subtitle={`${activeMemToast.count} surah${activeMemToast.count > 1 ? 's' : ''} added`}
              variant="memorisation"
              onDismiss={() => setActiveMemToast(null)}
            />
          </div>
        </div>
      )}

      {/* Speed Dial FAB — only where its actions are relevant */}
      {showFab && (
        <SpeedDial
          onLogRevision={() => setShowAddRevision(true)}
          onAddMemorisation={() => setShowAddMemorisation(true)}
        />
      )}

      {/* Log Revision Dialog */}
      <Dialog open={showAddRevision} onOpenChange={(open) => { setShowAddRevision(open); if (!open) resetRevisionForm(); }}>
        <DialogContent className="max-w-[92vw] w-full rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Log a Previous Revision</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label htmlFor="surah-select" className="block text-sm font-medium text-gray-700 mb-1.5">Surah</label>
              <select
                id="surah-select"
                className="w-full border border-gray-200 rounded-xl px-3 h-12 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={selectedSurah ?? ''}
                onChange={e => setSelectedSurah(Number(e.target.value) || undefined)}
                required
              >
                <option value="" disabled>Select a surah</option>
                {memorisedSurahs.map(surah => (
                  <option key={surah.number} value={surah.number}>
                    {surah.number}. {surah.transliteration} ({surah.name})
                  </option>
                ))}
              </select>
              {memorisedSurahs.length === 0 && (
                <p className="text-xs text-gray-500 mt-1.5">Add a memorised surah first to log a past revision.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <div className="flex gap-2">
                <button type="button" className={dateChipClass(isSameDay(selectedDate, today))}
                  onClick={() => { setSelectedDate(today); setShowCalendar(false); }}>
                  Today
                </button>
                <button type="button" className={dateChipClass(isSameDay(selectedDate, yesterday))}
                  onClick={() => { setSelectedDate(yesterday); setShowCalendar(false); }}>
                  Yesterday
                </button>
                <button type="button"
                  className={dateChipClass(showCalendar || (!isSameDay(selectedDate, today) && !isSameDay(selectedDate, yesterday)))}
                  onClick={() => setShowCalendar(v => !v)}>
                  <span className="inline-flex items-center gap-1">
                    {!isSameDay(selectedDate, today) && !isSameDay(selectedDate, yesterday) && selectedDate
                      ? selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      : 'Pick date'}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
                  </span>
                </button>
              </div>
              {showCalendar && (
                <div className="flex justify-center mt-2 border border-gray-100 rounded-xl">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => { if (d) { setSelectedDate(startOfDay(d)); setShowCalendar(false); } }}
                    toDate={new Date()}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating</label>
              <div className="flex gap-2">
                {RATINGS.map(rating => (
                  <button
                    key={rating.value}
                    type="button"
                    className={`flex-1 h-11 rounded-xl text-sm font-semibold border transition-colors ${
                      selectedRating === rating.value
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'
                    }`}
                    onClick={() => setSelectedRating(rating.value as 'easy' | 'medium' | 'hard')}
                  >
                    {rating.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-base disabled:opacity-50 transition-colors"
              disabled={!selectedSurah || !selectedDate || !selectedRating || submitting}
            >
              {submitting ? 'Saving...' : 'Add Revision'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Memorisation Dialog */}
      <AddMemorisationDialog open={showAddMemorisation} onOpenChange={setShowAddMemorisation} onSuccess={(count) => setActiveMemToast({ count })} />

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 w-full z-40 bg-white border-t border-gray-100"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="max-w-[480px] mx-auto grid grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 h-14 w-full text-xs font-medium transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Index;
