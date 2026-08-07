/**
 * Central axios instance. Every API call in the app goes through this,
 * so logging, error handling, and base config live in exactly one place.
 */

import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor — good place to attach auth tokens later, and to log
// every outgoing call during development.
api.interceptors.request.use(
  (config) => {
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
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.detail ||
      error.message ||
      "Something went wrong. Please try again.";

    if (process.env.NODE_ENV === "development") {
      console.error(`✗ ${error.config?.method?.toUpperCase()} ${error.config?.url} — ${message}`);
    }

    return Promise.reject({ ...error, message });
  }
);

export default api;
