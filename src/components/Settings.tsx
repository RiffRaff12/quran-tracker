import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Settings as SettingsIcon, Database, Bell, User, MessageSquare } from 'lucide-react';
import * as idbManager from '@/utils/idbManager';
import { useToast } from '@/hooks/use-toast';
import FeedbackForm from './FeedbackForm';

const Settings = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export all IndexedDB data as JSON
  const handleExport = async () => {
    try {
      const surahRevisions = await idbManager.getAllSurahRevisions();
      const revisionLogs = await idbManager.getAllRevisionLogs();
      const userProfile = await idbManager.getUserProfileOffline();
      const scheduledNotifications = await idbManager.getAllScheduledNotifications();
      const data = {
        surahRevisions,
        revisionLogs,
        userProfile,
        scheduledNotifications,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ayat-revision-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup Exported",
        description: "Your data has been successfully exported.",
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
      });
    }
  };

  // Import data from JSON file
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate the backup file structure
      if (!data.surahRevisions || !data.revisionLogs || !data.userProfile) {
        throw new Error('Invalid backup file format');
      }
      
      // Import the data
      if (data.surahRevisions) await idbManager.setSurahRevisions(data.surahRevisions);
      if (data.revisionLogs) {
        for (const log of data.revisionLogs) await idbManager.addRevisionLog(log);
      }
      if (data.userProfile) await idbManager.setUserProfileOffline(data.userProfile);
      if (data.scheduledNotifications) {
        for (const notif of data.scheduledNotifications) await idbManager.addScheduledNotification(notif);
      }
      
      toast({
        title: "Backup Imported",
        description: "Your data has been successfully restored.",
      });
      
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      toast({
        variant: 'destructive',
        title: "Import Failed",
        description: `Failed to import backup: ${(e as Error).message}`,
      });
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Clear all data
  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        // Clear all IndexedDB data
        const db = await idbManager.getDB();
        await db.clear('surahRevisions');
        await db.clear('revisionLogs');
        await db.clear('userProfile');
        await db.clear('scheduledNotifications');
        
        toast({
          title: "Data Cleared",
          description: "All data has been successfully cleared.",
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: "Clear Failed",
          description: "Failed to clear data. Please try again.",
        });
      }
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full p-2 sm:p-4 pb-20">
      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Export, import, or clear your revision data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              onClick={handleExport} 
              className="h-12 w-full text-base"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Backup
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              className="h-12 w-full text-base"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Backup
            </Button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="application/json" 
              style={{ display: 'none' }} 
              onChange={handleImport} 
            />
          </div>
          <Button 
            onClick={handleClearData} 
            className="h-12 w-full text-base"
            variant="destructive"
          >
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <SettingsIcon className="h-5 w-5" />
            App Information
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            About this application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">App Name</span>
              <span className="text-sm text-muted-foreground">Quran Revision Tracker</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Version</span>
              <Badge variant="secondary">1.0.0</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Storage</span>
              <span className="text-sm text-muted-foreground">Local (IndexedDB)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Offline Support</span>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Yes</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="h-5 w-5" />
            Features
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            What this app can do for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm">Track memorized surahs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm">Spaced repetition scheduling</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm">Progress tracking and streaks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm">Local notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm">Data backup and restore</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm">Offline-first design</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="h-5 w-5" />
            Feedback
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Help us improve by sharing your thoughts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackForm>
            <Button className="h-12 w-full text-base">
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Feedback
            </Button>
          </FeedbackForm>
        </CardContent>
      </Card>

      {/* How Spaced Repetition Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Bell className="h-5 w-5" />
            How Spaced Repetition Works
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Understand how your revision schedule is optimized
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>
              Spaced repetition is a proven learning technique that helps you remember what you've memorized for the long term. Instead of reviewing everything every day, the app schedules each surah for revision at just the right time—right before you're likely to forget it.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>When you review a surah, you rate how easy or hard it was to recall.</li>
              <li>If it was easy, the app will wait longer before showing it again.</li>
              <li>If it was hard, you'll see it again sooner.</li>
              <li>This way, you spend more time on surahs you find difficult, and less on those you know well.</li>
              <li>Adding a past revision helps the app adjust your schedule to match your real progress.</li>
            </ul>
            <p>
              This method helps you keep all your surahs fresh in your memory, while saving time and effort!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings; 