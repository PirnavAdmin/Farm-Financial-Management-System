import React, { useState, useEffect } from 'react';
import ReportsLanding from './ReportsLanding';
import ReportViewer from './ReportViewer';
import { getReportById } from './reportsCatalog';
import './reports.css';

export default function Reports({
  activeReport: initialActiveReport = null,
  onNavigate,
  onReportChange
}) {
  // If initialActiveReport is passed (e.g. from navbar search or direct prop), resolve it
  const resolveReport = (val) => {
    if (!val || val === 'Reports' || val === 'reports') return null;
    const found = getReportById(val);
    return found ? found.id : null;
  };

  const [selectedReportId, setSelectedReportId] = useState(() => resolveReport(initialActiveReport));

  useEffect(() => {
    const resolved = resolveReport(initialActiveReport);
    setSelectedReportId(resolved);
  }, [initialActiveReport]);

  const handleSelectReport = (reportId) => {
    setSelectedReportId(reportId);
    if (onReportChange) {
      onReportChange(reportId);
    }
  };

  const handleBackToReports = () => {
    setSelectedReportId(null);
    if (onReportChange) {
      onReportChange('Reports');
    }
  };

  const handleNavigateHome = () => {
    if (onNavigate) {
      onNavigate('Dashboard');
    } else {
      setSelectedReportId(null);
    }
  };

  if (selectedReportId) {
    return (
      <ReportViewer
        reportId={selectedReportId}
        onBackToReports={handleBackToReports}
        onNavigateHome={handleNavigateHome}
      />
    );
  }

  return (
    <ReportsLanding
      onSelectReport={handleSelectReport}
      onNavigateHome={handleNavigateHome}
    />
  );
}
