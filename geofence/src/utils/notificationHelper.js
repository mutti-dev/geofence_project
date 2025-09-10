import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import API from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function registerForPushNotificationsAsync() {
  try {
    if (!Constants.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    console.log('Expo push token:', token);

    // send to backend
    const userToken = await AsyncStorage.getItem('token');
    if (userToken) {
      try {
        await API.post('/users/push-token', { token }, { headers: { Authorization: `Bearer ${userToken}` } });
      } catch (err) {
        console.log('Failed to register push token with backend', err?.response?.data || err.message);
      }
    }

    return token;
  } catch (err) {
    console.log('registerForPushNotificationsAsync error', err);
    return null;
  }
}

// configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});
