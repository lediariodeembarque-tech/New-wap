const API_BASE = 'http://localhost:3001/api';

const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('new-wap-token');
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }

  return response.status === 204 ? null : response.json();
};

export const loginUser = async (email, password) => {
  const data = await apiFetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
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
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return data.day;
};

export const uploadImage = async (file) => {
  const token = localStorage.getItem('new-wap-token');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Upload failed');
  }

  return response.json();
};
