/**
 * Central axios instance. Every API call in the app goes through this,
 * so logging, error handling, and base config live in exactly one place.
 */

import axios from "axios";
import { clearAuthSession } from "./authSession";
import { getApiErrorMessage } from "./apiErrors";

const configuredBaseUrl = process.env.REACT_APP_API_BASE_URL;
const BASE_URL = (() => {
  const baseUrl = configuredBaseUrl || "http://localhost:8000/api";
  if (
    process.env.NODE_ENV !== "development"
    || !/^https?:\/\/(?:localhost|127\.0\.0\.1):8000(?:[/?#]|$)/i.test(baseUrl)
  ) {
    return baseUrl;
  }

  const parsedUrl = new URL(baseUrl);
  parsedUrl.protocol = "http:";
  parsedUrl.hostname = "localhost";
  return parsedUrl.toString().replace(/\/$/, "");
})();

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor — good place to attach auth tokens later, and to log
// every outgoing call during development.
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (process.env.NODE_ENV === "development") {
      console.log(`→ ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normalizes errors into one shape so components
// don't each need their own try/catch parsing logic.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
      return Promise.reject(error);
    }

    const isAuthenticationRequest = error.config?.url?.startsWith("auth/");
    if (
      error.response?.status === 401 &&
      !isAuthenticationRequest &&
      localStorage.getItem("accessToken")
    ) {
      clearAuthSession();
      if (window.location.pathname !== "/") {
        window.location.replace("/");
      }
    }

    const message = getApiErrorMessage(
      error.response?.data,
      error.message || "Something went wrong. Please try again."
    );

    if (process.env.NODE_ENV === "development") {
      console.error(`✗ ${error.config?.method?.toUpperCase()} ${error.config?.url} — ${message}`);
    }

    return Promise.reject({ ...error, message });
  }
);

export default api;
