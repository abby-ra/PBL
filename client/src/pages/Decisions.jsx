import { useState, useEffect } from 'react';
import { decisionsAPI } from '../services/api';

const STATUS_CONFIG = {
  APPROVED: { cls: 'badge-green', label: '✓ Approved' },
  REJECTED: { cls: 'badge-red', label: '✗ Rejected' },
  PENDING: { cls: 'badge-amber', label: '⏳ Pending' },
  UNDER_REVIEW: { cls: 'badge-violet', label: '🔍 Review' },
};

const RECOMMENDATION_CONFIG = {
  APPROVE: { cls: 'badge-green', label: '✓ Approve' },
  REJECT: { cls: 'badge-red', label: '✗ Reject' },
  REVIEW: { cls: 'badge-violet', label: '🔍 Review' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { cls: 'badge-muted', label: status };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

function RecommendationBadge({ rec }) {
  const cfg = RECOMMENDATION_CONFIG[rec] || { cls: 'badge-muted', label: rec };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

// ─── New Decision Form ────────────────────────
function NewDecisionModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ title: '', description: '', submitted_by: 'Admin User' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    if (!form.title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await decisionsAPI.analyze(form);
      onSubmit(res.decision);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        className="card fade-in"
        style={{ width: 520, maxWidth: '90vw', boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header">
          <div>
            <div className="card-title" style={{ fontSize: 15 }}>Submit Decision for AI Analysis</div>
            <div className="card-subtitle">AI will analyze against live SAP data and provide a recommendation</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="input-label">Decision Title *</label>
            <input
              className="input-field"
              placeholder="e.g. Increase safety stock for TechComp Asia components"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="input-label">Additional Context</label>
            <textarea
              className="input-field textarea-field"
              placeholder="Any additional context, constraints, or background…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="input-label">Submitted By</label>
            <input
              className="input-field"
              value={form.submitted_by}
              onChange={(e) => setForm({ ...form, submitted_by: e.target.value })}
            />
          </div>

          {error && <div className="alert alert-danger">⚠️ {error}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading || !form.title.trim()}
            >
              {loading ? <><div className="spinner" style={{ width: 13, height: 13 }} /> Analyzing…</> : '🤖 Analyze with AI'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Decision Detail Panel ────────────────────
function DecisionDetail({ decision, onAction, onClose }) {
  const [actionLoading, setActionLoading] = useState(null);

  async function takeAction(action) {
    setActionLoading(action);
    try {
      await decisionsAPI.takeAction(decision.id, {
        action,
        decided_by: 'Admin User',
        notes: '',
      });
      onAction(decision.id, action);
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  const canAct = ['PENDING', 'UNDER_REVIEW'].includes(decision.status);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        className="card fade-in"
        style={{ width: 600, maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header">
          <div style={{ flex: 1 }}>
            <div className="flex-center gap-8 mb-4">
              <StatusBadge status={decision.status} />
              <span className="text-sm text-muted">{decision.id}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {decision.title}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* AI Recommendation */}
        <div style={{
          background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 14,
          borderLeft: `3px solid ${decision.ai_recommendation === 'APPROVE' ? 'var(--accent-green)' : decision.ai_recommendation === 'REJECT' ? 'var(--accent-red)' : 'var(--accent-violet)'}`,
        }}>
          <div className="flex-between mb-8">
            <span className="text-sm text-muted">AI Recommendation</span>
            <RecommendationBadge rec={decision.ai_recommendation} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {decision.summary || decision.impact}
          </div>
        </div>

        {/* Confidence */}
        {(decision.confidence_score || decision.confidence) && (
          <div style={{ marginBottom: 14 }}>
            <div className="flex-between mb-4">
              <span className="text-sm text-muted">AI Confidence</span>
              <span className="text-mono" style={{ fontSize: 12, color: 'var(--accent-blue)' }}>
                {decision.confidence_score || decision.confidence}%
              </span>
            </div>
            <div className="confidence-bar">
              <div className="confidence-fill" style={{
                width: `${decision.confidence_score || decision.confidence}%`,
                background: 'var(--accent-blue)',
              }} />
            </div>
          </div>
        )}

        {/* Supporting factors */}
        {decision.supporting_factors?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div className="text-sm text-muted mb-8">Supporting Factors</div>
            {decision.supporting_factors.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <span style={{ color: 'var(--accent-green)' }}>✓</span> {f}
              </div>
            ))}
          </div>
        )}

        {/* Risk factors */}
        {decision.risk_factors?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div className="text-sm text-muted mb-8">Risk Factors</div>
            {decision.risk_factors.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <span style={{ color: 'var(--accent-amber)' }}>⚠</span> {f}
              </div>
            ))}
          </div>
        )}

        {/* Meta */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 14,
        }}>
          <div>
            <div className="text-sm text-muted mb-4">Category</div>
            <span className="badge badge-blue">{decision.category}</span>
          </div>
          <div>
            <div className="text-sm text-muted mb-4">Submitted By</div>
            <div style={{ fontSize: 13 }}>{decision.submitted_by || decision.decided_by || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-muted mb-4">Created</div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              {new Date(decision.created_at).toLocaleDateString()}
            </div>
          </div>
          {decision.time_sensitivity && (
            <div>
              <div className="text-sm text-muted mb-4">Urgency</div>
              <span className={`badge ${decision.time_sensitivity === 'URGENT' ? 'badge-red' : decision.time_sensitivity === 'STANDARD' ? 'badge-blue' : 'badge-muted'}`}>
                {decision.time_sensitivity}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {canAct && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-success"
              onClick={() => takeAction('approve')}
              disabled={!!actionLoading}
              style={{ flex: 1 }}
            >
              {actionLoading === 'approve' ? <><div className="spinner" style={{ width: 13, height: 13 }} /> Approving…</> : '✓ Approve'}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => takeAction('reject')}
              disabled={!!actionLoading}
              style={{ flex: 1 }}
            >
              {actionLoading === 'reject' ? <><div className="spinner" style={{ width: 13, height: 13 }} /> Rejecting…</> : '✗ Reject'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => takeAction('escalate')}
              disabled={!!actionLoading}
            >
              Escalate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Decisions page ──────────────────────
export default function Decisions() {
  const [decisions, setDecisions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadDecisions();
  }, []);

  async function loadDecisions() {
    setLoading(true);
    try {
      const res = await decisionsAPI.getAll();
      setDecisions(res.decisions || []);
      setSummary(res.summary);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleNewDecision(decision) {
    setDecisions((prev) => [decision, ...prev]);
  }

  function handleAction(id, action) {
    const statusMap = { approve: 'APPROVED', reject: 'REJECTED', escalate: 'UNDER_REVIEW' };
    setDecisions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: statusMap[action] } : d))
    );
    setSelectedDecision(null);
  }

  const filtered =
    statusFilter === 'ALL'
      ? decisions
      : decisions.filter((d) => d.status === statusFilter);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Decision Management</div>
          <div className="page-subtitle">AI-powered decision support with human oversight</div>
        </div>
        <div className="header-actions">
          {summary && (
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="badge badge-amber">{summary.pending} Pending</span>
              <span className="badge badge-green">{summary.approved} Approved</span>
              <span className="badge badge-violet">{summary.under_review} Review</span>
            </div>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewModal(true)}>
            + New Decision
          </button>
        </div>
      </div>

      <div className="page-body">
        {error && <div className="alert alert-danger">⚠️ {error}</div>}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${statusFilter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '35%', height: 10 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No decisions found</div>
            <div className="empty-state-desc">Create a new decision to get AI-powered analysis</div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Decision</th>
                  <th>Category</th>
                  <th>AI Recommendation</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedDecision(d)}
                  >
                    <td className="text-mono" style={{ fontSize: 11 }}>{d.id}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: 280 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.title}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>
                        {d.category?.replace('_', ' ')}
                      </span>
                    </td>
                    <td><RecommendationBadge rec={d.ai_recommendation} /></td>
                    <td className="text-mono" style={{ fontSize: 12 }}>
                      {d.confidence_score || d.confidence || '—'}%
                    </td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedDecision(d); }}>
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNewModal && (
        <NewDecisionModal
          onClose={() => setShowNewModal(false)}
          onSubmit={handleNewDecision}
        />
      )}

      {selectedDecision && (
        <DecisionDetail
          decision={selectedDecision}
          onAction={handleAction}
          onClose={() => setSelectedDecision(null)}
        />
      )}
    </>
  );
}
