const API_BASE = import.meta.env.VITE_API_URL || '/api';

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === 'object' && body && body.message
        ? body.message
        : typeof body === 'string'
          ? body
          : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body;
};

const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('new-wap-token');
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  return parseResponse(response);
};

export const loginUser = async (email, password) => {
  const data = await apiFetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: String(email).trim(), password })
  });

  localStorage.setItem('new-wap-token', data.token);
  localStorage.setItem('new-wap-user', JSON.stringify(data.user));
  return data;
};

export const getUserProfile = async () => {
  const data = await apiFetch('/me');
  localStorage.setItem('new-wap-user', JSON.stringify(data.user));
  return data.user;
};

export const getDays = async () => {
  const data = await apiFetch('/days');
  return data.days || {};
};

export const saveDay = async (date, payload) => {
  const data = await apiFetch(`/days/${encodeURIComponent(date)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return data.day;
};

export const uploadImage = async (file) => {
  const token = localStorage.getItem('new-wap-token');
  const form = new FormData();
  form.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form
  });

  return parseResponse(response);
};
