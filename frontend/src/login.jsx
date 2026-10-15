import { useState } from 'react'
import './login.css'

const apiBase = import.meta.env.VITE_API_BASE_URL || ''

async function authRequest(path, payload) {
  const response = await fetch(`${apiBase}/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || result.error || 'Something went wrong. Please try again.')
  return result
}

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [view, setView] = useState('login')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

  const titles = {
    login: ['Welcome back', 'Sign in to manage your farm with confidence.'],
    'request-otp': ['Forgot password?', 'Enter your account email and we’ll send you a verification code.'],
    'verify-otp': ['Check your email', `Enter the 6-digit code sent to ${email}.`],
    'reset-password': ['Set a new password', 'Choose a new password for your account.'],
    complete: ['Password updated', 'Your password has been changed. You can now sign in.'],
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <a className="login-brand" href="#home"><span className="login-brand-mark">+</span> AGRIMAN</a>
        <div className="login-kicker">WELCOME TO AGRIMAN</div>
        <h1 id="login-title">{titles[view][0]}</h1>
        <p className="login-intro">{titles[view][1]}</p>

        {error && <div className="auth-message auth-error" role="alert">{error}</div>}
        {notice && <div className="auth-message auth-success" role="status">{notice}</div>}

        {view === 'login' && <form className="login-form" onSubmit={(event) => { event.preventDefault(); onLogin(email) }}>
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" autoComplete="username" placeholder="Enter your email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="login-password">Password</label>
          <div className="password-field">
            <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button type="button" className="show-password" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          <div className="login-options">
            <label className="remember-label"><input type="checkbox" /> <span>Remember me</span></label>
            <button className="auth-link" type="button" onClick={openForgotPassword}>Forgot password?</button>
          </div>
          <button className="login-submit" type="submit">Sign in <span>→</span></button>
        </form>}

        {view === 'request-otp' && <form className="login-form" onSubmit={(event) => {
          event.preventDefault()
          runRequest(async () => {
            await authRequest('forgot-password', { email })
            setView('verify-otp')
            setNotice('If an account exists for this email, a verification code has been sent.')
          })
        }}>
          <label htmlFor="reset-email">Email</label>
          <input id="reset-email" type="email" autoComplete="email" placeholder="Enter your account email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <button className="login-submit auth-submit" type="submit" disabled={busy}>{busy ? 'Sending code…' : 'Send verification code'} <span>→</span></button>
          <button className="auth-back" type="button" onClick={backToLogin}>Back to sign in</button>
        </form>}

        {view === 'verify-otp' && <form className="login-form" onSubmit={(event) => {
          event.preventDefault()
          runRequest(async () => {
            const result = await authRequest('verify-reset-otp', { email, otp })
            if (!result.resetToken) throw new Error('The server did not return a reset token. Please request a new code.')
            setResetToken(result.resetToken)
            setView('reset-password')
            setNotice('Email verified. Choose a new password.')
          })
        }}>
          <label htmlFor="reset-otp">6-digit verification code</label>
          <input id="reset-otp" className="otp-input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="Enter code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required />
          <button className="login-submit auth-submit" type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Verify code'} <span>→</span></button>
          <button className="auth-back" type="button" onClick={() => { setView('request-otp'); setOtp(''); setNotice(''); setError('') }}>Use a different email or resend code</button>
        </form>}

        {view === 'reset-password' && <form className="login-form" onSubmit={(event) => {
          event.preventDefault()
          if (newPassword !== confirmPassword) {
            setError('Passwords do not match.')
            return
          }
          runRequest(async () => {
            await authRequest('reset-password', { email, resetToken, password: newPassword })
            setView('complete')
            setPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setNotice('Your password was updated successfully.')
          })
        }}>
          <label htmlFor="new-password">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          <label className="confirm-password-label" htmlFor="confirm-password">Confirm new password</label>
          <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} placeholder="Re-enter your password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          <button className="login-submit auth-submit" type="submit" disabled={busy}>{busy ? 'Updating…' : 'Update password'} <span>→</span></button>
        </form>}

        {view === 'complete' && <button className="login-submit auth-submit" type="button" onClick={backToLogin}>Back to sign in <span>→</span></button>}

        <div className="login-help">Need help? <a href="mailto:support@agriman.local">Contact AGRIMAN support</a></div>
        <div className="login-demo-note">Demo screen: credentials are not verified by a server.</div>
      </section>
    </main>
  )
}
