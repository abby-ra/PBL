import { useState } from 'react';
import { useTheme } from '../context/Themecontext';

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
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{description}</div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        background: checked ? 'var(--accent-blue)' : 'var(--bg-elevated)',
        border: `1px solid ${checked ? 'var(--accent-blue)' : 'var(--border)'}`,
        position: 'relative', transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: checked ? 22 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: checked ? 'white' : 'var(--text-muted)',
        transition: 'left 0.2s',
      }} />
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      className="input-field"
      style={{ width: 180 }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Sign Out Modal ───────────────────────────
function SignOutModal({ onCancel, onConfirm }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onCancel}>
      <div
        className="card fade-in"
        style={{ width: 380, boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            Sign out?
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            You'll need to sign back in to access the dashboard.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm}>
            Sign Out
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

export default function Settings() {
  // ── Theme (real — connected to ThemeContext) ──
  const { theme, setTheme } = useTheme();

  // ── Profile ──
  const [name, setName] = useState('Admin User');
  const [email, setEmail] = useState('admin@company.com');
  const [role, setRole] = useState('AI Engineer');
  const [avatarColor, setAvatarColor] = useState(0);
  const [editingProfile, setEditingProfile] = useState(false);

  // ── Appearance ──
  const [fontSize, setFontSize] = useState('medium');
  const [compactMode, setCompactMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Notifications ──
  const [notifDecisions, setNotifDecisions] = useState(true);
  const [notifPredictions, setNotifPredictions] = useState(true);
  const [notifAlerts, setNotifAlerts] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifSound, setNotifSound] = useState(false);

  // ── Dashboard prefs ──
  const [defaultPage, setDefaultPage] = useState('dashboard');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('30');
  const [currency, setCurrency] = useState('usd');
  const [dateFormat, setDateFormat] = useState('dd/mm/yyyy');

  // ── AI prefs ──
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState('70');
  const [language, setLanguage] = useState('en');

  // ── UI state ──
  const [showSignOut, setShowSignOut] = useState(false);
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleSignOut() {
    setShowSignOut(false);
    alert('Signed out. Redirecting to login…');
    // window.location.href = '/login';
  }

  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  // Theme preview colors for the buttons
  const themeOptions = [
    {
      value: 'dark',
      label: ' Dark',
      preview: { bg: '#0a0c10', surface: '#111318', text: '#e8eaf0' },
    },
    {
      value: 'light',
      label: ' Light',
      preview: { bg: '#f0f2f7', surface: '#ffffff', text: '#0f1623' },
    },
    {
      value: 'system',
      label: ' System',
      preview: { bg: 'linear-gradient(135deg,#0a0c10 50%,#f0f2f7 50%)', surface: '#888', text: '#888' },
    },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Manage your profile, appearance, and preferences</div>
        </div>
        <div className="header-actions">
          {saved && <span className="badge badge-green">✓ Saved!</span>}
          <button className="btn btn-primary btn-sm" onClick={save}>
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 720 }}>

        {/* ── Profile ── */}
        <Section title="Profile">
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
              <div style={{ fontSize: 12, color: 'var(--accent-blue)', marginTop: 2 }}>{role}</div>
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
                <label className="input-label">Role</label>
                <input className="input-field" value={role} onChange={(e) => setRole(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Avatar Color</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {AVATAR_COLORS.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => setAvatarColor(i)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c,
                        cursor: 'pointer',
                        border: avatarColor === i ? '3px solid var(--accent-blue)' : '2px solid transparent',
                        transform: avatarColor === i ? 'scale(1.2)' : 'scale(1)',
                        transition: 'all 0.15s',
                      }}
                    />
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
        <Section title="Appearance" >

          {/* Theme picker with visual previews */}
          <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
              Theme
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Choose your preferred color theme — changes apply instantly
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {themeOptions.map((t) => (
                <div
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  style={{
                    flex: 1, cursor: 'pointer', borderRadius: 10,
                    border: theme === t.value
                      ? '2px solid var(--accent-blue)'
                      : '2px solid var(--border)',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                    boxShadow: theme === t.value ? '0 0 0 3px var(--accent-blue-dim)' : 'none',
                  }}
                >
                  {/* Mini UI preview */}
                  <div style={{
                    background: t.preview.bg,
                    padding: '10px 10px 6px',
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}>
                    <div style={{
                      background: t.preview.surface,
                      borderRadius: 4, padding: '5px 7px',
                      display: 'flex', gap: 4, alignItems: 'center',
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                      <div style={{ width: 30, height: 4, borderRadius: 2, background: t.preview.text, opacity: 0.3 }} />
                    </div>
                    <div style={{
                      background: t.preview.surface,
                      borderRadius: 4, padding: 5,
                      display: 'flex', flexDirection: 'column', gap: 3,
                    }}>
                      <div style={{ width: '80%', height: 3, borderRadius: 2, background: t.preview.text, opacity: 0.4 }} />
                      <div style={{ width: '60%', height: 3, borderRadius: 2, background: t.preview.text, opacity: 0.2 }} />
                    </div>
                  </div>

                  {/* Label */}
                  <div style={{
                    padding: '8px 10px',
                    background: 'var(--bg-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {t.label}
                    </span>
                    {theme === t.value && (
                      <span style={{
                        width: 16, height: 16, borderRadius: '50%',
                        background: 'var(--accent-blue)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, color: 'white', fontWeight: 700,
                      }}>✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SettingRow label="Font Size" description="Adjust the text size across the app">
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
        <Section title="Notifications">
          <SettingRow label="Decision Alerts" description="Notify when a new decision needs review">
            <Toggle checked={notifDecisions} onChange={setNotifDecisions} />
          </SettingRow>
          <SettingRow label="Prediction Updates" description="Notify when new AI predictions are generated">
            <Toggle checked={notifPredictions} onChange={setNotifPredictions} />
          </SettingRow>
          <SettingRow label="Risk Alerts" description="Notify on HIGH risk supply chain or HR issues">
            <Toggle checked={notifAlerts} onChange={setNotifAlerts} />
          </SettingRow>
          <SettingRow label="Email Notifications" description="Send alerts to your email address">
            <Toggle checked={notifEmail} onChange={setNotifEmail} />
          </SettingRow>
          <SettingRow label="Sound Alerts" description="Play a sound for important notifications">
            <Toggle checked={notifSound} onChange={setNotifSound} />
          </SettingRow>
        </Section>

        {/* ── Dashboard Preferences ── */}
        <Section title="Dashboard Preferences" >
          <SettingRow label="Default Landing Page" description="Which page opens when you log in">
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
            <SettingRow label="Refresh Interval" description="How often to refresh data">
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
          <SettingRow label="Date Format" description="How dates are displayed across the app">
            <Select value={dateFormat} onChange={setDateFormat} options={[
              { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY' },
              { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY' },
              { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD' },
            ]} />
          </SettingRow>
        </Section>

        {/* ── AI Preferences ── */}
        <Section title="AI Preferences" >
          <SettingRow label="AI Suggestions" description="Show suggested questions in the AI Assistant">
            <Toggle checked={aiSuggestions} onChange={setAiSuggestions} />
          </SettingRow>
          <SettingRow label="Minimum Confidence Threshold" description="Only show decisions above this confidence level">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range" min="50" max="95" step="5"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(e.target.value)}
                style={{ width: 100, accentColor: 'var(--accent-blue)' }}
              />
              <span className="text-mono" style={{ fontSize: 13, color: 'var(--accent-blue)', width: 36 }}>
                {confidenceThreshold}%
              </span>
            </div>
          </SettingRow>
          <SettingRow label="Language" description="Language for AI responses">
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
        <Section title="Account" >
          <SettingRow label="Session" description="You are currently signed in as Admin User">
            <button className="btn btn-danger btn-sm" onClick={() => setShowSignOut(true)}>
              Sign Out
            </button>
          </SettingRow>
          <SettingRow label="Export My Data" description="Download all your decisions and preferences">
            <button className="btn btn-secondary btn-sm">Export →</button>
          </SettingRow>
          <SettingRow label="Delete Account" description="Permanently delete your account and all data">
            <button className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.3)' }}>
              Delete
            </button>
          </SettingRow>
        </Section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingBottom: 24 }}>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>Reset</button>
          <button className="btn btn-primary" onClick={save}>
            {saved ? '✓ Saved' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {showSignOut && (
        <SignOutModal onCancel={() => setShowSignOut(false)} onConfirm={handleSignOut} />
      )}
    </>
  );
}