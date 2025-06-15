
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, Target } from 'lucide-react';
import { getTodaysRevisions, getUpcomingRevisions } from '@/utils/dataManager';
import { SURAHS } from '@/utils/surahData';
import RevisionCard from '@/components/RevisionCard';

const RecommendedRevisions = () => {
  const todaysRevisions = getTodaysRevisions();
  const upcomingRevisions = getUpcomingRevisions(7); // Next 7 days
  
  const overdue = todaysRevisions.filter(r => {
    const today = new Date();
    const dueDate = new Date(r.nextRevision);
    return dueDate < today && !r.completed;
  });

  const dueToday = todaysRevisions.filter(r => {
    const today = new Date();
    const dueDate = new Date(r.nextRevision);
    return dueDate.toDateString() === today.toDateString() && !r.completed;
  });

  const completed = todaysRevisions.filter(r => r.completed);

  const getSurahInfo = (surahNumber: number) => {
    return SURAHS.find(s => s.number === surahNumber);
  };

  if (todaysRevisions.length === 0) {
    return (
      <Card className="text-center p-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-emerald-800 mb-2">
          All Set for Today!
        </h3>
        <p className="text-gray-600 mb-4">
          You don't have any revisions due today. Check the Surahs tab to add more memorized surahs.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overdue Section */}
      {overdue.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              Overdue Revisions
              <Badge variant="destructive" className="ml-auto">
                {overdue.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdue.map((revision) => (
              <RevisionCard
                key={revision.surahNumber}
                revision={revision}
                onComplete={() => window.location.reload()}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Due Today Section */}
      {dueToday.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Clock className="w-5 h-5" />
              Due Today
              <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-800">
                {dueToday.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dueToday.map((revision) => (
              <RevisionCard
                key={revision.surahNumber}
                revision={revision}
                onComplete={() => window.location.reload()}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Today Section */}
      {completed.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Target className="w-5 h-5" />
              Completed Today
              <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-800">
                {completed.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completed.map((revision) => (
              <RevisionCard
                key={revision.surahNumber}
                revision={revision}
                onComplete={() => window.location.reload()}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming This Week */}
      {upcomingRevisions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Coming This Week
              <Badge variant="outline" className="ml-auto">
                {upcomingRevisions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingRevisions.slice(0, 5).map((upcoming) => {
                const surah = getSurahInfo(upcoming.surahNumber);
                const dueDate = new Date(upcoming.nextRevision);
                const daysUntil = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={upcoming.surahNumber} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{surah?.name}</p>
                      <p className="text-xs text-gray-500">{surah?.transliteration}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                    </Badge>
                  </div>
                );
              })}
              {upcomingRevisions.length > 5 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  And {upcomingRevisions.length - 5} more...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecommendedRevisions;
