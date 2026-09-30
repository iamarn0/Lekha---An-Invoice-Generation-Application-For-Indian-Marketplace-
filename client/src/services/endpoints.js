import api from './api';

export const authApi = {
  me: () => api.get('/auth/me', { skipAuthRedirect: true }),
  login: (body) => api.post('/auth/login', body),
  register: (body) => api.post('/auth/register', body),
  logout: () => api.post('/auth/logout'),
  forgot: (email) => api.post('/auth/forgot-password', { email }),
  reset: (body) => api.post('/auth/reset-password', body),
};

export const clientApi = {
  list: (params) => api.get('/clients', { params }),
  get: (id) => api.get(`/clients/${id}`),
  create: (body) => api.post('/clients', body),
  update: (id, body) => api.put(`/clients/${id}`, body),
  remove: (id) => api.delete(`/clients/${id}`),
};

export const invoiceApi = {
  list: (params) => api.get('/invoices', { params }),
  get: (id) => api.get(`/invoices/${id}`),
  create: (body) => api.post('/invoices', body),
  update: (id, body) => api.put(`/invoices/${id}`, body),
  remove: (id) => api.delete(`/invoices/${id}`),
  duplicate: (id) => api.post(`/invoices/${id}/duplicate`),
  convert: (id) => api.post(`/invoices/${id}/convert`),
  setStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
  send: (id) => api.post(`/invoices/${id}/send`),
  pdf: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};

export async function downloadInvoicePdf(invoice) {
  try {
    const response = await invoiceApi.pdf(invoice._id);
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${invoice.invoiceNumber}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      try {
        error.normalizedMessage = JSON.parse(text).message;
      } catch {
        error.normalizedMessage = 'The PDF could not be downloaded.';
      }
    }
    throw error;
  }
}

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  overview: (months) => api.get('/analytics', { params: { months } }),
};

export const activityApi = {
  list: (params) => api.get('/activity', { params }),
};

export const searchApi = {
  query: (q) => api.get('/search', { params: { q } }),
};

export const settingsApi = {
  update: (body) => api.put('/settings', body),
  password: (body) => api.put('/settings/password', body),
  logo: (file) => {
    const form = new FormData();
    form.append('logo', file);
    return api.post('/settings/logo', form);
  },
  removeLogo: () => api.delete('/settings/logo'),
};

export const contactApi = {
  submit: (body) => api.post('/contact', body),
};
