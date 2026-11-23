import React from 'react';
import Machinery from '../../Masters/Machinery/index.jsx';

export default function MachineryUsagePage({ initialTab = 'hub', onNavigate }) {
  return <Machinery initialTab={initialTab} onNavigate={onNavigate} />;
}

export { Machinery };
