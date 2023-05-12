import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-mobile-datepicker';
import { getDisplayDate, getISODateFormatted } from './date-util';
import { MONTH_STRING_ARRAY } from '../../modules/date/constants';

// https://www.npmjs.com/package/react-mobile-datepicker
// configs for date order, caption, and date step
const defaultDateConfig = {
  year: {
    format: 'YYYY',
    caption: 'Year',
    step: 1,
  },
  month: {
    format: (value) => MONTH_STRING_ARRAY[value.getMonth()],
    caption: 'Mon',
    step: 1,
  },
  date: {
    format: 'DD',
    caption: 'Day',
    step: 1,
  },
};

const subDailyDateConfig = {
  year: {
    format: 'YYYY',
    caption: 'Year',
    step: 1,
  },
  month: {
    format: (value) => MONTH_STRING_ARRAY[value.getMonth()],
    caption: 'Mon',
    step: 1,
  },
  date: {
    format: 'DD',
    caption: 'Day',
    step: 1,
  },
  hour: {
    format: 'hh',
    caption: 'Hour',
    step: 1,
  },
  minute: {
    format: 'mm',
    caption: 'Min',
    step: 1,
  },
};

// change to UTC offset time for date picker controls
const convertToUTCDateObject = (dateString) => {
  const date = new Date(dateString);
  const dateUTC = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
  return dateUTC;
};

// change to offset time used in parent component date setting functions
const convertToLocalDateObject = (date) => {
  const dateLocal = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return dateLocal;
};

function MobileDatePicker(props) {
  const {
    date,
    startDateLimit,
    endDateLimit,
    onDateChange,
    hasSubdailyLayers,
  } = props;
  const [time, setTime] = useState(convertToUTCDateObject(date));
  const [minDate, setMinDate] = useState(convertToUTCDateObject(startDateLimit));
  const [maxDate, setMaxDate] = useState(convertToUTCDateObject(endDateLimit));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setInitDates();
  }, [endDateLimit, date]);

  const handleClickDateButton = () => {
    setIsOpen(true);
  };

  const handleCancel = () => {
    setTime(convertToUTCDateObject(date));
    setIsOpen(false);
  };

  const handleChange = (date) => {
    setTime(date);
  };

  const handleSelect = (time) => {
    setIsOpen(false);
    setTime(time);

    // convert date back to local time
    const date = convertToLocalDateObject(time);
    onDateChange(getISODateFormatted(date));
  };

  const setInitDates = () => {
    setTime(convertToUTCDateObject(date));
    setMinDate(convertToUTCDateObject(startDateLimit));
    setMaxDate(convertToUTCDateObject(endDateLimit));
  };

  const getHeaderTime = (time, isSubdaily) => (
    <div className="datepicker-header">
      {getDisplayDate(new Date(convertToLocalDateObject(time)), isSubdaily)}
    </div>
  );

  const displayDate = getDisplayDate(date, hasSubdailyLayers);
  const headerTime = getHeaderTime(time, hasSubdailyLayers);

  return (
    time && (
      <>
        <div
          className="mobile-date-picker-select-btn"
          onClick={handleClickDateButton}
        >
          <div className="mobile-date-picker-select-btn-text">
            <span>{displayDate}</span>
          </div>
        </div>
        <DatePicker
          dateConfig={hasSubdailyLayers ? subDailyDateConfig : defaultDateConfig}
          showCaption
          theme="android-dark"
          customHeader={headerTime}
          confirmText="OK"
          cancelText="CANCEL"
          min={minDate}
          max={maxDate}
          value={time}
          isOpen={isOpen}
          onCancel={handleCancel}
          onChange={handleChange}
          onSelect={handleSelect}
        />
      </>
    )
  );
}

MobileDatePicker.propTypes = {
  date: PropTypes.object,
  endDateLimit: PropTypes.string,
  hasSubdailyLayers: PropTypes.bool,
  onDateChange: PropTypes.func,
  startDateLimit: PropTypes.string,
};

export default MobileDatePicker;
