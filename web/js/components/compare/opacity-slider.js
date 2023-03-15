import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Slider from 'rc-slider';
import lodashDebounce from 'lodash/debounce';
import MonospaceDate from '../util/monospace-date';

const percentFormatter = function(v) {
  return `${v} %`;
};
/*
 * A react component, Builds a rather specific
 * interactive widget
 *
 * @class OpacitySlider
 * @extends React.Component
 */
class OpacitySlider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
    };
    this.onSlide = this.onSlide.bind(this);
    this.getDateTextOptions = this.getDateTextOptions.bind(this);
    this.debounceOpacityUpdate = lodashDebounce(this.onSlide, 100);
  }

  /*
   * trigger onSlide Callback
   *
   * @method onSlide
   *
   * @param {number} value - Value of the slider
   *  selection
   *
   * @return {void}
   */
  onSlide(value) {
    const { onSlide } = this.props;
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
          <Slider
            range
            defaultValue={value}
            tipFormatter={percentFormatter}
            onChange={this.debounceOpacityUpdate}
            onAfterChange={this.onSlide}
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
OpacitySlider.defaultProps = {
  value: 50,
};
OpacitySlider.propTypes = {
  dateA: PropTypes.string,
  dateB: PropTypes.string,
  onSlide: PropTypes.func,
  value: PropTypes.number,
};

export default OpacitySlider;
