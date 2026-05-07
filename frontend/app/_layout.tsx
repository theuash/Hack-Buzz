import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { APP_NAME, THEME_COLOR, DEFAULT_GP_ID, DEFAULT_TOKEN } from '../src/constants/config';
import { storage } from '../src/services/storage';
import { NotificationHandler } from '../src/components/NotificationHandler';

export default function RootLayout() {
  useEffect(() => {
    const initSession = async () => {
      const user = await storage.getUser();
      if (!user && DEFAULT_GP_ID) {
        console.log('[MediRef] Root Layout: Auto-login session recovery...');
        await storage.saveToken(DEFAULT_TOKEN || 'temp_token');
        await storage.saveUser({ id: DEFAULT_GP_ID, name: 'Auto Login GP' });
      }
    };
    initSession();
  }, []);

  return (
    <>
      <NotificationHandler />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: THEME_COLOR,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerTitle: APP_NAME,
        }}
      >
        <Stack.Screen name="index" options={{ title: APP_NAME }} />
        <Stack.Screen name="dashboard" options={{ title: `${APP_NAME} - Dashboard`, headerLeft: () => null }} />
        <Stack.Screen name="create-referral" options={{ title: 'New Referral' }} />
        <Stack.Screen name="qr-display" options={{ title: 'Referral Created' }} />
      </Stack>
    </>
  );
}
