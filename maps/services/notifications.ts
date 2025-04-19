import * as Notifications from 'expo-notifications';

const PROXIMITY_THRESHOLD = 100; // 100 метров

export class NotificationManager {
  private activeNotifications: Map<number, string> = new Map();

  async init() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  async showNotification(markerId: number, markerTitle?: string) {
    if (this.activeNotifications.has(markerId)) return;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Вы рядом с меткой!',
        body: markerTitle ? `Метка: ${markerTitle}` : 'Сохранённая точка',
      },
      trigger: null,
    });

    this.activeNotifications.set(markerId, notificationId);
  }

  async cancelNotification(markerId: number) {
    const notificationId = this.activeNotifications.get(markerId);
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      this.activeNotifications.delete(markerId);
    }
  }

  clearAll() {
    this.activeNotifications.forEach(async (id) => {
      await Notifications.cancelScheduledNotificationAsync(id);
    });
    this.activeNotifications.clear();
  }
}