import React from 'react';
import { useSelector } from 'react-redux';
import { travelModeData } from '../tile-measurement/utils/layer-data-eic';

function TravelModeTitle() {
  const travelModeID = useSelector((state) => state.ui.travelMode);
  const travelTitle = travelModeData[travelModeID] ? travelModeData[travelModeID].title : '';

  return (
    <div id="travel-mode-title">
      <span>{travelTitle}</span>
    </div>
  );
}

export default TravelModeTitle;
