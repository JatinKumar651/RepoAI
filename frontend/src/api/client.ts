import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: inject JWT ─────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 ────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Typed API helpers ────────────────────────────────────────
export const authApi = {
  login: (data: any) => apiClient.post("/api/auth/login", data),
  signup: (data: any) => apiClient.post("/api/auth/signup", data),
  getGoogleUrl: () => apiClient.get<{ url: string }>("/api/auth/google"),
  callback: (access_token: string, refresh_token: string) =>
    apiClient.post("/api/auth/callback", { access_token, refresh_token }),
  me: () => apiClient.get("/api/auth/me"),
  logout: () => apiClient.post("/api/auth/logout"),
};

export const analyzeApi = {
  analyzeRepo: (repo_url: string) =>
    apiClient.post("/api/analyze-repo", { repo_url }),
};

export const historyApi = {
  save: (payload: {
    repo_url: string;
    repo_card: Record<string, unknown>;
    directory_tree: string[];
    token_metrics: Record<string, unknown>;
    generated_prompt: string;
  }) => apiClient.post("/api/history", payload),

  list: (limit = 20, offset = 0) =>
    apiClient.get("/api/history", { params: { limit, offset } }),

  get: (id: string) => apiClient.get(`/api/history/${id}`),

  delete: (id: string) => apiClient.delete(`/api/history/${id}`),
};
