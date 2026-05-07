import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { storage } from '../src/services/storage';
import { DEFAULT_GP_ID, DEFAULT_TOKEN } from '../src/constants/config';

export default function IndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    const autoLogin = async () => {
      // If no session exists, inject defaults for testing
      const token = await storage.getToken();
      if (!token && DEFAULT_GP_ID) {
        await storage.saveToken(DEFAULT_TOKEN || 'temp_token');
        await storage.saveUser({ id: DEFAULT_GP_ID, name: 'Auto Login GP' });
      }
      
      // Redirect to Dashboard immediately
      router.replace('/dashboard');
    };

    autoLogin();
  }, []);

  return null;
}
