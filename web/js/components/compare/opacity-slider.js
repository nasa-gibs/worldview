import React from 'react';
import PropTypes from 'prop-types';
import Slider, { createSliderWithTooltip } from 'rc-slider';
import lodashDebounce from 'lodash/debounce';

const SliderWithTooltip = createSliderWithTooltip(Slider);
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
class OpacitySlider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
    };
    this.onSlide = this.onSlide.bind(this);
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
    this.props.onSlide(value);
  }

  render() {
    return (
      <div id="ab-slider-case" className="ab-slider-case">
        <label className="wv-slider-label left">
          <h4>A</h4>
        </label>
        <div className="input-range ">
          <SliderWithTooltip
            defaultValue={this.state.value}
            tipFormatter={percentFormatter}
            onChange={this.debounceOpacityUpdate}
            onAfterChange={this.onSlide}
          />
        </div>
        <label className="wv-slider-label right">
          <h4>B</h4>
        </label>
      </div>
    );
  }
}
OpacitySlider.defaultProps = {
  value: 50,
};
OpacitySlider.propTypes = {
  onSlide: PropTypes.func,
  value: PropTypes.number,
};

export default OpacitySlider;
