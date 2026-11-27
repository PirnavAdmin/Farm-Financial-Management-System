import { useEffect, useState, Component, useCallback, useRef } from 'react'
import './App.css'
import Login from './login.jsx'
import LandingPage from './LandingPage/LandingPage.jsx'
import Farmers from './Masters/Farmers/index.jsx'
import Users from './Settings/Users/Users.jsx'
import Dashboard from './Dashboard/Dashboard.jsx'

import Farms from './Masters/Farms/farms.jsx'
import ExpenseCategories from './Masters/Expense Categories/expense categories.jsx'
import IncomeCategories from './Masters/Income Categories/income categories.jsx'
import Suppliers from './Masters/Suppliers/index.jsx'
import Machinery from './Masters/Machinery/index.jsx'
import Products from './Masters/Products/index.jsx'
import { authRequest } from './auth.js'

import Crops from './Masters/Crops/index.jsx'
import Income from './Finance/Income/income.jsx'
import Expenses from './Finance/Expenses/expenses.jsx'
import Payments from './Finance/Payments/payments.jsx'
import Receipts from './Finance/Receipts/receipts.jsx'
import Loans from './Finance/Loans/loans.jsx'
import BankAccounts from './Finance/Bank Accounts/bank accounts.jsx'
import { InventoryProvider } from './Inventory/InventoryContext.jsx'
import ProductMaster from './Inventory/Product Master/ProductMaster.jsx'
import Purchases from './Inventory/Purchases/purchases.jsx'
import StockTransfer from './Inventory/Stock Transfer/StockTransfer.jsx'
import LowStock from './Inventory/Low Stock/LowStock.jsx'
import StockIn from './Inventory/Stock In/stock in.jsx'
import StockOut from './Inventory/Stock Out/stock out.jsx'
import StockAdjustment from './Inventory/Stock Adjustment/stock adjustment.jsx'
import StockLedger from './Inventory/Stock Ledger/stock ledger.jsx'
import Sales from './Sales/Sales/sales.jsx'
import Customers from './Sales/Customers/customers.jsx'
import Receivables from './Sales/Receivables/receivables.jsx'
import Reports from './Reports/index.jsx'
import { REPORTS_CATALOG } from './Reports/reportsCatalog.js'
import AuditLog from './Settings/Audit Log/audit log.jsx'
import Company from './Settings/Company/company.jsx'
import Roles from './Settings/Roles/roles.jsx'
import Labour from './Agriculture/Labour Attendance/Labour.jsx'
import Sidebar from './Sidebar/Sidebar.jsx'
import Navbar from './Navbar/Navbar.jsx'


const isReportScreen = (name) => {
  if (!name) return false
  if (name === 'Reports' || name === 'reports') return true
  if (String(name).startsWith('Reports:') || String(name).startsWith('Reports/')) return true
  return REPORTS_CATALOG.some(
    (r) => r.id === name || r.route === name || r.name.toLowerCase() === String(name).toLowerCase()
  )
}

function formatDisplayName(email, customName) {
  if (customName) return customName
  if (!email) return 'Meghana Reddy'
  const prefix = email.split('@')[0]
  if (prefix.toLowerCase().includes('meghana')) return 'Meghana Reddy'
  const parts = prefix.split(/[._-]/).filter(Boolean)
  if (parts.length >= 2) {
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }
  return prefix.charAt(0).toUpperCase() + prefix.slice(1)
}

function getInitials(name, email) {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) {
    const prefix = email.split('@')[0]
    const parts = prefix.split(/[._-]/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return prefix.slice(0, 2).toUpperCase()
  }
  return 'MR'
}

class ModuleErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[ModuleErrorBoundary caught error]:', error, errorInfo);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.active !== this.props.active && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <section className="page-content">
          <div style={{ padding: '40px 24px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '24px auto', maxWidth: '600px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ color: '#1e3325', margin: '0 0 8px', fontSize: '20px' }}>Unable to display {this.props.active}</h2>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.5 }}>
              {this.state.error?.message || 'An unexpected error occurred while loading this view.'}
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ padding: '10px 20px', background: '#15803d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Reload View
            </button>
          </div>
          <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
        </section>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [loggedIn, setLoggedIn] = useState(() => {
    return Boolean(localStorage.getItem('agriman_access_token') || sessionStorage.getItem('agriman_access_token'))
  })
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('agriman_user_email') || sessionStorage.getItem('agriman_user_email') || 'User'
  })
  const [accountEmail, setAccountEmail] = useState(() => {
    return localStorage.getItem('agriman_account_email') || sessionStorage.getItem('agriman_account_email') || ''
  })
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('agriman_user_role') || sessionStorage.getItem('agriman_user_role') || 'User'
  })
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('agriman_user_name')
      || sessionStorage.getItem('agriman_user_name')
      || localStorage.getItem('agriman_user_email')
      || sessionStorage.getItem('agriman_user_email')
      || 'User'
  })
  const [active, setActive] = useState('Dashboard')
  const [expanded, setExpanded] = useState({})
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const [publicRoute, setPublicRoute] = useState(() => {
    return window.location.hash === '#login' ? 'login' : 'landing'
  })
  const [transitionStage, setTransitionStage] = useState('active') // 'active' | 'exiting' | 'entering'
  const isTransitioningRef = useRef(false)
  const publicScrollRef = useRef(null)
  const mainContentRef = useRef(null)
  const [headerHidden, setHeaderHidden] = useState(() => false)
  const headerHiddenRef = useRef(false)
  const headerCooldownRef = useRef(0)
  const sidebarCollapsed = false

  const handleNavigateToLogin = useCallback(() => {
    if (isTransitioningRef.current || publicRoute === 'login') return
    isTransitioningRef.current = true
    setTransitionStage('exiting')

    setTimeout(() => {
      window.location.hash = '#login'
      setPublicRoute('login')
      setTransitionStage('entering')

      if (publicScrollRef.current) {
        publicScrollRef.current.scrollTop = 0
      }
      window.scrollTo(0, 0)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionStage('active')
          isTransitioningRef.current = false
        })
      })
    }, 220)
  }, [publicRoute])

  const handleBackToHome = useCallback(() => {
    if (isTransitioningRef.current || publicRoute === 'landing') return
    isTransitioningRef.current = true
    setTransitionStage('exiting')

    setTimeout(() => {
      window.location.hash = '#home'
      setPublicRoute('landing')
      setTransitionStage('entering')

      if (publicScrollRef.current) {
        publicScrollRef.current.scrollTop = 0
      }
      window.scrollTo(0, 0)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionStage('active')
          isTransitioningRef.current = false
        })
      })
    }, 220)
  }, [publicRoute])

  useEffect(() => {
    const handleHashChange = () => {
      if (isTransitioningRef.current) return
      const hash = window.location.hash.toLowerCase()
      if (hash === '#login' && publicRoute !== 'login') {
        handleNavigateToLogin()
      } else if (
        (hash === '#home' || hash === '' || hash === '#features' || hash === '#about' || hash === '#how-it-works') &&
        publicRoute !== 'landing'
      ) {
        handleBackToHome()
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [publicRoute, handleNavigateToLogin, handleBackToHome])

  useEffect(() => {
    const handleDocumentClick = () => {
      setShowUserMenu(false)
      setShowNotifMenu(false)
    }
    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [])

  useEffect(() => {
    const storage = localStorage.getItem('agriman_access_token') ? localStorage : sessionStorage
    const initialAccessToken = storage.getItem('agriman_access_token')
    if (!initialAccessToken) return undefined

    let mounted = true
    async function restoreSession() {
      try {
        const response = await authRequest('me', { method: 'GET', accessToken: initialAccessToken })
        const user = response.user || response

        if (!mounted) return
        const displayName = user.fullName || user.name || user.email || user.phoneNumber || storage.getItem('agriman_user_email') || 'User'
        const email = user.email || user.Email || storage.getItem('agriman_account_email') || ''
        const role = user.role || storage.getItem('agriman_user_role') || 'User'
        storage.setItem('agriman_user_email', displayName)
        storage.setItem('agriman_user_name', displayName)
        if (email) storage.setItem('agriman_account_email', email)
        storage.setItem('agriman_user_role', role)
        setUserEmail(displayName)
        setAccountEmail(email)
        setUserName(displayName)
        setUserRole(role)
        setLoggedIn(true)
      } catch (requestError) {
        if (!mounted) return
        if (requestError.status === 401 || requestError.status === 400) {
          for (const currentStorage of [localStorage, sessionStorage]) {
            currentStorage.removeItem('agriman_access_token')
            currentStorage.removeItem('agriman_refresh_token')
            currentStorage.removeItem('agriman_user_email')
            currentStorage.removeItem('agriman_user_name')
            currentStorage.removeItem('agriman_account_email')
            currentStorage.removeItem('agriman_user_role')
          }
          setLoggedIn(false)
          setUserEmail('User')
          setAccountEmail('')
          setUserName('User')
          setUserRole('User')
        }
      }
    }

    restoreSession()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!loggedIn) return undefined

    let rafId = null
    let activeTarget = null
    const lastPositions = new WeakMap()
    const anchorPositions = new WeakMap()
    const lastDirections = new WeakMap()

    const applyHeaderHidden = (next) => {
      if (headerHiddenRef.current === next) return
      headerHiddenRef.current = next
      headerCooldownRef.current = performance.now() + 320
      setHeaderHidden(next)
    }

    const handleScroll = (e) => {
      const rawTarget = e.target
      const target = rawTarget === document ? document.scrollingElement : rawTarget
      if (!target || typeof target.scrollTop !== 'number') return
      // Ignore horizontal-only scrollbars (tables with horizontal overflow only)
      if (target.scrollHeight <= target.clientHeight + 8) return
      // Ignore navbar's own dropdowns, sidebar, and tooltip/menu popovers
      if (target.closest?.('.navbar-dropdown, .sidebar, .pay-date-menu, .rec-date-menu, .exp-date-menu')) return

      if (performance.now() < headerCooldownRef.current) {
        lastPositions.set(target, target.scrollTop || 0)
        return
      }

      activeTarget = target
      if (rafId !== null) return
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        const el = activeTarget
        if (!el) return
        if (performance.now() < headerCooldownRef.current) {
          lastPositions.set(el, el.scrollTop || 0)
          return
        }

        const currentTop = el.scrollTop || 0
        const prevTop = lastPositions.get(el) ?? currentTop
        lastPositions.set(el, currentTop)

        const stepDelta = currentTop - prevTop
        if (Math.abs(stepDelta) < 1) return

        const dir = stepDelta > 0 ? 'down' : 'up'
        if (lastDirections.get(el) !== dir) {
          lastDirections.set(el, dir)
          anchorPositions.set(el, prevTop)
        }

        const anchorTop = anchorPositions.get(el) ?? prevTop
        const accumulated = currentTop - anchorTop

        // Returning to top from a scrolled position reveals the header
        if (dir === 'up' && prevTop > 16 && currentTop <= 16) {
          anchorPositions.set(el, currentTop)
          applyHeaderHidden(false)
          return
        }

        if (!headerHiddenRef.current && dir === 'down' && accumulated >= 16 && currentTop > 40) {
          applyHeaderHidden(true)
        } else if (headerHiddenRef.current && dir === 'up' && accumulated <= -14) {
          applyHeaderHidden(false)
        }
      })
    }

    document.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    return () => {
      document.removeEventListener('scroll', handleScroll, { capture: true })
      if (rafId !== null) window.cancelAnimationFrame(rafId)
    }
  }, [loggedIn])

  useEffect(() => {
    const shouldHideOnNavigate = active !== 'Dashboard'
    headerHiddenRef.current = shouldHideOnNavigate
    headerCooldownRef.current = performance.now() + 320
    setHeaderHidden(shouldHideOnNavigate)
    const scroller = mainContentRef.current?.querySelector('.page-content, .users-page')
    if (scroller) scroller.scrollTop = 0
  }, [active])

  function handleLogin(user, token, rememberMe, identifier, refreshToken) {
    const storage = rememberMe ? localStorage : sessionStorage
    const displayName = user.fullName || user.name || user.email || user.phoneNumber || identifier || 'User'
    const email = user.email || user.Email || identifier || ''
    const role = user.role || 'User'
    for (const currentStorage of [localStorage, sessionStorage]) {
      currentStorage.removeItem('agriman_access_token')
      currentStorage.removeItem('agriman_refresh_token')
      currentStorage.removeItem('agriman_user_email')
      currentStorage.removeItem('agriman_user_name')
      currentStorage.removeItem('agriman_account_email')
      currentStorage.removeItem('agriman_user_role')
    }
    storage.setItem('agriman_access_token', token)
    if (refreshToken) storage.setItem('agriman_refresh_token', refreshToken)
    storage.setItem('agriman_user_email', displayName)
    storage.setItem('agriman_user_name', user.fullName || user.name || displayName)
    if (email) storage.setItem('agriman_account_email', email)
    storage.setItem('agriman_user_role', role)
    setUserEmail(displayName)
    setAccountEmail(email)
    setUserName(user.fullName || user.name || displayName)
    setUserRole(role)
    setLoggedIn(true)
  }

  function handleLogout() {
    setLoggedIn(false)
    setShowUserMenu(false)
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem('agriman_access_token')
      storage.removeItem('agriman_refresh_token')
      storage.removeItem('agriman_user_email')
      storage.removeItem('agriman_user_name')
      storage.removeItem('agriman_account_email')
      storage.removeItem('agriman_user_role')
    }
    setUserEmail('User')
    setAccountEmail('')
    setUserName('User')
    setUserRole('User')
  }

  function selectItem(label) {
    setActive(label)
    setShowUserMenu(false)
  }

  const userInitials = getInitials(userName, userEmail)

  if (!loggedIn) {
    return (
      <div className="public-route-wrapper">
        <div
          ref={publicScrollRef}
          className={`public-route-scroll-container public-route-stage-${transitionStage}`}
        >
          {publicRoute === 'login' ? (
            <Login
              onLogin={handleLogin}
              onBackToHome={handleBackToHome}
            />
          ) : (
            <LandingPage
              onNavigateToLogin={handleNavigateToLogin}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <InventoryProvider>
      <div className={`app-shell${active === 'Dashboard' ? ' dashboard-shell' : ''}`}>
      <Sidebar
        active={active}
        selectItem={selectItem}
        expanded={expanded}
        setExpanded={setExpanded}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main ref={mainContentRef} className={`main-content${headerHidden ? ' header-is-hidden' : ''}`}>
        <Navbar
          active={active}
          selectItem={selectItem}
          userName={formatDisplayName(userEmail, userName)}
          userEmail={userEmail}
          userRole={userRole}
          userInitials={userInitials}
          handleLogout={handleLogout}
          hidden={headerHidden}
        />

        <ModuleErrorBoundary active={active}>
        {active === 'Farmers' ? (
          <section className="page-content">
            <Farmers profileEmail={accountEmail} profileName={userName} />
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        ) : active === 'Users' ? (
          <Users />
        ) : active === 'Crop Management' || active === 'Crop Master' || active === 'Crops' || active === 'Crop Varieties' ? (
          <section className="page-content">
            <Crops initialTab="crop-management" onNavigate={selectItem} />
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        ) : active === 'Crop Season' || active === 'Crop Seasons' ? (
          <section className="page-content">
            <Crops initialTab="seasons" onNavigate={selectItem} />
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        ) : active === 'Labour Attendance' ? (
          <section className="page-content">
            <Labour initialTab="attendance" onNavigate={selectItem} />
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        ) : active === 'Labour Management' || active === 'Labour' || active === 'Labour Master' ? (
          <section className="page-content">
            <Labour initialTab="labourers" onNavigate={selectItem} />
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        ) : active === 'Labour Payments' ? (
          <section className="page-content">
            <Labour initialTab="payments" onNavigate={selectItem} />
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        ) : active === 'Crop Activities' ? (
          <section className="page-content">
            <Crops initialTab="activities" onNavigate={selectItem} />
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        ) : (
          <section className="page-content">
            {active === 'Income' ? (
              <Income />
            ) : active === 'Expenses' ? (
              <Expenses />
            ) : active === 'Payments' ? (
              <Payments />
            ) : active === 'Receipts' ? (
              <Receipts />
            ) : (active === 'Loans' || active === 'Loans & Finance') ? (
              <Loans />
            ) : active === 'Bank Accounts' ? (
              <BankAccounts />
            ) : active === 'Product Master' || active === 'Products' ? (
              <Products onNavigate={selectItem} />
            ) : active === 'Purchases' ? (
              <Purchases />
            ) : active === 'Stock In' ? (
              <StockIn />
            ) : active === 'Stock Out' ? (
              <StockOut />
            ) : active === 'Stock Transfer' ? (
              <StockTransfer />
            ) : active === 'Stock Adjustment' ? (
              <StockAdjustment />
            ) : active === 'Stock Ledger' ? (
              <StockLedger />
            ) : active === 'Low Stock' ? (
              <LowStock onNavigate={selectItem} />
            ) : active === 'Sales Transactions' || active === 'Sales' ? (
              <Sales onNavigate={selectItem} />
            ) : active === 'Customers' ? (
              <Customers onNavigate={selectItem} />
            ) : active === 'Payments & Receivables' || active === 'Receivables' ? (
              <Receivables onNavigate={selectItem} />
            ) : active === 'Expense Categories' ? (
              <ExpenseCategories />
            ) : active === 'Income Categories' ? (
              <IncomeCategories />
            ) : isReportScreen(active) ? (
              <Reports activeReport={active} onNavigate={selectItem} />
            ) : active === 'Roles' ? (
              <Roles />
            ) : active === 'Company' ? (
              <Company />
            ) : active === 'Audit Log' ? (
              <AuditLog />
            ) : active === 'Users' ? (
            <Users />
          ) : active === 'Farms' ? (
            <Farms />
          ) : active === 'Suppliers' ? (
            <Suppliers onNavigate={selectItem} />
          ) : active === 'Machinery and Equipments' || active === 'Machinery & Equipments' || active === 'Agriculture Machinery' || active === 'Machinery' || active === 'Machinery & Equipment' || active === 'Machinery Usage' ? (
            <Machinery onNavigate={selectItem} />
          ) : active === 'Dashboard' ? (
              <Dashboard onNavigate={selectItem} userName={userName} />
            ) : (
              <div className="module-view-container">
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">FARM FINANCIAL MANAGEMENT • {active.toUpperCase()}</div>
                    <h1>{active}</h1>
                    <p>Manage, audit, and analyze {active} data across all farm operations.</p>
                  </div>
                  <button className="date-filter" type="button" onClick={() => selectItem('Dashboard')}>
                    <span>▦</span> Return to Dashboard
                  </button>
                </div>
                <div className="welcome-card">
                  <div className="welcome-copy">
                    <span className="welcome-tag">YOUR FARM, IN GOOD HANDS</span>
                    <h2>{active} workspace</h2>
                    <p>This section is ready for your farm management records.</p>
                    <button type="button" className="primary-button" onClick={() => selectItem('Dashboard')}>
                      View dashboard <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        )}
        </ModuleErrorBoundary>
      </main>
    </div>
    </InventoryProvider>
  )
}

export default App
