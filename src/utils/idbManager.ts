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
  const db = await getDB();
  return (await db.getAll('surahRevisions'));
}

export async function setSurahRevisions(revisions: SurahData[]) {
  const db = await getDB();
  const tx = db.transaction('surahRevisions', 'readwrite');
  for (const rev of revisions) {
    await tx.store.put(rev);
  }
  await tx.done;
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