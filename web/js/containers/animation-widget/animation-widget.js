import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get as lodashGet } from 'lodash';
import util from '../../util/util';
import ErrorBoundary from '../error-boundary';
import PlayQueue from '../../components/animation-widget/play-queue';
import { promiseImageryForTime } from '../../modules/map/util';
import {
  selectDate,
  selectInterval,
  toggleCustomModal,
} from '../../modules/date/actions';
import {
  TIME_SCALE_FROM_NUMBER,
  customModalType,
} from '../../modules/date/constants';
import {
  snapToIntervalDelta,
  getNumberOfSteps,
} from '../../modules/animation/util';
import {
  subdailyLayersActive,
  getAllActiveLayers,
  dateRange as getDateRange,
} from '../../modules/layers/selectors';
import { getSelectedDate } from '../../modules/date/selectors';
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
  toggleAnimationAutoplay,
} from '../../modules/animation/actions';
import usePrevious from '../../util/customHooks';
import DesktopAnimationWidget from './desktop-animation-widget';
import MobileAnimationWidget from './mobile-animation-widget';
import CollapsedAnimationWidget from './collapsed-animation-widget';
import AnimationTileCheck from '../../components/kiosk/animation-tile-check/animation-tile-check';

function AnimationWidget (props) {
  const {
    appNow,
    animationCustomModalOpen,
    autoplay,
    breakpoints,
    currentDate,
    delta,
    endDate,
    hasFutureLayers,
    hasSubdailyLayers,
    interval,
    isActive,
    isCollapsed,
    isDistractionFreeModeActive,
    isEmbedModeActive,
    isKioskModeActive,
    isLandscape,
    isMobile,
    isMobilePhone,
    isMobileTablet,
    isPlaying,
    isPortrait,
    looping,
    minDate,
    maxDate,
    numberOfFrames,
    onClose,
    onPushLoop,
    onPushPause,
    onPushPlay,
    onSlide,
    onToggleAnimationAutoplay,
    onToggleAnimationCollapse,
    onUpdateEndDate,
    onUpdateStartDate,
    onUpdateStartAndEndDate,
    playDisabled,
    promiseImageryForTime,
    screenHeight,
    screenWidth,
    selectDate,
    sliderLabel,
    speedRedux,
    snappedCurrentDate,
    startDate,
    subDailyMode,
  } = props;

  const widgetWidth = 334;
  const subdailyWidgetWidth = 460;
  const halfWidgetWidth = (subDailyMode ? subdailyWidgetWidth : widgetWidth) / 2;

  const [widgetPosition, setWidgetPosition] = useState({ x: screenWidth / 2 - halfWidgetWidth, y: -25 });
  const [collapsedWidgetPosition, setCollapsedWidgetPosition] = useState({ x: 0, y: 0 });
  const [userHasMovedWidget, setUserHasMovedWidget] = useState(false);
  const [speed, setSpeed] = useState(speedRedux);
  const [testMode, setTestMode] = useState(false);

  const prevSubDailyMode = usePrevious(subDailyMode);
  const prevHasFutureLayers = usePrevious(hasFutureLayers);

  // component did mount
  useEffect(() => {
    if (isEmbedModeActive) {
      setWidgetPosition({ x: 10, y: 0 });
    }
    if (!isPlaying && autoplay && !isKioskModeActive) {
      onPushPlay();
      toggleAutoplay();
    }
  }, []);

  // component did update
  useEffect(() => {
    const subdailyChange = subDailyMode !== prevSubDailyMode && prevSubDailyMode !== undefined;

    if (prevHasFutureLayers && !hasFutureLayers) {
      onUpdateEndDate(appNow);
    }

    // If toggle between subdaily/daily & widget hasn't been manually moved, try to keep centered
    if (subdailyChange && !userHasMovedWidget) {
      const useWidth = subDailyMode ? subdailyWidgetWidth : widgetWidth;

      setWidgetPosition({
        x: (screenWidth / 2) - (useWidth / 2),
        y: 0,
      });
    }
  });

  // Prevent drag when interacting with child elements (e.g. buttons) Only allow drag when targeting "background" elements
  const handleDragStart = (e, data) => {
    const draggableTargets = [
      'wv-animation-widget',
      'wv-animation-widget-header',
      'wv-anim-dates-case',
      'thru-label',
    ];
    const { classList } = e.target;
    return draggableTargets.some((tClass) => classList.contains(tClass));
  };

  const toggleCollapse = () => {
    onToggleAnimationCollapse();
  };

  const toggleAutoplay = () => {
    onToggleAnimationAutoplay();
  };

  const onExpandedDrag = (e, position) => {
    const { x, y } = position;
    setUserHasMovedWidget(true);
    setWidgetPosition({ x, y });
  };

  const onCollapsedDrag = (e, position) => {
    const { x, y } = position;
    setUserHasMovedWidget(true);
    setCollapsedWidgetPosition({ x, y });
  };

  const onLoop = () => {
    onPushLoop(looping);
  };

  const onDateChange = ([newStartDate, newEndDate]) => {
    if (newStartDate !== startDate) {
      onUpdateStartDate(newStartDate);
    }
    if (newEndDate !== endDate) {
      onUpdateEndDate(newEndDate);
    }
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
  const zeroDates = () => {
    let startDateZeroed = new Date(startDate);
    let endDateZeroed = new Date(endDate);

    if (subDailyMode) {
      // for subdaily, zero start and end dates to UTC HH:MM:00:00
      const startMinutes = startDateZeroed.getMinutes();
      const endMinutes = endDateZeroed.getMinutes();
      startDateZeroed.setUTCMinutes(Math.floor(startMinutes / 10) * 10);
      startDateZeroed.setUTCSeconds(0);
      startDateZeroed.setUTCMilliseconds(0);
      endDateZeroed.setUTCMinutes(Math.floor(endMinutes / 10) * 10);
      endDateZeroed.setUTCSeconds(0);
      endDateZeroed.setUTCMilliseconds(0);
    } else {
      // for nonsubdaily, zero start and end dates to UTC 00:00:00:00
      startDateZeroed = util.clearTimeUTC(startDate);
      endDateZeroed = util.clearTimeUTC(endDate);
    }
    return {
      startDate: startDateZeroed,
      endDate: endDateZeroed,
    };
  };

  const onPushPlayFunc = () => {
    const {
      startDate,
      endDate,
    } = zeroDates();
    onUpdateStartAndEndDate(startDate, endDate);
    onPushPlay();
  };

  return isActive ? (
    <ErrorBoundary>
      {
        testMode && (
          <AnimationTileCheck
            startDate={startDate}
            endDate={endDate}
            interval={interval}
            delta={delta}
            isPlaying={isPlaying}
            setTestMode={setTestMode}
          />
        )
      }
      {isPlaying && !testMode && (
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
      {isCollapsed ? (
        <CollapsedAnimationWidget
          hasSubdailyLayers={hasSubdailyLayers}
          isMobile={isMobile}
          isPlaying={isPlaying}
          onClose={onClose}
          onPushPause={onPushPause}
          playDisabled={playDisabled}
          isPortrait={isPortrait}
          isLandscape={isLandscape}
          isMobilePhone={isMobilePhone}
          isMobileTablet={isMobileTablet}
          screenWidth={screenWidth}
          breakpoints={breakpoints}
          collapsedWidgetPosition={collapsedWidgetPosition}
          handleDragStart={handleDragStart}
          onCollapsedDrag={onCollapsedDrag}
          onPushPlay={onPushPlayFunc}
          toggleCollapse={toggleCollapse}
        />
      ) : isMobile ? (
        <MobileAnimationWidget
          breakpoints={breakpoints}
          endDate={endDate}
          hasSubdailyLayers={hasSubdailyLayers}
          isLandscape={isLandscape}
          isMobile={isMobile}
          isMobilePhone={isMobilePhone}
          isMobileTablet={isMobileTablet}
          isPlaying={isPlaying}
          isPortrait={isPortrait}
          looping={looping}
          maxDate={maxDate}
          minDate={minDate}
          onLoop={onLoop}
          onSlide={onSlide}
          onUpdateEndDate={onUpdateEndDate}
          onUpdateStartDate={onUpdateStartDate}
          playDisabled={playDisabled}
          selectDate={selectDate}
          screenHeight={screenHeight}
          screenWidth={screenWidth}
          setSpeed={setSpeed}
          sliderLabel={sliderLabel}
          speed={speed}
          startDate={startDate}
          subDailyMode={subDailyMode}
          toggleCollapse={toggleCollapse}
        />
      ) : isKioskModeActive && !testMode
        ? null

        : (
          <DesktopAnimationWidget
            animationCustomModalOpen={animationCustomModalOpen}
            customModalType={customModalType}
            isDistractionFreeModeActive={isDistractionFreeModeActive}
            endDate={endDate}
            handleDragStart={handleDragStart}
            hasSubdailyLayers={hasSubdailyLayers}
            interval={interval}
            isKioskModeActive={isKioskModeActive}
            isPlaying={isPlaying}
            looping={looping}
            maxDate={maxDate}
            minDate={minDate}
            numberOfFrames={numberOfFrames}
            onClose={onClose}
            onDateChange={onDateChange}
            onExpandedDrag={onExpandedDrag}
            onLoop={onLoop}
            onPushPause={onPushPause}
            onPushPlay={onPushPlayFunc}
            onSlide={onSlide}
            playDisabled={playDisabled}
            toggleCollapse={toggleCollapse}
            setSpeed={setSpeed}
            sliderLabel={sliderLabel}
            speed={speed}
            startDate={startDate}
            subDailyMode={subDailyMode}
            widgetPosition={widgetPosition}
            zeroDates={zeroDates}
          />
        )}
    </ErrorBoundary>
  ) : null;
}

const mapStateToProps = (state) => {
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
    startDate, endDate, speed, loop, isPlaying, isActive, isCollapsed, autoplay,
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

  const { isDistractionFreeModeActive, isKioskModeActive } = ui;
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
  const maxFrames = 300;
  const mobileMaxFrames = 50;
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
    autoplay,
    customSelected,
    startDate,
    endDate,
    isCollapsed,
    isKioskModeActive,
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
    speedRedux: speed,
    isPlaying,
    looping: loop,
    map,
    proj,
    promiseImageryForTime: (date) => promiseImageryForTime(state, date),
    isEmbedModeActive,
    playDisabled: !screenSize.isMobileDevice ? numberOfFrames >= maxFrames || numberOfFrames === 1 : numberOfFrames >= mobileMaxFrames || numberOfFrames === 1,
  };
};

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
  onToggleAnimationAutoplay: () => {
    dispatch(toggleAnimationAutoplay());
  },
});

AnimationWidget.propTypes = {
  appNow: PropTypes.object,
  animationCustomModalOpen: PropTypes.bool,
  autoplay: PropTypes.bool,
  breakpoints: PropTypes.object,
  snappedCurrentDate: PropTypes.object,
  currentDate: PropTypes.object,
  delta: PropTypes.number,
  endDate: PropTypes.object,
  hasFutureLayers: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool,
  interval: PropTypes.string,
  isActive: PropTypes.bool,
  isCollapsed: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  isKioskModeActive: PropTypes.bool,
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
  onToggleAnimationAutoplay: PropTypes.func,
  onClose: PropTypes.func,
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
  speedRedux: PropTypes.number,
  startDate: PropTypes.object,
  subDailyMode: PropTypes.bool,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AnimationWidget);
