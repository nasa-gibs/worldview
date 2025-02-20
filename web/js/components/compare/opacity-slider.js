import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import MonospaceDate from '../util/monospace-date';

function OpacitySlider ({
  value,
  onSlide,
  dateA,
  dateB,
}) {
  const [currentValue, setValue] = useState(value);
  /*
   * trigger onSlide Callback
   * @method onSlide
   * @param {number} value - Value of the slider selection
   * @return {void}
   */
  const handleSlide = (val) => {
    setValue(val);
    onSlide(val);
  };

  const getDateTextOptions = (dateA, dateB) => {
    const isSameDate = dateA === dateB;
    let dateAText = '';
    let dateBText = '';
    if (!isSameDate) {
      dateAText += `: ${dateA}`;
      dateBText += `: ${dateB}`;
    }
    const labelStyle = isSameDate ? {} : { width: '105px', paddingLeft: '3px' };
    const caseStyle = { width: isSameDate ? '178px' : '420px' };
    return {
      dateAText,
      dateBText,
      caseStyle,
      labelStyle,
    };
  };

  const options = useMemo(
    () => getDateTextOptions(dateA, dateB),
    [dateA, dateB],
  );
  const {
    dateAText, dateBText, caseStyle, labelStyle,
  } = options;

  return (
    <div id="ab-slider-case" className="ab-slider-case" style={caseStyle}>
      <label className="wv-slider-label left" style={labelStyle}>
        <h4 className="left">
          <span>A</span>
          <MonospaceDate date={dateAText} />
        </h4>
      </label>
      <div className="input-range">
        <div className="range-tooltip">
          {currentValue}
          {' '}
          %
        </div>
        <input
          type="range"
          className="form-range"
          defaultValue={currentValue}
          onChange={(e) => handleSlide(parseFloat(e.target.value))}
          style={{ '--value-percent': `${currentValue}%` }}
        />
      </div>
      <label className="wv-slider-label right" style={labelStyle}>
        <h4 className="right">
          <span>B</span>
          <MonospaceDate date={dateBText} />
        </h4>
      </label>
    </div>
  );
}

OpacitySlider.propTypes = {
  dateA: PropTypes.string,
  dateB: PropTypes.string,
  onSlide: PropTypes.func,
  value: PropTypes.number,
};

export default OpacitySlider;
