/**
 * SAP Enterprise AI — Frontend API Service
 * All backend API calls go through here.
 */

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// ── Core fetch with auth token ────────────────
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('sap_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // Auto redirect to login on 401
  if (response.status === 401) {
    localStorage.removeItem('sap_token');
    localStorage.removeItem('sap_user');
    window.location.href = '/login';
    return;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// ── Auth API ──────────────────────────────────
export const authAPI = {
  register: (data) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (email, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => apiFetch('/auth/logout', { method: 'POST' }),

  getMe: () => apiFetch('/auth/me'),

  getAllUsers: () => apiFetch('/auth/users'),
};

// ── History API ───────────────────────────────
export const historyAPI = {
  getStats:           () => apiFetch('/history/stats'),
  getChatHistory:     () => apiFetch('/history/chat'),
  getChatSessions:    () => apiFetch('/history/chat/sessions'),
  getSessionMessages: (sessionId) => apiFetch(`/history/chat/sessions/${sessionId}`),
  getDecisionHistory: () => apiFetch('/history/decisions'),
  getPredictionHistory: () => apiFetch('/history/predictions'),
  getActivityLog:     () => apiFetch('/history/activity'),
};

// ── Chat API ──────────────────────────────────
export const chatAPI = {
  sendMessage: (message, history = []) =>
    apiFetch('/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  getSuggestedQuestions: () => apiFetch('/chat/suggested-questions'),
};

// ── Analytics API ─────────────────────────────
export const analyticsAPI = {
  getKPIs:        () => apiFetch('/analytics/kpis'),
  getOverview:    () => apiFetch('/analytics/overview'),
  getFinancial:   (groupBy = 'quarter') => apiFetch(`/analytics/financial?group_by=${groupBy}`),
  getSupplyChain: () => apiFetch('/analytics/supply-chain'),
  getSales:       () => apiFetch('/analytics/sales'),
  getHR:          () => apiFetch('/analytics/hr'),
};

// ── Predictions API ───────────────────────────
export const predictionsAPI = {
  getAll:          () => apiFetch('/predictions'),
  getById:         (id) => apiFetch(`/predictions/${id}`),
  getNarrative:    (id) => apiFetch(`/predictions/${id}/narrative`, { method: 'POST' }),
  getRiskSummary:  () => apiFetch('/predictions/summary/risks'),
};

// ── Decisions API ─────────────────────────────
export const decisionsAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status)   params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    const query = params.toString() ? `?${params}` : '';
    return apiFetch(`/decisions${query}`);
  },
  getById:    (id) => apiFetch(`/decisions/${id}`),
  analyze:    (data) => apiFetch('/decisions/analyze', { method: 'POST', body: JSON.stringify(data) }),
  takeAction: (id, action) => apiFetch(`/decisions/${id}/action`, { method: 'POST', body: JSON.stringify(action) }),
  getAnalytics: () => apiFetch('/decisions/analytics/summary'),
};

export default { authAPI, historyAPI, chatAPI, analyticsAPI, predictionsAPI, decisionsAPI };