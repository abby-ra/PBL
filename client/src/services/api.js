/**
 * SAP Enterprise AI — Frontend API Service
 * All backend API calls go through here.
 * Set REACT_APP_API_URL in your .env
 */

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// ─────────────────────────────────────────────
// CORE FETCH HELPER
// ─────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// ─────────────────────────────────────────────
// CHAT API
// ─────────────────────────────────────────────
export const chatAPI = {
  /**
   * Send a message to the AI assistant
   * @param {string} message - User's message
   * @param {Array} history - Previous messages [{role, content}]
   * @returns {Promise<{response: string, data_sources_used: string[]}>}
   */
  sendMessage: (message, history = []) =>
    apiFetch("/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),

  /** Get suggested quick-action questions */
  getSuggestedQuestions: () => apiFetch("/chat/suggested-questions"),
};

// ─────────────────────────────────────────────
// ANALYTICS API
// ─────────────────────────────────────────────
export const analyticsAPI = {
  /** Get all KPI cards for dashboard */
  getKPIs: () => apiFetch("/analytics/kpis"),

  /** Get full overview (used on initial Dashboard load) */
  getOverview: () => apiFetch("/analytics/overview"),

  /** Get financial analytics, optionally grouped by day/week/month/quarter */
  getFinancial: (groupBy = "quarter") =>
    apiFetch(`/analytics/financial?group_by=${groupBy}`),

  /** Get supply chain analytics */
  getSupplyChain: () => apiFetch("/analytics/supply-chain"),

  /** Get sales analytics */
  getSales: () => apiFetch("/analytics/sales"),

  /** Get HR analytics */
  getHR: () => apiFetch("/analytics/hr"),
};

// ─────────────────────────────────────────────
// PREDICTIONS API
// ─────────────────────────────────────────────
export const predictionsAPI = {
  /** Get all predictions */
  getAll: () => apiFetch("/predictions"),

  /** Get single prediction by ID */
  getById: (id) => apiFetch(`/predictions/${id}`),

  /** Generate AI narrative explanation for a prediction */
  getNarrative: (id) =>
    apiFetch(`/predictions/${id}/narrative`, { method: "POST" }),

  /** Get risk summary (high/medium/low breakdown) */
  getRiskSummary: () => apiFetch("/predictions/summary/risks"),
};

// ─────────────────────────────────────────────
// DECISIONS API
// ─────────────────────────────────────────────
export const decisionsAPI = {
  /**
   * Get all decisions, with optional filters
   * @param {Object} filters - { status, category }
   */
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.category) params.append("category", filters.category);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch(`/decisions${query}`);
  },

  /** Get single decision */
  getById: (id) => apiFetch(`/decisions/${id}`),

  /**
   * Submit a new decision for AI analysis
   * @param {Object} decision - { title, description, submitted_by }
   */
  analyze: (decision) =>
    apiFetch("/decisions/analyze", {
      method: "POST",
      body: JSON.stringify(decision),
    }),

  /**
   * Approve / reject / escalate a decision
   * @param {string} id
   * @param {Object} action - { action: "approve"|"reject"|"escalate", decided_by, notes }
   */
  takeAction: (id, action) =>
    apiFetch(`/decisions/${id}/action`, {
      method: "POST",
      body: JSON.stringify(action),
    }),

  /** Get analytics summary for the decisions page */
  getAnalytics: () => apiFetch("/decisions/analytics/summary"),
};

export default { chatAPI, analyticsAPI, predictionsAPI, decisionsAPI };
