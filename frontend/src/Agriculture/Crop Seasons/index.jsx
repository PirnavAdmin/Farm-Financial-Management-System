import React from 'react';
import Crops from '../../Masters/Crops/Crops';

export default function CropSeasonsPage({ onNavigate }) {
  return <Crops initialTab="seasons" onNavigate={onNavigate} />;
}
