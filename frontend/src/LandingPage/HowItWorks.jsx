import React from 'react';
import './HowItWorks.css';
import howItWorksBg from './how-it-works-bg.jpg';

/**
 * Sub-Component: SectionIntroduction
 * Left column intro resting naturally above the tractor and farmland.
 */
function SectionIntroduction({ onNavigateToLogin }) {
  return (
    <div className="hiw-left-column">
      <div className="hiw-kicker-wrap">
        <span className="hiw-kicker-text">THE AGRIMAN PROCESS</span>
        <span className="hiw-kicker-line" aria-hidden="true" />
      </div>

      <h2 className="hiw-main-heading">
        How <span className="hiw-brand-highlight">AGRIMAN</span> Works
      </h2>

      <p className="hiw-description">
        Get started in three simple steps and bring your farm operations online.
      </p>

      <button
        type="button"
        className="hiw-get-started-btn"
        onClick={onNavigateToLogin}
        aria-label="Get Started with AGRIMAN"
      >
        <span>Get Started</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Sub-Component: WorkflowCard
 * Rebuilt exactly to match the approved reference design:
 * - Dimensions: ~260px wide × ~370px tall
 * - 28px rounded corners, pure white background, subtle border, soft green shadow
 * - 60px dark forest-green circular badge with thick white border (unclipped)
 * - 70px × 70px light-green rounded icon square (18px radius) with ~40px icon
 * - Typography: Titles 23px bold navy, Descriptions 17-18px regular blue-grey
 * - Custom bottom dual-layered green wave with rounded clipping
 * - Decorative plant / analytics illustrations for Cards 2 and 3
 */
function WorkflowCard({ stepNumber, icon, title, description, bottomWave, illustration }) {
  return (
    <div className="hiw-workflow-card">
      {/* Top Numbered Circle Badge: 60px diameter, thick white border, unclipped */}
      <div className="hiw-card-badge" aria-label={`Step ${stepNumber}`}>
        <span>{stepNumber}</span>
      </div>

      {/* Light-green rounded icon square: 70px × 70px, 18px corners */}
      <div className="hiw-icon-container" aria-hidden="true">
        {icon}
      </div>

      {/* Titles: 23px bold navy */}
      <h3 className="hiw-card-title">{title}</h3>

      {/* Descriptions: 17-18px regular blue-grey */}
      <p className="hiw-card-desc">{description}</p>

      {/* Custom light-green dual wave at bottom of card */}
      <div className="hiw-card-wave" aria-hidden="true">
        {bottomWave}
      </div>

      {/* Optional decorative plant / analytics illustration near bottom-right */}
      {illustration && (
        <div className="hiw-card-illustration" aria-hidden="true">
          {illustration}
        </div>
      )}
    </div>
  );
}

/**
 * Sub-Component: WorkflowConnector
 * Dotted connecting lines and 48px circular white containers with green dotted borders.
 */
function WorkflowConnector() {
  return (
    <>
      <div className="hiw-connecting-track" aria-hidden="true" />
      <div className="hiw-arrow-indicator hiw-arrow-1-2" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#168044" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>
      <div className="hiw-arrow-indicator hiw-arrow-2-3" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#168044" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>
    </>
  );
}

/**
 * Sub-Component: WorkflowCards
 * Right column container holding exactly 3 white cards horizontally.
 */
function WorkflowCards() {
  return (
    <div className="hiw-right-column">
      <WorkflowConnector />

      <div className="hiw-cards-grid">
        {/* CARD 1: Register (User outline icon, ~40px) */}
        <WorkflowCard
          stepNumber="1"
          title="Register"
          description="Create your AGRIMAN account and set up your farm profile."
          icon={
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
          bottomWave={
            <svg viewBox="0 0 260 50" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 32 C60 16 130 42 200 24 C230 16 250 28 260 28 L260 50 L0 50 Z" fill="rgba(168, 240, 191, 0.55)" />
              <path d="M0 38 C70 24 140 44 210 30 C235 25 250 34 260 34 L260 50 L0 50 Z" fill="rgba(34, 197, 94, 0.16)" />
            </svg>
          }
        />

        {/* CARD 2: Add Farm Details (Map pin outline icon, ~40px + Plant illustration) */}
        <WorkflowCard
          stepNumber="2"
          title="Add Farm Details"
          description="Add your farm information, land details, crops and operational records."
          icon={
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          }
          bottomWave={
            <svg viewBox="0 0 260 50" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 30 C60 14 125 40 185 24 C220 16 245 28 260 28 L260 50 L0 50 Z" fill="rgba(168, 240, 191, 0.55)" />
              <path d="M0 36 C65 22 135 42 205 32 C230 26 250 34 260 34 L260 50 L0 50 Z" fill="rgba(34, 197, 94, 0.16)" />
            </svg>
          }
          illustration={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 20h8" />
              <path d="M12 20v-7" />
              <path d="M12 13a4.5 4.5 0 0 1 4.5-4.5c0 2.5-1.8 4.5-4.5 4.5Z" />
              <path d="M12 13a4.5 4.5 0 0 0-4.5-4.5c0 2.5 1.8 4.5 4.5 4.5Z" />
            </svg>
          }
        />

        {/* CARD 3: Manage & View Reports (Analytics bar chart + trend outline, ~40px + Analytics illustration) */}
        <WorkflowCard
          stepNumber="3"
          title="Manage & View Reports"
          description="Track farm activities, financial transactions and performance reports."
          icon={
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="14" width="4" height="7" rx="1" />
              <rect x="10" y="10" width="4" height="11" rx="1" />
              <rect x="17" y="6" width="4" height="15" rx="1" />
              <path d="M3 10L10 5L17 3L21 3" />
              <path d="M18 3L21 3L21 6" />
            </svg>
          }
          bottomWave={
            <svg viewBox="0 0 260 50" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 32 C70 18 135 42 195 24 C225 16 245 28 260 28 L260 50 L0 50 Z" fill="rgba(168, 240, 191, 0.55)" />
              <path d="M0 38 C75 24 145 42 215 32 C235 26 250 34 260 34 L260 50 L0 50 Z" fill="rgba(34, 197, 94, 0.16)" />
            </svg>
          }
          illustration={
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="3.5" height="7" x="4" y="14" rx="0.8" fill="rgba(34, 197, 94, 0.25)" />
              <rect width="3.5" height="12" x="10" y="9" rx="0.8" fill="rgba(34, 197, 94, 0.25)" />
              <rect width="3.5" height="17" x="16" y="4" rx="0.8" fill="rgba(34, 197, 94, 0.25)" />
            </svg>
          }
        />
      </div>
    </div>
  );
}

/**
 * Main Component: HowItWorks
 * Rendered directly on top of the supplied agricultural background image asset.
 */
export default function HowItWorks({ onNavigateToLogin }) {
  return (
    <section
      id="how-it-works"
      className="how-it-works-section"
      style={{ backgroundImage: `url(${howItWorksBg})` }}
      aria-label="How AGRIMAN Works"
    >
      <div className="section-container hiw-relative-container">
        <div className="hiw-layout-grid">
          <SectionIntroduction onNavigateToLogin={onNavigateToLogin} />
          <WorkflowCards />
        </div>
      </div>
    </section>
  );
}
