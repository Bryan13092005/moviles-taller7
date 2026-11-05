import axios from 'axios';

export const apiClient = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
