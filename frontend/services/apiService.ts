import axios from "axios";
import { API_BASE_URL } from "../constants/config";
import { getToken } from "../utils/storage";

// ── Axios instance ─────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Types ──────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  gpId: string;
  email: string;
}

export type ConsentStatus = "pending" | "approved" | "denied";

export interface Referral {
  id: string;
  specialty: string;
  patientPhone: string; // masked server-side before returning
  date: string;         // ISO string
  consentStatus: ConsentStatus;
}

export interface CreateReferralPayload {
  encryptedPayload: string;
  patientPhone: string;
  specialty: string;
  gpId: string;
}

export interface CreateReferralResponse {
  docId: string;
  createdAt: string;
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export async function loginGP(
  email: string,
  password: string
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/api/auth/login", {
    email,
    password,
  });
  return data;
}

// ── Referrals ──────────────────────────────────────────────────────────────────

export async function fetchReferrals(): Promise<Referral[]> {
  const { data } = await api.get<Referral[]>("/api/referral/list");
  return data;
}

export async function createReferral(
  payload: CreateReferralPayload
): Promise<CreateReferralResponse> {
  const { data } = await api.post<CreateReferralResponse>(
    "/api/referral/create",
    payload
  );
  return data;
}
