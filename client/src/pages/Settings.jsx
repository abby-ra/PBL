import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

// ─── Reusable components ──────────────────────
function Section({ title, icon, children }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
        marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>{icon}</span> {title}
      </div>
      {children}
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, padding: '13px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{description}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
      background: checked ? 'var(--accent-blue)' : 'var(--bg-elevated)',
      border: `1px solid ${checked ? 'var(--accent-blue)' : 'var(--border)'}`,
      position: 'relative', transition: 'all 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: checked ? 22 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: checked ? 'white' : 'var(--text-muted)',
        transition: 'left 0.2s',
      }} />
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select className="input-field" style={{ width: 180 }} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Sign Out Confirmation Modal ───────────────
function SignOutModal({ onCancel, onConfirm, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onCancel}>
      <div className="card fade-in" style={{ width: 380, boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}></div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            Sign out?
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            You'll need to sign back in to access the dashboard.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Signing out…</> : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#3b82f6,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
];

const THEME_OPTIONS = [
  { value: 'dark',   label: 'Dark' },
  { value: 'light',  label: 'Light' },
  { value: 'system', label: 'System' },
];

export default function Settings() {
  // ── Auth (real logout) ──
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ── Theme ──
  const { theme, setTheme } = useTheme();

  // ── Profile ──
  const [name, setName]               = useState(user?.name || 'Admin User');
  const [email, setEmail]             = useState(user?.email || 'admin@company.com');
  const [role]                        = useState(user?.role || 'viewer');
  const [avatarColor, setAvatarColor] = useState(0);
  const [editingProfile, setEditingProfile] = useState(false);

  // ── Appearance ──
  const [fontSize, setFontSize]             = useState('medium');
  const [compactMode, setCompactMode]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Notifications ──
  const [notifDecisions, setNotifDecisions]   = useState(true);
  const [notifPredictions, setNotifPredictions] = useState(true);
  const [notifAlerts, setNotifAlerts]         = useState(true);
  const [notifEmail, setNotifEmail]           = useState(false);
  const [notifSound, setNotifSound]           = useState(false);

  // ── Dashboard prefs ──
  const [defaultPage, setDefaultPage]       = useState('dashboard');
  const [autoRefresh, setAutoRefresh]       = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('30');
  const [currency, setCurrency]             = useState('usd');
  const [dateFormat, setDateFormat]         = useState('dd/mm/yyyy');

  // ── AI prefs ──
  const [aiSuggestions, setAiSuggestions]       = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState('70');
  const [language, setLanguage]               = useState('en');

  // ── UI state ──
  const [showSignOut, setShowSignOut] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [saved, setSaved]             = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  // ── REAL LOGOUT ──────────────────────────────
  async function handleSignOut() {
    setLogoutLoading(true);
    try {
      await authAPI.logout(); // tells backend to log the activity
    } catch (_) {
      // ignore — still log out client side even if request fails
    } finally {
      logout();              // clears token + user from AuthContext + localStorage
      navigate('/login');    // redirect to login page
    }
  }

  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Manage your profile, appearance, and preferences</div>
        </div>
        <div className="header-actions">
          {saved && <span className="badge badge-green">✓ Settings saved!</span>}
          <button className="btn btn-primary btn-sm" onClick={save}>
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 720 }}>

        {/* ── Profile ── */}
        <Section title="Profile" icon="👤">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '4px 0 16px', borderBottom: '1px solid var(--border)', marginBottom: 4,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: AVATAR_COLORS[avatarColor],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{email}</div>
              <span className={`badge ${role === 'admin' ? 'badge-violet' : 'badge-blue'}`} style={{ marginTop: 4, display: 'inline-flex' }}>
                {role}
              </span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditingProfile(!editingProfile)}>
              {editingProfile ? 'Done' : ' Edit'}
            </button>
          </div>

          {editingProfile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
              <div>
                <label className="input-label">Display Name</label>
                <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Avatar Color</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {AVATAR_COLORS.map((c, i) => (
                    <div key={i} onClick={() => setAvatarColor(i)} style={{
                      width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: avatarColor === i ? '2px solid white' : '2px solid transparent',
                      transform: avatarColor === i ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.15s',
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <SettingRow label="Change Password" description="Update your account password">
            <button className="btn btn-secondary btn-sm">Change →</button>
          </SettingRow>
          <SettingRow label="Two-Factor Authentication" description="Add extra security to your account">
            <Toggle checked={false} onChange={() => {}} />
          </SettingRow>
        </Section>

        {/* ── Appearance ── */}
        <Section title="Appearance">
          <SettingRow label="Theme" description={`Currently: ${theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'}`}>
            <div style={{ display: 'flex', gap: 6 }}>
              {THEME_OPTIONS.map((t) => (
                <button key={t.value} className={`btn btn-sm ${theme === t.value ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTheme(t.value)}>
                  {t.label}
                </button>
              ))}
            </div>
          </SettingRow>
          <SettingRow label="Font Size" description="Adjust text size across the app">
            <Select value={fontSize} onChange={setFontSize} options={[
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium (Default)' },
              { value: 'large', label: 'Large' },
            ]} />
          </SettingRow>
          <SettingRow label="Compact Mode" description="Reduce spacing for a denser layout">
            <Toggle checked={compactMode} onChange={setCompactMode} />
          </SettingRow>
          <SettingRow label="Collapsed Sidebar" description="Start with sidebar minimized">
            <Toggle checked={sidebarCollapsed} onChange={setSidebarCollapsed} />
          </SettingRow>
        </Section>

        {/* ── Notifications ── */}
        <Section title="Notifications" >
          <SettingRow label="Decision Alerts" description="Notify when a decision needs review">
            <Toggle checked={notifDecisions} onChange={setNotifDecisions} />
          </SettingRow>
          <SettingRow label="Prediction Updates" description="Notify when new AI predictions are ready">
            <Toggle checked={notifPredictions} onChange={setNotifPredictions} />
          </SettingRow>
          <SettingRow label="Risk Alerts" description="Notify on HIGH risk issues">
            <Toggle checked={notifAlerts} onChange={setNotifAlerts} />
          </SettingRow>
          <SettingRow label="Email Notifications" description="Send alerts to your email address">
            <Toggle checked={notifEmail} onChange={setNotifEmail} />
          </SettingRow>
          <SettingRow label="Sound Alerts" description="Play sound for important notifications">
            <Toggle checked={notifSound} onChange={setNotifSound} />
          </SettingRow>
        </Section>

        {/* ── Dashboard Preferences ── */}
        <Section title="Dashboard Preferences">
          <SettingRow label="Default Landing Page" description="Page shown when you log in">
            <Select value={defaultPage} onChange={setDefaultPage} options={[
              { value: 'dashboard', label: 'Dashboard' },
              { value: 'chat', label: 'AI Assistant' },
              { value: 'analytics', label: 'Analytics' },
              { value: 'decisions', label: 'Decisions' },
            ]} />
          </SettingRow>
          <SettingRow label="Auto Refresh Data" description="Automatically refresh dashboard data">
            <Toggle checked={autoRefresh} onChange={setAutoRefresh} />
          </SettingRow>
          {autoRefresh && (
            <SettingRow label="Refresh Interval" description="How often to refresh">
              <Select value={refreshInterval} onChange={setRefreshInterval} options={[
                { value: '15', label: 'Every 15 seconds' },
                { value: '30', label: 'Every 30 seconds' },
                { value: '60', label: 'Every minute' },
                { value: '300', label: 'Every 5 minutes' },
              ]} />
            </SettingRow>
          )}
          <SettingRow label="Currency Display" description="Currency format for financial figures">
            <Select value={currency} onChange={setCurrency} options={[
              { value: 'usd', label: '$ USD' },
              { value: 'eur', label: '€ EUR' },
              { value: 'gbp', label: '£ GBP' },
              { value: 'inr', label: '₹ INR' },
            ]} />
          </SettingRow>
          <SettingRow label="Date Format" description="How dates are shown across the app">
            <Select value={dateFormat} onChange={setDateFormat} options={[
              { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY' },
              { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY' },
              { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD' },
            ]} />
          </SettingRow>
        </Section>

        {/* ── AI Preferences ── */}
        <Section title="AI Preferences">
          <SettingRow label="AI Suggestions" description="Show suggested questions in AI Assistant">
            <Toggle checked={aiSuggestions} onChange={setAiSuggestions} />
          </SettingRow>
          <SettingRow label="Minimum Confidence Threshold" description="Only show decisions above this level">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="range" min="50" max="95" step="5"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(e.target.value)}
                style={{ width: 100, accentColor: 'var(--accent-blue)' }}
              />
              <span className="text-mono" style={{ fontSize: 13, color: 'var(--accent-blue)', width: 36 }}>
                {confidenceThreshold}%
              </span>
            </div>
          </SettingRow>
          <SettingRow label="AI Response Language" description="Language for AI-generated responses">
            <Select value={language} onChange={setLanguage} options={[
              { value: 'en', label: '🇺🇸 English' },
              { value: 'de', label: '🇩🇪 German' },
              { value: 'fr', label: '🇫🇷 French' },
              { value: 'es', label: '🇪🇸 Spanish' },
              { value: 'ja', label: '🇯🇵 Japanese' },
            ]} />
          </SettingRow>
        </Section>

        {/* ── Account ── */}
        <Section title="Account" icon="">
          <SettingRow label="Signed in as" description={`${user?.email || email} · Role: ${role}`}>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setShowSignOut(true)}
            >
               Sign Out
            </button>
          </SettingRow>
          <SettingRow label="Export My Data" description="Download your decisions and preferences">
            <button className="btn btn-secondary btn-sm">Export →</button>
          </SettingRow>
          <SettingRow label="Delete Account" description="Permanently remove your account and all data">
            <button className="btn btn-secondary btn-sm"
              style={{ color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.3)' }}>
              Delete
            </button>
          </SettingRow>
        </Section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingBottom: 32 }}>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>Reset to Defaults</button>
          <button className="btn btn-primary" onClick={save}>{saved ? '✓ All Saved' : 'Save All Changes'}</button>
        </div>
      </div>

      {/* Sign Out Modal */}
      {showSignOut && (
        <SignOutModal
          onCancel={() => setShowSignOut(false)}
          onConfirm={handleSignOut}
          loading={logoutLoading}
        />
      )}
    </>
  );
}