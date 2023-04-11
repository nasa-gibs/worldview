import React from 'react';
import { connect } from 'react-redux';
import {
  debounce as lodashDebounce,
  get as lodashGet,
} from 'lodash';
import PropTypes from 'prop-types';
import Slider, { Handle } from 'rc-slider';
import Draggable from 'react-draggable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getISODateFormatted } from '../components/timeline/date-util';
import util from '../util/util';
import ErrorBoundary from './error-boundary';
import DateRangeSelector from '../components/date-selector/date-range-selector';
import LoopButton from '../components/animation-widget/loop-button';
import PlayButton from '../components/animation-widget/play-button';
import TimeScaleIntervalChange from '../components/timeline/timeline-controls/timescale-interval-change';
import CustomIntervalSelector from '../components/timeline/custom-interval-selector/custom-interval-selector';
import MobileCustomIntervalSelector from '../components/timeline/custom-interval-selector/mobile-custom-interval-selector';
import MobileDatePicker from '../components/timeline/mobile-date-picker';
import PlayQueue from '../components/animation-widget/play-queue';
import { promiseImageryForTime } from '../modules/map/util';
import {
  selectDate,
  selectInterval,
  toggleCustomModal,
} from '../modules/date/actions';
import {
  TIME_SCALE_FROM_NUMBER,
  TIME_SCALE_TO_NUMBER,
  customModalType,
} from '../modules/date/constants';
import {
  snapToIntervalDelta,
  getNumberOfSteps,
} from '../modules/animation/util';
import {
  subdailyLayersActive,
  getAllActiveLayers,
  dateRange as getDateRange,
} from '../modules/layers/selectors';
import { getSelectedDate } from '../modules/date/selectors';
import {
  play,
  onClose,
  stop,
  toggleLooping,
  changeFrameRate,
  changeStartDate,
  changeEndDate,
  changeStartAndEndDate,
  toggleAnimationCollapse,
} from '../modules/animation/actions';
import GifButton from '../components/animation-widget/gif-button';

function RangeHandle(props) {
  const {
    value, offset, dragging, ...restProps
  } = props;

  const positionStyle = {
    position: 'absolute',
    left: `${(offset - 5).toFixed(2)}%`,
  };

  return (
    <>
      <span className="anim-frame-rate-label" style={positionStyle}>
        {value < 10 ? value.toFixed(1) : value}
      </span>
      <Handle
        dragging={dragging.toString()}
        value={value}
        offset={offset}
        {...restProps}
      />
    </>
  );
}

const widgetWidth = 334;
const subdailyWidgetWidth = 460;
const maxFrames = 300;
const mobileMaxFrames = 50;

class AnimationWidget extends React.Component {
  constructor(props) {
    super(props);
    const halfWidgetWidth = (props.subDailyMode ? subdailyWidgetWidth : widgetWidth) / 2;
    this.state = {
      speed: props.speed,
      widgetPosition: {
        x: (props.screenWidth / 2) - halfWidgetWidth,
        y: -25,
      },
      collapsedWidgetPosition: { x: 0, y: 0 },
      userHasMovedWidget: false,
    };
    this.debounceDateUpdate = lodashDebounce(selectDate, 8);

    this.onDateChange = this.onDateChange.bind(this);
    this.onIntervalSelect = this.onIntervalSelect.bind(this);
    this.onLoop = this.onLoop.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.toggleCollapse = this.toggleCollapse.bind(this);
    this.onCollapsedDrag = this.onCollapsedDrag.bind(this);
    this.onExpandedDrag = this.onExpandedDrag.bind(this);
  }

  componentDidMount() {
    const {
      isEmbedModeActive,
    } = this.props;
    if (isEmbedModeActive) {
      this.setState({
        widgetPosition: {
          x: 10,
          y: 0,
        },
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { userHasMovedWidget } = this.state;
    const {
      appNow, hasFutureLayers, onUpdateEndDate, subDailyMode, screenWidth,
    } = this.props;
    const subdailyChange = subDailyMode !== prevProps.subDailyMode;

    // handle removing futureTime layer to stop animation/update end date range
    if (prevProps.hasFutureLayers && !hasFutureLayers) {
      onUpdateEndDate(appNow);
    }

    // If toggling between subdaily/regular mode and widget hasn't been manually moved
    // yet, try to keep it centered
    if (subdailyChange && !userHasMovedWidget) {
      const useWidth = subDailyMode ? subdailyWidgetWidth : widgetWidth;

      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        widgetPosition: {
          x: (screenWidth / 2) - (useWidth / 2),
          y: 0,
        },
      });
    }
  }

  toggleCollapse() {
    const { onToggleAnimationCollapse } = this.props;
    onToggleAnimationCollapse();
  }

  /**
   * Prevent drag when interacting with child elements (e.g. buttons)
   * Only allow drag when targeting "background" elements
   */
  handleDragStart = (e, data) => {
    const draggableTargets = [
      'wv-animation-widget',
      'wv-animation-widget-header',
      'wv-anim-dates-case',
      'thru-label',
    ];
    const { classList } = e.target;
    return draggableTargets.some((tClass) => classList.contains(tClass));
  };

  onExpandedDrag(e, position) {
    const { x, y } = position;
    this.setState({
      userHasMovedWidget: true,
      widgetPosition: { x, y },
    });
  }

  onCollapsedDrag(e, position) {
    const { x, y } = position;
    this.setState({
      userHasMovedWidget: true,
      collapsedWidgetPosition: { x, y },
    });
  }

  onLoop() {
    const { looping } = this.state;
    const { onPushLoop } = this.props;
    let loop = true;
    if (looping) {
      loop = false;
    }
    onPushLoop(loop);
  }

  onDateChange([newStartDate, newEndDate]) {
    const {
      onUpdateStartDate, onUpdateEndDate, startDate, endDate,
    } = this.props;
    if (newStartDate !== startDate) {
      onUpdateStartDate(newStartDate);
    }
    if (newEndDate !== endDate) {
      onUpdateEndDate(newEndDate);
    }
  }

  onMobileDateChangeStart = (date) => {
    const { onUpdateStartDate } = this.props;
    const dateObj = new Date(date);
    this.debounceDateUpdate(dateObj);
    onUpdateStartDate(dateObj);
  };

  onMobileDateChangeEnd = (date) => {
    const { onUpdateEndDate } = this.props;
    const dateObj = new Date(date);
    this.debounceDateUpdate(dateObj);
    onUpdateEndDate(dateObj);
  };

  onIntervalSelect(timeScale, openModal) {
    let delta;
    const { onIntervalSelect, customInterval, customDelta } = this.props;
    const customSelected = timeScale === 'custom';

    if (openModal) {
      this.toggleCustomIntervalModal(openModal);
      return;
    }

    if (customSelected && customInterval && customDelta) {
      timeScale = customInterval;
      delta = customDelta;
    } else {
      timeScale = Number(TIME_SCALE_TO_NUMBER[timeScale]);
      delta = 1;
    }
    onIntervalSelect(delta, timeScale, customSelected);
  }

  onPushPlay = () => {
    const {
      onUpdateStartAndEndDate,
      onPushPlay,
    } = this.props;
    const {
      startDate,
      endDate,
    } = this.zeroDates();
    onUpdateStartAndEndDate(startDate, endDate);
    onPushPlay();
  };

  /**
   * Zeroes start and end animation dates to UTC 00:00:00 for predictable animation range
   * subdaily intervals retain hours and minutes
   *
   * @method zeroDates
   *
   * @return {Object}
    * @param {Object} JS Date - startDate
    * @param {Object} JS Date - endDate
   */
  zeroDates = () => {
    const { subDailyMode } = this.props;
    let {
      startDate,
      endDate,
    } = this.props;
    if (subDailyMode) {
      // for subdaily, zero start and end dates to UTC HH:MM:00:00
      const startMinutes = startDate.getMinutes();
      const endMinutes = endDate.getMinutes();
      startDate.setUTCMinutes(Math.floor(startMinutes / 10) * 10);
      startDate.setUTCSeconds(0);
      startDate.setUTCMilliseconds(0);
      endDate.setUTCMinutes(Math.floor(endMinutes / 10) * 10);
      endDate.setUTCSeconds(0);
      endDate.setUTCMilliseconds(0);
    } else {
      // for nonsubdaily, zero start and end dates to UTC 00:00:00:00
      startDate = util.clearTimeUTC(startDate);
      endDate = util.clearTimeUTC(endDate);
    }
    return {
      startDate,
      endDate,
    };
  };

  toggleCustomIntervalModal = (isOpen) => {
    const { toggleCustomModal } = this.props;
    toggleCustomModal(isOpen, customModalType.ANIMATION);
  };

  renderCollapsedWidget() {
    const {
      hasSubdailyLayers,
      isMobile,
      isPlaying,
      onClose,
      onPushPause,
      playDisabled,
      isPortrait,
      isLandscape,
      isMobilePhone,
      isMobileTablet,
      screenWidth,
      breakpoints,
    } = this.props;
    const { collapsedWidgetPosition } = this.state;
    const cancelSelector = '.no-drag, svg';
    const dontShow = isMobile && playDisabled;
    const widgetClasses = 'wv-animation-widget-wrapper minimized '
      + `${hasSubdailyLayers ? 'subdaily ' : ''}`
      + `${isMobile ? 'mobile ' : ''}`
      + `${isLandscape ? 'landscape ' : ''}`;
    const subdailyID = hasSubdailyLayers ? '-subdaily' : '';

    const getWidgetIDs = () => {
      if ((isMobilePhone && isPortrait) || (!isMobileTablet && screenWidth < 670 && hasSubdailyLayers) || (!isMobileTablet && screenWidth < 575 && !hasSubdailyLayers)) {
        return `-phone-portrait${subdailyID}`;
      } if (isMobilePhone && isLandscape) {
        return `-phone-landscape${subdailyID}`;
      } if ((isMobileTablet && isPortrait) || (!isMobilePhone && screenWidth < breakpoints.small)) {
        return `-tablet-portrait${subdailyID}`;
      } if (isMobileTablet && isLandscape) {
        return `-tablet-landscape${subdailyID}`;
      }
    };

    const widgetIDs = getWidgetIDs();

    return !dontShow && (
      <Draggable
        bounds="body"
        cancel={cancelSelector}
        onStart={this.handleDragStart}
        position={collapsedWidgetPosition}
        onDrag={this.onCollapsedDrag}
        disabled={isMobile}
      >
        <div
          className={widgetClasses}
          id={`collapsed-animate-widget${widgetIDs}`}
        >
          <div
            id="wv-animation-widget"
            className="wv-animation-widget minimized"
          >
            <PlayButton
              playing={isPlaying}
              play={this.onPushPlay}
              pause={onPushPause}
              isDisabled={playDisabled}
              isMobile={isMobile}
            />
            {!isMobile && <FontAwesomeIcon icon="chevron-up" className="wv-expand" onClick={this.toggleCollapse} /> }
            {!isMobile && <FontAwesomeIcon icon="times" className="wv-close" onClick={onClose} /> }
          </div>
        </div>
      </Draggable>
    );
  }

  renderMobileWidget() {
    const {
      looping,
      isPlaying,
      maxDate,
      minDate,
      onSlide,
      sliderLabel,
      startDate,
      endDate,
      subDailyMode,
      hasSubdailyLayers,
      isMobile,
      isMobilePhone,
      isMobileTablet,
      screenWidth,
      screenHeight,
      breakpoints,
      isLandscape,
      isPortrait,
      playDisabled,
    } = this.props;
    const { speed } = this.state;

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

    return (
      <div className="wv-animation-widget-wrapper-mobile" id={`mobile-animation-widget-${mobileID}`}>
        <div className="mobile-animation-header">
          <span aria-label="Close" onClick={this.toggleCollapse} id="mobile-animation-close">
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
                <LoopButton looping={looping} onLoop={this.onLoop} isMobile={isMobile} />
              </div>

              <div className="mobile-animation-flex-row">
                <MobileCustomIntervalSelector
                  hasSubdailyLayers={hasSubdailyLayers}
                />
              </div>

              <div className="mobile-animation-flex-row" id="slider-case-row">
                <div className="wv-slider-case">
                  <Slider
                    className="input-range"
                    step={0.5}
                    max={10}
                    min={0.5}
                    value={speed}
                    onChange={(num) => this.setState({ speed: num })}
                    handle={RangeHandle}
                    onAfterChange={() => { onSlide(speed); }}
                    disabled={isPlaying}
                  />
                  <span className="wv-slider-label">{sliderLabel}</span>
                </div>
              </div>

              <div className="mobile-animation-flex-row">
                <div className="mobile-animation-block-row" id="mobile-animation-start-date">
                  <span>Start Date</span>
                  <MobileDatePicker
                    date={startDate}
                    startDateLimit={minimumDate}
                    endDateLimit={endingDate}
                    onDateChange={this.onMobileDateChangeStart}
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
                    onDateChange={this.onMobileDateChangeEnd}
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

  renderExpandedWidget() {
    const {
      onClose,
      looping,
      isPlaying,
      maxDate,
      minDate,
      onSlide,
      sliderLabel,
      startDate,
      endDate,
      onPushPause,
      subDailyMode,
      interval,
      animationCustomModalOpen,
      hasSubdailyLayers,
      playDisabled,
      numberOfFrames,
    } = this.props;
    const { speed, widgetPosition } = this.state;
    const cancelSelector = '.no-drag, .date-arrows';

    return (
      <Draggable
        bounds="body"
        cancel={cancelSelector}
        handle=".wv-animation-widget-header"
        position={widgetPosition}
        onDrag={this.onExpandedDrag}
        onStart={this.handleDragStart}
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
              play={this.onPushPlay}
              pause={onPushPause}
              isDisabled={playDisabled}
            />
            <LoopButton looping={looping} onLoop={this.onLoop} />

            {/* FPS slider */}
            <div className="wv-slider-case">
              <Slider
                className="input-range"
                step={0.5}
                max={10}
                min={0.5}
                value={speed}
                onChange={(num) => this.setState({ speed: num })}
                handle={RangeHandle}
                onAfterChange={() => { onSlide(speed); }}
                disabled={isPlaying}
              />
              <span className="wv-slider-label">{sliderLabel}</span>
            </div>

            {/* Create Gif */}
            <GifButton
              zeroDates={this.zeroDates}
              numberOfFrames={numberOfFrames}
            />

            {/* From/To Date/Time Selection */}
            <DateRangeSelector
              idSuffix="animation-widget"
              startDate={startDate}
              endDate={endDate}
              setDateRange={this.onDateChange}
              minDate={minDate}
              maxDate={maxDate}
              subDailyMode={subDailyMode}
              isDisabled={isPlaying}
            />

            <FontAwesomeIcon icon="chevron-down" className="wv-minimize" onClick={this.toggleCollapse} />
            <FontAwesomeIcon icon="times" className="wv-close" onClick={onClose} />

          </div>
        </div>
      </Draggable>
    );
  }

  render() {
    const {
      looping,
      isPlaying,
      startDate,
      isMobile,
      endDate,
      onPushPause,
      isActive,
      isDistractionFreeModeActive,
      promiseImageryForTime,
      selectDate,
      currentDate,
      snappedCurrentDate,
      delta,
      interval,
      numberOfFrames,
      isCollapsed,
    } = this.props;
    const { speed } = this.state;

    if (!isActive) {
      return null;
    }
    return (
      <ErrorBoundary>
        {isPlaying && (
          <PlayQueue
            isMobile={isMobile}
            isLoopActive={looping}
            isPlaying={isPlaying}
            numberOfFrames={numberOfFrames}
            snappedCurrentDate={snappedCurrentDate}
            currentDate={currentDate}
            startDate={startDate}
            endDate={endDate}
            interval={interval}
            delta={delta}
            speed={speed}
            selectDate={selectDate}
            togglePlaying={onPushPause}
            promiseImageryForTime={promiseImageryForTime}
            onClose={onPushPause}
          />
        )}
        {!isDistractionFreeModeActive && (
          <>
            {isCollapsed ? this.renderCollapsedWidget() : isMobile ? this.renderMobileWidget() : this.renderExpandedWidget()}
          </>
        )}
      </ErrorBoundary>
    );
  }
}

function mapStateToProps(state) {
  const {
    compare,
    animation,
    date,
    embed,
    sidebar,
    modal,
    config,
    map,
    screenSize,
    ui,
    proj,
  } = state;
  const {
    startDate, endDate, speed, loop, isPlaying, isActive, isCollapsed,
  } = animation;
  const {
    customSelected,
    delta,
    customDelta,
    appNow,
    animationCustomModalOpen,
  } = date;
  let {
    interval,
    customInterval,
  } = date;
  const { isCompareA } = compare;

  const hasSubdailyLayers = subdailyLayersActive(state);
  const activeLayersForProj = getAllActiveLayers(state);
  const hasFutureLayers = activeLayersForProj.filter((layer) => layer.futureTime).length > 0;
  const layerDateRange = getDateRange({}, activeLayersForProj);

  const minDate = new Date(config.startDate);
  let maxDate;
  if (layerDateRange && layerDateRange.end > appNow) {
    maxDate = layerDateRange.end;
  } else {
    maxDate = appNow;
  }

  const { isDistractionFreeModeActive } = ui;
  const { isEmbedModeActive } = embed;
  const animationIsActive = isActive
    && lodashGet(map, 'ui.selected.frameState_')
    && sidebar.activeTab !== 'download' // No Animation when data download is active
    && !compare.active
    && !(modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT'); // No Animation when Image download is open

  if (!hasSubdailyLayers) {
    interval = interval > 3 ? 3 : interval;
    customInterval = customInterval > 3 ? 3 : customInterval;
  }
  const useInterval = customSelected ? customInterval || 3 : interval;
  const useDelta = customSelected && customDelta ? customDelta : delta;
  const subDailyInterval = useInterval > 3;
  const subDailyMode = subDailyInterval && hasSubdailyLayers;
  const frameLimit = screenSize.isMobileDevice ? mobileMaxFrames : maxFrames;
  const numberOfFrames = getNumberOfSteps(
    startDate,
    endDate,
    TIME_SCALE_FROM_NUMBER[useInterval],
    useDelta,
    frameLimit,
  );
  const currentDate = getSelectedDate(state);
  let snappedCurrentDate;
  if (numberOfFrames < frameLimit) {
    snappedCurrentDate = snapToIntervalDelta(
      currentDate,
      startDate,
      endDate,
      TIME_SCALE_FROM_NUMBER[useInterval],
      useDelta,
    );
  } else {
    snappedCurrentDate = currentDate;
  }

  const {
    isMobilePhone, screenWidth, isMobileTablet, breakpoints, screenHeight,
  } = screenSize;

  return {
    appNow,
    animationCustomModalOpen,
    customSelected,
    startDate,
    endDate,
    isCollapsed,
    draggerSelected: isCompareA ? 'selected' : 'selectedB',
    snappedCurrentDate,
    currentDate,
    minDate,
    maxDate,
    isActive: animationIsActive,
    isDistractionFreeModeActive,
    isMobile: screenSize.isMobileDevice,
    isMobilePhone,
    isMobileTablet,
    breakpoints,
    isLandscape: screenSize.orientation === 'landscape',
    isPortrait: screenSize.orientation === 'portrait',
    screenWidth,
    screenHeight,
    hasFutureLayers,
    hasSubdailyLayers,
    subDailyMode,
    delta: useDelta,
    interval: TIME_SCALE_FROM_NUMBER[useInterval] || 'day',
    customDelta: customDelta || 1,
    customInterval: customInterval || 3,
    numberOfFrames,
    sliderLabel: 'Frames Per Second',
    speed,
    isPlaying,
    looping: loop,
    map,
    proj,
    promiseImageryForTime: (date) => promiseImageryForTime(state, date),
    isEmbedModeActive,
    playDisabled: !screenSize.isMobileDevice ? numberOfFrames >= maxFrames || numberOfFrames === 1 : numberOfFrames >= mobileMaxFrames || numberOfFrames === 1,
  };
}

const mapDispatchToProps = (dispatch) => ({
  selectDate: (val) => {
    dispatch(selectDate(val));
  },
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
  toggleCustomModal: (open, toggleBy) => {
    dispatch(toggleCustomModal(open, toggleBy));
  },
  onSlide: (num) => {
    dispatch(changeFrameRate(num));
  },
  onIntervalSelect: (delta, timeScale, customSelected) => {
    dispatch(selectInterval(delta, timeScale, customSelected));
  },
  onUpdateStartDate(date) {
    dispatch(changeStartDate(date));
  },
  onUpdateEndDate(date) {
    dispatch(changeEndDate(date));
  },
  onUpdateStartAndEndDate: (startDate, endDate) => {
    dispatch(changeStartAndEndDate(startDate, endDate));
  },
  onToggleAnimationCollapse: () => {
    dispatch(toggleAnimationCollapse());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AnimationWidget);

RangeHandle.propTypes = {
  dragging: PropTypes.object,
  offset: PropTypes.number,
  value: PropTypes.number,
};
AnimationWidget.propTypes = {
  appNow: PropTypes.object,
  animationCustomModalOpen: PropTypes.bool,
  breakpoints: PropTypes.object,
  snappedCurrentDate: PropTypes.object,
  currentDate: PropTypes.object,
  customDelta: PropTypes.number,
  customInterval: PropTypes.number,
  delta: PropTypes.number,
  endDate: PropTypes.object,
  hasFutureLayers: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool,
  interval: PropTypes.string,
  isActive: PropTypes.bool,
  isCollapsed: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  isMobilePhone: PropTypes.bool,
  isMobileTablet: PropTypes.bool,
  isPlaying: PropTypes.bool,
  isPortrait: PropTypes.bool,
  isLandscape: PropTypes.bool,
  looping: PropTypes.bool,
  maxDate: PropTypes.object,
  minDate: PropTypes.object,
  numberOfFrames: PropTypes.number,
  onToggleAnimationCollapse: PropTypes.func,
  onClose: PropTypes.func,
  onIntervalSelect: PropTypes.func,
  onPushLoop: PropTypes.func,
  onPushPause: PropTypes.func,
  onPushPlay: PropTypes.func,
  onSlide: PropTypes.func,
  onUpdateEndDate: PropTypes.func,
  onUpdateStartAndEndDate: PropTypes.func,
  onUpdateStartDate: PropTypes.func,
  playDisabled: PropTypes.bool,
  promiseImageryForTime: PropTypes.func,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  selectDate: PropTypes.func,
  sliderLabel: PropTypes.string,
  speed: PropTypes.number,
  startDate: PropTypes.object,
  subDailyMode: PropTypes.bool,
  toggleCustomModal: PropTypes.func,
};
