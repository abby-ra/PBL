import { NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { to: '/dashboard', icon: <GridIcon />, label: 'Dashboard' },
      { to: '/analytics', icon: <ChartIcon />, label: 'Analytics' },
    ],
  },
  {
    section: 'AI Engine',
    items: [
      { to: '/chat', icon: <ChatIcon />, label: 'AI Assistant' },
      { to: '/predictions', icon: <TrendIcon />, label: 'Predictions' },
      { to: '/decisions', icon: <DecisionIcon />, label: 'Decisions', badge: '2' },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/settings', icon: <SettingsIcon />, label: 'Settings' },
    ],
  },
];

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">S</div>
            <div className="logo-text">
              <div>SAP Decision AI</div>
              <div className="logo-sub">Enterprise Intelligence</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((section) => (
            <div key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">A</div>
          <div className="user-info">
            <div className="user-name">Admin User</div>
            <div className="user-role">AI Engineer</div>
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}

/* ── SVG Icons ── */
function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="1,12 5,7 9,9 15,3" />
      <line x1="1" y1="15" x2="15" y2="15" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 10.5a1.5 1.5 0 01-1.5 1.5H4L1 15V2.5A1.5 1.5 0 012.5 1h10A1.5 1.5 0 0114 2.5v8z" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="1,11 6,5 10,8 15,2" />
      <polyline points="11,2 15,2 15,6" />
    </svg>
  );
}

function DecisionIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="7" />
      <path d="M5 8l2 2 4-4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
    </svg>
  );
}
