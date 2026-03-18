import { LocalNotifications, LocalNotificationSchema, ActionPerformed } from '@capacitor/local-notifications';
import * as idbManager from './idbManager';
import { ScheduledNotification } from '@/types/revision';

// Check if Capacitor local notifications are available (native app only)
function isNativeNotificationsAvailable(): boolean {
  try {
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

// Request notification permissions
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNativeNotificationsAvailable()) return false;
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch {
    return false;
  }
}

// Listen for notification actions
export function listenForNotificationActions(onAction: (notification: ActionPerformed) => void) {
  if (!isNativeNotificationsAvailable()) return;
  try {
    LocalNotifications.addListener('localNotificationActionPerformed', onAction);
  } catch {
    // not supported
  }
}

// Schedule a local notification
export async function scheduleLocalNotification(notification: ScheduledNotification) {
  await idbManager.addScheduledNotification(notification);
  if (!isNativeNotificationsAvailable()) return;
  try {
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
  } catch {
    // not supported on this platform
  }
}

// Cancel a scheduled local notification
export async function cancelLocalNotification(id: string) {
  await idbManager.removeScheduledNotification(id);
  if (!isNativeNotificationsAvailable()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: Number(id) }] });
  } catch {
    // not supported on this platform
  }
}

// Cancel all scheduled notifications
export async function cancelAllLocalNotifications() {
  if (!isNativeNotificationsAvailable()) return;
  try {
    await LocalNotifications.removeAllDeliveredNotifications();
  } catch {
    // not supported on this platform
  }
}

// Get all scheduled notifications from local DB
export async function getAllScheduledNotifications(): Promise<ScheduledNotification[]> {
  return idbManager.getAllScheduledNotifications();
} 