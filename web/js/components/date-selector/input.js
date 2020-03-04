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
    this.state = {
      value: '',
      selected: false,
      size: null,
    };
    this.inputs = [];
  }

  componentDidUpdate(prevProps) {
    const { focused, tabIndex, value } = this.props;
    if (focused) {
      this.inputs[tabIndex].focus();
    }
    if (value !== prevProps.value) {
      this.updateValue();
    }
  }

  componentDidMount() {
    this.updateValue();
    this.setTextSize();
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

  // update input value
  updateValue = () => {
    const { value } = this.props;
    this.setState({ value });
  }

  onKeyPress = (e) => {
    // check tab and enter key code
    const { keyCode } = e;
    const entered = keyCode === 13 || keyCode === 9;
    if (entered) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  onKeyUp = (e) => {
    const { type } = this.props;
    const { keyCode } = e;
    const entered = keyCode === 13 || keyCode === 9;
    let shiftTab;

    // shift down when tab pressed
    if (e.shiftKey && keyCode === 9) {
      shiftTab = true;
    }
    if (keyCode === 38) {
      // up
      e.preventDefault();
      this.onClickUp();
      return;
    }
    if (keyCode === 40) {
      // down
      e.preventDefault();
      this.onClickDown();
      return;
    }
    if (e.type === 'focusout' || entered) {
      if (type === 'year' || type === 'day') {
        if (!((keyCode >= 48 && keyCode <= 57) || entered || keyCode === 8)) {
          return;
        }
      }
      if (entered) {
        if (shiftTab) {
          // shift-tabbed - move backward
          this.previousTab();
        } else {
          // entered or tabbed - move forward
          this.nextTab();
        }
      }
    }
  }

  onClickUp = () => {
    this.rollDate(1);
  }

  onClickDown = () => {
    this.rollDate(-1);
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
    const date = new Date(this.props.date);
    if (input > 1000 && input < 9999) {
      const newDate = new Date(date.setUTCFullYear(input));
      return this.validateDate(newDate);
    }
    return null;
  }

  monthValidation = (input) => {
    const date = new Date(this.props.date);
    let newDate;
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
    const date = new Date(this.props.date);
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
    const date = new Date(this.props.date);
    if (input >= 0 && input <= 23) {
      const newDate = new Date(date.setUTCHours(input));
      return this.validateDate(newDate);
    }
    return null;
  }

  minuteValidation = (input) => {
    const date = new Date(this.props.date);
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
    const { setFocusedTab, tabIndex } = this.props;
    e.target.select();
    this.setState({ selected: true });
    setFocusedTab(tabIndex);
  }

  blur = (e) => {
    const { setFocusedTab, tabIndex, type } = this.props;
    // check for valid date on blur
    const inputValue = e.target.value;
    const newDate = this.validateBasedOnType(inputValue);
    let value = newDate === null
      ? this.props.value
      : inputValue;

    if (type === 'month' && !isNaN(value)) {
      value = util.monthStringArray[value - 1];
    } else if (value.length === 1) {
      value = `0${value}`;
    }

    this.setState({
      value,
      selected: false,
    });

    setFocusedTab(null, tabIndex);
  }

  onChange = (e) => {
    this.setState({
      value: e.target.value.toUpperCase(),
    });
  }

  nextTab = () => {
    const { changeTab, tabIndex } = this.props;
    changeTab(tabIndex + 1, tabIndex);
  }

  previousTab = () => {
    const { changeTab, tabIndex } = this.props;
    changeTab(tabIndex - 1, tabIndex);
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
      inputId,
      isValid,
      tabIndex,
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
    return (
      <div
        className={containerClassName}
        style={containerBorderStyle}
      >
        <Arrow
          direction="up"
          onClick={this.onClickUp}
          type={type}
        />
        <input
          type="text"
          ref={(input) => {
            this.inputs[tabIndex] = input;
          }}
          size={size}
          maxLength={size}
          className={inputClassName}
          id={inputId}
          value={value}
          tabIndex={tabIndex}
          onKeyUp={this.onKeyUp}
          onKeyDown={this.onKeyPress}
          onChange={this.onChange}
          style={fontSizeStyle}
          onBlur={this.blur}
          onFocus={this.handleFocus}
        />
        <Arrow
          direction="down"
          onClick={this.onClickDown}
          type={type}
        />
      </div>
    );
  }
}

DateInputColumn.propTypes = {
  changeTab: PropTypes.func,
  date: PropTypes.object,
  focused: PropTypes.bool,
  fontSize: PropTypes.number,
  inputId: PropTypes.string,
  isValid: PropTypes.bool,
  maxDate: PropTypes.object,
  minDate: PropTypes.object,
  setFocusedTab: PropTypes.func,
  tabIndex: PropTypes.number,
  type: PropTypes.string,
  updateDate: PropTypes.func,
  updateTimeUnitInput: PropTypes.func,
  value: PropTypes.node,
};

export default DateInputColumn;
