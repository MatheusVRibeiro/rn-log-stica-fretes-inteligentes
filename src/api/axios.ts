import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { clearSessionStorage, SESSION_EXPIRED_MESSAGE, STORAGE_KEYS } from "@/auth/session";
import * as authService from "@/services/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "https://api.caramellologistica.com",
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string | null> | null = null;

const redirectToLoginAfterSessionExpiration = () => {
  clearSessionStorage();
  const targetUrl = `/login?session=expired&message=${encodeURIComponent(SESSION_EXPIRED_MESSAGE)}`;

  if (window.location.pathname !== "/login") {
    window.location.assign(targetUrl);
  }
};

const shouldSkipRefresh = (config?: InternalAxiosRequestConfig) => {
  const url = config?.url ?? "";
  return url.includes("/auth/login") || url.includes("/auth/refresh");
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.accessToken);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (status !== 401 || !originalRequest || originalRequest._retry || shouldSkipRefresh(originalRequest)) {
      if (status === 401 && !shouldSkipRefresh(originalRequest)) {
        redirectToLoginAfterSessionExpiration();
      }
      return Promise.reject(error);
    }

    const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    if (!storedRefreshToken) {
      redirectToLoginAfterSessionExpiration();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = authService
        .refreshToken(storedRefreshToken)
        .then((res) => {
          if (!res.success || !res.data?.token) {
            throw new Error(res.message || SESSION_EXPIRED_MESSAGE);
          }

          localStorage.setItem(STORAGE_KEYS.accessToken, res.data.token);
          if (res.data.refreshToken) {
            localStorage.setItem(STORAGE_KEYS.refreshToken, res.data.refreshToken);
          }
          return res.data.token;
        })
        .catch((refreshError) => {
          redirectToLoginAfterSessionExpiration();
          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const newToken = await refreshPromise;
      if (newToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default api;
