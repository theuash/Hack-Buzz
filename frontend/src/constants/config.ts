export const APP_NAME = (process.env as any).EXPO_PUBLIC_APP_NAME || "MediRef";
export const API_BASE_URL = (process.env as any).EXPO_PUBLIC_API_URL || "http://localhost:5000";
export const SALT = "MEDIREF_SECURE_V1_2024";
export const THEME_COLOR = "#0F9B8E";
export const USE_MOCK = false; 
export const DEFAULT_GP_ID = "60d6cbbc31e14fcfb3a13943"; // Replace with your actual MongoDB GP ID
export const DEFAULT_TOKEN = "your_real_jwt_token"; // Optional fallback
