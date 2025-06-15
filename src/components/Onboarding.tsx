
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, Search, BookOpen } from 'lucide-react';
import { SURAHS } from '@/utils/surahData';
import { updateSurahStatus } from '@/utils/dataManager';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [selectedSurahs, setSelectedSurahs] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const filteredSurahs = SURAHS.filter(surah => 
    surah.name.includes(searchTerm) || 
    surah.transliteration.toLowerCase().includes(searchTerm.toLowerCase()) ||
    surah.number.toString().includes(searchTerm)
  );

  const toggleSurah = (surahNumber: number) => {
    const newSelected = new Set(selectedSurahs);
    if (newSelected.has(surahNumber)) {
      newSelected.delete(surahNumber);
    } else {
      newSelected.add(surahNumber);
    }
    setSelectedSurahs(newSelected);
  };

  const handleComplete = () => {
    // Mark all selected surahs as memorized
    selectedSurahs.forEach(surahNumber => {
      updateSurahStatus(surahNumber, true);
    });
    
    // Mark onboarding as complete
    localStorage.setItem('quran_onboarding_complete', 'true');
    onComplete();
  };

  const steps = [
    {
      title: "Welcome to Quran Tracker",
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-800">
            Strengthen Your Memorization
          </h2>
          <p className="text-gray-600">
            Use intelligent spaced repetition to maintain and strengthen your Quran memorization.
            Let's start by selecting the surahs you've already memorized.
          </p>
          <Button 
            onClick={() => setCurrentStep(1)}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Get Started
          </Button>
        </div>
      )
    },
    {
      title: "Select Your Memorized Surahs",
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-emerald-800 mb-2">
              Which surahs have you memorized?
            </h2>
            <p className="text-sm text-gray-600">
              Select all the surahs you have memorized. You can always add more later.
            </p>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search surahs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="text-sm text-gray-600 mb-4">
            Selected: {selectedSurahs.size} surahs
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin">
            {filteredSurahs.map((surah) => {
              const isSelected = selectedSurahs.has(surah.number);
              return (
                <div
                  key={surah.number}
                  onClick={() => toggleSurah(surah.number)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all touch-manipulation ${
                    isSelected 
                      ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {surah.number}
                        </Badge>
                        <h3 className="font-medium text-sm truncate">{surah.name}</h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{surah.transliteration}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-emerald-600 ml-2" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(0)}
              className="flex-1"
            >
              Back
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={selectedSurahs.size === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Complete Setup
            </Button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-2">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentStep ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <CardTitle className="text-lg">{steps[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent>
          {steps[currentStep].content}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
