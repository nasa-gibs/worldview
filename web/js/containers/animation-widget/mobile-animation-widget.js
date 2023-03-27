import React from 'react';
import {
  debounce as lodashDebounce,
} from 'lodash';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getISODateFormatted } from '../../components/timeline/date-util';
import MobileCustomIntervalSelector from '../../components/timeline/custom-interval-selector/mobile-custom-interval-selector';
import MobileDatePicker from '../../components/timeline/mobile-date-picker';
import LoopButton from '../../components/animation-widget/loop-button';

function MobileAnimationWidget (props) {
  const {
    breakpoints,
    endDate,
    hasSubdailyLayers,
    isLandscape,
    isMobile,
    isMobilePhone,
    isMobileTablet,
    isPlaying,
    isPortrait,
    looping,
    maxDate,
    minDate,
    onLoop,
    onSlide,
    onUpdateEndDate,
    onUpdateStartDate,
    playDisabled,
    selectDate,
    screenHeight,
    screenWidth,
    setSpeed,
    sliderLabel,
    speed,
    startDate,
    subDailyMode,
    toggleCollapse,
  } = props;

  const debounceDateUpdate = lodashDebounce(selectDate, 8);
  const minimumDate = getISODateFormatted(minDate);
  const maximumDate = getISODateFormatted(maxDate);
  const endingDate = getISODateFormatted(endDate);
  const startingDate = getISODateFormatted(startDate);

  const getMobileIDs = () => {
    if ((isMobilePhone && isLandscape) || (!isMobilePhone && !isMobileTablet && screenHeight < 800)) {
      return 'mobile-phone-landscape';
    } if ((isMobilePhone && isPortrait) || (!isMobilePhone && !isMobileTablet && screenWidth < 550)) {
      return 'mobile-phone-portrait';
    } if (isMobileTablet || screenWidth <= breakpoints.small) {
      return 'tablet';
    }
  };

  const mobileID = getMobileIDs();

  const collapseIconMobile = {
    height: '30px',
    width: '30px',
    color: '#fff',
  };

  const onFrameSliderChange = (num) => {
    setSpeed(num);
    onSlide(speed);
  };

  const onMobileDateChangeStart = (date) => {
    const dateObj = new Date(date);
    debounceDateUpdate(dateObj);
    onUpdateStartDate(dateObj);
  };

  const onMobileDateChangeEnd = (date) => {
    const dateObj = new Date(date);
    debounceDateUpdate(dateObj);
    onUpdateEndDate(dateObj);
  };

  return (
    <div className="wv-animation-widget-wrapper-mobile" id={`mobile-animation-widget-${mobileID}`}>
      <div className="mobile-animation-header">
        <span aria-label="Close" onClick={toggleCollapse} id="mobile-animation-close">
          <FontAwesomeIcon icon="times" className="collapse-icon" style={collapseIconMobile} />
        </span>
      </div>
      <div className="mobile-animation-warning-message-container">
        <span id={playDisabled ? 'mobile-animation-warning-message' : ''}>Too many animation frames. Reduce time range or increase increment size.</span>
      </div>
      <div
        id="wv-animation-widget"
        className={`wv-animation-widget${subDailyMode ? ' subdaily' : ''}`}
      >
        <div className="mobile-animation-flex-container">
          <div className="mobile-animation-widget-container">

            <div className="mobile-animation-flex-row">
              <span>
                Loop
              </span>
              <LoopButton looping={looping} onLoop={onLoop} isMobile={isMobile} />
            </div>

            <div className="mobile-animation-flex-row">
              <MobileCustomIntervalSelector
                hasSubdailyLayers={hasSubdailyLayers}
              />
            </div>

            <div className="mobile-animation-flex-row" id="slider-case-row">
              <span className="wv-slider-label">
                {speed}
                {' '}
                {sliderLabel}
              </span>
              <div className="wv-slider-case">
                <div className="input-range-wrapper" style={{ position: 'relative' }}>
                  <input
                    type="range"
                    className="input-range form-range range-mobile"
                    step={0.5}
                    max={10}
                    min={0.5}
                    value={speed}
                    onChange={(e) => onFrameSliderChange(parseFloat(e.target.value))}
                    disabled={isPlaying}
                    style={{
                      '--value-percent': `${((speed - 0.5) / (10 - 0.5)) * 100}%`,
                      width: '300px',
                    }}
                  />
                </div>

              </div>
            </div>

            <div className="mobile-animation-flex-row">
              <div className="mobile-animation-block-row" id="mobile-animation-start-date">
                <span>Start Date</span>
                <MobileDatePicker
                  date={startDate}
                  startDateLimit={minimumDate}
                  endDateLimit={endingDate}
                  onDateChange={onMobileDateChangeStart}
                  hasSubdailyLayers={hasSubdailyLayers}
                  isMobile={isMobile}
                />
              </div>
            </div>

            <div className="mobile-animation-flex-row">
              <div className="mobile-animation-block-row" id="mobile-animation-end-date">
                <span>End Date</span>
                <MobileDatePicker
                  date={endDate}
                  startDateLimit={startingDate}
                  endDateLimit={maximumDate}
                  onDateChange={onMobileDateChangeEnd}
                  hasSubdailyLayers={hasSubdailyLayers}
                  isMobile={isMobile}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

MobileAnimationWidget.propTypes = {
  breakpoints: PropTypes.object,
  endDate: PropTypes.object,
  hasSubdailyLayers: PropTypes.bool,
  isLandscape: PropTypes.bool,
  isMobile: PropTypes.bool,
  isMobilePhone: PropTypes.bool,
  isMobileTablet: PropTypes.bool,
  isPlaying: PropTypes.bool,
  isPortrait: PropTypes.bool,
  looping: PropTypes.bool,
  maxDate: PropTypes.object,
  minDate: PropTypes.object,
  onLoop: PropTypes.func,
  onSlide: PropTypes.func,
  onUpdateEndDate: PropTypes.func,
  onUpdateStartDate: PropTypes.func,
  playDisabled: PropTypes.bool,
  selectDate: PropTypes.func,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  setSpeed: PropTypes.func,
  sliderLabel: PropTypes.string,
  speed: PropTypes.number,
  startDate: PropTypes.object,
  subDailyMode: PropTypes.bool,
  toggleCollapse: PropTypes.func,
};

export default MobileAnimationWidget;
