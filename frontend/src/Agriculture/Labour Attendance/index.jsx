import React from 'react';
import Labour from './Labour';

export default function LabourAttendancePage({ initialTab = 'attendance', onNavigate }) {
  return <Labour initialTab={initialTab} onNavigate={onNavigate} />;
}

export { Labour };
