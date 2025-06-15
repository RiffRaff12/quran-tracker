
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
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Revision Calendar
              </CardTitle>
              <CardDescription>
                View your upcoming revision schedule
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium px-4">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Upcoming Revisions List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Revisions</CardTitle>
          <CardDescription>
            Next 30 days of scheduled revisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedDates.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No upcoming revisions scheduled. Start memorizing surahs to see them here!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.slice(0, 10).map(dateKey => {
                const date = new Date(dateKey);
                const revisions = revisionsByDate[dateKey];
                const isToday = date.toDateString() === new Date().toDateString();
                const isOverdue = date < new Date() && !isToday;
                
                return (
                  <div key={dateKey} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className={`font-semibold ${
                        isToday ? 'text-emerald-600' : 
                        isOverdue ? 'text-red-600' : 'text-foreground'
                      }`}>
                        {formatDate(dateKey)}
                      </h3>
                      {isToday && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                          Today
                        </Badge>
                      )}
                      {isOverdue && (
                        <Badge variant="destructive">
                          Overdue
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ml-4">
                      {revisions.map(revision => {
                        const surah = SURAHS.find(s => s.number === revision.surahNumber);
                        return (
                          <Card key={revision.surahNumber} className="bg-gray-50">
                            <CardContent className="p-3">
                              <div className="font-medium">{surah?.name}</div>
                              <div className="text-sm text-muted-foreground">
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
