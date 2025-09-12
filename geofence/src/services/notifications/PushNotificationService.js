import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
    
  let token;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token!');
    return;
  }

  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Expo Push Token:", token);
  return token;
}

export function addNotificationListeners(onReceive, onResponse) {
  const sub1 = Notifications.addNotificationReceivedListener(onReceive);
  const sub2 = Notifications.addNotificationResponseReceivedListener(onResponse);

  return () => {
    sub1.remove();
    sub2.remove();
  };
}
