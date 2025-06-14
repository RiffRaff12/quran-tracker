
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
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Surahs</CardTitle>
          <CardDescription>
            Mark surahs as memorized to start tracking revisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search surahs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filter === 'memorized' ? 'default' : 'outline'}
                onClick={() => setFilter('memorized')}
                size="sm"
              >
                Memorized
              </Button>
              <Button
                variant={filter === 'not-memorized' ? 'default' : 'outline'}
                onClick={() => setFilter('not-memorized')}
                size="sm"
              >
                Not Memorized
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Surahs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSurahs.map((surah) => {
          const isMemorized = surahData[surah.number]?.memorized || false;
          const lastRevision = surahData[surah.number]?.lastRevision;
          
          return (
            <Card key={surah.number} className={`cursor-pointer transition-all hover:shadow-md ${
              isMemorized ? 'bg-emerald-50 border-emerald-200' : 'bg-white'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{surah.name}</h3>
                    <p className="text-sm text-muted-foreground">{surah.transliteration}</p>
                    <p className="text-xs text-muted-foreground">
                      Surah {surah.number} • {surah.verses} verses
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMemorized(surah.number)}
                    className="p-1"
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
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
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
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No surahs found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SurahManager;
