import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import {
  registerForPushNotifications,
  handleConsultationConfirmed,
} from "../services/notificationService";

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push notifications on mount
    registerForPushNotifications();

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data as Record<string, string>;
        if (data?.type === "consultation_confirmed") {
          handleConsultationConfirmed(data);
        }
      });

    // Listen for user tapping a notification (background/killed state)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<
          string,
          string
        >;
        if (data?.type === "consultation_confirmed") {
          handleConsultationConfirmed(data);
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor="#0F9B8E" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0F9B8E" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700", fontSize: 18 },
          headerBackTitleVisible: false,
          contentStyle: { backgroundColor: "#F8FAFB" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="dashboard"
          options={{ title: "MediRef", headerBackVisible: false }}
        />
        <Stack.Screen name="referral-form" options={{ title: "New Referral" }} />
        <Stack.Screen name="qr-display" options={{ title: "Referral QR" }} />
      </Stack>
    </>
  );
}
