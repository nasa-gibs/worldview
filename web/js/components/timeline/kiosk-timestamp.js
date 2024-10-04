import React from 'react';
import PropTypes from 'prop-types';
import util from '../../util/util';
import { MONTH_STRING_ARRAY } from '../../modules/date/constants';

/**
 * getIsDaylightSavingsTime()
 *
 * @returns bool indicating if it is daylight savings time on the US East coast
 */
function getIsDaylightSavingsTime() {
  const date = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const dateObj = new Date(date);
  const isDaylightSavingTime = dateObj.getTimezoneOffset() < new Date(dateObj.getFullYear(), 0, 1).getTimezoneOffset();
  return isDaylightSavingTime;
}

function KioskTimeStamp({ date, subdaily, isKioskModeActive }) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'America/New_York',
  };

  const updateKioskModeTime = isKioskModeActive && subdaily;

  const isDaylightSavingsTime = getIsDaylightSavingsTime();
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const dateParts = formatter.formatToParts(date);

  const kioskYear = dateParts.find((part) => part.type === 'year').value;
  const kioskMonth = dateParts.find((part) => part.type === 'month').value.slice(0, 3);
  const kioskDay = dateParts.find((part) => part.type === 'day').value;
  const kioskHour = dateParts.find((part) => part.type === 'hour').value;
  const kioskTimeZoneLabel = isDaylightSavingsTime ? 'EDT' : 'EST';

  const dfYear = date.getUTCFullYear();
  const dfMonth = MONTH_STRING_ARRAY[date.getUTCMonth()];
  const dfDay = util.pad(date.getUTCDate(), 2, '0');
  const dfHour = util.pad(date.getUTCHours(), 2, '0');

  const year = updateKioskModeTime ? kioskYear : dfYear;
  const month = updateKioskModeTime ? kioskMonth : dfMonth;
  const day = updateKioskModeTime ? kioskDay : dfDay;
  const hour = updateKioskModeTime ? kioskHour : dfHour;

  const minutes = dateParts.find((part) => part.type === 'minute').value;
  const timeZoneLabel = updateKioskModeTime ? kioskTimeZoneLabel : 'UTC';

  return (
    <>
      <div className="kiosk-day">
        {day}
      </div>
      <div className="kiosk-month">
        {month}
      </div>
      <div className="kiosk-year">
        {year}
      </div>

      {subdaily && (
        <>
          <div className="kiosk-hours">
            {hour}
          </div>
          <div className="kiosk-colon">
            :
          </div>
          <div className="kiosk-minutes">
            {minutes}
          </div>
          <div className="kiosk-colon">
            :
          </div>
          <div className="kiosk-seconds">
            00
          </div>
          <div className="kiosk-timezone">
            {timeZoneLabel}
          </div>
        </>
      )}
    </>
  );
}

KioskTimeStamp.propTypes = {
  date: PropTypes.object,
  isKioskModeActive: PropTypes.bool,
  subdaily: PropTypes.bool,
};

export default KioskTimeStamp;
