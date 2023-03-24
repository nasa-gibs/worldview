import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Slider from 'rc-slider';
import Draggable from 'react-draggable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import raf from 'rc-util/lib/raf';
import DateRangeSelector from '../../components/date-selector/date-range-selector';
import LoopButton from '../../components/animation-widget/loop-button';
import PlayButton from '../../components/animation-widget/play-button';
import GifButton from '../../components/animation-widget/gif-button'
import TimeScaleIntervalChange from '../../components/timeline/timeline-controls/timescale-interval-change';
import CustomIntervalSelector from '../../components/timeline/custom-interval-selector/custom-interval-selector';

// function RangeHandle(props) {
//   const {
//     value, offset, dragging, ...restProps
//   } = props;

//   const positionStyle = {
//     position: 'absolute',
//     left: `${(offset - 5).toFixed(2)}%`,
//   };

//   return (
//     <>
//       <span className="anim-frame-rate-label" style={positionStyle}>
//         {value < 10 ? value.toFixed(1) : value}
//       </span>
//       <Handle
//         dragging={dragging.toString()}
//         value={value}
//         offset={offset}
//         {...restProps}
//       />
//     </>
//   );
// }

const DesktopAnimationWidget = (props) => {
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
    zeroDates
  } = props;

  const cancelSelector = '.no-drag, .date-arrows';

  const onFrameSliderChange = (num) => {
    setSpeed(num)
    onSlide(speed)
  }

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

        {/* Custom time interval selection */}
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
          <Slider
            className="input-range"
            step={0.5}
            max={10}
            min={0.5}
            value={speed}
            onChange={(num) => onFrameSliderChange(num)}
            // handle={RangeHandle}
            disabled={isPlaying}
          />
          <span className="wv-slider-label">{sliderLabel}</span>
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
  )
}

export default DesktopAnimationWidget