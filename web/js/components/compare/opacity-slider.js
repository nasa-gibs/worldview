import React from 'react';
import PropTypes from 'prop-types';
import InputRange from 'react-input-range';
import RangeInput from '../util/range-input';
import lodashDebounce from 'lodash/debounce';

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
      value: props.value
    };
    this.debounceOpacityUpdate = lodashDebounce(this.onUpdate.bind(this), 100);
  }
  onUpdate(arra) {
    const value = Math.ceil(arra[0]);
    this.props.onSlide(value);
  }
  /*
   * Sets a new state value when a
   * when the slider is adjusted
   *
   * @method onSlide
   *
   * @param {number} value - Value of the slider
   *  selection
   *
   * @return {void}
   */
  onSlide(arra) {
    const value = Math.ceil(arra[0]);
    this.props.onSlide(value);
    this.setState({
      value: value
    });
  }

  render() {
    return (
      <div id="ab-slider-case" className="ab-slider-case">
        <label className="wv-slider-label left">
          <h4>A</h4>
        </label>
        <div className="input-range ">
          <RangeInput
            start={[this.state.value]}
            range={{ min: 0, max: 100 }}
            step={1}
            onUpdate={this.debounceOpacityUpdate}
            onSlide={this.onSlide.bind(this)}
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
  value: 50
};
OpacitySlider.propTypes = {
  value: PropTypes.number,
  onSlide: PropTypes.func,
  onSlideEnd: PropTypes.func
};

export default OpacitySlider;
