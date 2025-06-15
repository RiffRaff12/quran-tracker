
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, Circle, Search } from 'lucide-react';
import { getRevisionData, updateSurahStatus } from '@/utils/dataManager';
import { SURAHS } from '@/utils/surahData';

const SurahManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, memorized, not-memorized
  const [surahData, setSurahData] = useState({});

  useEffect(() => {
    const data = getRevisionData();
    setSurahData(data.surahs);
  }, []);

  const filteredSurahs = SURAHS.filter(surah => {
    const matchesSearch = surah.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         surah.transliteration.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'memorized') {
      return matchesSearch && surahData[surah.number]?.memorized;
    } else if (filter === 'not-memorized') {
      return matchesSearch && !surahData[surah.number]?.memorized;
    }
    
    return matchesSearch;
  });

  const toggleMemorized = (surahNumber) => {
    const currentStatus = surahData[surahNumber]?.memorized || false;
    updateSurahStatus(surahNumber, !currentStatus);
    
    // Update local state
    setSurahData(prev => ({
      ...prev,
      [surahNumber]: {
        ...prev[surahNumber],
        memorized: !currentStatus
      }
    }));
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Manage Surahs</CardTitle>
          <CardDescription className="text-sm">
            Mark surahs as memorized to start tracking revisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search surahs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
                className="whitespace-nowrap touch-manipulation"
              >
                All
              </Button>
              <Button
                variant={filter === 'memorized' ? 'default' : 'outline'}
                onClick={() => setFilter('memorized')}
                size="sm"
                className="whitespace-nowrap touch-manipulation"
              >
                Memorized
              </Button>
              <Button
                variant={filter === 'not-memorized' ? 'default' : 'outline'}
                onClick={() => setFilter('not-memorized')}
                size="sm"
                className="whitespace-nowrap touch-manipulation"
              >
                Not Memorized
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Surahs List - Mobile Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {filteredSurahs.map((surah) => {
          const isMemorized = surahData[surah.number]?.memorized || false;
          const lastRevision = surahData[surah.number]?.lastRevision;
          
          return (
            <Card key={surah.number} className={`transition-all hover:shadow-md active:scale-95 touch-manipulation ${
              isMemorized ? 'bg-emerald-50 border-emerald-200' : 'bg-white'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base md:text-lg truncate">{surah.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{surah.transliteration}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Surah {surah.number} • {surah.verses} verses
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMemorized(surah.number)}
                    className="p-2 touch-manipulation ml-2 flex-shrink-0"
                  >
                    {isMemorized ? (
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                
                {isMemorized && (
                  <div className="space-y-2">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-xs">
                      Memorized
                    </Badge>
                    {lastRevision && (
                      <p className="text-xs text-muted-foreground">
                        Last revised: {new Date(lastRevision).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSurahs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-muted-foreground">No surahs found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SurahManager;
