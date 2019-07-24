import React from 'react';
import PropTypes from 'prop-types';
import Slider, { Handle } from 'rc-slider';
import TimeSelector from '../date-selector/date-selector';
import LoopButton from './loop-button';
import PlayButton from './play-button';
import AnimWidgetHeader from './header';

const RangeHandle = props => {
  const { value, offset, dragging, ...restProps } = props;

  const positionStyle = {
    position: 'absolute',
    left: `${(offset - 5).toFixed(2)}%`
  };

  return (
    <React.Fragment>
      <span className="anim-frame-rate-label" style={positionStyle}>
        {value < 10 ? value.toFixed(1) : value}
      </span>
      <Handle
        dragging={dragging.toString()}
        value={value}
        offset={offset}
        {...restProps}
      />
    </React.Fragment>
  );
};
/*
 * A react component, Builds a rather specific
 * interactive widget
 *
 * @class AnimationWidget
 * @extends React.Component
 */
class AnimationWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.sliderSpeed,
      looping: props.looping,
      startDate: props.startDate,
      endDate: props.endDate,
      hasSubdailyLayers: props.hasSubdailyLayers,
      header: props.header,
      incrementArray: props.incrementArray,
      increment: props.increment
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

  /*
   * calls the callback, passing the
   * current state elements as parameters
   *
   * @method play
   *
   * @return {void}
   */
  play() {
    this.props.onPushPlay();
    this.setState({
      playing: true
    });
  }
  pause() {
    this.props.onPushPause();
    this.setState({
      playing: false
    });
  }
  /*
   * Sets a new state to say whether or not
   * the animation should loop
   *
   * @method onLoop
   *
   * @param {Object} component - slider react
   *  component
   * @param {number} value - Value of the slider
   *  selection
   *
   * @return {void}
   */
  onLoop() {
    var loop = true;
    if (this.state.looping) {
      loop = false;
    }
    this.setState({
      looping: loop
    });
    this.props.onPushLoop(loop);
  }
  onDateChange(date, id) {
    const { endDate, startDate } = this.state;
    if (id === 'start') {
      this.setState({
        startDate: date
      });
      this.props.onDateChange(date, endDate);
    } else {
      this.setState({
        endDate: date
      });
      this.props.onDateChange(startDate, date);
    }
  }
  render() {
    return (
      <div
        id="wv-animation-widget"
        className={
          'wv-animation-widget' +
          (this.state.hasSubdailyLayers ? ' subdaily' : '')
        }
      >
        <AnimWidgetHeader
          text={this.state.increment}
          toolTipTextArray={this.state.incrementArray}
          onClick={this.props.onZoomSelect}
        />

        <PlayButton
          playing={this.state.playing}
          play={this.play.bind(this)}
          pause={this.pause.bind(this)}
        />
        <LoopButton
          looping={this.state.looping}
          onLoop={this.onLoop.bind(this)}
        />
        <div className="wv-slider-case">
          <Slider
            className="input-range"
            step={0.5}
            max={10}
            min={0.5}
            value={this.state.value}
            onChange={this.onSlide.bind(this)}
            handle={RangeHandle}
          />
          <span className="wv-slider-label">{this.props.sliderLabel}</span>
        </div>

        <a
          href="javascript:void(null)"
          title="Create Animated GIF"
          className="wv-icon-case"
          onClick={this.props.onPushGIF}
        >
          <i
            id="wv-animation-widget-file-video-icon"
            className="fas fa-file-video wv-animation-widget-icon"
          />
        </a>
        <div className="wv-anim-dates-case">
          <TimeSelector
            width="120"
            height="30"
            date={this.state.startDate}
            id="start"
            idSuffix="animation-widget-start"
            onDateChange={this.onDateChange.bind(this)}
            maxDate={this.state.endDate}
            minDate={this.props.minDate}
            hasSubdailyLayers={this.state.hasSubdailyLayers}
          />
          <div className="thru-label">To</div>
          <TimeSelector
            width="120"
            height="30"
            date={this.state.endDate}
            id="end"
            idSuffix="animation-widget-end"
            onDateChange={this.onDateChange.bind(this)}
            maxDate={this.props.maxDate}
            minDate={this.state.startDate}
            hasSubdailyLayers={this.state.hasSubdailyLayers}
          />
        </div>
        <i className="fa fa-times wv-close" onClick={this.props.onClose} />
      </div>
    );
  }
}
RangeHandle.propTypes = {
  dragging: PropTypes.object,
  offset: PropTypes.number,
  value: PropTypes.number
};
AnimationWidget.propTypes = {
  endDate: PropTypes.object,
  hasSubdailyLayers: PropTypes.bool,
  header: PropTypes.element,
  increment: PropTypes.string,
  incrementArray: PropTypes.array,
  looping: PropTypes.bool,
  maxDate: PropTypes.object,
  minDate: PropTypes.object,
  onClose: PropTypes.func,
  onDateChange: PropTypes.func,
  onPushGIF: PropTypes.func,
  onPushLoop: PropTypes.func,
  onPushPause: PropTypes.func,
  onPushPlay: PropTypes.func,
  onSlide: PropTypes.func,
  onZoomSelect: PropTypes.func,
  sliderLabel: PropTypes.string,
  sliderSpeed: PropTypes.number,
  startDate: PropTypes.object
};

export default AnimationWidget;
