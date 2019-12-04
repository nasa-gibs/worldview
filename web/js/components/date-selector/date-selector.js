import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DateInputColumn from './input';
import util from '../../util/util';

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
      tab: null,
      year: null,
      month: null,
      day: null,
      hour: null,
      minute: null
    };
  }

  // add pending timeunit input
  updateTimeUnitInput = (timeUnit, input) => {
    this.setState({
      [timeUnit]: input
    }, this.updateDate);
  }

  blur = () => {
    this.setState({ tab: null });
  }

  setFocusedTab = (tab) => {
    this.setState({ tab });
  }

  changeTab = (index) => {
    const { subDailyMode } = this.props;
    const { tab } = this.state;
    let nextTab = index;
    let maxTab;
    if (subDailyMode) {
      maxTab = 5;
    } else {
      maxTab = 3;
    }
    if (index > tab) {
      // past max tab
      if (index > maxTab) {
        nextTab = 1;
      }
    } else {
      // below min tab
      if (index < 1) {
        nextTab = maxTab;
      }
    }
    this.setState({
      tab: nextTab
    });
  }

  /**
  * @desc update date with potential temporarily invalid dates
  * @desc Example: temporary invalid date example would be starting with FEB 22
  * @desc changing to invalid FEB 31 (31 is a valid day, but invalid for FEB),
  * @desc and finally changing to valid OCT 31 - temp values are retained for this
  *
  * @param {String} date
  * @param {Boolean} isRollDate
  * @returns {void}
  */
  updateDate = (date = this.props.date, isRollDate) => {
    const { minDate, maxDate, id, onDateChange } = this.props;
    const { year, month, day, hour, minute } = this.state;
    const inputDate = new Date(date);
    const tempDay = day || date.getUTCDate();
    let dateWithinRange;
    let updatedDate;
    let validDate = true;

    if (isRollDate) {
      dateWithinRange = inputDate > minDate && inputDate <= maxDate;
      date = inputDate;
      validDate = true;
    } else {
      // conditional logic allows temporary place holder values to be validated
      // in the event other inputs are invalid, temp values remain without date change
      if (year) {
        date = new Date(new Date(date).setUTCFullYear(year));
      }

      if (day && !month) {
        const maxDate = new Date(
          date.getYear(),
          date.getMonth() + 1,
          0
        ).getDate();

        if (day <= maxDate) {
          date = new Date(new Date(date).setUTCDate(day));
        } else {
          date = new Date(new Date(date).setUTCDate(maxDate));
          validDate = false;
        }
      }

      if (month) {
        const realMonth = util.stringInArray(util.monthStringArray, month);
        const maxDatePrev = new Date(
          date.getYear(),
          date.getMonth() + 1,
          0
        ).getDate();

        const maxDateNew = new Date(
          date.getYear(),
          realMonth + 1,
          0
        ).getDate();

        if (maxDatePrev > maxDateNew && tempDay > maxDateNew) {
          validDate = false;
        }

        if (day && month) {
          date = new Date(new Date(date).setUTCDate(1));
          date = new Date(new Date(date).setUTCMonth(realMonth));
        } else {
          date = new Date(new Date(date).setUTCMonth(realMonth));
        }
      }

      if (day && month) {
        const maxDate = new Date(
          date.getYear(),
          date.getMonth() + 1,
          0
        ).getDate();

        if (day <= maxDate) {
          date = new Date(new Date(date).setUTCDate(day));
        } else {
          date = new Date(new Date(date).setUTCDate(maxDate));
          validDate = false;
        }
      }

      if (hour) {
        date = new Date(new Date(date).setUTCHours(hour));
      }

      if (minute) {
        date = new Date(new Date(date).setUTCMinutes(minute));
      }

      // updateDate at this stage can still be invalid with pending timeunit changes
      dateWithinRange = date > minDate && date <= maxDate;
      updatedDate = date.toISOString() !== this.props.date.toISOString();
      if (!dateWithinRange && updatedDate) {
        date = inputDate;
      }
    }

    if (validDate && (isRollDate || (dateWithinRange && updatedDate))) {
      onDateChange(date, id);
      // clear the pending timeunit inputs
      this.setState({
        year: null,
        month: null,
        day: null,
        hour: null,
        minute: null
      });
    }
  }

  shouldComponentUpdate(prevProps, prevState) {
    const {
      date,
      subDailyMode,
      maxDate,
      minDate
    } = this.props;

    const updateCheck = (
      this.state.tab === prevState.tab &&
      date.getTime() === prevProps.date.getTime() &&
      subDailyMode === prevProps.subDailyMode &&
      maxDate.getTime() === prevProps.maxDate.getTime() &&
      minDate.getTime() === prevProps.minDate.getTime()
    );
    return !updateCheck;
  }

  render() {
    const {
      date,
      maxDate,
      minDate,
      fontSize,
      idSuffix,
      subDailyMode
    } = this.props;
    const { tab } = this.state;
    const sharedProps = {
      hold: tab === null,
      date,
      updateDate: this.updateDate,
      setFocusedTab: this.setFocusedTab,
      changeTab: this.changeTab,
      maxDate,
      minDate,
      blur: this.blur,
      fontSize,
      updateTimeUnitInput: this.updateTimeUnitInput
    };
    return (
      <div className="wv-date-selector-widget">
        <DateInputColumn
          {...sharedProps}
          value={date.getUTCFullYear()}
          type="year"
          inputId={idSuffix ? 'year-' + idSuffix : ''}
          tabIndex={1}
          focused={tab === 1}
        />
        <DateInputColumn
          {...sharedProps}
          value={util.monthStringArray[date.getUTCMonth()]}
          type="month"
          inputId={idSuffix ? 'month-' + idSuffix : ''}
          tabIndex={2}
          focused={tab === 2}
        />
        <DateInputColumn
          {...sharedProps}
          type="day"
          value={util.pad(date.getUTCDate(), 2, '0')}
          tabIndex={3}
          inputId={idSuffix ? 'day-' + idSuffix : ''}
          focused={tab === 3}
        />
        { subDailyMode && (
          <React.Fragment>
            <DateInputColumn
              {...sharedProps}
              type="hour"
              inputId={idSuffix ? 'hour-' + idSuffix : ''}
              value={util.pad(date.getUTCHours(), 2, '0')}
              tabIndex={4}
              focused={tab === 4}
            />
            <div className="input-time-divider">:</div>
            <DateInputColumn
              {...sharedProps}
              type="minute"
              value={util.pad(date.getUTCMinutes(), 2, '0')}
              inputId={idSuffix ? 'minute-' + idSuffix : ''}
              tabIndex={5}
              focused={tab === 5}
            />
            <div className="input-time-zmark">Z</div>
          </React.Fragment>
        )
        }
      </div>
    );
  }
}
DateSelector.defaultProps = {
  fontSize: 15
};
DateSelector.propTypes = {
  date: PropTypes.object,
  fontSize: PropTypes.number,
  id: PropTypes.string,
  idSuffix: PropTypes.string,
  maxDate: PropTypes.object,
  minDate: PropTypes.object,
  onDateChange: PropTypes.func,
  subDailyMode: PropTypes.bool
};

export default DateSelector;
