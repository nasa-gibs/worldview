import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

/*
 * Interval Input for Custom Interval Selector
 * group. It is a child component.
 *
 * @class IntervalInput
 */
const regex = /^[0-9\b]+$/;

class IntervalInput extends PureComponent {
  onKeyInput = (e) => {
    let value = e.target.value;
    if (value === '' || regex.test(value)) {
      value = Number(value);
      if (value <= 1000) {
        this.props.changeInterval(value);
      }
    }
  }
  handleKeyPress = (e) => {
    let value = e.target.value;
    if (value === '' || regex.test(value)) {
      value = Number(value);
      if (e.key === 'ArrowUp') {
        if (value < 1000) {
          this.props.changeInterval(value + 1);
        }
      } else if (e.key === 'ArrowDown') {
        if (value > 1) {
          this.props.changeInterval(value - 1);
        }
      }
    }
  }
  render() {
    return (
      <input className="interval-input" type="text"
        min="1" step="1" value={this.props.intervalValue}
        onKeyDown={this.handleKeyPress}
        onChange={this.onKeyInput} />
    );
  }
}

IntervalInput.propTypes = {
  intervalValue: PropTypes.number,
  changeInterval: PropTypes.func
};

export default IntervalInput;
