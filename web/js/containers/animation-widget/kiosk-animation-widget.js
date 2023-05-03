import React from 'react';
import PropTypes from 'prop-types';

function formatDate(date) {
  const adjustedDate = new Date(date);
  // Add 4 hours to the adjustedDate
  adjustedDate.setHours(adjustedDate.getHours() + 4);

  const year = adjustedDate.getFullYear();
  const month = adjustedDate.toLocaleString('en-US', { month: 'long' });
  const day = adjustedDate.getDate().toString().padStart(2, '0');
  const hours = adjustedDate.getHours().toString().padStart(2, '0');
  const minutes = adjustedDate.getMinutes().toString().padStart(2, '0');

  return `${year} ${month} ${day} ${hours}:${minutes} Z`;
}

function KioskAnimationWidget(props) {
  const {
    startDate,
    endDate,
  } = props;

  const startDateString = formatDate(startDate);
  const endDateString = formatDate(endDate);
  const middleText = ' to ';

  return (
    <div className="wv-kiosk-animation-wrapper">
      <div className="wv-kiosk-animation-widget">
        <div className="kiosk-animation-widget-row">
          <span className="kiosk-animation-widget-label">{startDateString}</span>
          <span id="kiosk-animation-widget-middle-label">{middleText}</span>
          <span className="kiosk-animation-widget-label">{endDateString}</span>
        </div>
      </div>
    </div>
  );
}

KioskAnimationWidget.propTypes = {
  startDate: PropTypes.object,
  endDate: PropTypes.object,
};

export default KioskAnimationWidget;

