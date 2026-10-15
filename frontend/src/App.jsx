import { useState } from 'react';
import './App.css';
import Login from './login.jsx';
import { FarmProvider, useFarm } from './context/FarmContext.jsx';
import Dashboard from './Dashboard/Dashboard.jsx';
import ModuleView from './components/ModuleView.jsx';

// Streamlined modules directly linked to the Dashboard (No unnecessary submenus)
const menuItems = [
  { label: 'Dashboard', icon: '▦' },
  { label: 'Crops', icon: '🌾' },
  { label: 'Income', icon: '↗' },
  { label: 'Expenses', icon: '↙' },
  { label: 'Transactions', icon: '↔' },
  { label: 'Machinery & Assets', icon: '🚜' },
  { label: 'Inventory', icon: '📦' },
  { label: 'Loans & Payments', icon: '⏳' },
  { label: 'Reports', icon: '📊' },
  { label: 'Notifications', icon: '🔔' },
  { label: 'General Settings', icon: '⚙' }
];

function getInitials(email) {
  if (!email) return 'AD';
  const namePart = email.split('@')[0];
  const parts = namePart.split(/[._-]/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return namePart.slice(0, 2).toUpperCase();
}

function AppContent({ userEmail, onLogout }) {
  const [active, setActive] = useState(() => {
    return localStorage.getItem('agriman_active_module') || 'Dashboard';
  });
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { notifications, academicYear, setAcademicYear } = useFarm();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const userInitials = getInitials(userEmail);

  function selectItem(label) {
    setActive(label);
    try {
      localStorage.setItem('agriman_active_module', label);
    } catch (e) {
      console.warn(e);
    }
    setShowUserMenu(false);
  }

  return (
    <div
      className="app-shell"
      onClick={() => {
        setShowUserMenu(false);
      }}
    >
      {/* Left Navigation Sidebar */}
      <aside className="sidebar" onClick={(e) => e.stopPropagation()}>
        <a className="brand" href="#dashboard" onClick={() => selectItem('Dashboard')}>
          <span className="brand-mark">A</span>
          <span className="brand-name">
            AGRIMAN<small>Farm Financial ERP</small>
          </span>
        </a>

        <div className="menu-caption">FARM MODULES</div>

        <nav aria-label="Main navigation">
          {menuItems.map((item) => {
            const isActive = active === item.label;
            return (
              <div className="menu-group" key={item.label}>
                <button
                  className={`menu-item${isActive ? ' selected' : ''}`}
                  type="button"
                  onClick={() => selectItem(item.label)}
                >
                  <span className="menu-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.label === 'Notifications' && unreadCount > 0 && (
                    <span className="menu-unread-pill">{unreadCount}</span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">{userInitials}</div>
          <div className="user-details">
            <strong className="sidebar-email" title={userEmail}>
              {userEmail}
            </strong>
            <span>Administrator</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <div className="breadcrumb">
              Workspace <span>/</span> <strong>{active}</strong>
            </div>

            {/* Academic Year Selector at the Top */}
            <div className="academic-year-topbar">
              <span className="academic-icon">🎓</span>
              <span className="academic-text">Academic Year:</span>
              <select
                className="academic-select"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                title="Select Academic Year"
              >
                <option value="2025-2026">2025–2026 (Current)</option>
                <option value="2024-2025">2024–2025</option>
                <option value="2023-2024">2023–2024</option>
                <option value="2026-2027">2026–2027 (Upcoming)</option>
              </select>
            </div>
          </div>

          <div className="topbar-actions" onClick={(e) => e.stopPropagation()}>
            <div className="topbar-divider" />

            {/* User Profile with Clickable Dropdown Showing Sign Out */}
            <div className="user-profile-wrapper">
              <button
                type="button"
                className="user-profile-trigger"
                aria-expanded={showUserMenu}
                onClick={() => {
                  setShowUserMenu((prev) => !prev);
                }}
              >
                <div className="top-avatar">{userInitials}</div>
                <div className="top-user">
                  <strong className="top-user-email" title={userEmail}>
                    {userEmail}
                  </strong>
                  <span>Administrator</span>
                </div>
                <span className={`top-chevron ${showUserMenu ? 'open' : ''}`}>⌄</span>
              </button>

              {showUserMenu && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <div className="dropdown-avatar">{userInitials}</div>
                    <div className="dropdown-user-info">
                      <strong title={userEmail}>{userEmail}</strong>
                      <span>Administrator</span>
                      <small className="session-pill">● Active Session</small>
                    </div>
                  </div>
                  <div className="user-dropdown-divider" />
                  <button
                    type="button"
                    className="user-dropdown-item"
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                  >
                    <span className="dropdown-icon">↪</span>
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="page-content">
          {active === 'Dashboard' ? (
            <Dashboard onNavigate={selectItem} />
          ) : (
            <ModuleView moduleName={active} onNavigate={selectItem} />
          )}

          <footer className="page-footer">
            © 2026 AgriMan Farm Financial Management System.
            <span>Built for the people who grow our future.</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(() => {
    return localStorage.getItem('agriman_logged_in') === 'true';
  });
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('agriman_user_email') || 'admin@agriman.in';
  });

  function handleLogin(email) {
    const finalEmail = email || 'admin@agriman.in';
    setUserEmail(finalEmail);
    setLoggedIn(true);
    try {
      localStorage.setItem('agriman_logged_in', 'true');
      localStorage.setItem('agriman_user_email', finalEmail);
    } catch (e) {
      console.warn(e);
    }
  }

  function handleLogout() {
    setLoggedIn(false);
    try {
      localStorage.removeItem('agriman_logged_in');
      localStorage.removeItem('agriman_user_email');
      localStorage.removeItem('agriman_active_module');
    } catch (e) {
      console.warn(e);
    }
  }

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <FarmProvider>
      <AppContent userEmail={userEmail} onLogout={handleLogout} />
    </FarmProvider>
  );
}

export default App;
