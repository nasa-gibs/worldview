import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import DatePicker from '../../util/react-mobile-datepicker';
import { getDisplayDate, getISODateFormatted } from './date-util';
import { MONTH_STRING_ARRAY } from '../../modules/date/constants';

// Local datepicker utility adapted from react-mobile-datepicker
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
    isEmbedModeActive,
    startDateLimit,
    endDateLimit,
    onDateChange,
    hasSubdailyLayers,
  } = props;
  const [time, setTime] = useState(convertToUTCDateObject(date));
  const [minDate, setMinDate] = useState(convertToUTCDateObject(startDateLimit));
  const [maxDate, setMaxDate] = useState(convertToUTCDateObject(endDateLimit));
  const [isOpen, setIsOpen] = useState(false);
  const portalElRef = useRef(null);

  const setInitDates = () => {
    setTime(convertToUTCDateObject(date));
    setMinDate(convertToUTCDateObject(startDateLimit));
    setMaxDate(convertToUTCDateObject(endDateLimit));
  };

  useEffect(() => {
    setInitDates();
  }, [endDateLimit, date]);

  const ensurePortalContainer = () => {
    if (portalElRef.current || typeof document === 'undefined') return;
    const el = document.createElement('div');
    el.classList.add('Modal-Portal');
    document.body.appendChild(el);
    portalElRef.current = el;
  };

  const removePortalContainer = () => {
    const el = portalElRef.current;
    if (!el) return;
    if (el.parentNode) el.parentNode.removeChild(el);
    portalElRef.current = null;
  };

  useEffect(() => () => {
    removePortalContainer();
  }, []);

  const handleClickDateButton = () => {
    if (!isEmbedModeActive) {
      ensurePortalContainer();
      setIsOpen(true);
    }
  };

  const handleCancel = () => {
    setTime(convertToUTCDateObject(date));
    setIsOpen(false);
    removePortalContainer();
  };

  const handleChange = (newDate) => {
    setTime(newDate);
  };

  const handleSelect = (newTime) => {
    setIsOpen(false);
    setTime(newTime);

    removePortalContainer();

    // convert date back to local time
    const newDate = convertToLocalDateObject(newTime);
    onDateChange(getISODateFormatted(newDate));
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleCancel();
  };

  const getHeaderTime = (newTime, isSubdaily) => (
    <div className="datepicker-header">
      {getDisplayDate(new Date(convertToLocalDateObject(newTime)), isSubdaily)}
    </div>
  );

  const displayDate = getDisplayDate(date, hasSubdailyLayers);
  const headerTime = getHeaderTime(time, hasSubdailyLayers);

  return (
    time && (
      <>
        <button
          type="button"
          className="mobile-date-picker-select-btn"
          onClick={handleClickDateButton}
        >
          <div className="mobile-date-picker-select-btn-text">
            <span>{displayDate}</span>
          </div>
        </button>
        {isOpen && portalElRef.current &&
          createPortal(
            (
              <div className="datepicker-modal" onClick={handleBackdropClick}>
                <DatePicker
                  isPopup={false}
                  dateConfig={hasSubdailyLayers ? subDailyDateConfig : defaultDateConfig}
                  showHeader
                  showFooter
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
              </div>
            ),
            portalElRef.current,
          )}
      </>
    )
  );
}

MobileDatePicker.propTypes = {
  date: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  endDateLimit: PropTypes.string,
  hasSubdailyLayers: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  onDateChange: PropTypes.func,
  startDateLimit: PropTypes.string,
};

export default MobileDatePicker;
