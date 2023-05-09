import React from 'react';

/* eslint-disable import/prefer-default-export */
// formats date for kiosk mode and updates to EST
export function kioskTimeStamp(date, subdaily) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/New_York',
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const dateParts = formatter.formatToParts(date);

  const year = dateParts.find((part) => part.type === 'year').value;
  const month = dateParts.find((part) => part.type === 'month').value.slice(0, 3);
  const day = dateParts.find((part) => part.type === 'day').value;
  const hours = dateParts.find((part) => part.type === 'hour').value;
  const minutes = dateParts.find((part) => part.type === 'minute').value;

  return (
    <div>
      <div className="kiosk-year">
        {year}
      </div>
      <div className="kiosk-month">
        {month}
      </div>
      <div className="kiosk-day">
        {day}
      </div>

      {subdaily && (
        <>
          <div className="kiosk-hours">
            {hours}
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
            EST
          </div>
        </>
      )}
    </div>
  );
}
