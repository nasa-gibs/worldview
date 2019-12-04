import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
      value: this.props.value,
      selected: false,
      valid: true,
      size: null
    };
    this.inputs = [];
  }

  componentDidUpdate(prevProps, prevState) {
    const { focused, hold, minDate, maxDate, tabIndex } = this.props;
    const { valid, value } = this.state;
    const date = this.props.date.toISOString();
    const prevDate = prevProps.date.toISOString();

    if (focused) {
      this.inputs[tabIndex].focus();
    }
    if (this.props.value !== prevProps.value && valid) {
      this.updateValue();
    }

    if (!valid) {
      if (hold) {
        const checkValidValue = this.validateBasedOnType(value, true);
        if (checkValidValue === null || date !== prevDate) {
          this.updateValue();
          this.resetValidSelected();
        }
      } else {
        if (date !== prevDate) {
          const dateWithinRange = this.props.date > minDate && this.props.date <= maxDate;
          if (dateWithinRange) {
            this.updateValue();
            this.resetValidSelected();
          }
        } else {
          this.validateBasedOnType(value, true);
        }
      }
    } else {
      if (value !== prevState.value) {
        this.validateBasedOnType(value, true);
      }
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
      size = '4';
    } else if (type === 'day') {
      size = 2;
    } else {
      size = 3;
    }
    this.setState({
      size: size
    });
  }

  // update input value
  updateValue = () => {
    this.setState({
      value: this.props.value
    });
  }

  // reset valid and selected state
  resetValidSelected = () => {
    this.setState({
      valid: true,
      selected: false
    });
  }

  onKeyPress = (e) => {
    // check tab and enter key code
    const keyCode = e.keyCode;
    const entered = keyCode === 13 || keyCode === 9;
    if (entered) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  onKeyUp = (e) => {
    const { type } = this.props;
    const keyCode = e.keyCode;
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

  validateBasedOnType = (value, stateCheck) => {
    const { type, updateTimeUnitInput } = this.props;
    let newDate;
    switch (type) {
      case 'year':
        newDate = this.yearValidation(value);
        break;
      case 'month':
        newDate = this.monthValidation(value);
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

    if (newDate !== null && !stateCheck) {
      updateTimeUnitInput(type, value);
    }
    return newDate;
  }

  yearValidation = (input) => {
    const date = new Date(this.props.date);
    if (input > 1000 && input < 9999) {
      const newDate = new Date(date.setUTCFullYear(input));
      return this.validateDate(newDate, input);
    }
    return null;
  }

  monthValidation = (input) => {
    const date = new Date(this.props.date);
    var newDate;
    if (!isNaN(input) && input < 13 && input > 0) {
      newDate = new Date(date.setUTCMonth(input - 1));
      if (newDate) {
        this.setState({
          value: util.monthStringArray[input - 1]
        });
        return this.validateDate(newDate, input);
      }
      return null;
    } else {
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
        return this.validateDate(addDay, input);
      } else {
        return null;
      }
    }
  }

  dayValidation = (input) => {
    const date = new Date(this.props.date);
    const standardMaxDateForMonth = 31;

    if (input > 0 && input <= standardMaxDateForMonth) {
      const actualMaxDateForMonth = new Date(
        date.getYear(),
        date.getMonth() + 1,
        0
      ).getDate();

      if (input > actualMaxDateForMonth) {
        return false;
      }
      const newDate = new Date(date.setUTCDate(input));
      return this.validateDate(newDate, input);
    }
    return null;
  }

  hourValidation = (input) => {
    const date = new Date(this.props.date);
    if (input >= 0 && input <= 23) {
      const newDate = new Date(date.setUTCHours(input));
      return this.validateDate(newDate, input);
    }
    return null;
  }

  minuteValidation = (input) => {
    const date = new Date(this.props.date);
    if (input >= 0 && input <= 59) {
      const newDate = new Date(date.setUTCMinutes(input));
      return this.validateDate(newDate, input);
    }
    return null;
  }

  rollDate = (amt) => {
    const { date, minDate, maxDate, type, updateDate } = this.props;
    const newDate = util.rollDate(
      date,
      type,
      amt,
      minDate,
      maxDate
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
    const { blur, type, updateTimeUnitInput } = this.props;
    const { valid } = this.state;
    // check for valid date on blur
    let value = e.target.value;
    const newDate = this.validateBasedOnType(value);
    let validDate = !!newDate;

    if (newDate) {
      updateTimeUnitInput(type, value);
    } else if (newDate === null) {
      value = this.props.value;
      validDate = valid;
    }

    this.setState({
      value,
      valid: validDate,
      selected: false
    });

    blur();
  }

  onChange = (e) => {
    this.setState({
      value: e.target.value.toUpperCase()
    });
  }

  nextTab = () => {
    const { changeTab, tabIndex } = this.props;
    changeTab(tabIndex + 1);
  }

  previousTab = () => {
    const { changeTab, tabIndex } = this.props;
    changeTab(tabIndex - 1);
  }

  validateDate = (date) => {
    const { minDate, maxDate } = this.props;
    let validDate = false;
    if (date > minDate && date <= maxDate) {
      this.setState({
        valid: true
      });
      validDate = date;
    }
    return validDate;
  }

  render() {
    const { fontSize, inputId, tabIndex, type } = this.props;
    const { selected, size, valid, value } = this.state;

    const containerClassName = `input-wrapper ${selected ? 'selected ' : ''}input-wrapper-${type}`;
    const containerBorderStyle = valid ? {} : { borderColor: '#ff0000' };
    const inputClassName = `button-input-group${valid ? '' : ' invalid-input'}`;
    const fontSizeStyle = fontSize ? { fontSize: fontSize + 'px' } : {};
    return (
      <div
        className={containerClassName}
        style={containerBorderStyle}
      >
        <div
          onClick={this.onClickUp}
          className="date-arrows date-arrow-up"
          data-interval={type}
        >
          <svg width="25" height="8">
            <path d="M 12.5,0 25,8 0,8 z" className="uparrow" />
          </svg>
        </div>
        <input
          type="text"
          ref={input => {
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
        <div
          onClick={this.onClickDown}
          className="date-arrows date-arrow-down"
          data-interval={type}
        >
          <svg width="25" height="8">
            <path d="M 12.5,0 25,8 0,8 z" className="downarrow" />
          </svg>
        </div>
      </div>
    );
  }
}

DateInputColumn.propTypes = {
  blur: PropTypes.func,
  changeTab: PropTypes.func,
  date: PropTypes.object,
  focused: PropTypes.bool,
  fontSize: PropTypes.number,
  hold: PropTypes.bool,
  inputId: PropTypes.string,
  maxDate: PropTypes.object,
  minDate: PropTypes.object,
  setFocusedTab: PropTypes.func,
  tabIndex: PropTypes.number,
  type: PropTypes.string,
  updateDate: PropTypes.func,
  updateTimeUnitInput: PropTypes.func,
  value: PropTypes.node
};

export default DateInputColumn;
