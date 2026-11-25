import React, { useState, useEffect, useRef } from 'react'
import './Navbar.css'
import { useTheme } from '../ThemeContext'

export default function Navbar({
  active = 'Dashboard',
  selectItem,
  userName = 'User',
  userEmail = '',
  userRole = 'User',
  userInitials = 'U',
  handleLogout
}) {
  const { theme, toggleTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  // Active modal state: null | 'profile' | 'settings' | 'security' | 'notifications' | 'support'
  const [activeModal, setActiveModal] = useState(null)

  // Local user profile editable state (persisted in localStorage)
  const [profileName, setProfileName] = useState(() => {
    return localStorage.getItem('agriman_user_name') || userName || 'Meghana Reddy'
  })
  const [profilePhone, setProfilePhone] = useState(() => {
    return localStorage.getItem('agriman_user_phone') || '+91 98765 43210'
  })
  const [profileSavedFeedback, setProfileSavedFeedback] = useState(false)

  // Localization / Account settings state (persisted in localStorage)
  const [appLang, setAppLang] = useState(() => localStorage.getItem('agriman_pref_lang') || 'en')
  const [appDateFormat, setAppDateFormat] = useState(() => localStorage.getItem('agriman_pref_date_format') || 'DD/MM/YYYY')
  const [appTimezone, setAppTimezone] = useState(() => localStorage.getItem('agriman_pref_tz') || 'Asia/Kolkata')
  const [appCurrency, setAppCurrency] = useState(() => localStorage.getItem('agriman_pref_currency') || 'INR')
  const [settingsSavedFeedback, setSettingsSavedFeedback] = useState(false)

  // Notification Preferences state (functional toggles persisted in localStorage)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('agriman_notif_prefs')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.warn(e)
    }
    return {
      general: true,
      payments: true,
      loans: true,
      lowStock: true,
      security: true
    }
  })
  const [prefsSavedFeedback, setPrefsSavedFeedback] = useState(false)

  // Password change state
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwFeedback, setPwFeedback] = useState({ text: '', type: '' })

  // Support Issue state
  const [supportCategory, setSupportCategory] = useState('General Query')
  const [supportMessage, setSupportMessage] = useState('')
  const [supportFeedback, setSupportFeedback] = useState('')
  const [faqExpanded, setFaqExpanded] = useState({ 0: true })

  // Notifications list with dynamic read/unread status
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Crop Season Review',
      message: 'Kharif 2026 planting schedule is ready for administrative review.',
      time: '15m ago',
      icon: '🌾',
      read: false
    },
    {
      id: 2,
      title: 'Low Stock Alert',
      message: 'NPK 19:19:19 Fertilizer is below minimum reorder level (8 bags left in Main Barn).',
      time: '1h ago',
      icon: '⚠️',
      read: false
    },
    {
      id: 3,
      title: 'Payment Received',
      message: '₹45,000 received from Ramesh Agro Traders for Cotton harvest delivery.',
      time: '3h ago',
      icon: '💰',
      read: false
    }
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  const notifRef = useRef(null)
  const userMenuRef = useRef(null)

  // Escape closes open menus and dialogs.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false)
        setShowNotifMenu(false)
        setActiveModal(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close menus.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifMenu(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Notification actions
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
  }

  const handleItemRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    )
  }

  // Profile modal save
  const handleSaveProfile = (e) => {
    e.preventDefault()
    try {
      localStorage.setItem('agriman_user_name', profileName.trim())
      localStorage.setItem('agriman_user_phone', profilePhone.trim())
      setProfileSavedFeedback(true)
      setTimeout(() => setProfileSavedFeedback(false), 2500)
    } catch (err) {
      console.warn('Unable to save profile to localStorage', err)
    }
  }

  // Settings modal save
  const handleSaveSettings = (e) => {
    e.preventDefault()
    try {
      localStorage.setItem('agriman_pref_lang', appLang)
      localStorage.setItem('agriman_pref_date_format', appDateFormat)
      localStorage.setItem('agriman_pref_tz', appTimezone)
      localStorage.setItem('agriman_pref_currency', appCurrency)
      setSettingsSavedFeedback(true)
      setTimeout(() => setSettingsSavedFeedback(false), 2500)
    } catch (err) {
      console.warn('Unable to save settings to localStorage', err)
    }
  }

  // Toggle notification preferences
  const handleTogglePref = (key) => {
    setNotifPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem('agriman_notif_prefs', JSON.stringify(updated))
      } catch (err) {
        console.warn(err)
      }
      setPrefsSavedFeedback(true)
      setTimeout(() => setPrefsSavedFeedback(false), 2000)
      return updated
    })
  }

  // Password change submission
  const handleChangePassword = (e) => {
    e.preventDefault()
    if (!pwCurrent) {
      setPwFeedback({ text: 'Please enter your current password.', type: 'error' })
      return
    }
    if (pwNew.length < 8) {
      setPwFeedback({ text: 'New password must be at least 8 characters long.', type: 'error' })
      return
    }
    if (pwNew !== pwConfirm) {
      setPwFeedback({ text: 'New passwords do not match.', type: 'error' })
      return
    }
    setPwFeedback({ text: 'Password updated successfully.', type: 'success' })
    setPwCurrent('')
    setPwNew('')
    setPwConfirm('')
    setTimeout(() => setPwFeedback({ text: '', type: '' }), 3500)
  }

  // Support ticket submission
  const handleSubmitSupport = (e) => {
    e.preventDefault()
    if (!supportMessage.trim()) return
    setSupportFeedback('Ticket #AGR-2026-89 submitted. Our agricultural technical team will respond within 4 hours.')
    setSupportMessage('')
    setTimeout(() => setSupportFeedback(''), 5000)
  }

  return (
    <>
      <header className="navbar-container">
        {/* 1. LEFT SECTION - Breadcrumb */}
        <div className="navbar-left">
          <div className="navbar-breadcrumb">
            <span className="breadcrumb-root">Workspace</span>
            <span className="breadcrumb-separator" aria-hidden="true">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
            <span className="breadcrumb-current">{active}</span>
          </div>
        </div>

        {/* 2. RIGHT SECTION - Actions & User Profile */}
        <div className="navbar-right">
          {/* Element 1: Light / Dark Mode Toggle Button */}
          <button
            type="button"
            className="navbar-icon-btn theme-toggle-btn"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>

          {/* Element 2: Notifications Bell with dynamic unread indicator */}
          <div className="navbar-notif-wrapper" ref={notifRef}>
            <button
              type="button"
              className="navbar-icon-btn"
              title="Notifications"
              aria-label={`${unreadCount} unread notifications`}
              onClick={(e) => {
                e.stopPropagation()
                setShowNotifMenu((prev) => !prev)
                setShowUserMenu(false)
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && <span className="navbar-notif-dot" />}
            </button>

            {/* Notifications Dropdown */}
            {showNotifMenu && (
              <div
                className="navbar-dropdown notif-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="notif-dropdown-header">
                  <div className="notif-title-group">
                    <strong>Notifications</strong>
                    {unreadCount > 0 ? (
                      <span className="notif-count-badge">{unreadCount} New</span>
                    ) : (
                      <span className="notif-all-read-badge">All caught up</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="notif-mark-read-btn"
                      onClick={handleMarkAllRead}
                      title="Mark all notifications as read"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="notif-items-list">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`notif-item ${item.read ? 'read' : 'unread'}`}
                      onClick={() => handleItemRead(item.id)}
                    >
                      <span className="notif-icon">{item.icon}</span>
                      <div className="notif-item-body">
                        <div className="notif-item-headline">
                          <strong>{item.title}</strong>
                          {!item.read && <span className="unread-dot" />}
                        </div>
                        <p>{item.message}</p>
                        <small>{item.time}</small>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="notif-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifMenu(false)
                      selectItem && selectItem('Notifications')
                    }}
                  >
                    View All Notifications →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Element 3: User Profile Avatar with dropdown */}
          <div className="navbar-user-wrapper" ref={userMenuRef}>
            <div
              className={`navbar-user-btn ${showUserMenu ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setShowUserMenu((prev) => !prev)
                setShowNotifMenu(false)
              }}
              role="button"
              tabIndex={0}
              aria-haspopup="true"
              aria-expanded={showUserMenu}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setShowUserMenu((prev) => !prev)
                }
              }}
            >
              <div className="navbar-avatar">{userInitials}</div>
              <div className="navbar-user-meta">
                <span className="navbar-user-name" title={profileName || userName || userEmail}>
                  {profileName || userName || 'User'}
                </span>
                <span className="navbar-user-role">{userRole}</span>
              </div>
              <span
                className={`navbar-chevron ${showUserMenu ? 'open' : ''}`}
                aria-hidden="true"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>

            {/* User Dropdown with exactly 6 options */}
            {showUserMenu && (
              <div
                className="navbar-dropdown user-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header: Authenticated user's actual information */}
                <div className="user-dropdown-header">
                  <div className="user-dropdown-avatar">{userInitials}</div>
                  <div className="user-dropdown-info">
                    <strong>{profileName || userName || userEmail}</strong>
                    <span>{userEmail}</span>
                    <div className="user-status-pill">
                      <span className="pulse-indicator" />
                      Active Session • {userRole}
                    </div>
                  </div>
                </div>

                <div className="user-dropdown-divider" />

                {/* 6 Structured Menu Options */}
                <div className="user-dropdown-menu-list">
                  {/* 1. My Profile */}
                  <button
                    type="button"
                    className="user-dropdown-action"
                    onClick={() => {
                      setShowUserMenu(false)
                      setActiveModal('profile')
                    }}
                  >
                    <svg className="menu-action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>My Profile</span>
                  </button>

                  {/* 2. Account Settings */}
                  <button
                    type="button"
                    className="user-dropdown-action"
                    onClick={() => {
                      setShowUserMenu(false)
                      setActiveModal('settings')
                    }}
                  >
                    <svg className="menu-action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>Account Settings</span>
                  </button>

                  {/* 3. Security & Privacy */}
                  <button
                    type="button"
                    className="user-dropdown-action"
                    onClick={() => {
                      setShowUserMenu(false)
                      setActiveModal('security')
                    }}
                  >
                    <svg className="menu-action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Security & Privacy</span>
                  </button>

                  {/* 4. Notification Preferences */}
                  <button
                    type="button"
                    className="user-dropdown-action"
                    onClick={() => {
                      setShowUserMenu(false)
                      setActiveModal('notifications')
                    }}
                  >
                    <svg className="menu-action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span>Notification Preferences</span>
                  </button>

                  {/* 5. Help & Support */}
                  <button
                    type="button"
                    className="user-dropdown-action"
                    onClick={() => {
                      setShowUserMenu(false)
                      setActiveModal('support')
                    }}
                  >
                    <svg className="menu-action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>Help & Support</span>
                  </button>
                </div>

                <div className="user-dropdown-divider" />

                {/* 6. Logout */}
                <button
                  type="button"
                  className="user-dropdown-action logout-btn"
                  onClick={() => {
                    setShowUserMenu(false)
                    handleLogout && handleLogout()
                  }}
                >
                  <svg className="menu-action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          ENTERPRISE ERP MODALS / DRAWERS FOR USER PROFILE MENU OPTIONS
          ========================================================================= */}
      {activeModal && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div
            className="enterprise-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Close Button */}
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setActiveModal(null)}
              aria-label="Close dialog"
            >
              ×
            </button>

            {/* -----------------------------------------------------------------
                MODAL 1: MY PROFILE
                ----------------------------------------------------------------- */}
            {activeModal === 'profile' && (
              <div className="modal-body">
                <div className="modal-header-block">
                  <div className="modal-avatar-lg">{userInitials}</div>
                  <div>
                    <h2 className="modal-title">My Profile</h2>
                    <p className="modal-subtitle">
                      Authenticated user credentials & enterprise farm permissions
                    </p>
                  </div>
                </div>

                <div className="profile-details-grid">
                  <div className="profile-detail-card">
                    <span className="detail-label">Designation</span>
                    <span className="detail-value highlight">
                      {userRole === 'Admin' ? 'Lead Farm Administrator' : 'Agricultural Operations Specialist'}
                    </span>
                  </div>
                  <div className="profile-detail-card">
                    <span className="detail-label">User ID</span>
                    <span className="detail-value font-mono">USR-2026-AGRI-042</span>
                  </div>
                  <div className="profile-detail-card">
                    <span className="detail-label">Organization</span>
                    <span className="detail-value">AGRIMAN Agricultural Enterprises</span>
                  </div>
                  <div className="profile-detail-card">
                    <span className="detail-label">Role Access</span>
                    <span className="detail-value role-badge">{userRole}</span>
                  </div>
                  <div className="profile-detail-card">
                    <span className="detail-label">Account Status</span>
                    <span className="detail-value status-active">
                      <span className="status-dot" /> Active & Verified
                    </span>
                  </div>
                  <div className="profile-detail-card">
                    <span className="detail-label">Last Login</span>
                    <span className="detail-value">Today, 09:30 AM IST</span>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="profile-form">
                  <h3 className="section-heading">Contact Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="prof-name">Full Name</label>
                      <input
                        id="prof-name"
                        type="text"
                        className="modal-input"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="prof-phone">Mobile Number</label>
                      <input
                        id="prof-phone"
                        type="text"
                        className="modal-input"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="prof-email">Email Address (Read-only)</label>
                    <input
                      id="prof-email"
                      type="email"
                      className="modal-input read-only"
                      value={userEmail}
                      readOnly
                    />
                  </div>

                  <div className="modal-actions-bar">
                    {profileSavedFeedback && (
                      <span className="save-success-feedback">
                        ✓ Profile updated successfully
                      </span>
                    )}
                    <button type="submit" className="primary-modal-btn">
                      Save Profile Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* -----------------------------------------------------------------
                MODAL 2: ACCOUNT SETTINGS
                ----------------------------------------------------------------- */}
            {activeModal === 'settings' && (
              <div className="modal-body">
                <div className="modal-header-block">
                  <div className="modal-icon-header">⚙️</div>
                  <div>
                    <h2 className="modal-title">Account Settings</h2>
                    <p className="modal-subtitle">
                      Configure regional formats, localization preferences, and currency display
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveSettings} className="settings-form">
                  <div className="settings-grid">
                    <div className="form-group">
                      <label htmlFor="set-lang">Language</label>
                      <select
                        id="set-lang"
                        className="modal-select"
                        value={appLang}
                        onChange={(e) => setAppLang(e.target.value)}
                      >
                        <option value="en">English (India / International)</option>
                        <option value="te">తెలుగు (Telugu)</option>
                        <option value="hi">हिन्दी (Hindi)</option>
                        <option value="ta">தமிழ் (Tamil)</option>
                        <option value="kn">ಕನ್ನಡ (Kannada)</option>
                      </select>
                      <small className="field-hint">Primary language for tables, charts, and reports</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="set-date">Date Format</label>
                      <select
                        id="set-date"
                        className="modal-select"
                        value={appDateFormat}
                        onChange={(e) => setAppDateFormat(e.target.value)}
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (Standard Indian - 19/11/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format - 2026-11-19)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (US Format - 11/19/2026)</option>
                      </select>
                      <small className="field-hint">Used across transaction ledgers and harvest dates</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="set-tz">Time Zone</label>
                      <select
                        id="set-tz"
                        className="modal-select"
                        value={appTimezone}
                        onChange={(e) => setAppTimezone(e.target.value)}
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST • UTC+05:30)</option>
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST • UTC+04:00)</option>
                      </select>
                      <small className="field-hint">Applied to audit timestamps and payment logs</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="set-currency">Currency Display</label>
                      <select
                        id="set-currency"
                        className="modal-select"
                        value={appCurrency}
                        onChange={(e) => setAppCurrency(e.target.value)}
                      >
                        <option value="INR">INR (₹ - Indian Rupee)</option>
                        <option value="USD">USD ($ - US Dollar)</option>
                        <option value="EUR">EUR (€ - Euro)</option>
                      </select>
                      <small className="field-hint">Financial symbol for income, expenses, and invoices</small>
                    </div>
                  </div>

                  <div className="modal-actions-bar">
                    {settingsSavedFeedback && (
                      <span className="save-success-feedback">
                        ✓ Preferences saved to workspace
                      </span>
                    )}
                    <button type="submit" className="primary-modal-btn">
                      Save Account Settings
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* -----------------------------------------------------------------
                MODAL 3: SECURITY & PRIVACY
                ----------------------------------------------------------------- */}
            {activeModal === 'security' && (
              <div className="modal-body">
                <div className="modal-header-block">
                  <div className="modal-icon-header">🛡️</div>
                  <div>
                    <h2 className="modal-title">Security & Privacy</h2>
                    <p className="modal-subtitle">
                      Credentials, session authentication, and enterprise access auditing
                    </p>
                  </div>
                </div>

                <div className="security-sections">
                  {/* Password Change */}
                  <form onSubmit={handleChangePassword} className="security-subcard">
                    <h3 className="subcard-title">Change Password</h3>
                    <div className="form-group">
                      <label htmlFor="pw-cur">Current Password</label>
                      <input
                        id="pw-cur"
                        type="password"
                        className="modal-input"
                        value={pwCurrent}
                        onChange={(e) => setPwCurrent(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="pw-new">New Password</label>
                        <input
                          id="pw-new"
                          type="password"
                          className="modal-input"
                          value={pwNew}
                          onChange={(e) => setPwNew(e.target.value)}
                          placeholder="Min 8 characters"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="pw-conf">Confirm New Password</label>
                        <input
                          id="pw-conf"
                          type="password"
                          className="modal-input"
                          value={pwConfirm}
                          onChange={(e) => setPwConfirm(e.target.value)}
                          placeholder="Re-enter new password"
                        />
                      </div>
                    </div>

                    {pwFeedback.text && (
                      <div className={`form-feedback ${pwFeedback.type}`}>
                        {pwFeedback.type === 'success' ? '✓ ' : '⚠️ '}
                        {pwFeedback.text}
                      </div>
                    )}

                    <div style={{ textAlign: 'right', marginTop: '12px' }}>
                      <button type="submit" className="primary-modal-btn">
                        Update Password
                      </button>
                    </div>
                  </form>

                  {/* Active Sessions */}
                  <div className="security-subcard">
                    <h3 className="subcard-title">Active Sessions & Devices</h3>
                    <div className="session-item active">
                      <div className="session-icon">💻</div>
                      <div className="session-info">
                        <strong>Windows PC • Google Chrome (Current Session)</strong>
                        <span>IP: 127.0.0.1 • Hyderabad, India</span>
                      </div>
                      <span className="session-badge-current">Active Now</span>
                    </div>
                    <div className="session-item">
                      <div className="session-icon">📱</div>
                      <div className="session-info">
                        <strong>Mobile Web • Safari (iOS)</strong>
                        <span>Last active: Yesterday at 08:45 PM</span>
                      </div>
                      <span className="session-badge-past">Signed out</span>
                    </div>
                  </div>

                  {/* Two-Factor Authentication (Future-ready) */}
                  <div className="security-subcard future-ready-card">
                    <div className="future-ready-header">
                      <div>
                        <h3 className="subcard-title">Two-Factor Authentication (2FA)</h3>
                        <p className="subcard-desc">
                          Require an authentication app (TOTP) or biometric key upon sign-in.
                        </p>
                      </div>
                      <span className="future-pill">Enterprise Roadmap (Q3 2026)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* -----------------------------------------------------------------
                MODAL 4: NOTIFICATION PREFERENCES
                ----------------------------------------------------------------- */}
            {activeModal === 'notifications' && (
              <div className="modal-body">
                <div className="modal-header-block">
                  <div className="modal-icon-header">🔔</div>
                  <div>
                    <h2 className="modal-title">Notification Preferences</h2>
                    <p className="modal-subtitle">
                      Control which operational alerts and financial reminders you receive
                    </p>
                  </div>
                </div>

                {prefsSavedFeedback && (
                  <div className="prefs-toast">✓ Preferences updated and saved</div>
                )}

                <div className="notif-prefs-list">
                  <div className="notif-pref-row">
                    <div className="pref-copy">
                      <strong>General Notifications</strong>
                      <p>System announcements, seasonal calendar reminders, and maintenance updates.</p>
                    </div>
                    <button
                      type="button"
                      className={`toggle-switch ${notifPrefs.general ? 'on' : 'off'}`}
                      onClick={() => handleTogglePref('general')}
                      aria-label="Toggle General Notifications"
                    >
                      <span className="toggle-slider" />
                    </button>
                  </div>

                  <div className="notif-pref-row">
                    <div className="pref-copy">
                      <strong>Payment Reminders</strong>
                      <p>Supplier invoice due dates, customer receivable alerts, and pending vouchers.</p>
                    </div>
                    <button
                      type="button"
                      className={`toggle-switch ${notifPrefs.payments ? 'on' : 'off'}`}
                      onClick={() => handleTogglePref('payments')}
                      aria-label="Toggle Payment Reminders"
                    >
                      <span className="toggle-slider" />
                    </button>
                  </div>

                  <div className="notif-pref-row">
                    <div className="pref-copy">
                      <strong>Loan Reminders</strong>
                      <p>Kisan Credit Card (KCC) schedules, interest accruals, and bank repayment dates.</p>
                    </div>
                    <button
                      type="button"
                      className={`toggle-switch ${notifPrefs.loans ? 'on' : 'off'}`}
                      onClick={() => handleTogglePref('loans')}
                      aria-label="Toggle Loan Reminders"
                    >
                      <span className="toggle-slider" />
                    </button>
                  </div>

                  <div className="notif-pref-row">
                    <div className="pref-copy">
                      <strong>Low-Stock Alerts</strong>
                      <p>Immediate notifications when seed, fertilizer, or pesticide inventory reaches reorder level.</p>
                    </div>
                    <button
                      type="button"
                      className={`toggle-switch ${notifPrefs.lowStock ? 'on' : 'off'}`}
                      onClick={() => handleTogglePref('lowStock')}
                      aria-label="Toggle Low Stock Alerts"
                    >
                      <span className="toggle-slider" />
                    </button>
                  </div>

                  <div className="notif-pref-row">
                    <div className="pref-copy">
                      <strong>Account & Security Notifications</strong>
                      <p>Alerts for new sign-ins from unrecognized devices or administrative password changes.</p>
                    </div>
                    <button
                      type="button"
                      className={`toggle-switch ${notifPrefs.security ? 'on' : 'off'}`}
                      onClick={() => handleTogglePref('security')}
                      aria-label="Toggle Security Notifications"
                    >
                      <span className="toggle-slider" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* -----------------------------------------------------------------
                MODAL 5: HELP & SUPPORT
                ----------------------------------------------------------------- */}
            {activeModal === 'support' && (
              <div className="modal-body">
                <div className="modal-header-block">
                  <div className="modal-icon-header">💬</div>
                  <div>
                    <h2 className="modal-title">Help & Enterprise Support</h2>
                    <p className="modal-subtitle">
                      Documentation, FAQ resources, and direct assistance for your farm operations
                    </p>
                  </div>
                </div>

                <div className="support-sections">
                  {/* Quick Cards: User Guide & Contact */}
                  <div className="support-cards-grid">
                    <div className="support-card">
                      <span className="support-card-icon">📖</span>
                      <strong>User Guide</strong>
                      <p>Step-by-step documentation for Crop Cycles, Ledger Vouchers, and Inventory.</p>
                      <button
                        type="button"
                        className="support-link-btn"
                        onClick={() => {
                          setActiveModal(null)
                          selectItem && selectItem('Dashboard')
                        }}
                      >
                        Explore Guide Topics →
                      </button>
                    </div>

                    <div className="support-card">
                      <span className="support-card-icon">📞</span>
                      <strong>Contact Support</strong>
                      <p>Email: <code>support@agriman.in</code><br />Toll-Free: <code>1800-419-AGRI</code></p>
                      <small>Mon – Sat • 8:00 AM – 8:00 PM IST</small>
                    </div>
                  </div>

                  {/* FAQs */}
                  <div className="faq-section">
                    <h3 className="section-heading">Frequently Asked Questions</h3>
                    <div className="faq-item">
                      <div
                        className="faq-question"
                        onClick={() => setFaqExpanded((prev) => ({ ...prev, 0: !prev[0] }))}
                      >
                        <span>How do I record a new crop planting season?</span>
                        <span className="faq-arrow">{faqExpanded[0] ? '▲' : '▼'}</span>
                      </div>
                      {faqExpanded[0] && (
                        <div className="faq-answer">
                          Navigate to <strong>Agriculture → Crops</strong> or <strong>Crop Master</strong> in the sidebar. Select your field plot, choose the crop variety, specify planting acreage, and save your crop cycle.
                        </div>
                      )}
                    </div>

                    <div className="faq-item">
                      <div
                        className="faq-question"
                        onClick={() => setFaqExpanded((prev) => ({ ...prev, 1: !prev[1] }))}
                      >
                        <span>How are Profit & Loss calculations generated?</span>
                        <span className="faq-arrow">{faqExpanded[1] ? '▲' : '▼'}</span>
                      </div>
                      {faqExpanded[1] && (
                        <div className="faq-answer">
                          Under <strong>Reports → P&L</strong>, AGRIMAN aggregates verified crop sales against documented input costs (fertilizers, seeds, labor, machinery hire) for real-time net margin analysis.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Report an Issue Form */}
                  <form onSubmit={handleSubmitSupport} className="issue-form">
                    <h3 className="section-heading">Report an Issue or Feedback</h3>
                    <div className="form-group">
                      <label htmlFor="sup-cat">Category</label>
                      <select
                        id="sup-cat"
                        className="modal-select"
                        value={supportCategory}
                        onChange={(e) => setSupportCategory(e.target.value)}
                      >
                        <option value="General Query">General Query</option>
                        <option value="Calculation / Accounting">Calculation / Accounting Discrepancy</option>
                        <option value="Inventory / Stock">Inventory / Warehouse Issue</option>
                        <option value="Performance / UI">Performance or Display Issue</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="sup-msg">Describe the issue</label>
                      <textarea
                        id="sup-msg"
                        rows="3"
                        className="modal-textarea"
                        placeholder="Provide details about what you observed..."
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        required
                      />
                    </div>
                    {supportFeedback && (
                      <div className="form-feedback success">✓ {supportFeedback}</div>
                    )}
                    <button type="submit" className="primary-modal-btn">
                      Submit Ticket
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}