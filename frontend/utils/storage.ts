import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  JWT_TOKEN: "mediref_jwt_token",
  GP_ID: "mediref_gp_id",
  GP_EMAIL: "mediref_gp_email",
};

// ── Token ─────────────────────────────────────────────────────────────────────

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.JWT_TOKEN, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.JWT_TOKEN);
}

export async function removeToken(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.JWT_TOKEN);
}

// ── GP Profile ────────────────────────────────────────────────────────────────

export async function saveGPProfile(gpId: string, email: string): Promise<void> {
  await AsyncStorage.multiSet([
    [KEYS.GP_ID, gpId],
    [KEYS.GP_EMAIL, email],
  ]);
}

export async function getGPProfile(): Promise<{ gpId: string; email: string } | null> {
  const pairs = await AsyncStorage.multiGet([KEYS.GP_ID, KEYS.GP_EMAIL]);
  const gpId = pairs[0][1];
  const email = pairs[1][1];
  if (!gpId || !email) return null;
  return { gpId, email };
}

// ── Clear all session data ─────────────────────────────────────────────────────

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.JWT_TOKEN, KEYS.GP_ID, KEYS.GP_EMAIL]);
}
