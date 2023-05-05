import React from 'react';
import PropTypes from 'prop-types';
import { formatKioskDate } from '../../components/kiosk/util';

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

