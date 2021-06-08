import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Arrow from '../util/arrow';
import util from '../../util/util';

/*
 * DateInputColumn used in DateSelector within
 * Timeline and AnimationWidget
 *
 * @class DateInputColumn
 */
class DateInputColumn extends Component {
  constructor(props) {
    super(props);
    const { type, subDailyMode } = props;
    this.state = {
      value: '',
      selected: false,
      size: null,
      lastPosition: subDailyMode ? type === 'minute' : type === 'day',
    };
  }

  componentDidMount() {
    this.updateValue();
    this.setTextSize();
  }

  componentDidUpdate(prevProps) {
    const { value } = this.props;
    if (value !== prevProps.value) {
      this.updateValue();
    }
  }

  setTextSize = () => {
    const { type } = this.props;
    let size;
    if (type === 'year') {
      size = 4;
    } else if (type === 'month') {
      size = 3;
    } else {
      // day, hour, minute
      size = 2;
    }
    this.setState({
      size,
    });
  }

  /**
   * Handle changing to next input position when user hits enter, or
   * return to first input when hitting tab/enter on the last input
   */
  nextTab = () => {
    const { lastPosition } = this.state;
    const {
      type, subDailyMode, idSuffix, isEndDate, isStartDate,
    } = this.props;
    const unitCycle = ['year', 'month', 'day'];
    if (subDailyMode) {
      unitCycle.push('hour');
      unitCycle.push('minute');
    }
    const currentPosition = unitCycle.indexOf(type);
    const nextPosition = currentPosition === unitCycle.length - 1 ? 0 : currentPosition + 1;
    const nextUnit = unitCycle[nextPosition];
    let currentTarget = `#${type}-${idSuffix}`;
    let nextTarget = `#${nextUnit}-${idSuffix}`;

    if (isStartDate) {
      currentTarget = `${currentTarget}-start`;
      nextTarget = lastPosition
        ? `#year-${idSuffix}-end`
        : `${nextTarget}-start`;
    } else if (isEndDate) {
      currentTarget = `${currentTarget}-end`;
      nextTarget = lastPosition
        ? `#year-${idSuffix}-start`
        : `${nextTarget}-end`;
    }

    document.querySelector(currentTarget).blur();
    setTimeout(() => {
      document.querySelector(nextTarget).focus();
    }, 10);
  }

  updateValue = () => {
    const { value } = this.props;
    this.setState({ value });
  }

  onKeyPress = (e) => {
    const { keyCode } = e;
    const entered = keyCode === 13;
    if (entered) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  onKeyUp = (e) => {
    const { type } = this.props;
    const { keyCode } = e;
    const entered = keyCode === 13;
    const tabbed = keyCode === 9;
    const backspace = keyCode === 8;
    const numKeys = keyCode >= 48 && keyCode <= 57;

    if (keyCode === 38) {
      // up
      e.preventDefault();
      this.rollDate(1);
      return;
    }
    if (keyCode === 40) {
      // down
      e.preventDefault();
      this.rollDate(-1);
      return;
    }
    if (e.type === 'focusout' || entered || tabbed) {
      if (type === 'year' || type === 'day') {
        if (!(numKeys || entered || backspace)) {
          return;
        }
      }
      if (entered) {
        // entered or tabbed - move forward
        this.nextTab();
      }
    }
  }

  validateBasedOnType = (value) => {
    const { type, updateTimeUnitInput } = this.props;
    let newDate;
    switch (type) {
      case 'year':
        newDate = this.yearValidation(value);
        break;
      case 'month':
        newDate = this.monthValidation(value);
        // transform month number to string (e.g., 3 -> 'MAR')
        // eslint-disable-next-line no-restricted-globals
        if (newDate !== null && !isNaN(value)) {
          value = util.monthStringArray[value - 1];
        }
        break;
      case 'day':
        newDate = this.dayValidation(value);
        break;
      case 'hour':
        newDate = this.hourValidation(value);
        break;
      case 'minute':
        newDate = this.minuteValidation(value);
        break;
      default:
        break;
    }

    // add leading '0' to single string number
    if (newDate !== null && value.length === 1) {
      value = `0${value}`;
    }

    // update parent level time unit type value
    if (newDate !== null) {
      updateTimeUnitInput(type, value);
    }
    return newDate;
  }

  yearValidation = (input) => {
    let { date } = this.props;
    date = new Date(date);
    if (input > 1000 && input < 9999) {
      const newDate = new Date(date.setUTCFullYear(input));
      return this.validateDate(newDate);
    }
    return null;
  }

  monthValidation = (input) => {
    let { date } = this.props;
    date = new Date(date);
    let newDate;
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(input) && input < 13 && input > 0) {
      newDate = new Date(date.setUTCMonth(input - 1));
      if (newDate) {
        return this.validateDate(newDate);
      }
      return null;
    }
    const realMonth = util.stringInArray(util.monthStringArray, input);
    if (realMonth !== false) {
      const day = date.getUTCDate();
      const zeroDay = new Date(date.setUTCDate(1));

      const zeroAddMonth = new Date(zeroDay.setUTCMonth(realMonth));
      const zeroAddedMonthNumber = zeroAddMonth.getUTCMonth();

      const addDay = new Date(zeroAddMonth.setUTCDate(day));
      const addedDayMonthNumber = addDay.getUTCMonth();

      if (addedDayMonthNumber !== zeroAddedMonthNumber) {
        return false;
      }
      return this.validateDate(addDay);
    }
    return null;
  }

  dayValidation = (input) => {
    let { date } = this.props;
    date = new Date(date);
    const standardMaxDateForMonth = 31;

    if (input > 0 && input <= standardMaxDateForMonth) {
      const actualMaxDateForMonth = new Date(
        date.getYear(),
        date.getMonth() + 1,
        0,
      ).getDate();

      if (input > actualMaxDateForMonth) {
        return false;
      }
      const newDate = new Date(date.setUTCDate(input));
      return this.validateDate(newDate);
    }
    return null;
  }

  hourValidation = (input) => {
    let { date } = this.props;
    date = new Date(date);
    if (input >= 0 && input <= 23) {
      const newDate = new Date(date.setUTCHours(input));
      return this.validateDate(newDate);
    }
    return null;
  }

  minuteValidation = (input) => {
    let { date } = this.props;
    date = new Date(date);
    if (input >= 0 && input <= 59) {
      const newDate = new Date(date.setUTCMinutes(input));
      return this.validateDate(newDate);
    }
    return null;
  }

  rollDate = (amt) => {
    const {
      date, minDate, maxDate, type, updateDate,
    } = this.props;
    const newDate = util.rollDate(
      date,
      type,
      amt,
      minDate,
      maxDate,
    );
    updateDate(newDate, true);
  }

  /**
   * Select all text on focus
   * https://stackoverflow.com/a/40261505/4589331
   * @param {Object} e | Event Object
   */
  handleFocus = (e) => {
    const { onFocus, type } = this.props;
    e.target.select();
    this.setState({ selected: true });
    onFocus(type);
  }

  blur = (e) => {
    const { type, value } = this.props;
    // check for valid date on blur
    const inputValue = e.target.value;
    const newDate = this.validateBasedOnType(inputValue);
    let newValue = newDate === null
      ? value
      : inputValue;

    // eslint-disable-next-line no-restricted-globals
    if (type === 'month' && !isNaN(newValue)) {
      newValue = util.monthStringArray[newValue - 1];
    } else if (newValue.length === 1) {
      newValue = `0${newValue}`;
    }

    this.setState({
      value: newValue,
      selected: false,
    });
  }

  onChange = (e) => {
    this.setState({
      value: e.target.value.toUpperCase(),
    });
  }

  validateDate = (date) => {
    const { minDate, maxDate } = this.props;
    if (date > minDate && date <= maxDate) {
      return date;
    }
    return false;
  }

  render() {
    const {
      fontSize,
      idSuffix,
      isValid,
      isStartDate,
      isEndDate,
      type,
    } = this.props;
    const {
      selected,
      size,
      value,
    } = this.state;

    // conditional styling
    const containerClassName = `input-wrapper ${selected ? 'selected ' : ''}input-wrapper-${type}`;
    const containerBorderStyle = isValid ? {} : { borderColor: '#ff0000' };
    const inputClassName = `button-input-group${isValid ? '' : ' invalid-input'}`;
    const fontSizeStyle = fontSize ? { fontSize: `${fontSize}px` } : {};
    const inputId = isStartDate
      ? `${type}-${idSuffix}-start`
      : isEndDate
        ? `${type}-${idSuffix}-end`
        : `${type}-${idSuffix}`;

    return (
      <div
        className={containerClassName}
        style={containerBorderStyle}
      >
        <Arrow
          direction="up"
          onClick={() => this.rollDate(1)}
          type={type}
        />
        <input
          id={inputId}
          type="text"
          size={size}
          maxLength={size}
          className={inputClassName}
          value={value}
          onKeyUp={this.onKeyUp}
          onKeyDown={this.onKeyPress}
          onChange={this.onChange}
          style={fontSizeStyle}
          onBlur={this.blur}
          onFocus={this.handleFocus}
        />
        <Arrow
          direction="down"
          onClick={() => this.rollDate(-1)}
          type={type}
        />
      </div>
    );
  }
}

DateInputColumn.propTypes = {
  date: PropTypes.object,
  fontSize: PropTypes.number,
  idSuffix: PropTypes.string,
  isValid: PropTypes.bool,
  isStartDate: PropTypes.bool,
  isEndDate: PropTypes.bool,
  maxDate: PropTypes.object,
  minDate: PropTypes.object,
  onFocus: PropTypes.func,
  subDailyMode: PropTypes.bool,
  type: PropTypes.string,
  updateDate: PropTypes.func,
  updateTimeUnitInput: PropTypes.func,
  value: PropTypes.node,
};

export default DateInputColumn;
