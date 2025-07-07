import { openDB, DBSchema } from 'idb';
import { SurahData, RevisionData, Profile } from '@/types/revision';

// This module is now the sole data source for the app (offline-only mode)
// All data is stored and retrieved from IndexedDB

interface AyatRevisionDB extends DBSchema {
  surahRevisions: {
    key: number; // surahNumber
    value: SurahData;
  };
  revisionLogs: {
    key: string; // `${surahNumber}_${timestamp}`
    value: RevisionData;
  };
  userProfile: {
    key: string; // 'profile'
    value: Profile;
  };
  syncMeta: {
    key: string; // 'lastSynced'
    value: { lastSynced: string };
  };
  scheduledNotifications: {
    key: string; // notification id
    value: import('@/types/revision').ScheduledNotification;
  };
}

const DB_NAME = 'ayat-revision-db';
const DB_VERSION = 1;

export async function getDB() {
  return openDB<AyatRevisionDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('surahRevisions')) {
        db.createObjectStore('surahRevisions', { keyPath: 'surahNumber' });
      }
      if (!db.objectStoreNames.contains('revisionLogs')) {
        db.createObjectStore('revisionLogs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('userProfile')) {
        db.createObjectStore('userProfile');
      }
      if (!db.objectStoreNames.contains('syncMeta')) {
        db.createObjectStore('syncMeta');
      }
      if (!db.objectStoreNames.contains('scheduledNotifications')) {
        db.createObjectStore('scheduledNotifications');
      }
    },
  });
}

// Surah Revisions
export async function getAllSurahRevisions(): Promise<SurahData[]> {
  console.log('Getting all surah revisions from IndexedDB...');
  const db = await getDB();
  const revisions = await db.getAll('surahRevisions');
  console.log('Retrieved surah revisions from IndexedDB:', revisions);
  return revisions;
}

export async function setSurahRevisions(revisions: SurahData[]) {
  console.log('Setting surah revisions:', revisions);
  const db = await getDB();
  const tx = db.transaction('surahRevisions', 'readwrite');
  for (const rev of revisions) {
    console.log(`Saving surah ${rev.surahNumber}:`, rev);
    await tx.store.put(rev);
  }
  await tx.done;
  console.log('Surah revisions saved successfully');
}

// Revision Logs
export async function getAllRevisionLogs(): Promise<RevisionData[]> {
  const db = await getDB();
  return (await db.getAll('revisionLogs'));
}

export async function addRevisionLog(log: RevisionData & { id: string }) {
  const db = await getDB();
  await db.put('revisionLogs', log, log.id);
}

// User Profile
export async function getUserProfileOffline(): Promise<Profile | undefined> {
  const db = await getDB();
  return db.get('userProfile', 'profile');
}

export async function setUserProfileOffline(profile: Profile) {
  const db = await getDB();
  await db.put('userProfile', profile, 'profile');
}

// Sync Metadata (not used in offline-only mode, but kept for possible future use)
export async function getLastSynced(): Promise<string | undefined> {
  const db = await getDB();
  const meta = await db.get('syncMeta', 'lastSynced');
  return meta?.lastSynced;
}

export async function setLastSynced(date: string) {
  const db = await getDB();
  await db.put('syncMeta', { lastSynced: date }, 'lastSynced');
}

// Scheduled Notifications
export async function getAllScheduledNotifications() {
  const db = await getDB();
  return db.getAll('scheduledNotifications');
}

export async function addScheduledNotification(notification: import('@/types/revision').ScheduledNotification) {
  const db = await getDB();
  await db.put('scheduledNotifications', notification, notification.id);
}

export async function removeScheduledNotification(id: string) {
  const db = await getDB();
  await db.delete('scheduledNotifications', id);
} 