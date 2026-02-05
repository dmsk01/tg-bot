import axios, { AxiosError } from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message = (error.response?.data as { error?: string })?.error || error.message;
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;

export const setAuthHeader = (token: string | null) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};
