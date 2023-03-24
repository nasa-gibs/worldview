/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import {
  debounce as lodashDebounce,
  get as lodashGet,
} from 'lodash';
import PropTypes from 'prop-types';
import { getISODateFormatted } from '../../components/timeline/date-util';
import util from '../../util/util';
import ErrorBoundary from '.././error-boundary';
import MobileCustomIntervalSelector from '../../components/timeline/custom-interval-selector/mobile-custom-interval-selector';
import MobileDatePicker from '../../components/timeline/mobile-date-picker';
import PlayQueue from '../../components/animation-widget/play-queue';
import { promiseImageryForTime } from '../../modules/map/util'
import {
  selectDate,
  selectInterval,
  toggleCustomModal,
} from '../../modules/date/actions';
import {
  TIME_SCALE_FROM_NUMBER,
  TIME_SCALE_TO_NUMBER,
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
  onIntervalSelect,
  toggleCustomIntervalModal,
  startDate,
  endDate,
  onUpdateStartAndEndDate,
} from '../../modules/animation/actions';
import GifButton from '../../components/animation-widget/gif-button';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import usePrevious from '../../../js/util/customHooks'
import DesktopAnimationWidget from './desktop-animation-widget'
import MobileAnimationWidget from './mobile-animation-widget'
import CollapsedAnimationWidget from './collapsed-animation-widget'

const AnimationWidget = (props) => {
  const {
    appNow,
    animationCustomModalOpen,
    breakpoints,
    currentDate,
    delta,
    draggerSelected,
    endDate,
    hasFutureLayers,
    hasSubdailyLayers,
    interval,
    isActive,
    isCollapsed,
    isEmbedModeActive,
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
    onIntervalSelect,
    onPushLoop,
    onPushPause,
    onPushPlay,
    onSlide,
    onToggleAnimationCollapse,
    onUpdateEndDate,
    onUpdateStartDate,
    onUpdateStartAndEndDate,
    playDisabled,
    screenWidth,
    sliderLabel,
    speedRedux,
    snappedCurrentDate,
    startDate,
    subDailyMode,
  } = props

  const widgetWidth = 334;
  const subdailyWidgetWidth = 460;
  const maxFrames = 300;
  const mobileMaxFrames = 50;
  const halfWidgetWidth = (subDailyMode ? subdailyWidgetWidth : widgetWidth) / 2;

  const [widgetPosition, setWidgetPosition] = useState({ x: screenWidth /2, y: -25 })
  const [collapsedWidgetPosition, setCollapsedWidgetPosition] = useState({ x: 0, y: 0 })
  const [userHasMovedWidget, setUserHasMovedWidget] = useState(false)
  const [speed, setSpeed] = useState(speedRedux)

  const debounceDateUpdate = lodashDebounce(selectDate, 8);

  // component did mount
  useEffect(() => {
    if(isEmbedModeActive){
      setWidgetPosition({ x: 10, y: 0 })
    }
  }, [])

  const prevSubDailyMode = usePrevious(subDailyMode)
  const prevHasFutureLayers = usePrevious(hasFutureLayers)

  // component did update
  useEffect(() => {
    const subdailyChange = subDailyMode !== prevSubDailyMode && prevSubDailyMode !== undefined

    if(prevHasFutureLayers && !hasFutureLayers) {
      onUpdateEndDate(appNow)
    }

    // If toggle between subdaily/daily & widget hasn't been manually moved, try to keep centered
    if (subdailyChange && !userHasMovedWidget) {
      const useWidth = subDailyMode ? subdailyWidgetWidth : widgetWidth

      setWidgetPosition({
        x: (screenWidth / 2) - (useWidth / 2),
        y: 0,
    })
    }
  })

    /**
   * Prevent drag when interacting with child elements (e.g. buttons)
   * Only allow drag when targeting "background" elements
   */
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
    }

    const onExpandedDrag = (e, position) => {
      const { x, y } = position
      setUserHasMovedWidget(true)
      setWidgetPosition({ x, y})
    }

    const onCollapsedDrag = (e, position) => {
      const { x, y } = position
      setUserHasMovedWidget(true)
      setCollapsedWidgetPosition({ x, y })
    }

    const onLoop = () => {
      if (looping) onPushLoop(looping)
    }

    const onDateChange = ([newStartDate, newEndDate]) => {
      if (newStartDate !== startDate) {
        onUpdateStartDate(newStartDate)
      }
      if (newEndDate !== endDate) {
        onUpdateEndDate(newEndDate)
      }
    }

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

    const onIntervalSelectFunc = (timeScale, openModal) => {
      let delta;
      const customSelected = timeScale === 'custom';

      if (openModal) {
        toggleCustomIntervalModal(openModal);
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
    if (subDailyMode) {
      // for subdaily, zero start and end dates to UTC HH:MM:00:00
      let startMinutes = startDate.getMinutes();
      let endMinutes = endDate.getMinutes();
      startDate.setUTCMinutes(Math.floor(startMinutes / 10) * 10);
      startDate.setUTCSeconds(0);
      startDate.setUTCMilliseconds(0);
      endDate.setUTCMinutes(Math.floor(endMinutes / 10) * 10);
      endDate.setUTCSeconds(0);
      endDate.setUTCMilliseconds(0);
    } else {
      // for nonsubdaily, zero start and end dates to UTC 00:00:00:00
      let startDate = util.clearTimeUTC(startDate);
      let endDate = util.clearTimeUTC(endDate);
    }
    return {
      startDate,
      endDate,
    };
  };

    const onPushPlayFunc = () => {
      const {
        startDate,
        endDate,
      } = zeroDates();
      onUpdateStartAndEndDate(startDate, endDate);
      onPushPlay();
    }

    const toggleCustomIntervalModal = (isOpen) => {
      toggleCustomModal(isOpen, customModalType.ANIMATION)
    }

  return isActive ? (
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
          onPushPlay={onPushPlay}
        />
      ) : (
        <DesktopAnimationWidget
          animationCustomModalOpen={animationCustomModalOpen}
          customModalType={customModalType}
          endDate={endDate}
          handleDragStart={handleDragStart}
          hasSubdailyLayers={hasSubdailyLayers}
          interval={interval}
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
  const maxFrames = 300;
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
    speedRedux: speed,
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
})

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  )(AnimationWidget)