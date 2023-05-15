/* eslint-disable react/jsx-props-no-spreading */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DateInputColumn from './date-input-column';
import util from '../../util/util';
import { MONTH_STRING_ARRAY } from '../../modules/date/constants';

/*
 * DateSelector used within Timeline and AnimationWidget.
 * It is a parent component for DateInputColumn(s)
 *
 * @class DateSelector
 */
class DateSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
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
    };
  }

  componentDidUpdate(prevProps) {
    const {
      date,
      minDate,
      maxDate,
      isStartDate,
      isEndDate,
    } = this.props;
    const {
      year,
      month,
      day,
      hour,
      minute,
    } = this.state;

    // parent arrow clicks should override any temporary values within date selector
    if (prevProps.date.getTime() !== date.getTime()) {
      this.clearTimeValuesAndValidation();
    }
    // handle animation start/end date limit changes and pending invalid -> valid dates
    const minDateChangeEndUpdate = isEndDate && prevProps.minDate.getTime() !== minDate.getTime();
    const maxDateChangeStartUpdate = isStartDate && prevProps.maxDate.getTime() !== maxDate.getTime();
    const anyPendingTimeUnits = year || month || day || hour || minute;
    if ((minDateChangeEndUpdate || maxDateChangeStartUpdate) && anyPendingTimeUnits) {
      this.updateDate();
    }
  }

  /**
  * @desc add individual timeunit input
  *
  * @param {String} timeUnit
  * @param {String / Number} input
  * @returns {void}
  */
  updateTimeUnitInput = (timeUnit, input) => {
    this.setState({
      [timeUnit]: input,
    }, this.updateDate);
  };

  setFocus = (type) => {
    this.setState({ focusedUnit: type });
  };

  /**
  * @desc check valid date with potential temporarily invalid dates
  * @desc Example: temporary invalid date example would be starting with FEB 22
  * @desc changing to invalid FEB 31 (31 is a valid day, but invalid for FEB),
  * @desc and changing to valid OCT 31 - temp values are retained until valid date
  *
  * @param {String} date
  * @param {Boolean} isRollDate
  * @returns {Object Date or Boolean} valid date or false
  */
  updateDateCheck = (date, isRollDate) => {
    const { minDate, maxDate } = this.props;
    const {
      year, month, day, hour, minute, focusedUnit,
    } = this.state;
    const tabToCheck = focusedUnit;
    const inputDate = new Date(date);
    const tempDay = day || date.getUTCDate();
    let validDate = true;
    let triggeredInvalid = false;

    if (isRollDate) {
      date = inputDate;
    } else {
      // conditional logic allows temporary place holder values to be validated
      // in the event other inputs are invalid, temp values remain without date change
      if (year) {
        date = new Date(new Date(date).setUTCFullYear(year));
        if (tabToCheck === 'year') {
          const yearDateWithinRange = date < minDate || date > maxDate;
          triggeredInvalid = yearDateWithinRange;
        }
      }
      if (day && !month) {
        const maxDayDate = new Date(
          date.getUTCFullYear(),
          date.getUTCMonth() + 1,
          0,
        ).getDate();

        let dateCheck;
        if (day <= maxDayDate) {
          date = new Date(new Date(date).setUTCDate(day));
          dateCheck = new Date(new Date(inputDate).setUTCDate(day));
        } else {
          validDate = false;
          date = new Date(new Date(date).setUTCDate(maxDayDate));
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
          date.getUTCFullYear(),
          date.getUTCMonth() + 1,
          0,
        ).getDate();

        const maxDateNew = new Date(
          date.getUTCFullYear(),
          realMonth + 1,
          0,
        ).getDate();

        if (maxDatePrev > maxDateNew && tempDay > maxDateNew) {
          validDate = false;
        }

        let dateCheck;
        if (day && month) {
          date = new Date(new Date(date).setUTCDate(1));
          date = new Date(new Date(date).setUTCMonth(realMonth));
          dateCheck = new Date(inputDate);
          dateCheck = new Date(new Date(dateCheck).setUTCDate(1));
          dateCheck = new Date(new Date(dateCheck).setUTCMonth(realMonth));
        } else {
          const maxDayDate = new Date(
            date.getUTCFullYear(),
            date.getUTCMonth() + 1,
            0,
          ).getDate();

          if (inputDate.getDate() > maxDayDate) {
            validDate = false;
          }
          dateCheck = new Date(new Date(inputDate).setUTCMonth(realMonth));
          date = new Date(new Date(date).setUTCMonth(realMonth));
        }

        if (tabToCheck === 'month') {
          const monthDateWithinRange = !validDate || (dateCheck < minDate || dateCheck > maxDate);
          triggeredInvalid = monthDateWithinRange;
        }
      }

      if (day && month) {
        const maxDayDate = new Date(
          date.getUTCFullYear(),
          date.getUTCMonth() + 1,
          0,
        ).getDate();

        let dateCheck;
        if (day <= maxDayDate) {
          const realMonth = util.stringInArray(MONTH_STRING_ARRAY, month);
          date = new Date(new Date(date).setUTCDate(day));
          dateCheck = new Date(inputDate);
          dateCheck = new Date(new Date(date).setUTCDate(1));
          dateCheck = new Date(new Date(dateCheck).setUTCMonth(realMonth));
          dateCheck = new Date(new Date(dateCheck).setUTCDate(day));
        } else {
          validDate = false;
          date = new Date(new Date(date).setUTCDate(maxDayDate));
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
        date = new Date(new Date(date).setUTCHours(hour));
        if (tabToCheck === 'hour') {
          const hourDateWithinRange = !validDate || (date < minDate || date > maxDate);
          triggeredInvalid = hourDateWithinRange;
        }
      }

      if (minute) {
        date = new Date(new Date(date).setUTCMinutes(minute));
        if (tabToCheck === 'minute') {
          const minuteDateWithinRange = !validDate || (date < minDate || date > maxDate);
          triggeredInvalid = minuteDateWithinRange;
        }
      }
    }

    // check if date is within min/max range
    const dateTime = date.getTime();
    const minDateTime = minDate.getTime();
    const maxDateTime = maxDate.getTime();
    const dateWithinRange = dateTime >= minDateTime && dateTime <= maxDateTime;

    // updateDate at this stage can still be invalid with pending timeunit changes
    // eslint-disable-next-line react/destructuring-assignment
    const updatedDate = date.getTime() !== this.props.date.getTime();
    const newDateWithinRange = dateWithinRange && updatedDate;
    if (validDate && (isRollDate || newDateWithinRange)) {
      return date;
    }
    // set invalid if updated and tabToCheck was offending invalid value
    const timeValid = `${tabToCheck}Valid`;
    if (updatedDate) {
      const timeValidation = !triggeredInvalid;
      // time specific validation (e.g., 'yearValid') for use in inputs
      this.setState({
        [timeValid]: timeValidation,
      });
    } else {
      // input not invalid, but some other input is, so add more invalids
      this.setState({
        [timeValid]: false,
      });
      // reverting from invalid date back to same valid date edge case
      if (!triggeredInvalid && validDate) {
        return date;
      }
    }
    return false;
  };

  /**
  * @desc update date with newDate if valid from check and then reset temp time values
  *
  * @param {String} date
  * @param {Boolean} isRollDate
  * @returns {void}
  */
  // eslint-disable-next-line react/destructuring-assignment
  updateDate = (date = this.props.date, isRollDate = false) => {
    const { onDateChange } = this.props;
    const newDate = this.updateDateCheck(date, isRollDate);

    if (newDate) {
      onDateChange(newDate);
      // clear the pending timeunit inputs and reset validation
      this.clearTimeValuesAndValidation();
    }
  };

  /**
  * @desc clear temp time values and reset time validation booleans
  *
  * @returns {void}
  */
  clearTimeValuesAndValidation = () => {
    this.setState({
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

  render() {
    const {
      date,
      maxDate,
      minDate,
      fontSize,
      idSuffix,
      subDailyMode,
      isStartDate,
      isEndDate,
      isDisabled,
    } = this.props;
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
    } = this.state;
    const sharedProps = {
      idSuffix,
      onFocus: this.setFocus,
      subDailyMode,
      isStartDate,
      isEndDate,
      date,
      updateDate: this.updateDate,
      maxDate,
      minDate,
      fontSize,
      updateTimeUnitInput: this.updateTimeUnitInput,
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
        />
        <DateInputColumn
          {...sharedProps}
          type="month"
          value={monthValue}
          isValid={monthValid}
          isDisabled={isDisabled}
        />
        <DateInputColumn
          {...sharedProps}
          type="day"
          value={dayValue}
          isValid={dayValid}
          isDisabled={isDisabled}
        />
        { subDailyMode && (
          <>
            <DateInputColumn
              {...sharedProps}
              type="hour"
              value={hourValue}
              isValid={hourValid}
              isDisabled={isDisabled}
            />
            <div className="input-time-divider">:</div>
            <DateInputColumn
              {...sharedProps}
              type="minute"
              value={minuteValue}
              isValid={minuteValid}
              isDisabled={isDisabled}
            />
            <div className="input-time-zmark">Z</div>
          </>
        )}
      </div>
    );
  }
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
};

export default DateSelector;
