import React from 'react';
import Crops from '../../Masters/Crops/Crops';

export default function CropActivitiesPage({ onNavigate }) {
  return <Crops initialTab="activities" onNavigate={onNavigate} />;
}
