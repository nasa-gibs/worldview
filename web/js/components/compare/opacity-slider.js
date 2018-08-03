import React from 'react';
import PropTypes from 'prop-types';
import InputRange from 'react-input-range';

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
  onSlide(value) {
    this.props.onSlide(value);
    this.setState({
      value: value
    });
  }

  render() {
    return (
      <div id="ab-slider-case" className="ab-slider-case">
        <span className="wv-slider-label left">A</span>
        <InputRange
          step={5}
          maxValue={100}
          minValue={0}
          value={this.state.value}
          formatLabel={() => ''}
          onChange={this.onSlide.bind(this)}
          onChangeComplete={this.props.onSlideEnd}
        />
        <span className="wv-slider-label right">B</span>
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
