import { useState } from 'react'
import './login.css'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    onLogin(email)
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <a className="login-brand" href="#home"><span className="login-brand-mark">+</span> AGRIMAN</a>
        <div className="login-kicker">WELCOME TO AGRIMAN</div>
        <h1 id="login-title">Welcome back</h1>
        <p className="login-intro">Sign in to manage your farm with confidence.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" autoComplete="username" placeholder="Enter your email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="login-password">Password</label>
          <div className="password-field">
            <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button type="button" className="show-password" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          <div className="login-options">
            <label className="remember-label"><input type="checkbox" /> <span>Remember me</span></label>
            <a href="mailto:support@agriman.local?subject=Password%20reset">Forgot password?</a>
          </div>
          <button className="login-submit" type="submit">Sign in <span>→</span></button>
        </form>
        <div className="login-help">Need help? <a href="mailto:support@agriman.local">Contact AGRIMAN support</a></div>
        <div className="login-demo-note">Demo screen: credentials are not verified by a server.</div>
      </section>
    </main>
  )
}
