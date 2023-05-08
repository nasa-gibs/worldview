import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DateRangeSelector from '../../components/date-selector/date-range-selector';
import LoopButton from '../../components/animation-widget/loop-button';
import PlayButton from '../../components/animation-widget/play-button';
import GifButton from '../../components/animation-widget/gif-button';
import TimeScaleIntervalChange from '../../components/timeline/timeline-controls/timescale-interval-change';
import CustomIntervalSelector from '../../components/timeline/custom-interval-selector/custom-interval-selector';

function DesktopAnimationWidget(props) {
  const {
    animationCustomModalOpen,
    customModalType,
    endDate,
    handleDragStart,
    hasSubdailyLayers,
    interval,
    isPlaying,
    looping,
    maxDate,
    minDate,
    numberOfFrames,
    onClose,
    onDateChange,
    onExpandedDrag,
    onLoop,
    onPushPause,
    onPushPlay,
    onSlide,
    playDisabled,
    toggleCollapse,
    setSpeed,
    sliderLabel,
    speed,
    startDate,
    subDailyMode,
    widgetPosition,
    zeroDates,
  } = props;

  const cancelSelector = '.no-drag, .date-arrows';

  const onFrameSliderChange = (num) => {
    setSpeed(num);
    onSlide(speed);
  };

  return (
    <Draggable
      bounds="body"
      cancel={cancelSelector}
      handle=".wv-animation-widget-header"
      position={widgetPosition}
      onDrag={onExpandedDrag}
      onStart={handleDragStart}
    >
      <div className="wv-animation-widget-wrapper">
        <div
          id="wv-animation-widget"
          className={`wv-animation-widget${subDailyMode ? ' subdaily' : ''}`}
        >
          <div className="wv-animation-widget-header">
            {'Animate Map in '}
            <TimeScaleIntervalChange
              timeScaleChangeUnit={interval}
              hasSubdailyLayers={hasSubdailyLayers}
              modalType={customModalType.ANIMATION}
              isDisabled={isPlaying}
            />
            {' Increments'}
          </div>

          <CustomIntervalSelector
            modalOpen={animationCustomModalOpen}
            hasSubdailyLayers={hasSubdailyLayers}
          />

          <PlayButton
            playing={isPlaying}
            play={onPushPlay}
            pause={onPushPause}
            isDisabled={playDisabled}
          />
          <LoopButton looping={looping} onLoop={onLoop} />

          {/* FPS slider */}
          <div className="wv-slider-case">
            <div className="input-range-wrapper" style={{ position: 'relative' }}>
              <input
                type="range"
                className="input-range form-range"
                step={0.5}
                max={10}
                min={0.5}
                value={speed}
                onChange={(e) => onFrameSliderChange(parseFloat(e.target.value))}
                disabled={isPlaying}
                style={{ '--value-percent': `${((speed - 0.5) / (10 - 0.5)) * 100}%` }}
              />
            </div>
            <span className="wv-slider-label mt-1">

              {speed}
              {' '}
              {sliderLabel}
            </span>
          </div>

          <GifButton
            zeroDates={zeroDates}
            numberOfFrames={numberOfFrames}
          />
          <DateRangeSelector
            idSuffix="animation-widget"
            startDate={startDate}
            endDate={endDate}
            setDateRange={onDateChange}
            minDate={minDate}
            maxDate={maxDate}
            subDailyMode={subDailyMode}
            isDisabled={isPlaying}
          />

          <FontAwesomeIcon icon="chevron-down" className="wv-minimize" onClick={toggleCollapse} />
          <FontAwesomeIcon icon="times" className="wv-close" onClick={onClose} />
        </div>
      </div>
    </Draggable>
  );
}

DesktopAnimationWidget.propTypes = {
  animationCustomModalOpen: PropTypes.bool,
  customModalType: PropTypes.object,
  endDate: PropTypes.object,
  handleDragStart: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool,
  interval: PropTypes.string,
  isPlaying: PropTypes.bool,
  looping: PropTypes.bool,
  maxDate: PropTypes.object,
  minDate: PropTypes.object,
  numberOfFrames: PropTypes.number,
  onClose: PropTypes.func,
  onDateChange: PropTypes.func,
  onExpandedDrag: PropTypes.func,
  onLoop: PropTypes.func,
  onPushPause: PropTypes.func,
  onPushPlay: PropTypes.func,
  onSlide: PropTypes.func,
  playDisabled: PropTypes.bool,
  toggleCollapse: PropTypes.func,
  setSpeed: PropTypes.func,
  sliderLabel: PropTypes.string,
  speed: PropTypes.number,
  startDate: PropTypes.object,
  subDailyMode: PropTypes.bool,
  widgetPosition: PropTypes.object,
  zeroDates: PropTypes.func,
};

export default DesktopAnimationWidget;
