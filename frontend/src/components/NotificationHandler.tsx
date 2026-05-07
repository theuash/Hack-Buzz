import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

export const NotificationHandler = () => {
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const { type, specialty, timestamp } = notification.request.content.data;
      
      if (type === 'consultation_confirmed') {
        Alert.alert(
          'Consultation Confirmed',
          `Your referral to ${specialty} was viewed by the specialist on ${new Date(timestamp).toLocaleString()}`,
          [{ text: 'OK' }]
        );
      }
    });

    return () => subscription.remove();
  }, []);

  return null;
};
