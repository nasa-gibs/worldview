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
    if (this.props.focused) {
      this.inputs[this.props.tabIndex].focus();
    }
    if (this.props.value !== prevProps.value) {
      this.updateValue();
    }
    // TODO: sometimes valid false state is retained for a valid input
    if (!this.state.valid && (!prevState.selected || !this.state.selected)) {
      const date = this.props.date.toISOString();
      const prevDate = prevProps.date.toISOString();
      if (date !== prevDate) {
        this.updateValue();
        this.resetValidSelected();
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
    var keyCode = e.keyCode;
    var entered = keyCode === 13 || keyCode === 9;
    if (entered) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  onKeyUp = (e) => {
    var keyCode = e.keyCode;
    var value = e.target.value;
    var newDate;
    var shiftTab;
    var entered = keyCode === 13 || keyCode === 9;

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
      if (this.props.type === 'year' || this.props.type === 'day') {
        if (!((keyCode >= 48 && keyCode <= 57) || entered || keyCode === 8)) {
          return;
        }
      }
      newDate = this.validateBasedOnType(value);
      if (newDate) {
        //TODO: IS THIS NECESSARY ANYMORE WITH NEW BLUR UPDATEDATE INVOKE?
        // this.props.updateDate(newDate, this.props.type);
        if (entered) {
          if (shiftTab) {
            // shift-tabbed - move backward
            this.previousTab();
          } else {
            // entered or tabbed - move forward
            this.nextTab();
          }
        }
      } else if (entered) {
        if (shiftTab) {
          // shift-tabbed - move backward
          this.previousTab();
        } else {
          // entered or tabbed - move forward
          this.nextTab();
        }
        this.setState({
          valid: false
        });
      }
    }
  }

  onClickUp = () => {
    this.rollDate(1);
    this.setState({
      valid: true
    });
  }

  onClickDown = () => {
    this.rollDate(-1);
    this.setState({
      valid: true
    });
  }

  validateBasedOnType = (value) => {
    let newDate;
    switch (this.props.type) {
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
    return newDate;
  }

  yearValidation = (input) => {
    var newDate;
    if (input > 1000 && input < 9999) {
      newDate = new Date(new Date(this.props.date).setUTCFullYear(input));
      return this.validateDate(newDate, input);
    }
  }

  monthValidation = (input) => {
    var newDate;
    if (!isNaN(input) && input < 13 && input > 0) {
      newDate = new Date(new Date(this.props.date).setUTCMonth(input - 1));
      if (newDate) {
        this.setState({
          value: util.monthStringArray[input - 1]
        });
        return this.validateDate(newDate, input);
      }
    } else {
      const realMonth = util.stringInArray(util.monthStringArray, input);
      if (realMonth !== false) {
        newDate = new Date(new Date(this.props.date).setUTCMonth(realMonth));
        return this.validateDate(newDate, input);
      } else {
        return false;
      }
    }
  }

  dayValidation = (input) => {
    var newDate;
    var maxDate;
    var currentDate = this.props.date;

    maxDate = new Date(
      currentDate.getYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();

    if (input > 0 && input <= maxDate) {
      newDate = new Date(new Date(currentDate).setUTCDate(input));
      return this.validateDate(newDate, input);
    }
  }

  hourValidation = (input) => {
    var newDate;
    if (input >= 0 && input <= 23) {
      newDate = new Date(new Date(this.props.date).setUTCHours(input));
      return this.validateDate(newDate, input);
    }
  }

  minuteValidation = (input) => {
    var newDate;
    if (input >= 0 && input <= 59) {
      newDate = new Date(new Date(this.props.date).setUTCMinutes(input));
      return this.validateDate(newDate, input);
    }
  }

  rollDate = (amt) => {
    var newDate = util.rollDate(
      this.props.date,
      this.props.type,
      amt,
      this.props.minDate,
      this.props.maxDate
    );
    this.props.updateDate(newDate, this.props.type, amt);
  }

  /**
   * Select all text on focus
   * https://stackoverflow.com/a/40261505/4589331
   * @param {Object} e | Event Object
   */
  handleFocus = (e) => {
    e.target.select();
    this.setState({ selected: true });
    this.props.setFocusedTab(this.props.tabIndex);
  }

  blur = (e) => {
    const { blur, updateDate, type } = this.props;
    // check for valid date on blur
    let value = e.target.value;
    const newDate = this.validateBasedOnType(value);
    let valid = !!newDate;

    if (newDate) {
      updateDate(newDate, type);
    }
    // reset to previous valid value with mouse click outside input
    if (!valid && !e.relatedTarget && document.activeElement.className !== 'button-input-group') {
      valid = true;
      value = this.props.value;
    }

    this.setState({
      value,
      valid,
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
    this.props.changeTab(this.props.tabIndex + 1);
  }

  previousTab = () => {
    this.props.changeTab(this.props.tabIndex - 1);
  }

  validateDate = (date, input) => {
    let validDate = false;
    if (date > this.props.minDate && date <= this.props.maxDate) {
      this.setState({
        valid: true
      });
      input = null;
      validDate = date;
    }
    this.props.updateTimeUnitInput(this.props.type, input);
    return validDate;
  }

  render() {
    return (
      <div
        className={
          this.state.selected
            ? 'input-wrapper selected' + ' input-wrapper-' + this.props.type
            : 'input-wrapper ' + 'input-wrapper-' + this.props.type
        }
        style={this.state.valid ? {} : { borderColor: '#ff0000' }}
      >
        <div
          onClick={this.onClickUp}
          className="date-arrows date-arrow-up"
          data-interval={this.props.type}
        >
          <svg width="25" height="8">
            <path d="M 12.5,0 25,8 0,8 z" className="uparrow" />
          </svg>
        </div>
        <input
          type="text"
          ref={input => {
            this.inputs[this.props.tabIndex] = input;
          }}
          size={this.state.size}
          maxLength={this.state.size}
          className="button-input-group"
          id={this.props.inputId}
          value={this.state.value}
          tabIndex={this.props.tabIndex}
          onKeyUp={this.onKeyUp}
          onKeyDown={this.onKeyPress /* currently not working */}
          onChange={this.onChange}
          style={
            this.props.fontSize ? { fontSize: this.props.fontSize + 'px' } : {}
          }
          step={this.props.step}
          onBlur={this.blur}
          onFocus={this.handleFocus}
        />
        <div
          onClick={this.onClickDown}
          className="date-arrows date-arrow-down"
          data-interval={this.props.type}
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
  inputId: PropTypes.string,
  maxDate: PropTypes.object,
  minDate: PropTypes.object,
  setFocusedTab: PropTypes.func,
  step: PropTypes.number,
  tabIndex: PropTypes.number,
  type: PropTypes.string,
  updateDate: PropTypes.func,
  updateTimeUnitInput: PropTypes.func,
  value: PropTypes.node
};

export default DateInputColumn;
