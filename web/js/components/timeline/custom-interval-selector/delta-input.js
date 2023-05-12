import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

/*
 * Delta Input for Custom Interval Selector
 * group. It is a child component.
 *
 * @class DeltaInput
 */
const regex = /^[0-9\b]+$/;

class DeltaInput extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      valid: true,
    };
  }

  componentDidMount() {
    const { deltaValue } = this.props;
    this.setValue(deltaValue);
  }

  onKeyInput = (e) => {
    let { value } = e.target;
    if (value === '' || regex.test(value)) {
      value = Number(value);
      if (value < 1000) {
        this.setValue(value);
      }
    }
  };

  handleKeyPress = (e) => {
    let { value } = this.state;
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
  };

  handleFocus = (e) => {
    e.target.select();
  };

  handleBlur = () => {
    const { changeDelta } = this.props;
    const { value } = this.state;
    if (value >= 1 && value < 1000) {
      this.setState({
        valid: true,
      }, changeDelta(value));
    } else {
      this.setState({
        valid: false,
      });
    }
  };

  setValue = (value) => {
    this.setState({
      value,
    });
  };

  render() {
    const {
      value,
      valid,
    } = this.state;
    return (
      <input
        className="custom-interval-delta-input no-drag"
        type="text"
        style={valid ? {} : { borderColor: '#ff0000' }}
        min="1"
        step="1"
        value={value}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        onKeyDown={this.handleKeyPress}
        onChange={this.onKeyInput}
      />
    );
  }
}

DeltaInput.propTypes = {
  changeDelta: PropTypes.func,
  deltaValue: PropTypes.number,
};

export default DeltaInput;
