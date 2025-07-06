import { LocalNotifications, ScheduleOptions, LocalNotificationSchema, ActionPerformed } from '@capacitor/local-notifications';
import * as idbManager from './idbManager';
import { ScheduledNotification } from '@/types/revision';

// Request notification permissions
export async function requestNotificationPermission(): Promise<boolean> {
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
}

// Listen for notification actions
export function listenForNotificationActions(onAction: (notification: ActionPerformed) => void) {
  LocalNotifications.addListener('localNotificationActionPerformed', onAction);
}

// Schedule a local notification
export async function scheduleLocalNotification(notification: ScheduledNotification) {
  // Create a numeric ID from the surah number and timestamp
  // Use a hash of the string ID to create a unique numeric ID
  const timestamp = new Date(notification.fireDate).getTime();
  const numericId = notification.surahNumber * 1000000 + (timestamp % 1000000);
  
  const notif: LocalNotificationSchema = {
    id: numericId,
    title: notification.title,
    body: notification.body,
    schedule: { at: new Date(notification.fireDate) },
    extra: { surahNumber: notification.surahNumber },
  };
  await LocalNotifications.schedule({ notifications: [notif] });
  await idbManager.addScheduledNotification(notification);
}

// Cancel a scheduled local notification
export async function cancelLocalNotification(id: string) {
  await LocalNotifications.cancel({ notifications: [{ id: Number(id) }] });
  await idbManager.removeScheduledNotification(id);
}

// Cancel all scheduled notifications
export async function cancelAllLocalNotifications() {
  await LocalNotifications.removeAllDeliveredNotifications();
  // Optionally clear from idbManager as well
  // (implement if needed)
}

// Get all scheduled notifications from local DB
export async function getAllScheduledNotifications(): Promise<ScheduledNotification[]> {
  return idbManager.getAllScheduledNotifications();
} 