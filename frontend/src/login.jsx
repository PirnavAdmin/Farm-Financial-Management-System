import { useState } from 'react'
function ArrowLeft({ size = 24, className = '', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}
import './login.css'
import farmBg from './assets/agriman-farm-bg.jpg'
import { authRequest } from './auth.js'

// Feature highlight icons - exact match to reference
function SproutIcon() {
  return (
    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 21c3-3 5-8 5-13" />
      <path d="M12 8c2.5-4 7-4 8-1-1 4-5 4-8 1Z" />
      <path d="M11 13c-3-2-6-1-7 2 2 2 6 0 7-2Z" />
      <path d="M9 18c-2-1-4 0-4.5 1.5 1.5 1.5 4 0.5 4.5-1.5Z" />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="13.5" width="4.5" height="7.5" rx="0.6" />
      <rect x="10" y="8" width="4.5" height="13" rx="0.6" />
      <rect x="16" y="3.5" width="4.5" height="17.5" rx="0.6" />
    </svg>
  )
}

function WeatherIcon() {
  return (
    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 13.5H7a4 4 0 0 1-1-7.87 5 5 0 0 1 9.5-1.5A3.5 3.5 0 0 1 17.5 13.5Z" />
      <circle cx="8" cy="17" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="16" cy="17" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="10" cy="20.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="14" cy="20.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 3 20 7.5 12 12 4 7.5" />
      <path d="m4 12 8 4.5 8-4.5" />
      <path d="m4 16.5 8 4.5 8-4.5" />
    </svg>
  )
}

// Form icons
function MailIcon() {
  return (
    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg className="toggle-password-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
      </svg>
    )
  }
  return (
    <svg className="toggle-password-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg className="btn-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

function UserPlusIcon() {
  return (
    <svg className="btn-user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  )
}

export default function Login({ onLogin, onBackToHome }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [view, setView] = useState('login')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function runRequest(action) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
    } catch (requestError) {
      setError(requestError.message || 'Unable to complete the request. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function handleSignInSubmit(event) {
    event.preventDefault()
    const trimmedEmail = identifier.trim()
    if (!trimmedEmail) {
      setError('Please enter your email address.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    runRequest(async () => {
      const result = await authRequest('login', {
        body: {
          identifier: trimmedEmail,
          password,
          rememberMe,
        },
      })
      const token =
        result.accessToken ||
        result.access_token ||
        result.token ||
        result.jwtToken ||
        result.data?.accessToken ||
        result.data?.access_token ||
        result.data?.token
      const user = result.user || result.data?.user || { email: trimmedEmail }
      if (!token) throw new Error('The server did not return a login token.')
      onLogin(
        user,
        token,
        rememberMe,
        trimmedEmail,
        result.refreshToken ||
          result.refresh_token ||
          result.data?.refreshToken ||
          result.data?.refresh_token
      )
    })
  }

  function openForgotPassword() {
    setError('')
    setNotice('')
    setView('request-otp')
  }

  function backToLogin() {
    setError('')
    setNotice('')
    setView('login')
  }

  function handleRegisterClick() {
    setNotice('New Farmer Registration will be available shortly or contact administrator.')
  }

  const titles = {
    login: ['Welcome Back', 'Sign in to manage your farm with confidence.'],
    'request-otp': ['Forgot password?', 'Enter your account email to receive a verification code.'],
    'verify-otp': ['Check your email', `Enter the 6-digit code sent to ${identifier}.`],
    'reset-password': ['Set a new password', 'Choose a new password for your account.'],
    complete: ['Password updated', 'Your password has been changed. You can now sign in.'],
  }

  return (
    <main className="agriman-login-container" style={{ backgroundImage: `url(${farmBg})` }}>
      {/* LEFT SECTION: Introduction & Feature Highlights */}
      <section className="agriman-left-intro">
        <div className="agriman-intro-content">
          <h1 className="agriman-main-heading">
            <span className="heading-line-dark">Smart Farming.</span>
            <span className="heading-line-green">Better Yields.</span>
          </h1>

          <div className="heading-accent-bar" aria-hidden="true" />

          <p className="agriman-intro-description">
            Plan, Monitor and Manage your Farm Operations
            <br />
            with AGRIMAN.
          </p>
        </div>

        {/* Four Feature Highlights in one horizontal row with vertical separators */}
        <div className="agriman-features-row" role="region" aria-label="Key Features">
          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <SproutIcon />
            </div>
            <span className="feature-label">Crop<br />Management</span>
          </div>

          <div className="feature-separator" aria-hidden="true" />

          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <BarChartIcon />
            </div>
            <span className="feature-label">Farm<br />Analytics</span>
          </div>

          <div className="feature-separator" aria-hidden="true" />

          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <WeatherIcon />
            </div>
            <span className="feature-label">Weather<br />Updates</span>
          </div>

          <div className="feature-separator" aria-hidden="true" />

          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <LayersIcon />
            </div>
            <span className="feature-label">Resource<br />Planning</span>
          </div>
        </div>
      </section>

      {/* RIGHT SECTION: Translucent Frosted Glass Login Panel */}
      <section className="agriman-right-panel" aria-label="Login Panel">
        <div className="agriman-glass-card">
          {/* Header with Top-Left Back to Home and Centered AGRIMAN Logo */}
          <div className="agriman-card-header">
            {onBackToHome && (
              <button
                type="button"
                className="agriman-back-home-btn"
                onClick={onBackToHome}
                aria-label="Back to Home"
                title="Back to Home"
              >
                <ArrowLeft size={22} className="back-arrow-icon" aria-hidden="true" />
              </button>
            )}

            <div className="agriman-logo-header">
              <a
                href="#home"
                onClick={(e) => {
                  if (onBackToHome) {
                    e.preventDefault()
                    onBackToHome()
                  }
                }}
                className="agriman-logo-link"
                aria-label="Return to AGRIMAN home"
              >
                <img
                  src="/agriman-logo.png"
                  alt="AGRIMAN Farm Management Logo"
                  className="agriman-brand-logo"
                />
              </a>
            </div>
          </div>

          <div className="panel-headings">
            <h2 className="panel-title">{titles[view][0]}</h2>
            <p className="panel-subtitle">{titles[view][1]}</p>
          </div>

          {error && (
            <div className="auth-alert auth-error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="auth-alert auth-success" role="status">
              {notice}
            </div>
          )}

          {/* VIEW: Login Form */}
          {view === 'login' && (
            <form className="login-form-body" onSubmit={handleSignInSubmit} noValidate>
              {/* Email Field */}
              <div className="input-group">
                <span className="input-leading-icon" aria-hidden="true">
                  <MailIcon />
                </span>
                <input
                  id="agriman-email-input"
                  className="pill-input"
                  type="email"
                  autoComplete="username"
                  placeholder="Enter your email address"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    if (error) setError('')
                  }}
                  required
                />
              </div>

              {/* Password Field */}
              <div className="input-group">
                <span className="input-leading-icon" aria-hidden="true">
                  <LockIcon />
                </span>
                <input
                  id="agriman-password-input"
                  className="pill-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  required
                />
                <button
                  type="button"
                  className="input-trailing-action"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>

              {/* Options: Remember me & Forgot password */}
              <div className="account-options-row">
                <label className="remember-me-toggle">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={openForgotPassword}
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="btn-primary-sign-in"
                disabled={busy}
              >
                <span>{busy ? 'Signing Inâ€¦' : 'Sign In'}</span>
                <ArrowRightIcon />
              </button>

              {/* Divider */}
              <div className="or-divider">
                <span className="divider-line" />
                <span className="divider-text">or</span>
                <span className="divider-line" />
              </div>

              {/* New Farmer Registration */}
              <button
                type="button"
                className="btn-secondary-register"
                onClick={handleRegisterClick}
              >
                <UserPlusIcon />
                <span>New Farmer Registration</span>
              </button>
            </form>
          )}

          {/* VIEW: Request OTP */}
          {view === 'request-otp' && (
            <form
              className="login-form-body"
              onSubmit={(e) => {
                e.preventDefault()
                runRequest(async () => {
                  const result = await authRequest('forgot-password', {
                    body: { identifier: identifier.trim() },
                  })
                  setOtp('')
                  setResetToken('')
                  setView('verify-otp')
                  setNotice(
                    result.message ||
                      'If an account exists for this email, a verification code has been sent.'
                  )
                })
              }}
            >
              <div className="input-group">
                <span className="input-leading-icon" aria-hidden="true">
                  <MailIcon />
                </span>
                <input
                  className="pill-input"
                  type="email"
                  autoComplete="username"
                  placeholder="Enter your account email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary-sign-in"
                disabled={busy}
              >
                <span>{busy ? 'Sending Codeâ€¦' : 'Send Verification Code'}</span>
                <ArrowRightIcon />
              </button>

              <button
                type="button"
                className="btn-back-link"
                onClick={backToLogin}
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* VIEW: Verify OTP */}
          {view === 'verify-otp' && (
            <form
              className="login-form-body"
              onSubmit={(e) => {
                e.preventDefault()
                runRequest(async () => {
                  const result = await authRequest('verify-otp', {
                    body: { identifier: identifier.trim(), otp },
                  })
                  setResetToken(result.resetToken || result.reset_token || result.token || '')
                  setView('reset-password')
                  setNotice(result.message || 'Verification successful. Choose a new password.')
                })
              }}
            >
              <div className="input-group">
                <input
                  className="pill-input otp-code-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary-sign-in"
                disabled={busy}
              >
                <span>{busy ? 'Verifyingâ€¦' : 'Verify Code'}</span>
                <ArrowRightIcon />
              </button>

              <button
                type="button"
                className="btn-back-link"
                onClick={() => {
                  setView('request-otp')
                  setOtp('')
                  setNotice('')
                  setError('')
                }}
              >
                Resend code or use different email
              </button>
            </form>
          )}

          {/* VIEW: Reset Password */}
          {view === 'reset-password' && (
            <form
              className="login-form-body"
              onSubmit={(e) => {
                e.preventDefault()
                if (newPassword !== confirmPassword) {
                  setError('Passwords do not match.')
                  return
                }
                runRequest(async () => {
                  const result = await authRequest('reset-password', {
                    body: {
                      identifier: identifier.trim(),
                      ...(resetToken ? { resetToken } : { otp }),
                      newPassword,
                      confirmPassword,
                    },
                  })
                  setView('complete')
                  setPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setNotice(result.message || 'Your password was updated successfully.')
                })
              }}
            >
              <div className="input-group">
                <span className="input-leading-icon" aria-hidden="true">
                  <LockIcon />
                </span>
                <input
                  className="pill-input"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="New password (min 8 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="input-trailing-action"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  <EyeIcon visible={showNewPassword} />
                </button>
              </div>

              <div className="input-group">
                <span className="input-leading-icon" aria-hidden="true">
                  <LockIcon />
                </span>
                <input
                  className="pill-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="input-trailing-action"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  <EyeIcon visible={showConfirmPassword} />
                </button>
              </div>

              <button
                type="submit"
                className="btn-primary-sign-in"
                disabled={busy}
              >
                <span>{busy ? 'Updatingâ€¦' : 'Update Password'}</span>
                <ArrowRightIcon />
              </button>
            </form>
          )}

          {/* VIEW: Complete */}
          {view === 'complete' && (
            <div className="login-form-body">
              <button
                type="button"
                className="btn-primary-sign-in"
                onClick={backToLogin}
              >
                <span>Back to Sign In</span>
                <ArrowRightIcon />
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
