import React from 'react';
import { connect } from 'react-redux';
import { without as lodashWithout } from 'lodash';
import ErrorBoundary from './error-boundary';
import PropTypes from 'prop-types';
import Slider, { Handle } from 'rc-slider';
import TimeSelector from '../components/date-selector/date-selector';
import LoopButton from '../components/animation-widget/loop-button';
import PlayButton from '../components/animation-widget/play-button';
import AnimWidgetHeader from '../components/animation-widget/header';
import googleTagManager from 'googleTagManager';
import { hasSubDaily as hasSubDailySelector } from '../modules/layers/selectors';
import {
  play,
  onClose,
  stop,
  toggleLooping,
  changeFrameRate,
  changeStartDate,
  changeEndDate,
  toggleComponentGifActive
} from '../modules/animation/actions';
import GifContainer from './gif';

import { timeScaleFromNumberKey } from '../modules/date/constants';

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
      speed: props.speed,
      isSliding: false,
      isGifActive: false
    };
    this.onDateChange = this.onDateChange.bind(this);
  }
  static getDerivedStateFromProps(props, state) {
    if (props.speed !== state.speed && !state.isSliding) {
      return { speed: props.speed };
    } else return null;
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
    this.props.onPushLoop(loop);
  }
  onDateChange(date, id) {
    const { onUpdateStartDate, onUpdateEndDate } = this.props;
    googleTagManager.pushEvent({
      event: 'GIF_animation_date_case'
    });
    if (id === 'start') {
      onUpdateStartDate(date);
    } else {
      onUpdateEndDate(date);
    }
  }
  render() {
    const {
      hasSubdailyLayers,
      increment,
      onZoomSelect,
      incrementArray,
      looping,
      isPlaying,
      maxDate,
      minDate,
      sliderLabel,
      startDate,
      endDate,
      onPushPlay,
      onPushPause,
      isActive
    } = this.props;
    if (!isActive) {
      return '';
    } else if (this.state.isGifActive) {
      return (
        <GifContainer
          onClose={() => {
            this.setState({ isGifActive: false });
          }}
        />
      );
    } else {
      return (
        <ErrorBoundary>
          <div
            id="wv-animation-widget"
            className={
              'wv-animation-widget' + (hasSubdailyLayers ? ' subdaily' : '')
            }
          >
            <AnimWidgetHeader
              text={increment}
              toolTipTextArray={incrementArray}
              onClick={onZoomSelect}
            />

            <PlayButton
              playing={isPlaying}
              play={onPushPlay}
              pause={onPushPause}
            />
            <LoopButton looping={looping} onLoop={this.onLoop.bind(this)} />
            <div className="wv-slider-case">
              <Slider
                className="input-range"
                step={0.5}
                max={10}
                min={0.5}
                value={this.state.speed}
                onChange={num => this.setState({ speed: num })}
                handle={RangeHandle}
                onBeforeChange={() => this.setState({ isSliding: true })}
                onAfterChange={() => {
                  this.setState({ isSliding: false });
                  this.props.onSlide(this.state.speed);
                }}
              />
              <span className="wv-slider-label">{sliderLabel}</span>
            </div>

            <a
              href="javascript:void(null)"
              title="Create Animated GIF"
              className="wv-icon-case"
              onClick={() => {
                this.toggleGIF();
              }}
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
                date={startDate}
                id="start"
                idSuffix="animation-widget-start"
                onDateChange={this.onDateChange}
                maxDate={endDate}
                minDate={minDate}
                hasSubdailyLayers={hasSubdailyLayers}
              />
              <div className="thru-label">To</div>

              <TimeSelector
                width="120"
                height="30"
                date={endDate}
                id="end"
                idSuffix="animation-widget-end"
                onDateChange={this.onDateChange}
                maxDate={maxDate}
                minDate={startDate}
                hasSubdailyLayers={hasSubdailyLayers}
              />
            </div>
            <i className="fa fa-times wv-close" onClick={this.props.onClose} />
          </div>
        </ErrorBoundary>
      );
    }
  }
}
function mapStateToProps(state) {
  const { layers, compare, animation, date, sidebar, modal } = state;
  const { startDate, endDate, speed, loop, isPlaying, isActive } = animation;
  const { minDate, maxDate } = date;
  const activeStr = compare.activeString;
  const hasSubdailyLayers = hasSubDailySelector(layers[activeStr]);
  const zoomObj = getZoomObject(date, hasSubdailyLayers);

  return {
    startDate,
    endDate,
    // minDate,
    // maxDate,
    isActive:
      isActive &&
      sidebar.activeTab !== 'download' && // No Animation when data download is active
      !(modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT'), // No Animation when Image download is open
    hasSubdailyLayers,
    incrementArray: zoomObj.array,
    increment: zoomObj.increment,
    sliderLabel: 'Frames Per Second',
    speed,
    isPlaying,
    looping: loop
  };
}
const mapDispatchToProps = dispatch => ({
  onClose: () => {
    dispatch(onClose());
  },
  onPushPlay: () => {
    dispatch(play());
  },
  onPushPause: () => {
    dispatch(stop());
  },
  onPushLoop: () => {
    dispatch(toggleLooping());
  },
  toggleGif: () => {
    dispatch(toggleComponentGifActive())
  },
  onSlide: num => {
    dispatch(changeFrameRate(num));
  },
  onZoomSelect: num => {
    // dispatch(onZoomSelect(num));
  },
  onUpdateStartDate(date) {
    dispatch(changeStartDate(date));
  },
  onUpdateEndDate(date) {
    dispatch(changeEndDate(date));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AnimationWidget);

AnimationWidget.propTypes = {
  speed: PropTypes.number,
  looping: PropTypes.bool,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
  incrementArray: PropTypes.array,
  increment: PropTypes.string,
  onSlide: PropTypes.func,
  onPushPlay: PropTypes.func,
  onPushPause: PropTypes.func,
  onPushLoop: PropTypes.func,
  onDateChange: PropTypes.func,
  onZoomSelect: PropTypes.func,
  sliderLabel: PropTypes.string,
  onPushGIF: PropTypes.func,
  minDate: PropTypes.object,
  maxDate: PropTypes.object,
  hasSubdailyLayers: PropTypes.bool,
  onClose: PropTypes.func,
  isPlaying: PropTypes.bool
};

const getZoomObject = function(dateModel, hasSubDaily) {
  let zooms = [];
  let headerText = '';
  const customText =
    dateModel.customDelta && dateModel.customInterval
      ? `${dateModel.customDelta} ${
        timeScaleFromNumberKey[dateModel.customInterval]
      }`
      : 'custom';
  if (hasSubDaily) {
    zooms = [customText, 'yearly', 'monthly', 'daily', 'hourly', 'minutely'];
  } else {
    zooms = [customText, 'yearly', 'monthly', 'daily'];
  }
  if (dateModel.customSelected) {
    headerText = zooms[0];
  } else {
    let interval = dateModel.interval
      ? dateModel.interval
      : dateModel.selectedZoom - 1;
    headerText = zooms[interval];
  }
  return {
    increment: headerText,
    array: lodashWithout(zooms, headerText)
  };
};
