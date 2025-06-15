
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUpcomingRevisions } from '@/utils/dataManager';
import { UpcomingRevision } from '@/types/revision';
import { SURAHS } from '@/utils/surahData';

const RevisionCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [upcomingRevisions, setUpcomingRevisions] = useState<UpcomingRevision[]>([]);

  useEffect(() => {
    loadUpcomingRevisions();
  }, []);

  const loadUpcomingRevisions = () => {
    const revisions = getUpcomingRevisions(30); // Next 30 days
    setUpcomingRevisions(revisions);
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRevisionsByDate = () => {
    const revisionsByDate: Record<string, UpcomingRevision[]> = {};
    upcomingRevisions.forEach(revision => {
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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Calendar Header - Mobile Optimized */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Calendar className="h-4 w-4 md:h-5 w-5" />
                Revision Calendar
              </CardTitle>
              <CardDescription className="text-sm">
                View your upcoming revision schedule
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth(-1)}
                className="h-8 w-8 p-0 md:h-9 md:w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium px-2 text-sm md:text-base whitespace-nowrap">
                {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth(1)}
                className="h-8 w-8 p-0 md:h-9 md:w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Upcoming Revisions List - Mobile Optimized */}
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
              <div className="text-4xl mb-2">📅</div>
              <Calendar className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-2 md:mb-4" />
              <p className="text-muted-foreground text-sm md:text-base">
                No upcoming revisions scheduled. Start memorizing surahs to see them here!
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {sortedDates.slice(0, 10).map(dateKey => {
                const date = new Date(dateKey);
                const revisions = revisionsByDate[dateKey];
                const isToday = date.toDateString() === new Date().toDateString();
                const isOverdue = date < new Date() && !isToday;
                
                return (
                  <div key={dateKey} className="space-y-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <h3 className={`font-semibold text-sm md:text-base ${
                        isToday ? 'text-emerald-600' : 
                        isOverdue ? 'text-red-600' : 'text-foreground'
                      }`}>
                        {formatDate(dateKey)}
                      </h3>
                      {isToday && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-xs">
                          Today
                        </Badge>
                      )}
                      {isOverdue && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 ml-2 md:ml-4">
                      {revisions.map(revision => {
                        const surah = SURAHS.find(s => s.number === revision.surahNumber);
                        return (
                          <Card key={revision.surahNumber} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                            <CardContent className="p-3">
                              <div className="font-medium text-sm md:text-base truncate">{surah?.name}</div>
                              <div className="text-xs md:text-sm text-muted-foreground truncate">
                                {surah?.transliteration}
                              </div>
                              <Badge variant="outline" className="text-xs mt-1">
                                Surah {surah?.number}
                              </Badge>
                            </CardContent>
                          </Card>
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
    </div>
  );
};

export default RevisionCalendar;
