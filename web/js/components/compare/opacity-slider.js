import React, { Component } from 'react';
import PropTypes from 'prop-types';
import MonospaceDate from '../util/monospace-date';

// Opacity slider used in compare mode
class OpacitySlider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
    };
    this.onSlide = this.onSlide.bind(this);
    this.getDateTextOptions = this.getDateTextOptions.bind(this);
  }

  /*
   * trigger onSlide Callback
   * @method onSlide
   * @param {number} value - Value of the slider selection
   * @return {void}
   */
  onSlide(value) {
    const { onSlide } = this.props;
    this.setState({ value });
    onSlide(value);
  }

  getDateTextOptions() {
    const { dateA, dateB } = this.props;
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
  }

  render() {
    const { value } = this.state;
    const {
      dateAText, dateBText, caseStyle, labelStyle,
    } = this.getDateTextOptions();

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
            {value}
            {' '}
            %
          </div>
          <input
            type="range"
            className="form-range"
            defaultValue={value}
            onChange={(e) => this.onSlide(parseFloat(e.target.value))}
            style={{ '--value-percent': `${value}%` }}
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
}

OpacitySlider.propTypes = {
  dateA: PropTypes.string,
  dateB: PropTypes.string,
  onSlide: PropTypes.func,
  value: PropTypes.number,
};

export default OpacitySlider;
