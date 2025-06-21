import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { getUpcomingRevisions, getSurahRevisions } from '@/utils/dataManager';
import { SurahData } from '@/types/revision';
import { SURAHS } from '@/utils/surahData';
import { supabase } from '@/lib/supabaseClient';

const RevisionCalendar = () => {

  const { data: upcomingRevisions = [], isLoading: isLoadingUpcoming } = useQuery<SurahData[]>({
    queryKey: ['upcomingRevisions'],
    queryFn: () => getUpcomingRevisions(30) // Get for the next 30 days
  });
  
  const { data: revisionHistory = [], isLoading: isLoadingHistory } = useQuery({
      queryKey: ['revisionHistory'],
      queryFn: async () => {
          const { data, error } = await supabase
              .from('revision_history')
              .select('*')
              .order('revision_date', { ascending: false })
              .limit(10);
          if (error) throw error;
          return data;
      },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRevisionsByDate = () => {
    const revisionsByDate: Record<string, SurahData[]> = {};
    upcomingRevisions.forEach(revision => {
      if (!revision.nextRevision) return;
      const dateKey = new Date(revision.nextRevision).toDateString();
      if (!revisionsByDate[dateKey]) {
        revisionsByDate[dateKey] = [];
      }
      revisionsByDate[dateKey].push(revision);
    });
    return revisionsByDate;
  };

  const revisionsByDate = getRevisionsByDate();
  const sortedDates = Object.keys(revisionsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const isLoading = isLoadingUpcoming || isLoadingHistory;
  
  if (isLoading) {
    return <div>Loading Calendar...</div>
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Upcoming Revisions</CardTitle>
          <CardDescription className="text-sm">
            Next 30 days of scheduled revisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedDates.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <Calendar className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-2 md:mb-4" />
              <p className="text-muted-foreground text-sm md:text-base">
                No upcoming revisions scheduled.
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {sortedDates.slice(0, 10).map(dateKey => {
                const date = new Date(dateKey);
                const revisions = revisionsByDate[dateKey];
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div key={dateKey} className="space-y-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <h3 className={`font-semibold text-sm md:text-base ${
                        isToday ? 'text-emerald-600' : 'text-foreground'
                      }`}>
                        {formatDate(dateKey)}
                      </h3>
                      {isToday && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-xs">
                          Today
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 pl-2">
                      {revisions.map(revision => {
                        const surah = SURAHS.find(s => s.number === revision.surahNumber);
                        if (!surah) return null;

                        return (
                          <div
                            key={revision.surahNumber}
                            className="flex items-center justify-between p-3 rounded-lg border bg-white"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-sm h-8 w-8 rounded-full flex items-center justify-center font-medium bg-gray-100 text-gray-600">
                                {surah.number}
                              </div>
                              <div>
                                <h3 className="font-semibold">{`${surah.transliteration} (${surah.name})`}</h3>
                                <p className="text-sm text-muted-foreground">{`${surah.verses} verses`}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Last revised on</p>
                              <p className="text-xs font-medium">
                                {revision.lastRevision ? new Date(revision.lastRevision).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Recent Revision History</CardTitle>
          <CardDescription className="text-sm">
            Your last 10 completed revisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {revisionHistory.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <p className="text-muted-foreground text-sm md:text-base">
                No revision history yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {revisionHistory.map((rev: any, idx: number) => {
                const surah = SURAHS.find(s => s.number === rev.surah_number);
                if (!surah) return null;
                
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm h-8 w-8 rounded-full flex items-center justify-center font-medium bg-gray-100 text-gray-600">
                        {surah.number}
                      </div>
                      <div>
                        <h3 className="font-semibold">{`${surah.transliteration} (${surah.name})`}</h3>
                        <p className="text-sm text-muted-foreground">{`${surah.verses} verses`}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Revised on {new Date(rev.revision_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <Badge className="text-xs capitalize mt-1" variant="outline">
                        {rev.difficulty}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RevisionCalendar;
