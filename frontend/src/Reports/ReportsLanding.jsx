import React, { useState } from 'react';
import {
  IndianRupee,
  Sprout,
  Package,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wheat,
  MapPin,
  Ruler,
  Users,
  Tractor,
  Boxes,
  ClipboardList,
  ShoppingCart,
  PackageMinus,
  TriangleAlert,
  ChevronRight,
  Search
} from 'lucide-react';
import { REPORT_CATEGORIES, REPORTS_CATALOG } from './reportsCatalog';
import './reports.css';

// Map icon names to Lucide icon components
const ICON_MAP = {
  IndianRupee,
  Sprout,
  Package,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wheat,
  MapPin,
  Ruler,
  Users,
  Tractor,
  Boxes,
  ClipboardList,
  ShoppingCart,
  PackageMinus,
  TriangleAlert
};

export default function ReportsLanding({ onSelectReport, onNavigateHome }) {
  const [activeCategory, setActiveCategory] = useState('financial');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter reports by active category and optional search query
  const categoryReports = REPORTS_CATALOG.filter((r) => r.category === activeCategory);
  const displayedReports = searchQuery.trim()
    ? categoryReports.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categoryReports;

  const handleKeyDown = (e, reportId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectReport(reportId);
    }
  };

  return (
    <div className="rpt-container">
      {/* ── 1. Top Breadcrumb ─────────────────────────────────────────────── */}
      <nav className="rpt-breadcrumb" aria-label="Breadcrumb">
        <button
          type="button"
          className="rpt-breadcrumb-link"
          onClick={onNavigateHome}
        >
          Home
        </button>
        <span className="rpt-breadcrumb-sep">/</span>
        <span className="rpt-breadcrumb-current" aria-current="page">
          Reports
        </span>
      </nav>

      {/* ── 2. Page Heading & Search ──────────────────────────────────────── */}
      <div className="rpt-header">
        <div className="rpt-header-text">
          <h1 className="rpt-title">Reports</h1>
          <p className="rpt-subtitle">
            Consolidated operational, agricultural, and financial intelligence for farm decision-making.
          </p>
        </div>
        <div className="rpt-search-box">
          <Search size={16} className="rpt-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="rpt-search-input"
            placeholder={`Search ${activeCategory} reports...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search reports"
          />
          {searchQuery && (
            <button
              type="button"
              className="rpt-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── 3. Category Navigation Tabs ───────────────────────────────────── */}
      <div className="rpt-category-nav" role="tablist" aria-label="Report Categories">
        {REPORT_CATEGORIES.map((cat) => {
          const CategoryIcon = ICON_MAP[cat.iconName] || IndianRupee;
          const count = REPORTS_CATALOG.filter((r) => r.category === cat.id).length;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${cat.id}`}
              id={`tab-${cat.id}`}
              className={`rpt-category-tab ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat.id);
                setSearchQuery('');
              }}
            >
              <span className="rpt-category-icon" aria-hidden="true">
                <CategoryIcon size={18} strokeWidth={1.8} />
              </span>
              <span className="rpt-category-label">{cat.label}</span>
              <span className="rpt-category-badge">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── 4. Report Cards Grid ─────────────────────────────────────────── */}
      <section
        id={`panel-${activeCategory}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeCategory}`}
        className="rpt-cards-panel"
      >
        <div className="rpt-panel-header">
          <div className="rpt-panel-info">
            <span className="rpt-category-title">
              {REPORT_CATEGORIES.find((c) => c.id === activeCategory)?.label} Catalog
            </span>
            <span className="rpt-count-indicator">
              Showing {displayedReports.length} of {categoryReports.length} reports
            </span>
          </div>
        </div>

        {displayedReports.length === 0 ? (
          <div className="rpt-empty-catalog">
            <p>No reports matched your search <strong>"{searchQuery}"</strong>.</p>
            <button
              type="button"
              className="rpt-btn-reset"
              onClick={() => setSearchQuery('')}
            >
              Clear Search Filter
            </button>
          </div>
        ) : (
          <div className="rpt-grid" role="list">
            {displayedReports.map((report, index) => {
              const ReportIcon = ICON_MAP[report.iconName] || TrendingUp;

              return (
                <div
                  key={report.id}
                  role="button"
                  tabIndex={0}
                  className="rpt-card"
                  onClick={() => onSelectReport(report.id)}
                  onKeyDown={(e) => handleKeyDown(e, report.id)}
                  aria-label={`Open ${report.name}: ${report.description}`}
                >
                  <div className="rpt-card-header">
                    <div className={`rpt-card-icon-wrap ${report.category}`}>
                      <ReportIcon size={20} strokeWidth={1.8} aria-hidden="true" />
                    </div>
                    <span className="rpt-card-index">#{String(index + 1).padStart(2, '0')}</span>
                  </div>

                  <div className="rpt-card-body">
                    <h3 className="rpt-card-title">{report.name}</h3>
                    <p className="rpt-card-desc">{report.description}</p>
                  </div>

                  <div className="rpt-card-footer">
                    <span className="rpt-card-cta">
                      View Report
                      <ChevronRight size={16} strokeWidth={2} className="rpt-card-chevron" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
