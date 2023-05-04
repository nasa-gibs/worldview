import React from 'react';
import PropTypes from 'prop-types';
import { formatKioskDate } from '../../components/kiosk/util';

// format date and update to EST
// function formatDate(date) {
//   const options = {
//     year: 'numeric',
//     month: 'long',
//     day: '2-digit',
//     hour: '2-digit',
//     minute: '2-digit',
//     hour12: false,
//     timeZone: 'America/New_York',
//   };

//   const formatter = new Intl.DateTimeFormat('en-US', options);
//   const dateParts = formatter.formatToParts(date);

//   const year = dateParts.find(part => part.type === 'year').value;
//   const month = dateParts.find(part => part.type === 'month').value;
//   const day = dateParts.find(part => part.type === 'day').value;
//   const hours = dateParts.find(part => part.type === 'hour').value;
//   const minutes = dateParts.find(part => part.type === 'minute').value;

//   return `${year} ${month} ${day} ${hours}:${minutes} EST`;
// }

function KioskAnimationWidget(props) {
  const {
    startDate,
    endDate,
    hasSubdailyLayers,
  } = props;

  const startDateString = formatKioskDate(startDate, hasSubdailyLayers);
  const endDateString = formatKioskDate(endDate, hasSubdailyLayers);
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
  subDailyMode: PropTypes.bool,
};

export default KioskAnimationWidget;

