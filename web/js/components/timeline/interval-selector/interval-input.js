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
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      valid: true
    };
  }
  onKeyInput = (e) => {
    let value = e.target.value;
    if (value === '' || regex.test(value)) {
      value = Number(value);
      if (value < 1000) {
        this.setValue(value);
      }
    }
  }
  handleKeyPress = (e) => {
    let value = this.state.value;
    if (value === '' || regex.test(value)) {
      value = Number(value);
      if (e.key === 'ArrowUp') {
        if (value < 1000) {
          this.setValue(value + 1);
        }
      } else if (e.key === 'ArrowDown') {
        if (value > 1) {
          this.setValue(value - 1);
        }
      } else if (e.key === 'Enter') {
        this.handleBlur();
      }
    }
  }
  handleFocus = (e) => {
    e.target.select();
  }
  handleBlur = () => {
    let { value } = this.state;
    if (value >= 1 && value < 1000) {
      this.setState({
        valid: true
      }, this.props.changeInterval(value));
    } else {
      this.setState({
        valid: false
      });
    }
  }
  setValue = (value) => {
    this.setState({
      value: value
    });
  }
  componentDidMount() {
    this.setValue(this.props.intervalValue);
  }
  render() {
    return (
      <input className="interval-input" type="text"
        style={this.state.valid ? {} : { borderColor: '#ff0000' }}
        min="1" step="1" value={this.state.value}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
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
