// File was taken from https://raw.githubusercontent.com/algolia/react-nouislider/master/index.js
// MIT License
import PropTypes from 'prop-types';
import React from 'react';
import nouislider from 'nouislider';

class Nouislider extends React.Component {
  componentDidMount() {
    if (this.props.disabled) {
      this.sliderContainer.setAttribute('disabled', true);
    } else this.sliderContainer.removeAttribute('disabled');
    this.createSlider();
  }

  componentDidUpdate() {
    if (this.props.disabled) {
      this.sliderContainer.setAttribute('disabled', true);
    } else this.sliderContainer.removeAttribute('disabled');
    this.slider.destroy();
    this.createSlider();
  }

  componentWillUnmount() {
    this.slider.destroy();
  }

  createSlider() {
    var slider = (this.slider = nouislider.create(this.sliderContainer, {
      ...this.props
    }));

    if (this.props.onUpdate) {
      slider.on('update', this.props.onUpdate);
    }

    if (this.props.onChange) {
      slider.on('change', this.props.onChange);
    }

    if (this.props.onSlide) {
      slider.on('slide', this.props.onSlide);
    }

    if (this.props.onStart) {
      slider.on('start', this.props.onStart);
    }

    if (this.props.onEnd) {
      slider.on('end', this.props.onEnd);
    }

    if (this.props.onSet) {
      slider.on('set', this.props.onSet);
    }
  }

  render() {
    return (
      <div
        ref={slider => {
          this.sliderContainer = slider;
        }}
      />
    );
  }
}

Nouislider.propTypes = {
  // http://refreshless.com/nouislider/slider-options/#section-animate
  animate: PropTypes.bool,
  // http://refreshless.com/nouislider/behaviour-option/
  behaviour: PropTypes.string,
  // http://refreshless.com/nouislider/slider-options/#section-Connect
  connect: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.bool),
    PropTypes.bool
  ]),
  // http://refreshless.com/nouislider/slider-options/#section-cssPrefix
  cssPrefix: PropTypes.string,
  // http://refreshless.com/nouislider/slider-options/#section-orientation
  direction: PropTypes.oneOf(['ltr', 'rtl']),
  // http://refreshless.com/nouislider/more/#section-disable
  disabled: PropTypes.bool,
  // http://refreshless.com/nouislider/slider-options/#section-limit
  limit: PropTypes.number,
  // http://refreshless.com/nouislider/slider-options/#section-margin
  margin: PropTypes.number,
  // http://refreshless.com/nouislider/events-callbacks/#section-change
  onChange: PropTypes.func,
  // http://refreshless.com/nouislider/events-callbacks/
  onEnd: PropTypes.func,
  // http://refreshless.com/nouislider/events-callbacks/#section-set
  onSet: PropTypes.func,
  // http://refreshless.com/nouislider/events-callbacks/#section-slide
  onSlide: PropTypes.func,
  // http://refreshless.com/nouislider/events-callbacks/
  onStart: PropTypes.func,
  // http://refreshless.com/nouislider/events-callbacks/#section-update
  onUpdate: PropTypes.func,
  // http://refreshless.com/nouislider/slider-options/#section-orientation
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  // http://refreshless.com/nouislider/pips/
  pips: PropTypes.object,
  // http://refreshless.com/nouislider/slider-values/#section-range
  range: PropTypes.object.isRequired,
  // http://refreshless.com/nouislider/slider-options/#section-start
  start: PropTypes.arrayOf(PropTypes.number).isRequired,
  // http://refreshless.com/nouislider/slider-options/#section-step
  step: PropTypes.number,
  // http://refreshless.com/nouislider/slider-options/#section-tooltips
  tooltips: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.arrayOf(
      PropTypes.shape({
        to: PropTypes.func
      })
    )
  ])
};

export default Nouislider;
