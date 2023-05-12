import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Arrow from '../util/arrow';
import { rollDate } from '../../modules/date/util';
import {
  yearValidation,
  monthValidation,
  dayValidation,
  hourValidation,
  minuteValidation,
} from './util';
import { MONTH_STRING_ARRAY } from '../../modules/date/constants';

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
      isLastPosition: subDailyMode ? type === 'minute' : type === 'day',
      isFirstPosition: type === 'year',
      unitCycle: subDailyMode
        ? ['year', 'month', 'day', 'hour', 'minute']
        : ['year', 'month', 'day'],
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
  };

  nextInput = () => {
    const { isLastPosition, unitCycle } = this.state;
    const {
      type, idSuffix, isEndDate, isStartDate,
    } = this.props;
    const currentPosition = unitCycle.indexOf(type);
    const nextPosition = currentPosition === unitCycle.length - 1 ? 0 : currentPosition + 1;
    const nextUnit = unitCycle[nextPosition];
    let currentTarget = `#${type}-${idSuffix}`;
    let nextTarget = `#${nextUnit}-${idSuffix}`;

    if (isStartDate) {
      currentTarget = `${currentTarget}-start`;
      nextTarget = isLastPosition
        ? `#year-${idSuffix}-end`
        : `${nextTarget}-start`;
    } else if (isEndDate) {
      currentTarget = `${currentTarget}-end`;
      nextTarget = isLastPosition
        ? `#year-${idSuffix}-start`
        : `${nextTarget}-end`;
    }

    document.querySelector(currentTarget).blur();
    setTimeout(() => {
      document.querySelector(nextTarget).focus();
    }, 10);
  };

  prevInput = () => {
    const { isFirstPosition, unitCycle } = this.state;
    const {
      type, subDailyMode, idSuffix, isEndDate, isStartDate,
    } = this.props;
    const currentPosition = unitCycle.indexOf(type);
    const prevPosition = currentPosition === 0 ? unitCycle.length - 1 : currentPosition - 1;
    const prevUnit = unitCycle[prevPosition];
    const rollOverPosition = subDailyMode ? 'minute' : 'day';

    let currentTarget = `#${type}-${idSuffix}`;
    let prevTarget = isFirstPosition
      ? `#${rollOverPosition}-${idSuffix}`
      : `#${prevUnit}-${idSuffix}`;

    if (isStartDate) {
      currentTarget = `${currentTarget}-start`;
      prevTarget = isFirstPosition
        ? `#${rollOverPosition}-${idSuffix}-end`
        : `${prevTarget}-start`;
    } else if (isEndDate) {
      currentTarget = `${currentTarget}-end`;
      prevTarget = isFirstPosition
        ? `#${rollOverPosition}-${idSuffix}-start`
        : `${prevTarget}-end`;
    }

    document.querySelector(currentTarget).blur();
    setTimeout(() => {
      document.querySelector(prevTarget).focus();
    }, 10);
  };

  updateValue = () => {
    const { value } = this.props;
    this.setState({ value });
  };

  onKeyPress = (e) => {
    const { keyCode } = e;
    const entered = keyCode === 13;
    const tabbed = keyCode === 9;
    const shiftTab = e.shiftKey && keyCode === 9;

    if (entered || tabbed || shiftTab) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  onKeyUp = (e) => {
    const { type } = this.props;
    const { keyCode } = e;
    const entered = keyCode === 13;
    const tabbed = keyCode === 9;
    const backspace = keyCode === 8;
    const numKeys = keyCode >= 48 && keyCode <= 57;
    const shiftTab = e.shiftKey && keyCode === 9;
    const validKeycodes = numKeys || entered || backspace || tabbed;

    if (keyCode === 38) {
      // up
      e.preventDefault();
      this.changeDate(1);
      return;
    }
    if (keyCode === 40) {
      // down
      e.preventDefault();
      this.changeDate(-1);
      return;
    }
    if (e.type === 'focusout' || entered || tabbed) {
      if ((type === 'year' || type === 'day') && !validKeycodes) {
        return;
      }
      if (shiftTab) {
        this.prevInput();
        return;
      }
      if (entered || tabbed) {
        this.nextInput();
      }
    }
  };

  sanitizeInput = (value) => {
    const {
      date, type, minDate, maxDate, updateTimeUnitInput,
    } = this.props;
    let newDate;
    const validateDate = (dateParam) => dateParam > minDate && dateParam <= maxDate && dateParam;
    switch (type) {
      case 'year':
        newDate = yearValidation(value, date, validateDate);
        break;
      case 'month':
        newDate = monthValidation(value, date, validateDate);
        // transform month number to string (e.g., 3 -> 'MAR')
        // eslint-disable-next-line no-restricted-globals
        if (newDate !== null && !isNaN(value)) {
          value = MONTH_STRING_ARRAY[value - 1];
        }
        break;
      case 'day':
        newDate = dayValidation(value, date, validateDate);
        break;
      case 'hour':
        newDate = hourValidation(value, date, validateDate);
        break;
      case 'minute':
        newDate = minuteValidation(value, date, validateDate);
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
  };

  changeDate = (amt) => {
    const {
      date, minDate, maxDate, type, updateDate, isDisabled,
    } = this.props;
    if (isDisabled) return;
    const newDate = rollDate(
      date,
      type,
      amt,
      minDate,
      maxDate,
    );
    updateDate(newDate, true);
  };

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
  };

  blur = (e) => {
    const { type, value } = this.props;
    // check for valid date on blur
    const inputValue = e.target.value;
    const newDate = this.sanitizeInput(inputValue);
    let newValue = newDate === null
      ? value
      : inputValue;

    // eslint-disable-next-line no-restricted-globals
    if (type === 'month' && !isNaN(newValue)) {
      newValue = MONTH_STRING_ARRAY[newValue - 1];
    } else if (newValue.length === 1) {
      newValue = `0${newValue}`;
    }

    this.setState({
      value: newValue,
      selected: false,
    });
  };

  onChange = (e) => {
    this.setState({
      value: e.target.value.toUpperCase(),
    });
  };

  render() {
    const {
      fontSize,
      idSuffix,
      isValid,
      isStartDate,
      isEndDate,
      isDisabled,
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
          onClick={isDisabled ? () => {} : () => this.changeDate(1)}
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
          onTouchCancel={this.blur}
          onFocus={this.handleFocus}
          onTouchStart={this.handleFocus}
          disabled={isDisabled}
        />
        <Arrow
          direction="down"
          onClick={isDisabled ? () => {} : () => this.changeDate(-1)}
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
  isDisabled: PropTypes.bool,
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
