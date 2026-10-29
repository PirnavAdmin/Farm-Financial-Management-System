import axios from 'axios';

// In dev mode, use relative URL ('') so requests go through Vite proxy at localhost:5173.
// This prevents browser CORS and 405 Method Not Allowed preflight errors.
const isDev = import.meta.env.DEV;
const rawBaseUrl = isDev ? '' : (import.meta.env.VITE_FARMERS_API_URL || import.meta.env.VITE_DASHBOARD_API_URL || 'https://lesser-chomp-stomp.ngrok-free.dev');
const BASE_URL = rawBaseUrl.replace(/\/+$/, '');
export const BUSINESS_API_BASE_URL = isDev ? '' : (import.meta.env.VITE_API_BASE_URL || BASE_URL).replace(/\/+$/, '');

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agriman_access_token') || sessionStorage.getItem('agriman_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let friendlyMessage = 'An unexpected error occurred. Please try again.';
    let validationErrors = null;

    if (error.response) {
      const { status, data } = error.response;

      if (data && data.errors && typeof data.errors === 'object') {
        validationErrors = data.errors;
        const messages = Object.values(data.errors).flat();
        friendlyMessage = messages.join(' ') || data.title || 'Validation error.';
      } else if (typeof data === 'string' && data.trim().length > 0) {
        friendlyMessage = data;
      } else if (data && data.title) {
        friendlyMessage = data.title;
      } else if (data && data.message) {
        friendlyMessage = data.message;
      } else if (status === 404) {
        friendlyMessage = `The API route or farmer record was not found (${error.config?.url || 'unknown route'}). Check that the business API host exposes this endpoint.`;
      } else if (status === 500) {
        friendlyMessage = 'Server error in ASP.NET Core Web API. Please check backend logs.';
      } else {
        friendlyMessage = `Request failed with status code ${status}.`;
      }

      error.friendlyMessage = friendlyMessage;
      error.validationErrors = validationErrors;
      error.statusCode = status;
    } else if (error.request) {
      error.friendlyMessage = 'Unable to connect to the backend API. Please verify that your ASP.NET Core API and ngrok tunnel are running, and check CORS settings.';
      error.statusCode = 0;
    } else {
      error.friendlyMessage = error.message;
    }

    if (import.meta.env.DEV) {
      console.error('[API Error]', error.friendlyMessage, error);
    }

    return Promise.reject(error);
  }
);

export default api;
