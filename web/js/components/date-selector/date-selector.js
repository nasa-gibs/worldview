/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import DateInputColumn from './date-input-column';
import util from '../../util/util';
import { MONTH_STRING_ARRAY } from '../../modules/date/constants';
import usePrevious from '../../util/customHooks';

/*
 * DateSelector used within Timeline and AnimationWidget.
 * It is a parent component for DateInputColumn(s)
 *
 * @class DateSelector
 */
function DateSelector(props) {
  const {
    date,
    minDate,
    maxDate,
    isStartDate,
    isEndDate,
    onDateChange,
    fontSize,
    idSuffix,
    subDailyMode,
    isDisabled,
    isKioskModeActive,
  } = props;

  const [focusedUnit, setFocusedUnit] = useState(null);
  const [dateObj, setDateObj] = useState({
    year: null,
    month: null,
    day: null,
    hour: null,
    minute: null,
    yearValid: true,
    monthValid: true,
    dayValid: true,
    hourValid: true,
    minuteValid: true,
  });

  const prevDate = usePrevious(date);

  /**
  * @desc add individual timeunit input
  *
  * @param {String} timeUnit
  * @param {String / Number} input
  * @returns {void}
  */
  const updateTimeUnitInput = (timeUnit, input) => {
    setDateObj({ ...dateObj, [timeUnit]: input });
  };

  /**
  * @desc check valid date with potential temporarily invalid dates
  * @desc Example: temporary invalid date example would be starting with FEB 22
  * @desc changing to invalid FEB 31 (31 is a valid day, but invalid for FEB),
  * @desc and changing to valid OCT 31 - temp values are retained until valid date
  *
  * @param {String} dateIn
  * @param {Boolean} isRollDate
  * @returns {Object Date or Boolean} valid date or false
  */
  const updateDateCheck = (dateIn, isRollDate) => {
    const {
      year, month, day, hour, minute,
    } = dateObj;
    const tabToCheck = focusedUnit;
    const inputDate = new Date(dateIn);
    const tempDay = day || dateIn.getUTCDate();
    let validDate = true;
    let triggeredInvalid = false;
    let newDate = dateIn;

    if (isRollDate) {
      newDate = inputDate;
    } else {
      // conditional logic allows temporary place holder values to be validated
      // in the event other inputs are invalid, temp values remain without date change
      if (year) {
        newDate = new Date(new Date(newDate).setUTCFullYear(year));
        if (tabToCheck === 'year') {
          const yearDateWithinRange = newDate < minDate || newDate > maxDate;
          triggeredInvalid = yearDateWithinRange;
        }
      }
      if (day && !month) {
        const maxDayDate = new Date(
          newDate.getUTCFullYear(),
          newDate.getUTCMonth() + 1,
          0,
        ).getDate();

        let dateCheck;
        if (day <= maxDayDate) {
          newDate = new Date(new Date(newDate).setUTCDate(day));
          dateCheck = new Date(new Date(inputDate).setUTCDate(day));
        } else {
          validDate = false;
          newDate = new Date(new Date(newDate).setUTCDate(maxDayDate));
          dateCheck = new Date(new Date(inputDate).setUTCDate(maxDayDate));
        }

        if (tabToCheck === 'day') {
          const dayDateWithinRange = !validDate || (dateCheck < minDate || dateCheck > maxDate);
          triggeredInvalid = dayDateWithinRange;
        }
      }

      if (month) {
        const realMonth = util.stringInArray(MONTH_STRING_ARRAY, month);
        const maxDatePrev = new Date(
          newDate.getUTCFullYear(),
          newDate.getUTCMonth() + 1,
          0,
        ).getDate();

        const maxDateNew = new Date(
          newDate.getUTCFullYear(),
          realMonth + 1,
          0,
        ).getDate();

        if (maxDatePrev > maxDateNew && tempDay > maxDateNew) {
          validDate = false;
        }

        let dateCheck;
        if (day && month) {
          newDate = new Date(new Date(newDate).setUTCDate(1));
          newDate = new Date(new Date(newDate).setUTCMonth(realMonth));
          dateCheck = new Date(inputDate);
          dateCheck = new Date(new Date(dateCheck).setUTCDate(1));
          dateCheck = new Date(new Date(dateCheck).setUTCMonth(realMonth));
        } else {
          const maxDayDate = new Date(
            newDate.getUTCFullYear(),
            newDate.getUTCMonth() + 1,
            0,
          ).getDate();

          if (inputDate.getDate() > maxDayDate) {
            validDate = false;
          }
          dateCheck = new Date(new Date(inputDate).setUTCMonth(realMonth));
          newDate = new Date(new Date(newDate).setUTCMonth(realMonth));
        }

        if (tabToCheck === 'month') {
          const monthDateWithinRange = !validDate || (dateCheck < minDate || dateCheck > maxDate);
          triggeredInvalid = monthDateWithinRange;
        }
      }

      if (day && month) {
        const maxDayDate = new Date(
          newDate.getUTCFullYear(),
          newDate.getUTCMonth() + 1,
          0,
        ).getDate();

        let dateCheck;
        if (day <= maxDayDate) {
          const realMonth = util.stringInArray(MONTH_STRING_ARRAY, month);
          newDate = new Date(new Date(newDate).setUTCDate(day));
          dateCheck = new Date(inputDate);
          dateCheck = new Date(new Date(newDate).setUTCDate(1));
          dateCheck = new Date(new Date(dateCheck).setUTCMonth(realMonth));
          dateCheck = new Date(new Date(dateCheck).setUTCDate(day));
        } else {
          validDate = false;
          newDate = new Date(new Date(newDate).setUTCDate(maxDayDate));
          dateCheck = new Date(new Date(inputDate).setUTCDate(maxDayDate));
        }

        if (tabToCheck === 'month') {
          const monthDateWithinRange = !validDate || (dateCheck < minDate || dateCheck > maxDate);
          triggeredInvalid = monthDateWithinRange;
        } else if (tabToCheck === 'day') {
          const dayDateWithinRange = !validDate || (dateCheck < minDate || dateCheck > maxDate);
          triggeredInvalid = dayDateWithinRange;
        }
      }

      if (hour) {
        newDate = new Date(new Date(newDate).setUTCHours(hour));
        if (tabToCheck === 'hour') {
          const hourDateWithinRange = !validDate || (newDate < minDate || newDate > maxDate);
          triggeredInvalid = hourDateWithinRange;
        }
      }

      if (minute) {
        newDate = new Date(new Date(newDate).setUTCMinutes(minute));
        if (tabToCheck === 'minute') {
          const minuteDateWithinRange = !validDate || (newDate < minDate || newDate > maxDate);
          triggeredInvalid = minuteDateWithinRange;
        }
      }
    }

    // check if date is within min/max range
    const dateTime = newDate.getTime();
    const minDateTime = minDate.getTime();
    const maxDateTime = maxDate.getTime();
    const dateWithinRange = dateTime >= minDateTime && dateTime <= maxDateTime;

    // updateDate at this stage can still be invalid with pending timeunit changes
    const updatedDate = newDate.getTime() !== date.getTime();
    const newDateWithinRange = dateWithinRange && updatedDate;
    if (validDate && (isRollDate || newDateWithinRange)) {
      return newDate;
    }
    // set invalid if updated and tabToCheck was offending invalid value
    const timeValid = `${tabToCheck}Valid`;
    if (updatedDate) {
      const timeValidation = !triggeredInvalid;
      // time specific validation (e.g., 'yearValid') for use in inputs
      setDateObj({ ...dateObj, [timeValid]: timeValidation });
    } else {
      // input not invalid, but some other input is, so add more invalids
      setDateObj({ ...dateObj, [timeValid]: false });
      // reverting from invalid date back to same valid date edge case
      if (!triggeredInvalid && validDate) {
        return newDate;
      }
    }
    return false;
  };

  /**
  * @desc clear temp time values and reset time validation booleans
  *
  * @returns {void}
  */
  const clearTimeValuesAndValidation = () => {
    setDateObj({
      year: null,
      month: null,
      day: null,
      hour: null,
      minute: null,
      yearValid: true,
      monthValid: true,
      dayValid: true,
      hourValid: true,
      minuteValid: true,
    });
  };

  useEffect(() => {
    // parent arrow clicks should override any temporary values within date selector
    if (!prevDate || prevDate.getTime() !== date.getTime()) {
      clearTimeValuesAndValidation();
    }
  }, [date]);

  /**
  * @desc update date with newDate if valid from check and then reset temp time values
  *
  * @param {String} dateIn
  * @param {Boolean} isRollDate
  * @returns {void}
  */
  const updateDate = (dateIn = date, isRollDate = false) => {
    const newDate = updateDateCheck(dateIn, isRollDate);

    if (newDate) {
      onDateChange(newDate);
      // clear the pending timeunit inputs and reset validation
      clearTimeValuesAndValidation();
    }
  };

  useEffect(() => {
    const {
      year,
      month,
      day,
      hour,
      minute,
    } = dateObj;
    const anyPendingTimeUnits = year || month || day || hour || minute;
    if (anyPendingTimeUnits) {
      updateDate();
    }
  }, [dateObj.year, dateObj.month, dateObj.day, dateObj.hour, dateObj.minute]);

  const {
    year,
    month,
    day,
    hour,
    minute,
    yearValid,
    monthValid,
    dayValid,
    hourValid,
    minuteValid,
  } = dateObj;
  const sharedProps = {
    idSuffix,
    onFocus: setFocusedUnit,
    subDailyMode,
    isStartDate,
    isEndDate,
    date,
    updateDate,
    maxDate,
    minDate,
    fontSize,
    updateTimeUnitInput,
  };

  const yearValue = year || date.getUTCFullYear();
  const monthValue = month || MONTH_STRING_ARRAY[date.getUTCMonth()];
  const dayValue = day || util.pad(date.getUTCDate(), 2, '0');
  const hourValue = hour || util.pad(date.getUTCHours(), 2, '0');
  const minuteValue = minute || util.pad(date.getUTCMinutes(), 2, '0');

  return (
    <div className="wv-date-selector-widget">
      <DateInputColumn
        {...sharedProps}
        type="year"
        value={yearValue}
        isValid={yearValid}
        isDisabled={isDisabled}
        isKioskModeActive={isKioskModeActive}
      />
      <DateInputColumn
        {...sharedProps}
        type="month"
        value={monthValue}
        isValid={monthValid}
        isDisabled={isDisabled}
        isKioskModeActive={isKioskModeActive}
      />
      <DateInputColumn
        {...sharedProps}
        type="day"
        value={dayValue}
        isValid={dayValid}
        isDisabled={isDisabled}
        isKioskModeActive={isKioskModeActive}
      />
      { subDailyMode && (
        <>
          <DateInputColumn
            {...sharedProps}
            type="hour"
            value={hourValue}
            isValid={hourValid}
            isDisabled={isDisabled}
            isKioskModeActive={isKioskModeActive}
          />
          <div className={isKioskModeActive ? 'input-time-divider-kiosk' : 'input-time-divider'}>:</div>
          <DateInputColumn
            {...sharedProps}
            type="minute"
            value={minuteValue}
            isValid={minuteValid}
            isDisabled={isDisabled}
            isKioskModeActive={isKioskModeActive}
          />
          <div className={isKioskModeActive ? 'input-time-zmark-kiosk' : 'input-time-zmark'}>Z</div>
        </>
      )}
    </div>
  );
}
DateSelector.defaultProps = {
  fontSize: 15,
};
DateSelector.propTypes = {
  date: PropTypes.object,
  fontSize: PropTypes.number,
  idSuffix: PropTypes.string,
  isStartDate: PropTypes.bool,
  isEndDate: PropTypes.bool,
  isDisabled: PropTypes.bool,
  maxDate: PropTypes.object,
  minDate: PropTypes.object,
  onDateChange: PropTypes.func,
  subDailyMode: PropTypes.bool,
  isKioskModeActive: PropTypes.bool,
};

export default DateSelector;
