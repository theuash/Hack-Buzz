import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@mediref_jwt_token';
const USER_KEY = '@mediref_user_data';

export const storage = {
  saveToken: async (token: string) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },
  getToken: async () => {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },
  saveUser: async (user: any) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getUser: async () => {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  clear: async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  },
};
