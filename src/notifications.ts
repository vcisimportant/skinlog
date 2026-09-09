import * as Notifications from 'expo-notifications';
import { Settings } from './storage';

// Without a handler, a reminder that fires while the app is already open is swallowed.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Returns false when a reminder was asked for but the phone refused permission, so
// the caller can say so rather than leaving a switch on that does nothing.
export async function applyReminder(settings: Settings): Promise<boolean> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.reminderEnabled) return true;

  const existing = await Notifications.getPermissionsAsync();
  const granted = existing.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return false;

  await Notifications.scheduleNotificationAsync({
    content: { title: 'Skinlog', body: 'How was your skin today?' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.reminderHour,
      minute: settings.reminderMinute,
    },
  });
  return true;
}
