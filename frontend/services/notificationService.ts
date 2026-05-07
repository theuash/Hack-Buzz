import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform, Alert } from "react-native";
import { APP_NAME } from "../constants/config";

// Configure how notifications are presented while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permissions and returns the Expo push token.
 * Returns null if permission is denied or on a simulator.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn(`${APP_NAME}: Push notifications only work on physical devices.`);
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert(
      `${APP_NAME}`,
      "Notification permission denied. You won't receive referral alerts."
    );
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "MediRef Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0F9B8E",
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

/**
 * Handles an incoming "consultation_confirmed" notification.
 * Shows an in-app alert with specialty and timestamp.
 */
export function handleConsultationConfirmed(
  data: Record<string, string>
): void {
  const specialty = data?.specialty ?? "Unknown Specialty";
  const rawTs = data?.timestamp ?? new Date().toISOString();
  const timestamp = new Date(rawTs).toLocaleString();

  Alert.alert(
    `${APP_NAME} — Referral Update`,
    `Your referral to ${specialty} was viewed by the specialist on ${timestamp}.`,
    [{ text: "OK", style: "default" }]
  );
}
