import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    if (!error.response) {
      error.normalizedMessage = 'Network error. Check your connection and try again.';
    } else if (data instanceof Blob) {
      error.normalizedMessage = 'Something went wrong. Please try again.';
    } else {
      error.normalizedMessage = data?.message || 'Something went wrong. Please try again.';
      error.fieldErrors = {};
      if (Array.isArray(data?.errors)) {
        data.errors.forEach((item) => {
          if (item.field) error.fieldErrors[item.field] = item.message;
        });
      }
    }

    const url = error.config?.url || '';
    const publicAuth = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']
      .some((path) => url.includes(path));

    if (error.response?.status === 401 && !publicAuth && !error.config?.skipAuthRedirect) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    return Promise.reject(error);
  }
);

export default api;
