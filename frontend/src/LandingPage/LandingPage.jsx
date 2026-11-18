import React, { useState, useEffect, useRef } from 'react'
import './LandingPage.css'
import HowItWorks from './HowItWorks'
import EssentialTools from './EssentialTools'
import AboutSection from './AboutSection'
import Footer from './Footer'

export default function LandingPage({ onNavigateToLogin }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0) // 0: Traditional, 1: Modern
  const [autoPlay, setAutoPlay] = useState(true)
  const [activeNav, setActiveNav] = useState('home')

  // Agricultural scenes for traditional-to-modern transition
  const slides = [
    {
      id: 'traditional',
      tag: 'TRADITIONAL AGRICULTURE',
      period: 'Heritage Farming',
      image: '/hero-traditional-farming.jpg',
      badge: 'From Traditional Farming to Modern Farm Management',
      title: 'Manage Your Farm with AGRIMAN',
      subtitle: 'Honoring agricultural roots while empowering farmers with structured digital record-keeping.',
      description: 'Organize your crops, land, finance, inventory and farm operations in one place.'
    },
    {
      id: 'modern',
      tag: 'MODERN MECHANIZATION',
      period: 'Advanced Farm Operations',
      image: '/hero-modern-farming.jpg',
      badge: 'From Traditional Farming to Modern Farm Management',
      title: 'Manage Your Farm with AGRIMAN',
      subtitle: 'Streamline modern field machinery, seasonal crop cycles, and farm accounting effortlessly.',
      description: 'Organize your crops, land, finance, inventory and farm operations in one place.'
    }
  ]

  // Dynamic scroll unlock on mount & cleanup on unmount
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const root = document.getElementById('root')

    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevRootOverflow = root ? root.style.overflow : ''

    html.style.overflow = 'auto'
    body.style.overflow = 'auto'
    if (root) {
      root.style.overflow = 'auto'
    }

    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      if (root) {
        root.style.overflow = prevRootOverflow
      }
    }
  }, [])

  // Auto-cycle the traditional-to-modern cinematic transition every 8 seconds
  useEffect(() => {
    if (!autoPlay) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === 0 ? 1 : 0))
    }, 8000)
    return () => clearInterval(interval)
  }, [autoPlay])

  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false)
    setActiveNav(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const nextSlide = () => {
    setAutoPlay(false)
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setAutoPlay(false)
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  return (
    <div className="agriman-landing">
      {/* ====================================================================
          1. HEADER / NAVIGATION BAR
          ==================================================================== */}
      <header className="landing-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <a href="#home" className="navbar-brand-link" onClick={(e) => { e.preventDefault(); handleNavClick('home') }}>
              <img
                src="/agriman-logo.png"
                alt="AGRIMAN Logo"
                className="navbar-logo"
              />
              <div className="navbar-brand-text">
                <span className="navbar-brand-name">AGRIMAN</span>
                <span className="navbar-brand-tagline">From Traditional Wisdom to Modern Management</span>
              </div>
            </a>
          </div>

          <nav className="desktop-nav" aria-label="Main Navigation">
            <button
              type="button"
              className={`nav-link ${activeNav === 'home' ? 'active' : ''}`}
              onClick={() => handleNavClick('home')}
            >
              Home
            </button>
            <button
              type="button"
              className={`nav-link ${activeNav === 'about' ? 'active' : ''}`}
              onClick={() => handleNavClick('about')}
            >
              About
            </button>
            <button
              type="button"
              className={`nav-link ${activeNav === 'features' ? 'active' : ''}`}
              onClick={() => handleNavClick('features')}
            >
              Features
            </button>
            <button
              type="button"
              className={`nav-link ${activeNav === 'how-it-works' ? 'active' : ''}`}
              onClick={() => handleNavClick('how-it-works')}
            >
              How It Works
            </button>

            <div className="nav-actions">
              <button
                type="button"
                className="nav-login-btn"
                onClick={onNavigateToLogin}
              >
                Login
              </button>
            </div>
          </nav>

          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-nav-drawer" role="dialog" aria-modal="true">
            <button type="button" className="mobile-nav-link" onClick={() => handleNavClick('home')}>
              Home
            </button>
            <button type="button" className="mobile-nav-link" onClick={() => handleNavClick('about')}>
              About
            </button>
            <button type="button" className="mobile-nav-link" onClick={() => handleNavClick('features')}>
              Features
            </button>
            <button type="button" className="mobile-nav-link" onClick={() => handleNavClick('how-it-works')}>
              How It Works
            </button>
            <div className="mobile-drawer-actions">
              <button
                type="button"
                className="mobile-login-btn"
                onClick={() => { setMobileMenuOpen(false); onNavigateToLogin(); }}
              >
                Login
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ====================================================================
          2. CINEMATIC AGRICULTURAL HERO SECTION
             - Traditional & Modern Farming Backgrounds
             - Traditional-to-Modern Transition Animation
             - Independent Foreground Moving Tractor with Wheels & Dust
             - Navigation Controls & Slide Indicators
          ==================================================================== */}
      <section id="home" className="hero-cinematic-section">
        {/* Cinematic Background Layer with Smooth Transition */}
        <div className="hero-background-wrapper">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`hero-slide-layer ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
              aria-hidden={index !== currentSlide}
            >
              {/* Optional Background Video Support Container */}
              <div className="hero-video-fallback-container">
                {/* A video tag is supported here when an approved MP4 video stream is provided */}
              </div>
            </div>
          ))}
          {/* Dark Emerald Cinematic Overlay for Readability */}
          <div className="hero-cinematic-overlay" />
        </div>

        {/* Foreground Animated Moving Scene (Scene 1: Traditional Ploughing | Scene 2: Modern Tractor) */}
        {currentSlide === 0 ? (
          <div className="hero-foreground-traditional-track" aria-hidden="true">
            <div className="moving-traditional-unit">
              {/* Detailed Realistic Traditional Indian Farmer, Wooden Plough, and Two Bullocks */}
              <svg
                className="traditional-plough-svg"
                viewBox="0 0 340 130"
                width="310"
                height="115"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* 1. TRADITIONAL WOODEN PLOUGH (HAL) & CONNECTING BEAMS */}
                {/* Long wooden pole/beam (Haris) from plough to the bullocks' yoke */}
                <path d="M106 104 L240 50" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
                <path d="M108 106 L242 52" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />

                {/* Wooden Plough Body & Share digging into soil */}
                <path d="M96 98 L124 104 L132 112 L100 112 Z" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
                <path d="M120 106 L134 112 L124 112 Z" fill="#94A3B8" stroke="#475569" strokeWidth="1" />

                {/* Wooden Stilt / Handle (Muthiya) held by farmer */}
                <path d="M102 100 L64 62 L58 64" stroke="#92400E" strokeWidth="3.5" strokeLinecap="round" />

                {/* Leather/Coir Reins (Rassi) from farmer's hands leading to bullocks */}
                <path d="M58 64 Q140 76 270 56" stroke="#FEF08A" strokeWidth="1.5" strokeDasharray="4 2" fill="none" opacity="0.9" />
                <path d="M58 64 Q150 80 290 58" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="4 2" fill="none" opacity="0.85" />

                {/* 2. INDIAN FARMER (KISAN) WALKING POSTURE */}
                <g className="farmer-character-group">
                  {/* Farmer Head & Saffron Turban (Pagri) */}
                  <g className="farmer-head">
                    <circle cx="38" cy="34" r="7" fill="#D97706" />
                    {/* Turban folds */}
                    <path d="M30 32 C30 21 47 21 47 29 C48 35 44 38 38 38 C32 38 30 35 30 32 Z" fill="#EA580C" stroke="#C2410C" strokeWidth="1" />
                    <path d="M31 34 L26 44 L30 46 Z" fill="#F97316" />
                  </g>

                  {/* Farmer Upper Body / White Kurta */}
                  <path d="M33 42 L47 42 L45 72 L31 72 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                  <path d="M38 42 L40 48 L43 42" stroke="#CBD5E1" strokeWidth="1.2" />

                  {/* Arms gripping the wooden plough handle */}
                  <path d="M41 46 L56 60 L62 64" stroke="#D97706" strokeWidth="3.5" strokeLinecap="round" />
                  <circle cx="62" cy="64" r="2.8" fill="#B45309" />

                  {/* Dhoti */}
                  <path d="M31 72 L45 72 L43 88 L33 88 Z" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1" />

                  {/* Animated Walking Legs */}
                  <g className="farmer-leg-front">
                    <path d="M42 86 L48 100 L53 112" stroke="#D97706" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M53 112 L59 113.5" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
                  </g>
                  <g className="farmer-leg-back">
                    <path d="M34 86 L29 100 L25 112" stroke="#B45309" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M25 112 L31 113.5" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
                  </g>
                </g>

                {/* 3. FAR BULLOCK (BACKGROUND BULLOCK - SLIGHT SHADE FOR DEPTH) */}
                <g className="bullock-far-group" opacity="0.82">
                  {/* Body & Dorsal Hump */}
                  <path d="M175 66 C175 54 190 48 206 48 C215 48 220 38 232 40 C242 43 252 54 262 54 L268 70 L260 84 L178 84 Z" fill="#CBD5E1" />
                  <path d="M220 40 C224 32 236 32 239 41 Z" fill="#94A3B8" />
                  {/* Head & Horns */}
                  <path d="M262 52 L280 46 L286 54 L274 62 Z" fill="#E2E8F0" />
                  <path d="M270 47 Q272 32 264 28" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  {/* Legs */}
                  <g className="bullock-far-leg-front">
                    <path d="M258 82 L264 98 L268 112" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
                    <path d="M266 110 L270 112" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
                  </g>
                  <g className="bullock-far-leg-back">
                    <path d="M184 82 L180 98 L176 112" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
                    <path d="M174 110 L178 112" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
                  </g>
                </g>

                {/* 4. NEAR BULLOCK (PROMINENT WHITE/CREAM ZEBU BULLOCK) */}
                <g className="bullock-near-group">
                  {/* Muscular Body */}
                  <path d="M195 64 C195 52 210 48 226 48 C234 48 238 36 250 38 C262 42 274 52 286 52 L292 70 L284 86 L198 86 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.2" />
                  {/* Dorsal Hump */}
                  <path d="M236 40 C240 28 255 28 259 41 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
                  {/* Dewlap */}
                  <path d="M280 62 Q287 76 274 80" stroke="#CBD5E1" strokeWidth="2" fill="none" />
                  {/* Head, Eyes, Snout & Curved Horns */}
                  <path d="M284 52 L306 46 L314 54 L300 64 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                  <ellipse cx="310" cy="53" rx="4.5" ry="3.5" fill="#475569" />
                  <circle cx="295" cy="50" r="2" fill="#1F2937" />
                  <path d="M286 54 Q280 60 284 64" stroke="#94A3B8" strokeWidth="1.5" fill="#F1F5F9" />
                  {/* Characteristic Curved Horns */}
                  <path d="M295 48 Q300 28 288 22" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path d="M299 47 Q306 30 298 24" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                  {/* Tail with Tuft */}
                  <path d="M195 66 Q188 82 190 96" stroke="#CBD5E1" strokeWidth="2" fill="none" />
                  <path d="M190 96 L193 104 L187 102 Z" fill="#334155" />

                  {/* Wooden Yoke (Jua) resting across the shoulders */}
                  <rect x="228" y="42" width="36" height="6.5" rx="2" fill="#92400E" stroke="#78350F" strokeWidth="1" />
                  <circle cx="234" cy="45" r="2.5" fill="#FDE68A" />
                  <circle cx="258" cy="45" r="2.5" fill="#FDE68A" />

                  {/* Walking Front Legs with Dynamic Stride */}
                  <g className="bullock-leg-front-left">
                    <path d="M276 84 L282 100 L286 112" stroke="#E2E8F0" strokeWidth="4.5" strokeLinecap="round" />
                    <path d="M284 110 L288 112" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
                  </g>
                  <g className="bullock-leg-front-right">
                    <path d="M284 84 L288 100 L292 112" stroke="#CBD5E1" strokeWidth="4.5" strokeLinecap="round" />
                    <path d="M290 110 L294 112" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
                  </g>

                  {/* Walking Back Legs with Dynamic Stride */}
                  <g className="bullock-leg-back-left">
                    <path d="M204 84 L200 98 L196 112" stroke="#E2E8F0" strokeWidth="4.5" strokeLinecap="round" />
                    <path d="M194 110 L198 112" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
                  </g>
                  <g className="bullock-leg-back-right">
                    <path d="M214 84 L210 98 L206 112" stroke="#CBD5E1" strokeWidth="4.5" strokeLinecap="round" />
                    <path d="M204 110 L208 112" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
                  </g>
                </g>
              </svg>

              {/* Trailing Soil Dust & Fresh Furrows Behind Wooden Plough */}
              <div className="traditional-soil-dust">
                <span className="soil-dust-particle s-dust-1" />
                <span className="soil-dust-particle s-dust-2" />
                <span className="soil-dust-particle s-dust-3" />
              </div>
            </div>
          </div>
        ) : (
          <div className="hero-foreground-tractor-track" aria-hidden="true">
            <div className="moving-tractor-unit">
              {/* Detailed Realistic Green Agricultural Tractor SVG with Yellow Wheels */}
              <svg
                className="tractor-svg"
                viewBox="0 0 240 130"
                width="210"
                height="115"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Rear Cultivator Implement Hitch */}
                <path d="M12 92 L36 92 M18 92 L18 108 M26 92 L26 108 M34 92 L34 108" stroke="#374151" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M14 108 L22 114 M22 108 L30 114 M30 108 L38 114" stroke="#4B5563" strokeWidth="2.5" strokeLinecap="round" />

                {/* Tractor Body Chassis */}
                <rect x="36" y="70" width="130" height="26" rx="4" fill="#126334" stroke="#0E4A27" strokeWidth="2" />
                {/* Front Engine Hood */}
                <path d="M136 52 L192 58 Q202 60 202 70 L202 92 L136 92 Z" fill="#168044" stroke="#126334" strokeWidth="2" />
                <path d="M166 60 L196 63 L196 68 L166 65 Z" fill="#A8F0BF" opacity="0.8" />
                {/* Radiator Grille & Headlight */}
                <rect x="198" y="66" width="6" height="22" rx="2" fill="#1F2937" />
                <circle cx="198" cy="72" r="3.5" fill="#FEF08A" />
                {/* Exhaust Pipe & Subtle Smoke */}
                <rect x="154" y="24" width="4.5" height="30" rx="1.5" fill="#374151" />
                <path d="M154 24 L158 20" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
                <circle className="exhaust-puff" cx="160" cy="14" r="3" fill="rgba(255,255,255,0.45)" />

                {/* Operator Cabin */}
                <path d="M72 30 L132 30 L136 70 L68 70 Z" fill="#0E4A27" stroke="#126334" strokeWidth="2.5" />
                {/* Cabin Glass Window */}
                <path d="M78 35 L126 35 L129 64 L75 64 Z" fill="#BAE6FD" opacity="0.65" stroke="#38BDF8" strokeWidth="1" />
                {/* Operator Silhouette */}
                <circle cx="98" cy="45" r="7" fill="#E2E8F0" />
                <path d="M90 64 C90 53 106 53 106 64 Z" fill="#F8FAFC" />
                {/* Steering Wheel */}
                <path d="M112 50 L118 56 M114 48 L114 54" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
                {/* Cabin Roof */}
                <rect x="66" y="24" width="74" height="7" rx="3.5" fill="#168044" stroke="#126334" strokeWidth="1.5" />

                {/* Front Wheel (Smaller with Yellow Rim & Rotating Spoke Pattern) */}
                <g className="tractor-wheel front-wheel" transform-origin="178 98">
                  <circle cx="178" cy="98" r="22" fill="#1F2937" stroke="#111827" strokeWidth="4" />
                  {/* Tire Treads */}
                  <circle cx="178" cy="98" r="23" stroke="#374151" strokeWidth="2" strokeDasharray="3 4" fill="none" />
                  {/* Yellow Wheel Rim */}
                  <circle cx="178" cy="98" r="14" fill="#FACC15" stroke="#CA8A04" strokeWidth="2" />
                  {/* Hub & Spokes */}
                  <circle cx="178" cy="98" r="5" fill="#713F12" />
                  <line x1="178" y1="84" x2="178" y2="112" stroke="#CA8A04" strokeWidth="2.5" />
                  <line x1="164" y1="98" x2="192" y2="98" stroke="#CA8A04" strokeWidth="2.5" />
                </g>

                {/* Rear Wheel (Large with Prominent Yellow Rim & Lug Treads) */}
                <g className="tractor-wheel rear-wheel" transform-origin="76 88">
                  <circle cx="76" cy="88" r="36" fill="#1F2937" stroke="#111827" strokeWidth="5" />
                  {/* Deep Agricultural Tire Lugs */}
                  <circle cx="76" cy="88" r="37.5" stroke="#374151" strokeWidth="3" strokeDasharray="5 5" fill="none" />
                  {/* Large Yellow Rim */}
                  <circle cx="76" cy="88" r="23" fill="#FACC15" stroke="#CA8A04" strokeWidth="2.5" />
                  {/* Central Hub & Lug Bolts */}
                  <circle cx="76" cy="88" r="8" fill="#713F12" />
                  <circle cx="76" cy="88" r="4" fill="#FDE047" />
                  <line x1="76" y1="65" x2="76" y2="111" stroke="#CA8A04" strokeWidth="3" />
                  <line x1="53" y1="88" x2="99" y2="88" stroke="#CA8A04" strokeWidth="3" />
                  <line x1="60" y1="72" x2="92" y2="104" stroke="#CA8A04" strokeWidth="3" />
                  <line x1="60" y1="104" x2="92" y2="72" stroke="#CA8A04" strokeWidth="3" />
                </g>
              </svg>

              {/* Trailing Soil Dust Particles */}
              <div className="tractor-dust-particles">
                <span className="dust-particle dust-1" />
                <span className="dust-particle dust-2" />
                <span className="dust-particle dust-3" />
                <span className="dust-particle dust-4" />
              </div>
            </div>
          </div>
        )}

        {/* Hero Content Container */}
        <div className="hero-content-container">
          {/* Top Badge */}
          <div className="hero-evolution-badge">
            <svg
              className="badge-leaf-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
            <span>From Traditional Farming to Modern Farm Management</span>
          </div>

          {/* Main Heading */}
          <h1 className="hero-main-title">
            Manage Your Farm with AGRIMAN
          </h1>

          {/* Description */}
          <p className="hero-subtext">
            Organize your crops, land, finance, inventory and farm operations in one place.
          </p>

          {/* CTA Buttons */}
          <div className="hero-cta-group">
            <button
              type="button"
              className="hero-btn-primary"
              onClick={onNavigateToLogin}
            >
              <span>Get Started</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          {/* Era Quick Switcher Toggle */}
          <div className="hero-scene-toggle" role="tablist" aria-label="Farming Era Views">
            <button
              type="button"
              role="tab"
              aria-selected={currentSlide === 0}
              className={`scene-toggle-pill ${currentSlide === 0 ? 'active' : ''}`}
              onClick={() => { setAutoPlay(false); setCurrentSlide(0); }}
            >
              <span className="toggle-dot" />
              <span>Traditional Ploughing (1950s)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentSlide === 1}
              className={`scene-toggle-pill ${currentSlide === 1 ? 'active' : ''}`}
              onClick={() => { setAutoPlay(false); setCurrentSlide(1); }}
            >
              <span className="toggle-dot" />
              <span>Modern Tractor Mechanization (2026)</span>
            </button>
          </div>
        </div>

        {/* Hero Navigation Controls (Previous / Next) */}
        <button
          type="button"
          className="hero-nav-arrow arrow-prev"
          aria-label="Previous agricultural scene"
          onClick={prevSlide}
        >
          ‹
        </button>
        <button
          type="button"
          className="hero-nav-arrow arrow-next"
          aria-label="Next agricultural scene"
          onClick={nextSlide}
        >
          ›
        </button>

        {/* Slide Indicators near Bottom-Right */}
        <div className="hero-slide-indicators">
          <span className="slide-indicator-label">SCENE {currentSlide + 1} OF 2</span>
          <div className="indicator-bars">
            <button
              type="button"
              aria-label="Scene 1: Traditional Farming"
              className={`indicator-dot ${currentSlide === 0 ? 'active' : ''}`}
              onClick={() => { setAutoPlay(false); setCurrentSlide(0); }}
            />
            <button
              type="button"
              aria-label="Scene 2: Modern Mechanization"
              className={`indicator-dot ${currentSlide === 1 ? 'active' : ''}`}
              onClick={() => { setAutoPlay(false); setCurrentSlide(1); }}
            />
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. HOW AGRIMAN WORKS SECTION
             - Modular replacement component reproducing the visual reference
          ==================================================================== */}
      <HowItWorks onNavigateToLogin={onNavigateToLogin} />

      {/* ====================================================================
          4. ESSENTIAL TOOLS / FEATURES SECTION
             - Premium horizontal scrolling card carousel
          ==================================================================== */}
      <EssentialTools onNavigateToLogin={onNavigateToLogin} />

      {/* ====================================================================
          5. ABOUT AGRIMAN SECTION
             - Left: Agricultural Photograph with floating decorative icons
             - Right: Heading, Description & 3 Feature Information Cards
          ==================================================================== */}
      <AboutSection />

      {/* ====================================================================
          6. PREMIUM CTA BANNER & THREE-COLUMN FOOTER
          ==================================================================== */}
      <Footer onNavigateToLogin={onNavigateToLogin} onNavClick={handleNavClick} />
    </div>
  )
}
