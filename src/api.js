const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
const TOKEN_KEY = 'new-wap-token';
const USER_KEY = 'new-wap-user';

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) clearSession();
    const message = typeof body === 'object' && body && body.message
      ? body.message
      : typeof body === 'string' && body.trim() ? body : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body;
};

const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
    });
    return await parseResponse(response);
  } catch (error) {
    if (error instanceof TypeError) throw new Error(`Não foi possível conectar à API em ${API_BASE}. Inicie o backend na porta 3001.`);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  const data = await apiFetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: String(email || '').trim(), password: String(password || '') })
  });
  if (!data?.token || !data?.user) throw new Error('Resposta de login inválida.');
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
};

export const getUserProfile = async () => {
  const data = await apiFetch('/me');
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
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
  const token = localStorage.getItem(TOKEN_KEY);
  const form = new FormData();
  form.append('file', file);
  try {
    const response = await fetch(`${API_BASE}/upload`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
    return await parseResponse(response);
  } catch (error) {
    if (error instanceof TypeError) throw new Error(`Não foi possível conectar à API em ${API_BASE}.`);
    throw error;
  }
};
