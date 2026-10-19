import { useState } from 'react'
import './App.css'
import Login from './login.jsx'
import Farmers from './Masters/Farmers/index.jsx'

const menuGroups = [
  { label: 'Dashboard', icon: '▦' },
  { label: 'Masters', icon: '▤', children: ['Farmers', 'Farms', 'Crops', 'Crop Varieties', 'Expense Categories', 'Income Categories', 'Products'] },
  { label: 'Agriculture', icon: '♧', children: ['Crop Seasons', 'Crop Activities', 'Labour Attendance', 'Machinery Usage'] },
  { label: 'Finance', icon: '₹', children: ['Income', 'Expenses', 'Payments', 'Receipts', 'Loans', 'Bank Accounts'] },
  { label: 'Inventory', icon: '▣', children: ['Purchases', 'Stock In', 'Stock Out', 'Stock Adjustment', 'Stock Ledger'] },
  { label: 'Sales', icon: '▱', children: ['Sales', 'Customers', 'Receivables'] },
  { label: 'Reports', icon: '▥', children: ['Income Report', 'Expense Report', 'Crop Profit', 'Farm Profit', 'Cash Flow', 'P&L', 'Dashboard Reports'] },
  { label: 'Notifications', icon: '♧' },
  { label: 'Settings', icon: '⚙', children: ['Users', 'Roles', 'Company', 'Audit Log'] },
]

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [active, setActive] = useState('Dashboard')
  const [expanded, setExpanded] = useState({ Masters: true })

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  function selectItem(label) {
    setActive(label)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" onClick={() => selectItem('Dashboard')}>
          <span className="brand-mark">A</span>
          <span className="brand-name">AGRIMAN<small>Farm management</small></span>
        </a>
        <div className="menu-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {menuGroups.map((group) => {
            const isOpen = expanded[group.label]
            const isActive = active === group.label || group.children?.includes(active)
            return (
              <div className="menu-group" key={group.label}>
                <button
                  className={`menu-item${isActive ? ' selected' : ''}`}
                  type="button"
                  aria-expanded={group.children ? Boolean(isOpen) : undefined}
                  onClick={() => group.children
                    ? setExpanded((current) => ({ ...current, [group.label]: !current[group.label] }))
                    : selectItem(group.label)}
                >
                  <span className="menu-icon" aria-hidden="true">{group.icon}</span>
                  <span>{group.label}</span>
                  {group.children && <span className={`chevron${isOpen ? ' open' : ''}`} aria-hidden="true">⌄</span>}
                </button>
                {group.children && isOpen && (
                  <div className="submenu">
                    {group.children.map((item) => (
                      <button
                        className={`submenu-item${active === item ? ' selected' : ''}`}
                        key={item}
                        type="button"
                        onClick={() => selectItem(item)}
                      >
                        <span className="submenu-dot" aria-hidden="true" />{item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">AD</div>
          <div className="user-details"><strong>Admin User</strong><span>Administrator</span></div>
          <button className="more-button logout-button" type="button" aria-label="Sign out" title="Sign out" onClick={() => setLoggedIn(false)}>↪</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div>
          <div className="topbar-actions">
            <button className="icon-button notification-button" type="button" aria-label="Notifications">♧<i /></button>
            <div className="topbar-divider" />
            <div className="top-avatar">AD</div>
            <div className="top-user"><strong>Admin User</strong><span>Administrator</span></div>
            <span className="top-chevron">⌄</span>
          </div>
        </header>
        <section className="page-content">
          {active === 'Farmers' ? <Farmers /> : <>
          <div className="page-heading">
            <div><div className="eyebrow">FARM FINANCIAL MANAGEMENT</div><h1>{active}</h1><p>Welcome back. Here’s your farm management workspace.</p></div>
            <button className="date-filter" type="button"><span>▦</span> This season <span className="filter-chevron">⌄</span></button>
          </div>
          <div className="welcome-card">
            <div className="welcome-copy"><span className="welcome-tag">YOUR FARM, IN GOOD HANDS</span><h2>Good morning, Admin</h2><p>Keep track of your farms, finances, crops and inventory, all in one place.</p><button type="button" className="primary-button" onClick={() => { setActive('Crop Seasons'); setExpanded((current) => ({ ...current, Agriculture: true })) }}>Explore agriculture <span>→</span></button></div>
            <div className="field-art" aria-hidden="true"><div className="sun" /><div className="hill hill-back" /><div className="hill hill-front" /><div className="crop-lines">╱ ╱ ╱ ╱ ╱</div></div>
          </div>
          <div className="section-title"><div><h2>At a glance</h2><p>A snapshot of your farm operations</p></div><button className="text-button" type="button" onClick={() => selectItem('Dashboard Reports')}>View reports <span>→</span></button></div>
          <div className="metric-grid">
            <article className="metric-card"><div className="metric-top"><span className="metric-icon green">♧</span><span className="metric-period">THIS SEASON</span></div><div className="metric-label">Active farms</div><div className="metric-value">12</div><div className="metric-note"><span className="positive">↗ 2 new</span> since last season</div></article>
            <article className="metric-card"><div className="metric-top"><span className="metric-icon amber">⌁</span><span className="metric-period">THIS SEASON</span></div><div className="metric-label">Active crop seasons</div><div className="metric-value">8</div><div className="metric-note">Across <strong>5 crop varieties</strong></div></article>
            <article className="metric-card"><div className="metric-top"><span className="metric-icon blue">↗</span><span className="metric-period">THIS MONTH</span></div><div className="metric-label">Income recorded</div><div className="metric-value">₹ 2,84,500</div><div className="metric-note"><span className="positive">↗ 12.8%</span> vs. last month</div></article>
            <article className="metric-card"><div className="metric-top"><span className="metric-icon coral">↘</span><span className="metric-period">THIS MONTH</span></div><div className="metric-label">Expenses recorded</div><div className="metric-value">₹ 1,62,300</div><div className="metric-note"><span className="neutral">On track</span> with your budget</div></article>
          </div>
          <div className="lower-grid">
            <article className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>The latest updates across your farms</p></div><button className="more-button panel-more" type="button" aria-label="More activity options">···</button></div><div className="activity-list"><div className="activity-row"><span className="activity-symbol green">₹</span><div><strong>Income recorded</strong><span>Wheat harvest · Green Valley Farm</span></div><time>Today, 10:42 AM</time><b>+ ₹ 42,000</b></div><div className="activity-row"><span className="activity-symbol amber">▣</span><div><strong>Stock received</strong><span>Organic fertilizer · 50 bags</span></div><time>Today, 9:15 AM</time><b className="plain-amount">Stock In</b></div><div className="activity-row"><span className="activity-symbol blue">♧</span><div><strong>Crop activity updated</strong><span>Irrigation · Sunrise Farms</span></div><time>Yesterday</time><b className="plain-amount">Updated</b></div></div></article>
            <article className="panel season-panel"><div className="panel-heading"><div><h2>Season overview</h2><p>Current crop season progress</p></div><button className="panel-link" type="button" onClick={() => { setActive('Crop Seasons'); setExpanded((current) => ({ ...current, Agriculture: true })) }}>View all <span>→</span></button></div><div className="season-name"><span className="season-icon">♧</span><div><strong>Kharif 2025</strong><span>Jun 2025 – Oct 2025</span></div><span className="status-pill">In progress</span></div><div className="progress-caption"><span>Season progress</span><strong>68%</strong></div><div className="progress-track"><span /></div><div className="season-stats"><div><span>Farms</span><strong>8</strong></div><div><span>Activities</span><strong>24</strong></div><div><span>Harvests</span><strong>3 <small>of 8</small></strong></div></div></article>
          </div>
          <footer className="page-footer">© 2025 Agriman <span>Built for the people who grow our future.</span></footer>
          </>}
        </section>
      </main>
    </div>
  )
}

export default App

