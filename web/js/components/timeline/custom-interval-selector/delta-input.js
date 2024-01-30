import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/*
 * Delta Input for Custom Interval Selector
 * group. It is a child component.
 *
 * @class DeltaInput
 */
const regex = /^[0-9\b]+$/;

function DeltaInput(props) {
  const {
    deltaValue,
    changeDelta,
  } = props;

  const [value, setValue] = useState('');
  const [valid, setValid] = useState(true);

  useEffect(() => {
    setValue(deltaValue);
  }, []);

  const onKeyInput = (e) => {
    let inputValue = e.target.value;
    if (inputValue === '' || regex.test(inputValue)) {
      inputValue = Number(inputValue);
      if (inputValue < 1000) {
        setValue(inputValue);
      }
    }
  };

  const handleBlur = () => {
    if (value >= 1 && value < 1000) {
      setValid(true);
      changeDelta(value);
    } else {
      setValid(false);
    }
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  const handleKeyPress = (e) => {
    if (value === '' || regex.test(value)) {
      const numberValue = Number(value);
      if (e.key === 'ArrowUp') {
        if (numberValue < 1000) {
          setValue(numberValue + 1);
        }
      } else if (e.key === 'ArrowDown') {
        if (numberValue > 1) {
          setValue(numberValue - 1);
        }
      } else if (e.key === 'Enter') {
        handleBlur();
      }
    }
  };

  return (
    <input
      className="custom-interval-delta-input no-drag"
      type="text"
      style={valid ? {} : { borderColor: '#ff0000' }}
      min="1"
      step="1"
      value={value}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyPress}
      onChange={onKeyInput}
    />
  );
}

DeltaInput.propTypes = {
  changeDelta: PropTypes.func,
  deltaValue: PropTypes.number,
};

export default DeltaInput;
