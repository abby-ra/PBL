import { useState, useEffect } from 'react';
import { historyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TABS = ['Overview', 'Chat History', 'Decisions', 'Predictions', 'Activity Log'];

function StatBox({ label, value, color, icon }) {
  return (
    <div className="kpi-card" style={{ '--accent-color': color }}>
      <div className="kpi-icon" style={{ background: `${color}18`, fontSize: 18 }}>{icon}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ fontSize: 28 }}>{value}</div>
    </div>
  );
}

function TimeAgo({ isoString }) {
  const date = new Date(isoString);
  return (
    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
      {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

// ── Overview Tab ──────────────────────────────
function OverviewTab({ stats, user }) {
  if (!stats) return null;
  return (
    <div>
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        👤 Logged in as <strong>{user?.name}</strong> ({user?.email}) ·
        Role: <span className={`badge ${user?.role === 'admin' ? 'badge-violet' : 'badge-blue'}`}>{user?.role}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <StatBox label="Chat Messages Sent"   value={stats.total_chat_messages} color="var(--accent-blue)"   icon="💬" />
        <StatBox label="Decisions Submitted"  value={stats.total_decisions}     color="var(--accent-violet)" icon="📋" />
        <StatBox label="Decisions Approved"   value={stats.approved_decisions}  color="var(--accent-green)"  icon="✅" />
        <StatBox label="Predictions Viewed"   value={stats.predictions_viewed}  color="var(--accent-amber)"  icon="📈" />
      </div>
    </div>
  );
}

// ── Chat History Tab ──────────────────────────
function ChatTab({ data }) {
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMsgs, setSessionMsgs] = useState([]);
  const [loadingSession, setLoadingSession] = useState(false);

  async function loadSession(sessionId) {
    setLoadingSession(true);
    setSelectedSession(sessionId);
    try {
      const res = await historyAPI.getSessionMessages(sessionId);
      setSessionMsgs(res.messages || []);
    } catch (e) {
      setSessionMsgs([]);
    } finally {
      setLoadingSession(false);
    }
  }

  if (!data) return <LoadSkeleton />;

  const sessions = {};
  data.messages?.forEach((m) => {
    if (!sessions[m.session_id]) sessions[m.session_id] = [];
    sessions[m.session_id].push(m);
  });

  const sessionList = Object.entries(sessions).sort(
    (a, b) => new Date(b[1][0].created_at) - new Date(a[1][0].created_at)
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, height: 500 }}>
      {/* Session list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {sessionList.length} Sessions
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sessionList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <div className="empty-state-title">No chats yet</div>
              <div className="empty-state-desc">Start chatting with the AI Assistant</div>
            </div>
          ) : sessionList.map(([sid, msgs]) => (
            <div
              key={sid}
              onClick={() => loadSession(sid)}
              style={{
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                background: selectedSession === sid ? 'var(--accent-blue-dim)' : 'transparent',
                borderLeft: selectedSession === sid ? '3px solid var(--accent-blue)' : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                Session {sid.slice(-8)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                {msgs.length} messages
              </div>
              <TimeAgo isoString={msgs[0].created_at} />
            </div>
          ))}
        </div>
      </div>

      {/* Messages panel */}
      <div className="card" style={{ overflowY: 'auto', padding: 16 }}>
        {!selectedSession ? (
          <div className="empty-state">
            <div className="empty-state-icon">👈</div>
            <div className="empty-state-title">Select a session</div>
            <div className="empty-state-desc">Click a session to view the conversation</div>
          </div>
        ) : loadingSession ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessionMsgs.map((m) => (
              <div key={m.id} style={{
                display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                gap: 8, alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: m.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                }}>
                  {m.role === 'user' ? '👤' : '🤖'}
                </div>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{
                    background: m.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    padding: '8px 12px',
                    fontSize: 12.5, color: m.role === 'user' ? 'white' : 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}>
                    {m.content.length > 300 ? m.content.slice(0, 300) + '…' : m.content}
                  </div>
                  <div style={{ marginTop: 3 }}><TimeAgo isoString={m.created_at} /></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Decisions Tab ─────────────────────────────
function DecisionsTab({ data }) {
  if (!data) return <LoadSkeleton />;
  if (!data.decisions?.length) return <EmptyState icon="📋" title="No decisions yet" desc="Submit a decision from the Decisions page" />;

  return (
    <div className="card" style={{ padding: 0 }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Ref</th><th>Title</th><th>Category</th><th>AI Recommendation</th><th>Confidence</th><th>Status</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.decisions.map((d) => (
            <tr key={d.id}>
              <td className="text-mono" style={{ fontSize: 11 }}>{d.decision_ref || '—'}</td>
              <td style={{ color: 'var(--text-primary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.title}
              </td>
              <td><span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{d.category}</span></td>
              <td>
                <span className={`badge ${d.ai_recommendation === 'APPROVE' ? 'badge-green' : d.ai_recommendation === 'REJECT' ? 'badge-red' : 'badge-violet'}`}>
                  {d.ai_recommendation}
                </span>
              </td>
              <td className="text-mono" style={{ fontSize: 12 }}>{d.confidence_score?.toFixed(1)}%</td>
              <td>
                <span className={`badge ${d.status === 'APPROVED' ? 'badge-green' : d.status === 'REJECTED' ? 'badge-red' : 'badge-amber'}`}>
                  {d.status}
                </span>
              </td>
              <td><TimeAgo isoString={d.created_at} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Predictions Tab ───────────────────────────
function PredictionsTab({ data }) {
  if (!data) return <LoadSkeleton />;
  if (!data.predictions?.length) return <EmptyState icon="📈" title="No predictions viewed yet" desc="Visit the Predictions page and click Explain" />;

  return (
    <div className="card" style={{ padding: 0 }}>
      <table className="data-table">
        <thead>
          <tr><th>Prediction</th><th>Action</th><th>Risk</th><th>Confidence</th><th>Date</th></tr>
        </thead>
        <tbody>
          {data.predictions.map((p) => (
            <tr key={p.id}>
              <td style={{ color: 'var(--text-primary)' }}>{p.title}</td>
              <td><span className="badge badge-blue">{p.action}</span></td>
              <td>
                <span className={`badge ${p.risk_level === 'HIGH' ? 'badge-red' : p.risk_level === 'MEDIUM' ? 'badge-amber' : 'badge-green'}`}>
                  {p.risk_level}
                </span>
              </td>
              <td className="text-mono" style={{ fontSize: 12 }}>{p.confidence?.toFixed(1)}%</td>
              <td><TimeAgo isoString={p.created_at} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Activity Log Tab ──────────────────────────
function ActivityTab({ data }) {
  if (!data) return <LoadSkeleton />;
  if (!data.activity?.length) return <EmptyState icon="📜" title="No activity yet" desc="Actions like login and decisions will appear here" />;

  const actionIcons = { login: '🔑', logout: '👋', register: '✨', decision_submitted: '📋', default: '⚡' };

  return (
    <div className="card" style={{ padding: 0 }}>
      <table className="data-table">
        <thead>
          <tr><th>Action</th><th>Detail</th><th>Timestamp</th></tr>
        </thead>
        <tbody>
          {data.activity.map((a) => (
            <tr key={a.id}>
              <td>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {actionIcons[a.action] || actionIcons.default}
                  <span className="badge badge-muted">{a.action}</span>
                </span>
              </td>
              <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.detail || '—'}</td>
              <td><TimeAgo isoString={a.created_at} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main History Page ─────────────────────────
export default function History() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats]         = useState(null);
  const [chatData, setChatData]   = useState(null);
  const [decisionData, setDecisionData] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => { loadTab(activeTab); }, [activeTab]);

  async function loadTab(tab) {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'Overview' && !stats) {
        const res = await historyAPI.getStats();
        setStats(res.stats);
      } else if (tab === 'Chat History' && !chatData) {
        const res = await historyAPI.getChatHistory();
        setChatData(res);
      } else if (tab === 'Decisions' && !decisionData) {
        const res = await historyAPI.getDecisionHistory();
        setDecisionData(res);
      } else if (tab === 'Predictions' && !predictionData) {
        const res = await historyAPI.getPredictionHistory();
        setPredictionData(res);
      } else if (tab === 'Activity Log' && !activityData) {
        const res = await historyAPI.getActivityLog();
        setActivityData(res);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Interaction History</div>
          <div className="page-subtitle">All your stored data from the database</div>
        </div>
        <span className="badge badge-green">● SQLite Connected</span>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px', fontSize: 13, fontWeight: 500,
                background: 'none', border: 'none', borderBottom: '2px solid',
                borderColor: activeTab === tab ? 'var(--accent-blue)' : 'transparent',
                color: activeTab === tab ? 'var(--accent-blue)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-danger">⚠️ {error}</div>}
        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>}

        {!loading && (
          <>
            {activeTab === 'Overview'     && <OverviewTab stats={stats} user={user} />}
            {activeTab === 'Chat History' && <ChatTab data={chatData} />}
            {activeTab === 'Decisions'    && <DecisionsTab data={decisionData} />}
            {activeTab === 'Predictions'  && <PredictionsTab data={predictionData} />}
            {activeTab === 'Activity Log' && <ActivityTab data={activityData} />}
          </>
        )}
      </div>
    </>
  );
}

function LoadSkeleton() {
  return (
    <div className="card">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <div className="skeleton" style={{ width: '100%', height: 12, marginBottom: 6 }} />
          <div className="skeleton" style={{ width: '60%', height: 10 }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-desc">{desc}</div>
    </div>
  );
}