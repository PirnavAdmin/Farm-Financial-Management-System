import React from 'react';
import Crops from '../Crops/Crops';

export default function CropVarietiesPage({ onNavigate }) {
  return <Crops initialTab="varieties" onNavigate={onNavigate} />;
}
