import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import { UncontrolledTooltip } from 'reactstrap';
import {
  debounce as lodashDebounce,
  throttle as lodashThrottle,
  get as lodashGet,
} from 'lodash';
import googleTagManager from 'googleTagManager';
import ErrorBoundary from '../error-boundary';
import MobileDatePicker from '../../components/timeline/mobile-date-picker';
import TimelineAxis from '../../components/timeline/timeline-axis/timeline-axis';
import TimelineLayerCoveragePanel from '../../components/timeline/timeline-coverage/timeline-coverage';
import TimeScaleIntervalChange from '../../components/timeline/timeline-controls/timescale-interval-change';
import DraggerContainer from '../../components/timeline/timeline-draggers/dragger-container';
import AxisHoverLine from '../../components/timeline/timeline-axis/date-tooltip/axis-hover-line';
import DateTooltip from '../../components/timeline/timeline-axis/date-tooltip/date-tooltip';
import CustomIntervalSelector from '../../components/timeline/custom-interval-selector/custom-interval-selector';
import DateSelector from '../../components/date-selector/date-selector';
import DateChangeArrows from '../../components/timeline/timeline-controls/date-change-arrows';
import AnimationButton from '../../components/timeline/timeline-controls/animation-button';
import AxisTimeScaleChange from '../../components/timeline/timeline-controls/axis-timescale-change';
import TimelineRangeSelector from '../../components/range-selection/range-selection';
import KioskTimeStamp from '../../components/timeline/kiosk-timestamp';

import {
  getIsBetween,
  getISODateFormatted,
} from '../../components/timeline/date-util';
import {
  dateRange as getDateRange,
  hasSubDaily as hasSubDailySelector,
  subdailyLayersActive,
  subdailyLayers,
  getActiveLayers,
  getSubDaily,
  getSmallestIntervalValue,
} from '../../modules/layers/selectors';
import { getSelectedDate, getDeltaIntervalUnit } from '../../modules/date/selectors';
import {
  selectDate as selectDateAction,
  changeTimeScale as changeTimeScaleAction,
  selectInterval,
  changeCustomInterval as changeCustomIntervalAction,
  changeAutoInterval as changeAutoIntervalAction,
  updateAppNow as updateAppNowAction,
  toggleCustomModal,
  triggerTodayButton as triggerTodayButtonAction,
} from '../../modules/date/actions';
import {
  checkHasFutureLayers,
  filterProjLayersWithStartDate,
  getNextTimeSelection,
  getNextImageryDelta,
} from '../../modules/date/util';
import { toggleActiveCompareState as toggleActiveCompareStateAction } from '../../modules/compare/actions';
import { addGranuleDateRanges as addGranuleDateRangesAction } from '../../modules/layers/actions';
import {
  onActivate as openAnimationAction,
  onClose as closeAnimationAction,
  changeStartAndEndDate,
  changeStartDate,
  changeEndDate,
  toggleAnimationCollapse,
  stop as pauseAnimation,
} from '../../modules/animation/actions';
import {
  TIME_SCALE_FROM_NUMBER,
  TIME_SCALE_TO_NUMBER,
  timeScaleOptions,
  customModalType,
} from '../../modules/date/constants';
import util from '../../util/util';
import usePrevious from '../../util/customHooks';

import MobileComparisonToggle from '../../components/compare/mobile-toggle';

const preventDefaultFunc = (e) => {
  e.preventDefault();
};

// get axisWidth and parentOffset for axis, footer, and leftOffset calculations
const getOffsetValues = (innerWidth, hasSubDaily) => {
  const parentOffset = (hasSubDaily ? 414 : 310) + 10;
  const width = innerWidth - parentOffset - 88;
  return { width, parentOffset };
};

// check if left arrow should be disabled on predicted decrement
const checkLeftArrowDisabled = (
  date,
  delta,
  timeScaleChangeUnit,
  timelineStartDateLimit,
) => {
  const nextDecMoment = moment.utc(date).subtract(delta, timeScaleChangeUnit);
  const nextDecrementDate = new Date(nextDecMoment.seconds(0).format());
  const minMinusDeltaMoment = moment.utc(timelineStartDateLimit)
    .subtract(delta, timeScaleChangeUnit);
  const minMinusDeltaDate = new Date(minMinusDeltaMoment.seconds(0).format());

  const nextDecrementDateTime = nextDecrementDate.getTime();
  const minMinusDeltaDateTime = minMinusDeltaDate.getTime();
  return nextDecrementDateTime <= minMinusDeltaDateTime;
};

// check if right arrow should be disabled on predicted increment
const checkRightArrowDisabled = (
  date,
  delta,
  timeScaleChangeUnit,
  timelineEndDateLimit,
  autoSelected,
) => {
  if (autoSelected) return false;

  const nextIncMoment = moment.utc(date).add(delta, timeScaleChangeUnit);

  const startOfDayNextIncrement = nextIncMoment.startOf('day').valueOf();
  const startOfDayLimit = moment.utc(timelineEndDateLimit).startOf('day')
    .valueOf();

  return startOfDayNextIncrement > startOfDayLimit;
};

const checkNowButtonDisabled = (
  date,
  timelineEndDateLimit,
  hasFutureLayers,
  nowOverride,
  appNow,
) => {
  const dateTimeMoment = new Date(moment.utc(date).seconds(0)
    .format());
  let maxDateMoment;
  if (nowOverride || hasFutureLayers) {
    maxDateMoment = new Date(moment.utc(appNow).seconds(0)
      .format());
  } else {
    maxDateMoment = new Date(moment.utc(timelineEndDateLimit).seconds(0)
      .format());
  }
  return dateTimeMoment.getTime() === maxDateMoment.getTime();
};

// get timelineEndDateLimit based on potential future layers
const getTimelineEndDateLimit = (state) => {
  const {
    date, layers, compare, proj,
  } = state;
  const { appNow } = date;
  const activeLayers = getActiveLayers(state);

  let layerDateRange;
  if (compare.active) {
    // use all layers to keep timeline axis range consistent when switching between A/B
    const compareALayersFiltered = filterProjLayersWithStartDate(layers.active.layers, proj.id);
    const compareBLayersFiltered = filterProjLayersWithStartDate(layers.activeB.layers, proj.id);
    layerDateRange = getDateRange({}, [...compareALayersFiltered, ...compareBLayersFiltered]);
  } else {
    const activeLayersFiltered = filterProjLayersWithStartDate(activeLayers, proj.id);
    layerDateRange = getDateRange({}, activeLayersFiltered);
  }

  let timelineEndDateLimit;
  if (layerDateRange && layerDateRange.end > appNow) {
    const layerDateRangeEndRoundedQuarterHour = util.roundTimeQuarterHour(layerDateRange.end);
    const appNowRoundedQuarterHour = util.roundTimeQuarterHour(appNow);
    if (layerDateRangeEndRoundedQuarterHour.getTime() > appNowRoundedQuarterHour.getTime()) {
      // if layerDateRange.end is after the set rounded quarter hour time, then update
      timelineEndDateLimit = getISODateFormatted(layerDateRangeEndRoundedQuarterHour);
    }
  } else {
    timelineEndDateLimit = getISODateFormatted(appNow);
  }
  return timelineEndDateLimit;
};

function Timeline(props) {
  const {
    activeLayers,
    addGranuleDateRanges,
    animationDisabled,
    animEndLocationDate,
    animStartLocationDate,
    appNow,
    autoSelected,
    axisWidth,
    breakpoints,
    changeAutoInterval,
    changeCustomInterval,
    changeTimeScale: changeTimeScaleProp,
    closeAnimation,
    customInterval,
    customSelected,
    dateA,
    dateB,
    activeString,
    deltaChangeAmt,
    displayStaticMap,
    draggerSelected,
    hasFutureLayers,
    hasSubdailyLayers,
    hasTempoProduct,
    hideTimeline,
    interval,
    isAnimatingToEvent,
    isAnimationPlaying,
    isAnimationWidgetOpen,
    isChartingActive,
    isCompareModeActive,
    isDataDownload,
    isDistractionFreeModeActive,
    isEmbedModeActive,
    isGifActive,
    isKioskModeActive,
    isLandscape,
    isMobile,
    isMobilePhone,
    isMobileTablet,
    isPortrait,
    isTourActive,
    leftArrowDisabled,
    newCustomDelta,
    nowButtonDisabled,
    nowOverride,
    onPauseAnimation,
    onToggleAnimationCollapse,
    onUpdateEndDate,
    onUpdateStartAndEndDate,
    onUpdateStartDate,
    openAnimation,
    parentOffset,
    rightArrowDisabled,
    screenWidth,
    selectDate,
    selectedDate,
    subDailyLayersList,
    timelineCustomModalOpen,
    timelineEndDateLimit,
    timelineStartDateLimit,
    timeScale,
    timeScaleChangeUnit,
    toggleActiveCompareState,
    triggerTodayButton,
    updateAppNow,
    proj,
    describeDomainsUrl,
    cmrBaseUrl,
  } = props;

  // State
  const [position, setPosition] = useState(0);
  const [transformX, setTransformX] = useState(0);
  const [leftOffset, setLeftOffset] = useState(0);
  const [frontDate, setFrontDate] = useState('');
  const [backDate, setBackDate] = useState('');
  const [animationStartLocationDate, setAnimationStartLocationDate] = useState('');
  const [animationEndLocationDate, setAnimationEndLocationDate] = useState('');
  const [animationStartLocation, setAnimationStartLocation] = useState(0);
  const [animationEndLocation, setAnimationEndLocation] = useState(0);
  const [draggerTimeState, setDraggerTimeState] = useState('');
  const [draggerTimeStateB, setDraggerTimeStateB] = useState('');
  const [draggerPosition, setDraggerPosition] = useState(0);
  const [draggerPositionB, setDraggerPositionB] = useState(0);
  const [draggerVisible, setDraggerVisible] = useState(true);
  const [draggerVisibleB, setDraggerVisibleB] = useState(false);
  const [hoverTime, setHoverTime] = useState('');
  const [hoverLinePosition, setHoverLinePosition] = useState(0);
  const [showHoverLine, setShowHoverLine] = useState(false);
  const [showDraggerTime, setShowDraggerTime] = useState(false);
  const [isAnimationDraggerDragging, setIsAnimationDraggerDragging] = useState(false);
  const [isDraggerDragging, setIsDraggerDragging] = useState(false);
  const [isTimelineDragging, setIsTimelineDragging] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [timelineHidden, setTimelineHidden] = useState(false);
  const [rangeSelectorMax] = useState({
    end: false, start: false, startOffset: -50, width: 50000,
  });
  const [matchingTimelineCoverage, setMatchingTimelineCoverage] = useState([]);
  const [isTimelineLayerCoveragePanelOpen, setIsTimelineLayerCoveragePanelOpen] = useState(false);
  const [shouldIncludeHiddenLayers, setShouldIncludeHiddenLayers] = useState(false);

  // Debounced functions — dispatch props are stable (memoized by connect)
  const debounceDateUpdateRef = useRef(lodashDebounce(selectDate, 8));
  const debounceOnUpdateStartDateRef = useRef(lodashDebounce(onUpdateStartDate, 30));
  const debounceOnUpdateEndDateRef = useRef(lodashDebounce(onUpdateEndDate, 30));
  const debounceOnUpdateStartAndEndDateRef = useRef(
    lodashDebounce(onUpdateStartAndEndDate, 30),
  );
  const appNowUpdateIntervalRef = useRef(0);

  // Refs for state values needed in interval/event callbacks
  const stateRef = useRef({});
  stateRef.current = {
    position,
    transformX,
    frontDate,
    hoverTime,
    draggerPosition,
    draggerPositionB,
    draggerVisible,
    draggerVisibleB,
    draggerTimeState,
    draggerTimeStateB,
    isTimelineDragging,
    isDraggerDragging,
    isAnimationDraggerDragging,
    showHoverLine,
    showDraggerTime,
    animationStartLocation,
    animationEndLocation,
  };

  // Previous values for componentDidUpdate logic
  const prevIsAnimationPlaying = usePrevious(isAnimationPlaying);
  const prevIsGifActive = usePrevious(isGifActive);
  const prevAnimStartLocationDate = usePrevious(animStartLocationDate);
  const prevAnimEndLocationDate = usePrevious(animEndLocationDate);
  const prevHasSubdailyLayers = usePrevious(hasSubdailyLayers);
  const prevHasTempoProduct = usePrevious(hasTempoProduct);
  const prevSubDailyLayersList = usePrevious(subDailyLayersList);
  const prevFrontDate = usePrevious(frontDate);
  const prevDateA = usePrevious(dateA);
  const prevDateB = usePrevious(dateB);

  // METHODS

  function onDateChange(date, draggerSelectedArg = draggerSelected) {
    const dateISOFormatted = getISODateFormatted(date);
    if (draggerSelectedArg === 'selected') {
      setDraggerTimeState(dateISOFormatted);
    } else {
      setDraggerTimeStateB(dateISOFormatted);
    }
    debounceDateUpdateRef.current(new Date(date), draggerSelectedArg);
  }

  function changeTimeScaleLocal(timeScaleNum) {
    setShowHoverLine(false);
    setShowDraggerTime(false);
    changeTimeScaleProp(timeScaleNum);
  }

  const changeTimeScaleScrollRef = useRef(null);
  changeTimeScaleScrollRef.current = (e) => {
    const timeScaleNumber = Number(TIME_SCALE_TO_NUMBER[timeScale]);
    const maxTimeScaleNumber = hasSubdailyLayers ? 5 : 3;

    if (e.deltaY > 0) {
      if (timeScaleNumber > 1) {
        changeTimeScaleLocal(timeScaleNumber - 1);
      }
    } else if (timeScaleNumber < maxTimeScaleNumber) {
      changeTimeScaleLocal(timeScaleNumber + 1);
    }
  };

  // Throttled/debounced wheel timescale change refs
  const throttleSettings = { leading: true, trailing: false };
  const throttleChangeTimeScaleWheelFireRef = useRef(
    lodashThrottle((e) => changeTimeScaleScrollRef.current(e), 200, throttleSettings),
  );
  const debounceChangeTimeScaleWheelRef = useRef(
    lodashDebounce(
      (e) => { throttleChangeTimeScaleWheelFireRef.current(e); },
      60,
      throttleSettings,
    ),
  );

  function animationDraggerDateUpdateLocal(startDate, endDate) {
    const { position: pos, transformX: tx, frontDate: fd } = stateRef.current;
    const options = timeScaleOptions[timeScale].timeAxis;
    const { gridWidth } = options;

    const frontDateObj = moment.utc(fd);
    const startLocation = frontDateObj.diff(startDate, timeScale, true) * gridWidth;
    const endLocation = frontDateObj.diff(endDate, timeScale, true) * gridWidth;

    setAnimationStartLocation(pos - startLocation + tx);
    setAnimationEndLocation(pos - endLocation + tx);
    setAnimationStartLocationDate(startDate);
    setAnimationEndLocationDate(endDate);
  }

  function animationDraggerDateUpdate(startDate, endDate) {
    animationDraggerDateUpdateLocal(startDate, endDate);

    const didStartDateChange = startDate.getTime() !== animStartLocationDate.getTime();
    const didEndDateChange = endDate.getTime() !== animEndLocationDate.getTime();
    if (didStartDateChange || didEndDateChange) {
      debounceOnUpdateStartAndEndDateRef.current(startDate, endDate);
    }
  }

  function determineAnimationDraggerUpdate(startDate, endDate) {
    const startChanged = animStartLocationDate !== startDate;
    const endChanged = animEndLocationDate !== endDate;
    if (startChanged) {
      if (endChanged) {
        debounceOnUpdateStartAndEndDateRef.current(startDate, endDate);
      } else {
        debounceOnUpdateStartDateRef.current(startDate);
      }
    } else if (endChanged) {
      debounceOnUpdateEndDateRef.current(endDate);
    }
  }

  function handleArrowDateChange(signConstant) {
    let delta = customSelected && deltaChangeAmt ? deltaChangeAmt : 1;
    let timescale = timeScaleChangeUnit;
    if (autoSelected && subDailyLayersList && subDailyLayersList.length) {
      delta = getNextImageryDelta(
        subDailyLayersList,
        activeString === 'active' ? dateA : dateB,
        signConstant,
      );
      timescale = 'minute';
    }
    if (!timeScaleChangeUnit) return;
    delta = Number(delta * signConstant);
    const disabled = signConstant > 0 ? rightArrowDisabled : leftArrowDisabled;
    if (!disabled) {
      const minDate = new Date(timelineStartDateLimit);
      const maxDate = new Date(timelineEndDateLimit);
      onDateChange(getNextTimeSelection(
        delta,
        timescale,
        selectedDate,
        minDate,
        maxDate,
      ));
    }
  }

  const handleKeyDownRef = useRef(null);
  handleKeyDownRef.current = (e) => {
    const { isTimelineDragging: dragging } = stateRef.current;
    if (e.target.tagName !== 'INPUT' && e.target.className !== 'form-range' && !e.ctrlKey && !e.metaKey && !dragging) {
      const timeScaleNumber = Number(TIME_SCALE_TO_NUMBER[timeScale]);
      const maxTimeScaleNumber = hasSubdailyLayers ? 5 : 3;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (timeScaleNumber > 1) {
          changeTimeScaleLocal(timeScaleNumber - 1);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (timeScaleNumber < maxTimeScaleNumber) {
          changeTimeScaleLocal(timeScaleNumber + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleArrowDateChange(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleArrowDateChange(1);
      }
    }
  };

  const handleKeyUpRef = useRef(() => {});

  function displayDateFn(date, leftOffsetArg) {
    requestAnimationFrame(() => {
      setHoverTime(date);
      setLeftOffset(leftOffsetArg - parentOffset);
    });
  }

  function showHoverOn() {
    const { showHoverLine: hovLine, showDraggerTime: dragTime } = stateRef.current;
    if (!hovLine && !dragTime) {
      setShowHoverLine(true);
    }
  }

  function showHoverOff() {
    const { showHoverLine: hovLine } = stateRef.current;
    if (hovLine === true) {
      setShowHoverLine(false);
    }
  }

  function toggleShowDraggerTimeFn(toggleBoolean) {
    setShowDraggerTime(toggleBoolean);
    setShowHoverLine(false);
    setIsDraggerDragging(toggleBoolean);
  }

  function showHoverFn(e, itemDate, nextDate, index) {
    e.preventDefault();
    e.stopPropagation();
    e.persist();
    requestAnimationFrame(() => {
      const { position: pos, transformX: tx } = stateRef.current;
      const options = timeScaleOptions[timeScale].timeAxis;
      const { gridWidth } = options;

      const { target } = e;
      const { clientX } = e;
      const boundingClientRect = target.getBoundingClientRect();
      const xHoverPositionInCurrentGrid = Math.floor(clientX) - Math.floor(boundingClientRect.left);

      const currentDateValue = new Date(itemDate).getTime();
      const nextDateValue = new Date(nextDate).getTime();
      const diff = nextDateValue - currentDateValue;
      const diffFactor = diff / gridWidth;
      const displayDateValue = currentDateValue + xHoverPositionInCurrentGrid * diffFactor;

      const isBetweenValidTimeline = getIsBetween(
        displayDateValue,
        timelineStartDateLimit,
        timelineEndDateLimit,
      );
      if (isBetweenValidTimeline) {
        const displayDateFormat = getISODateFormatted(displayDateValue);
        displayDateFn(displayDateFormat, clientX);
        setHoverLinePosition(index * gridWidth + xHoverPositionInCurrentGrid +
          tx + pos);
      }
    });
  }

  function updatePositioning({
    isTimelineDragging: dragging,
    position: pos,
    transformX: tx,
    frontDate: fd,
    backDate: bd,
    draggerPosition: dp,
    draggerPositionB: dpB,
    draggerVisible: dv,
    draggerVisibleB: dvB,
    animationStartLocation: asl,
    animationEndLocation: ael,
  }, ht = stateRef.current.hoverTime) {
    setIsTimelineDragging(dragging);
    setShowHoverLine(false);
    setPosition(pos);
    setTransformX(tx);
    setFrontDate(fd);
    setBackDate(bd);
    setDraggerPosition(dp);
    setDraggerPositionB(dpB);
    setDraggerVisible(dv);
    setDraggerVisibleB(dvB);
    setAnimationStartLocation(asl);
    setAnimationEndLocation(ael);
    setHoverTime(ht);
  }

  function updatePositioningOnSimpleDrag({
    position: pos,
    draggerPosition: dp,
    draggerPositionB: dpB,
    animationStartLocation: asl,
    animationEndLocation: ael,
  }) {
    setIsTimelineDragging(true);
    setShowHoverLine(false);
    setPosition(pos);
    setDraggerPosition(dp);
    setDraggerPositionB(dpB);
    setAnimationStartLocation(asl);
    setAnimationEndLocation(ael);
  }

  function updatePositioningOnAxisStopDrag({
    isTimelineDragging: dragging,
    position: pos,
    transformX: tx,
  }, ht = stateRef.current.hoverTime) {
    setIsTimelineDragging(dragging);
    setShowHoverLine(false);
    setPosition(pos);
    setTransformX(tx);
    setHoverTime(ht);
  }

  function updateTimelineMoveAndDrag(dragging) {
    setIsTimelineDragging(dragging);
  }

  function clickAnimationButton() {
    if (isCompareModeActive || isChartingActive || isDataDownload) {
      return;
    }
    if (isAnimationWidgetOpen && isMobile) {
      onToggleAnimationCollapse();
      onPauseAnimation();
    } else if (isMobile && !isAnimationWidgetOpen) {
      openAnimation();
    } else if (isAnimationWidgetOpen) {
      closeAnimation();
    } else {
      googleTagManager.pushEvent({
        event: 'GIF_setup_animation_button',
      });
      openAnimation();
    }
  }

  function toggleHideTimelineFn() {
    setTimelineHidden((prev) => !prev);
  }

  function updateAnimationDateAndLocationFn(
    startDate, endDate, startLocation, endLocation, isDragging,
  ) {
    const { animationStartLocation: asl, animationEndLocation: ael } = stateRef.current;
    setAnimationStartLocation(startLocation || asl);
    setAnimationEndLocation(endLocation || ael);
    setAnimationStartLocationDate(startDate);
    setAnimationEndLocationDate(endDate);
    setIsAnimationDraggerDragging(isDragging);
    determineAnimationDraggerUpdate(startDate, endDate);
  }

  function updateDraggerDatePositionFn(
    newDate,
    draggerSelectedArg,
    draggerPositionArg,
    draggerVisibleArg,
    otherDraggerVisibleArg,
  ) {
    const {
      draggerPosition: dp,
      draggerPositionB: dpB,
      draggerVisible: dv,
      draggerVisibleB: dvB,
      draggerTimeState: dts,
      draggerTimeStateB: dtsB,
    } = stateRef.current;
    if (draggerSelectedArg === 'selected') {
      setDraggerPosition(draggerPositionArg || dp);
      setDraggerVisible(draggerVisibleArg || dv);
      setDraggerVisibleB(otherDraggerVisibleArg || dvB);
      setDraggerTimeState(newDate || dts);
      if (newDate) {
        onDateChange(newDate, 'selected');
      }
    } else {
      setDraggerPositionB(draggerPositionArg || dpB);
      setDraggerVisible(otherDraggerVisibleArg || dv);
      setDraggerVisibleB(draggerVisibleArg || dvB);
      setDraggerTimeStateB(newDate || dtsB);
      if (newDate) {
        onDateChange(newDate, 'selectedB');
      }
    }
  }

  function setDraggerVisibilityFn(dv, dvB) {
    setDraggerVisible(dv);
    setDraggerVisibleB(dvB);
  }

  function setMatchingTimelineCoverageFn(dateRange, includeHidden) {
    setMatchingTimelineCoverage(dateRange);
    setShouldIncludeHiddenLayers(includeHidden);
  }

  function toggleLayerCoveragePanel(isOpen) {
    if (isOpen) {
      googleTagManager.pushEvent({
        event: 'open_layer_coverage_panel',
      });
    }
    setIsTimelineLayerCoveragePanelOpen(isOpen);
  }

  function updateDraggerTimeStateFn(date, isDraggerB) {
    if (isDraggerB) {
      setDraggerTimeStateB(date);
    } else {
      setDraggerTimeState(date);
    }
  }

  const propsRef = useRef({});
  propsRef.current = { isAnimationPlaying, updateAppNow };

  function checkAndUpdateAppNow() {
    const ensureCanUpdate = function() {
      return new Promise((resolve) => {
        (function waitForSafeUpdate() {
          const {
            isTimelineDragging: dragging,
            isDraggerDragging: draggerDrag,
            isAnimationDraggerDragging: animDrag,
          } = stateRef.current;
          const { isAnimationPlaying: playing } = propsRef.current;
          const userIsInteracting = dragging || draggerDrag || animDrag;
          if (!userIsInteracting && !playing) {
            return resolve();
          }
          return setTimeout(waitForSafeUpdate, 1000);
        }());
      });
    };

    ensureCanUpdate().then(() => {
      propsRef.current.updateAppNow(util.now());
    });
  }

  function handleSelectNowButton() {
    triggerTodayButton();
  }

  function getMobileDateButtonStyle() {
    let mobileLeft = 190;
    let mobileBottom = 20;
    if (isEmbedModeActive) {
      mobileLeft = 145;
      mobileBottom = 20;
    }
    if (hasSubdailyLayers && screenWidth >= 484) {
      mobileLeft = 287;
      if (isEmbedModeActive) {
        mobileLeft = 220;
      }
    } else if (screenWidth < 575) {
      mobileLeft = isCompareModeActive ? 112 : 10;
      mobileBottom = 75;
      if (isEmbedModeActive) {
        mobileLeft = isCompareModeActive ? 90 : 10;
        mobileBottom = 56;
      }
    }

    return {
      left: `${mobileLeft}px`,
      bottom: `${mobileBottom}px`,
    };
  }

  function renderDateChangeArrows() {
    return (
      <DateChangeArrows
        leftArrowDown={() => handleArrowDateChange(-1)}
        leftArrowDisabled={leftArrowDisabled}
        isMobile={isMobile}
        rightArrowDown={() => handleArrowDateChange(1)}
        rightArrowDisabled={rightArrowDisabled}
        nowButtonDisabled={nowButtonDisabled}
        handleSelectNowButton={handleSelectNowButton}
      />
    );
  }

  function renderMobile() {
    const dataDownloadLabel = isDataDownload
      ? 'Animation feature is deactivated when Data Download feature is active'
      : '';
    const chartingActiveLabel = isChartingActive
      ? 'Animation feature is deactivated when Charting feature is active'
      : dataDownloadLabel;
    return (
      <div id="timeline-header" className="timeline-header-mobile">
        <MobileDatePicker
          date={selectedDate}
          startDateLimit={timelineStartDateLimit}
          endDateLimit={timelineEndDateLimit}
          onDateChange={onDateChange}
          hasSubdailyLayers={hasSubdailyLayers}
          isMobile={isMobile}
          isEmbedModeActive={isEmbedModeActive}
        />
        <MobileComparisonToggle />
        <div
          className="mobile-date-change-arrows-btn"
          style={getMobileDateButtonStyle()}
        >
          <div id="zoom-buttons-group">
            {renderDateChangeArrows()}
          </div>
        </div>
        <div>
          {!isCompareModeActive && !isChartingActive && (
            <AnimationButton
              isMobile={isMobile}
              breakpoints={breakpoints}
              screenWidth={screenWidth}
              isMobilePhone={isMobilePhone}
              isMobileTablet={isMobileTablet}
              isLandscape={isLandscape}
              isPortrait={isPortrait}
              clickAnimationButton={clickAnimationButton}
              hasSubdailyLayers={hasSubdailyLayers}
              isKioskModeActive={isKioskModeActive}
              isEmbedModeActive={isEmbedModeActive}
              disabled={animationDisabled}
              label={isCompareModeActive
                ? 'Animation feature is deactivated when Compare feature is active'
                : chartingActiveLabel}
            />
          )}
        </div>
      </div>
    );
  }

  // EFFECTS

  // Stable handler wrappers that delegate to refs (avoid stale closures)
  const keyDownHandler = (e) => handleKeyDownRef.current(e);
  const keyUpHandler = (e) => handleKeyUpRef.current(e);

  // componentDidMount + componentWillUnmount
  useEffect(() => {
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    document.querySelector('.timeline-container')
      .addEventListener('wheel', preventDefaultFunc, { passive: false });

    if (!nowOverride) {
      appNowUpdateIntervalRef.current = setInterval(
        () => checkAndUpdateAppNow(), 60000 * 10,
      );
    }

    // setInitialState
    setDraggerTimeState(dateA);
    setDraggerTimeStateB(dateB);
    setHoverTime(dateA);
    setInitialLoadComplete(true);

    return () => {
      if (appNowUpdateIntervalRef.current) {
        clearInterval(appNowUpdateIntervalRef.current);
      }
      document.removeEventListener('keydown', keyDownHandler);
      document.removeEventListener('keyup', keyUpHandler);
      document.querySelector('.timeline-container')
        .removeEventListener('wheel', preventDefaultFunc);
    };
  }, []);

  // getDerivedStateFromProps replacement - update animation dates when animation is initiated
  useEffect(() => {
    if (!animationStartLocationDate &&
      !animationEndLocationDate &&
      animStartLocationDate &&
      animEndLocationDate) {
      const startDate = animStartLocationDate;
      const endDate = animEndLocationDate;
      const options = timeScaleOptions[timeScale].timeAxis;
      const { gridWidth } = options;

      const frontDateObj = moment.utc(frontDate);
      const startLocation = frontDateObj.diff(startDate, timeScale, true) * gridWidth;
      const endLocation = frontDateObj.diff(endDate, timeScale, true) * gridWidth;

      setAnimationStartLocationDate(animStartLocationDate);
      setAnimationEndLocationDate(animEndLocationDate);
      setAnimationStartLocation(position - startLocation + transformX);
      setAnimationEndLocation(position - endLocation + transformX);
    }
  }, [animStartLocationDate, animEndLocationDate]);

  // componentDidUpdate logic — skip on first render (componentDidUpdate doesn't run on mount)
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    // handle update animation positioning from play button/gif creation
    const didAnimationTurnOn = !prevIsAnimationPlaying && isAnimationPlaying;
    const didGifTurnOn = !prevIsGifActive && isGifActive;
    if (didAnimationTurnOn || didGifTurnOn) {
      animationDraggerDateUpdateLocal(animStartLocationDate, animEndLocationDate);
    }

    // handle location update from animation widget date changes
    if (isAnimationWidgetOpen) {
      if (
        prevAnimStartLocationDate &&
        prevAnimEndLocationDate &&
        animStartLocationDate &&
        animEndLocationDate
      ) {
        const animStartDateChanged = prevAnimStartLocationDate.getTime() !==
          animStartLocationDate.getTime();
        const animEndDateChanged = prevAnimEndLocationDate.getTime() !==
          animEndLocationDate.getTime();
        const frontDateChanged = prevFrontDate !== frontDate;
        if (animStartDateChanged || animEndDateChanged || frontDateChanged) {
          animationDraggerDateUpdate(animStartLocationDate, animEndLocationDate);
        }
      }
    }

    const subdailyRemoved = !hasSubdailyLayers && prevHasSubdailyLayers;
    const tempoRemoved = !hasTempoProduct && prevHasTempoProduct;
    const subDailyCountChanged = prevSubDailyLayersList &&
      subDailyLayersList.length !== prevSubDailyLayersList.length;
    const subdailyInterval = customInterval > 3 || interval > 3;

    if (tempoRemoved) {
      changeAutoInterval();
      selectInterval(1, TIME_SCALE_TO_NUMBER.day, false, false);
    }
    if (subdailyRemoved && subdailyInterval) {
      changeCustomInterval();
      selectInterval(1, TIME_SCALE_TO_NUMBER.day, false, false);
    }

    const isSubDaily = newCustomDelta < 1440;
    if (subDailyCountChanged) {
      if (hasTempoProduct) {
        changeAutoInterval(true);
      } else if (isSubDaily) {
        changeCustomInterval(newCustomDelta, TIME_SCALE_TO_NUMBER.minute);
      }
    }

    if (hasSubdailyLayers && !prevHasSubdailyLayers) {
      changeTimeScaleLocal(4);
    }

    if (dateA !== prevDateA && dateA !== draggerTimeState) {
      updateDraggerTimeStateFn(dateA, false);
    }
    if (dateB !== prevDateB && dateB !== draggerTimeStateB) {
      updateDraggerTimeStateFn(dateB, true);
    }
  });

  // RENDER

  const selectedDraggerPosition = draggerSelected === 'selected'
    ? draggerPosition
    : draggerPositionB;
  const isTimelineHidden = timelineHidden || hideTimeline;
  const chevronDirection = isTimelineHidden ? 'left' : 'right';
  const isAnimationWidgetReady = isAnimationWidgetOpen &&
    !animationDisabled &&
    animationStartLocation &&
    animationStartLocationDate &&
    animationEndLocation &&
    animationEndLocationDate;

  const containerDisplayStyle = {
    display: isDistractionFreeModeActive ? 'block' : 'block',
  };

  const dataDownloadLabel = isDataDownload
    ? 'Animation feature is deactivated when Data Download feature is active'
    : '';
  const chartingActiveLabel = isChartingActive
    ? 'Animation feature is deactivated when Charting feature is active'
    : dataDownloadLabel;

  return (
    <div
      className="timeline-container"
      style={containerDisplayStyle}
    >
      {initialLoadComplete && !isDistractionFreeModeActive &&
        (
          <ErrorBoundary>
            {isMobile || isEmbedModeActive
            /* Mobile Timeline Size */
              ? renderMobile()
            /* Normal Timeline Size */
              : !isDistractionFreeModeActive && (
                <section id="timeline" className="timeline-inner clearfix">
                  <div
                    id="timeline-header"
                    className={`timeline-header-desktop ${hasSubdailyLayers ? 'subdaily' : ''}`}
                    style={{ marginRight: isTimelineHidden ? '20px' : '0' }}
                  >
                    {/* Date Selector, Interval, Arrow Controls */}
                    <div id="date-selector-main" className={isKioskModeActive ? 'date-selector-kiosk' : ''}>
                      <DateSelector
                        id={draggerSelected}
                        idSuffix="timeline"
                        date={new Date(selectedDate)}
                        onDateChange={onDateChange}
                        maxDate={new Date(timelineEndDateLimit)}
                        minDate={new Date(timelineStartDateLimit)}
                        subDailyMode={hasSubdailyLayers}
                        isKioskModeActive={isKioskModeActive}
                        fontSize={24}
                      />
                    </div>
                    <div id="zoom-buttons-group" className={isKioskModeActive ? 'd-none' : ''}>

                      <TimeScaleIntervalChange
                        timeScaleChangeUnit={timeScaleChangeUnit}
                        hasSubdailyLayers={hasSubdailyLayers}
                        hasTempoProduct={hasTempoProduct}
                        modalType={customModalType.TIMELINE}
                      />

                      {renderDateChangeArrows()}
                    </div>
                    <AnimationButton
                      clickAnimationButton={clickAnimationButton}
                      disabled={animationDisabled}
                      isKioskModeActive={isKioskModeActive}
                      screenWidth={screenWidth}
                      breakpoints={breakpoints}
                      label={isCompareModeActive
                        ? 'Animation feature is deactivated when Compare feature is active'
                        : chartingActiveLabel}
                    />
                  </div>

                  {!isTimelineHidden &&
                  (
                    <div id="timeline-footer" className="notranslate">
                      {/* Axis */}
                      <TimelineAxis
                        activeLayers={activeLayers}
                        addGranuleDateRanges={addGranuleDateRanges}
                        appNow={appNow}
                        axisWidth={axisWidth}
                        parentOffset={parentOffset}
                        leftOffset={leftOffset}
                        position={position}
                        transformX={transformX}
                        timeScale={timeScale}
                        timelineStartDateLimit={timelineStartDateLimit}
                        timelineEndDateLimit={timelineEndDateLimit}
                        frontDate={frontDate}
                        backDate={backDate}
                        dateA={dateA}
                        dateB={dateB}
                        hoverTime={hoverTime}
                        draggerSelected={draggerSelected}
                        draggerTimeState={draggerTimeState}
                        draggerTimeStateB={draggerTimeStateB}
                        draggerPosition={draggerPosition}
                        draggerPositionB={draggerPositionB}
                        draggerVisible={draggerVisible}
                        draggerVisibleB={draggerVisibleB}
                        animationStartLocation={animationStartLocation}
                        animationEndLocation={animationEndLocation}
                        animStartLocationDate={animStartLocationDate}
                        animEndLocationDate={animEndLocationDate}
                        debounceChangeTimeScaleWheel={debounceChangeTimeScaleWheelRef.current}
                        onDateChange={onDateChange}
                        updatePositioning={updatePositioning}
                        updateTimelineMoveAndDrag={updateTimelineMoveAndDrag}
                        updatePositioningOnSimpleDrag={updatePositioningOnSimpleDrag}
                        updatePositioningOnAxisStopDrag={updatePositioningOnAxisStopDrag}
                        updateDraggerDatePosition={updateDraggerDatePositionFn}
                        showHoverOn={showHoverOn}
                        showHoverOff={showHoverOff}
                        showHover={showHoverFn}
                        hasFutureLayers={hasFutureLayers}
                        hasSubdailyLayers={hasSubdailyLayers}
                        isCompareModeActive={isCompareModeActive}
                        isAnimationPlaying={isAnimationPlaying}
                        isAnimatingToEvent={isAnimatingToEvent}
                        isTourActive={isTourActive}
                        isAnimationDraggerDragging={isAnimationDraggerDragging}
                        isDraggerDragging={isDraggerDragging}
                        isTimelineDragging={isTimelineDragging}
                        matchingTimelineCoverage={matchingTimelineCoverage}
                        proj={proj}
                        describeDomainsUrl={describeDomainsUrl}
                        cmrBaseUrl={cmrBaseUrl}
                      />

                      <AxisHoverLine
                        activeLayers={activeLayers}
                        shouldIncludeHiddenLayers={shouldIncludeHiddenLayers}
                        axisWidth={axisWidth}
                        hoverLinePosition={hoverLinePosition}
                        showHoverLine={showHoverLine}
                        isTimelineDragging={isTimelineDragging}
                        isAnimationDraggerDragging={isAnimationDraggerDragging}
                        isDraggerDragging={isDraggerDragging}
                        selectedDraggerPosition={selectedDraggerPosition}
                        isTimelineLayerCoveragePanelOpen={isTimelineLayerCoveragePanelOpen}
                      />

                      {/* Timeline Layer Coverage Panel */}
                      <TimelineLayerCoveragePanel
                        appNow={appNow}
                        axisWidth={axisWidth}
                        backDate={backDate}
                        frontDate={frontDate}
                        isTimelineLayerCoveragePanelOpen={isTimelineLayerCoveragePanelOpen}
                        matchingTimelineCoverage={matchingTimelineCoverage}
                        parentOffset={parentOffset}
                        positionTransformX={position + transformX}
                        setMatchingTimelineCoverage={setMatchingTimelineCoverageFn}
                        timelineStartDateLimit={timelineStartDateLimit}
                        timeScale={timeScale}
                        toggleLayerCoveragePanel={toggleLayerCoveragePanel}
                      />

                      {isAnimationWidgetReady &&
                      (
                        <TimelineRangeSelector
                          axisWidth={axisWidth}
                          position={position}
                          transformX={transformX}
                          timeScale={timeScale}
                          timelineStartDateLimit={timelineStartDateLimit}
                          timelineEndDateLimit={timelineEndDateLimit}
                          frontDate={frontDate}
                          startLocation={animationStartLocation}
                          endLocation={animationEndLocation}
                          startLocationDate={animationStartLocationDate}
                          endLocationDate={animationEndLocationDate}
                          updateAnimationDateAndLocation={updateAnimationDateAndLocationFn}
                          max={rangeSelectorMax}
                        />
                      )}

                      {frontDate &&
                      (
                        <DraggerContainer
                          axisWidth={axisWidth}
                          position={position}
                          transformX={transformX}
                          timeScale={timeScale}
                          timelineStartDateLimit={timelineStartDateLimit}
                          timelineEndDateLimit={timelineEndDateLimit}
                          frontDate={frontDate}
                          backDate={backDate}
                          draggerSelected={draggerSelected}
                          draggerTimeState={draggerTimeState}
                          draggerTimeStateB={draggerTimeStateB}
                          draggerPosition={draggerPosition}
                          draggerPositionB={draggerPositionB}
                          draggerVisible={draggerVisible}
                          draggerVisibleB={draggerVisibleB}
                          setDraggerVisibility={setDraggerVisibilityFn}
                          toggleShowDraggerTime={toggleShowDraggerTimeFn}
                          onChangeSelectedDragger={toggleActiveCompareState}
                          updateDraggerDatePosition={updateDraggerDatePositionFn}
                          isCompareModeActive={isCompareModeActive}
                          isDraggerDragging={isDraggerDragging}
                          isAnimationPlaying={isAnimationPlaying}
                        />
                      )}

                      {!isTimelineDragging &&
                      (
                        <DateTooltip
                          activeLayers={activeLayers}
                          shouldIncludeHiddenLayers={shouldIncludeHiddenLayers}
                          axisWidth={axisWidth}
                          leftOffset={leftOffset}
                          hoverTime={hoverTime}
                          selectedDate={selectedDate}
                          selectedDraggerPosition={selectedDraggerPosition}
                          hasSubdailyLayers={hasSubdailyLayers}
                          showDraggerTime={showDraggerTime}
                          showHoverLine={showHoverLine}
                          isTimelineLayerCoveragePanelOpen={isTimelineLayerCoveragePanelOpen}
                        />
                      )}
                    </div>
                  )}

                  {/* Custom Interval Selector Widget */}
                  <CustomIntervalSelector
                    modalOpen={timelineCustomModalOpen}
                    hasSubdailyLayers={hasSubdailyLayers}
                  />

                  {/* Zoom Level Change Controls */}
                  <AxisTimeScaleChange
                    timeScale={timeScale}
                    changeTimeScale={changeTimeScaleLocal}
                    isDraggerDragging={isDraggerDragging}
                    hasSubdailyLayers={hasSubdailyLayers}
                    timelineHidden={isTimelineHidden}
                  />

                  {/* Open/Close Chevron */}
                  <button
                    type="button"
                    id="timeline-hide"
                    aria-label={isTimelineHidden ? 'Show timeline' : 'Hide timeline'}
                    onClick={toggleHideTimelineFn}
                  >
                    <UncontrolledTooltip id="center-align-tooltip" target="timeline-hide" placement="top">
                      {isTimelineHidden ? 'Show timeline' : 'Hide timeline'}
                    </UncontrolledTooltip>
                    <div
                      className={`wv-timeline-hide wv-timeline-hide-double-chevron-${chevronDirection}`}
                    />
                  </button>
                </section>
              )}
          </ErrorBoundary>
        )}
      {initialLoadComplete && isDistractionFreeModeActive &&
      (
        <ErrorBoundary>
          <section id="distraction-free-timeline" className="clearfix">
            <div
              id="distraction-free-timeline-header"
              className={`distraction-free-timeline-header ${hasSubdailyLayers ? 'subdaily' : ''} ${isMobile ? 'mobile' : ''}`}
              style={
                {
                  marginRight: isTimelineHidden ? '20px' : '0',
                  display: displayStaticMap ? 'none' : 'flex',
                }
              }
            >
              <KioskTimeStamp
                date={selectedDate}
                subdaily={hasSubdailyLayers}
                isKioskModeActive={isKioskModeActive}
              />
            </div>
          </section>
        </ErrorBoundary>
      )}
    </div>
  );
}

function mapStateToProps(state) {
  const {
    animation,
    compare,
    charting,
    config,
    date,
    events,
    embed,
    layers,
    map,
    modal,
    proj,
    screenSize,
    sidebar,
    tour,
    ui,
  } = state;
  const {
    appNow,
    customDelta,
    customInterval,
    customSelected,
    autoSelected,
    interval,
    selected,
    selectedB,
    selectedZoom,
    timelineCustomModalOpen,
  } = date;
  const { isCompareA, activeString } = compare;
  const isCompareModeActive = compare.active;
  const isChartingActive = charting.active;
  const { isDistractionFreeModeActive, isKioskModeActive, displayStaticMap } = ui;
  const { isEmbedModeActive } = embed;
  const isMobile = screenSize.isMobileDevice;
  const {
    breakpoints,
    screenWidth,
    isMobilePhone,
    isMobileTablet,
    orientation,
  } = screenSize;
  const { isAnimatingToEvent } = events;

  // handle active layer filtering and check for subdaily
  const activeLayers = getActiveLayers(state);
  const projection = proj.id;
  const activeLayersFiltered = filterProjLayersWithStartDate(activeLayers, projection);
  const hasSubdailyLayers = isCompareModeActive
    ? hasSubDailySelector(layers.active.layers) || hasSubDailySelector(layers.activeB.layers)
    : subdailyLayersActive(state);
  const subDailyLayersList = isCompareModeActive
    ? [...getSubDaily(layers.active.layers), ...getSubDaily(layers.activeB.layers)]
    : subdailyLayers(state);
  const newCustomDelta = getSmallestIntervalValue(state);
  const hasTempoProduct = layers[activeString].layers.filter((layer) => layer.visible && layer.id.includes('TEMPO')).length > 0;

  // if future layers are included, timeline axis end date will extend past appNow
  const hasFutureLayers = checkHasFutureLayers(state);
  let timelineEndDateLimit;
  if (hasFutureLayers) {
    timelineEndDateLimit = getTimelineEndDateLimit(state);
  } else {
    timelineEndDateLimit = getISODateFormatted(appNow);
  }

  const selectedDate = getSelectedDate(state);
  const { delta, unit } = getDeltaIntervalUnit(state);

  let updatedCustomInterval = customInterval;
  let updatedSelectedZoom = selectedZoom;

  // handle reset of timescale and intervals if not subdaily
  if (!hasSubdailyLayers) {
    if (selectedZoom > 3) {
      updatedSelectedZoom = 3;
    }
    if (customInterval > 3) {
      updatedCustomInterval = 3;
    }
  }

  const nowOverride = !!config.parameters.now;
  const dimensionsAndOffsetValues = getOffsetValues(
    screenWidth,
    hasSubdailyLayers,
  );

  const timelineStartDateLimit = config.startDate;
  const leftArrowDisabled = checkLeftArrowDisabled(
    selectedDate,
    delta,
    unit,
    timelineStartDateLimit,
  );
  const rightArrowDisabled = checkRightArrowDisabled(
    selectedDate,
    delta,
    unit,
    timelineEndDateLimit,
    autoSelected,
  );
  const nowButtonDisabled = checkNowButtonDisabled(
    selectedDate,
    timelineEndDateLimit,
    hasFutureLayers,
    nowOverride,
    appNow,
  );
  const describeDomainsUrl = config?.features?.describeDomains?.url || 'https://gibs.earthdata.nasa.gov';
  const cmrBaseUrl = config?.features?.cmr?.url;

  return {
    appNow,
    activeLayers: activeLayersFiltered,
    isTourActive: tour.active,
    isMobile,
    isMobilePhone,
    isMobileTablet,
    orientation,
    isLandscape: screenSize.orientation === 'landscape',
    isPortrait: screenSize.orientation === 'portrait',
    screenWidth,
    breakpoints,
    draggerSelected: isCompareA ? 'selected' : 'selectedB',
    hasSubdailyLayers,
    subDailyLayersList,
    customSelected,
    autoSelected,
    isCompareModeActive,
    isChartingActive,
    isAnimatingToEvent,
    hasFutureLayers,
    hasTempoProduct,
    dateA: getISODateFormatted(selected),
    dateB: getISODateFormatted(selectedB),
    activeString,
    timelineStartDateLimit: config.startDate, // same as startDate
    isAnimationWidgetOpen: animation.isActive,
    animStartLocationDate: animation.startDate,
    animEndLocationDate: animation.endDate,
    axisWidth: dimensionsAndOffsetValues.width,
    selectedDate,
    timeScale: TIME_SCALE_FROM_NUMBER[updatedSelectedZoom.toString()],
    timeScaleChangeUnit: unit,
    customInterval: customInterval || interval,
    interval,
    customIntervalValue: customDelta || 1,
    customIntervalZoomLevel: updatedCustomInterval || 3,
    nowOverride,
    deltaChangeAmt: delta,
    parentOffset: dimensionsAndOffsetValues.parentOffset,
    timelineEndDateLimit,
    leftArrowDisabled,
    rightArrowDisabled,
    nowButtonDisabled,
    hideTimeline:
      (modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT') || animation.gifActive,
    animationDisabled:
      !lodashGet(map, 'ui.selected.frameState_') ||
      sidebar.activeTab === 'download' ||
      compare.active ||
      charting.active,
    isDataDownload: sidebar.activeTab === 'download',
    isAnimationPlaying: animation.isPlaying,
    isAnimationCollapsed: animation.isCollapsed,
    isGifActive: animation.gifActive,
    timelineCustomModalOpen,
    isDistractionFreeModeActive,
    isEmbedModeActive,
    isKioskModeActive,
    displayStaticMap,
    newCustomDelta,
    proj: proj.selected,
    describeDomainsUrl,
    cmrBaseUrl,
  };
}

const mapDispatchToProps = (dispatch) => ({
  // updates the relative application now to allow up to date coverage
  updateAppNow: (date) => {
    dispatch(updateAppNowAction(date));
  },
  // sets date to NOW based on state.date.appNow
  triggerTodayButton: () => {
    dispatch(triggerTodayButtonAction());
  },
  // changes date of active dragger 'selected' or 'selectedB'
  selectDate: (val) => {
    dispatch(selectDateAction(val));
  },
  // changes/sets custom delta and timescale interval
  changeCustomInterval: (delta, timeScale) => {
    dispatch(changeCustomIntervalAction(delta, timeScale));
  },
  // changes/sets auto delta and timescale interval
  changeAutoInterval: (autoSelected) => {
    dispatch(changeAutoIntervalAction(autoSelected));
  },
  // changes timescale (scale of grids vs. what LEFT/RIGHT arrow do)
  changeTimeScale: (val) => {
    dispatch(changeTimeScaleAction(val));
  },
  // changes to non-custom timescale interval, sets customSelected to TRUE/FALSE
  selectInterval: (delta, timeScale, customSelected) => {
    dispatch(selectInterval(delta, timeScale, customSelected));
  },
  toggleCustomModal: (open, toggleBy) => {
    dispatch(toggleCustomModal(open, toggleBy));
  },
  openAnimation: () => {
    dispatch(openAnimationAction());
  },
  closeAnimation: () => {
    dispatch(closeAnimationAction());
  },
  toggleActiveCompareState: () => {
    dispatch(toggleActiveCompareStateAction());
  },
  // update animation startDate
  onUpdateStartDate: (date) => {
    dispatch(changeStartDate(date));
  },
  // update animation endDate
  onUpdateEndDate: (date) => {
    dispatch(changeEndDate(date));
  },
  // update animation startDate and endDate
  onUpdateStartAndEndDate: (startDate, endDate) => {
    dispatch(changeStartAndEndDate(startDate, endDate));
  },
  // unminimize animation widget in mobile
  onToggleAnimationCollapse: () => {
    dispatch(toggleAnimationCollapse());
  },
  onPauseAnimation: () => {
    dispatch(pauseAnimation());
  },
  addGranuleDateRanges: (layer, dateRanges) => {
    dispatch(addGranuleDateRangesAction(layer, dateRanges));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Timeline);

Timeline.propTypes = {
  addGranuleDateRanges: PropTypes.func,
  appNow: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  activeLayers: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  animationDisabled: PropTypes.bool,
  animEndLocationDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  animStartLocationDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  axisWidth: PropTypes.number,
  breakpoints: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  changeCustomInterval: PropTypes.func,
  changeAutoInterval: PropTypes.func,
  changeTimeScale: PropTypes.func,
  closeAnimation: PropTypes.func,
  customInterval: PropTypes.number,
  customSelected: PropTypes.bool,
  autoSelected: PropTypes.bool,
  dateA: PropTypes.string,
  dateB: PropTypes.string,
  activeString: PropTypes.string,
  deltaChangeAmt: PropTypes.number,
  displayStaticMap: PropTypes.bool,
  draggerSelected: PropTypes.string,
  hasFutureLayers: PropTypes.bool,
  hasTempoProduct: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool,
  subDailyLayersList: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  hideTimeline: PropTypes.bool,
  interval: PropTypes.number,
  isAnimationPlaying: PropTypes.bool,
  isAnimatingToEvent: PropTypes.bool,
  isAnimationWidgetOpen: PropTypes.bool,
  isCompareModeActive: PropTypes.bool,
  isChartingActive: PropTypes.bool,
  isDataDownload: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  isGifActive: PropTypes.bool,
  isKioskModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  isMobilePhone: PropTypes.bool,
  isMobileTablet: PropTypes.bool,
  isLandscape: PropTypes.bool,
  isPortrait: PropTypes.bool,
  isTourActive: PropTypes.bool,
  leftArrowDisabled: PropTypes.bool,
  newCustomDelta: PropTypes.number,
  nowButtonDisabled: PropTypes.bool,
  nowOverride: PropTypes.bool,
  onPauseAnimation: PropTypes.func,
  onToggleAnimationCollapse: PropTypes.func,
  onUpdateEndDate: PropTypes.func,
  onUpdateStartAndEndDate: PropTypes.func,
  onUpdateStartDate: PropTypes.func,
  openAnimation: PropTypes.func,
  parentOffset: PropTypes.number,
  rightArrowDisabled: PropTypes.bool,
  screenWidth: PropTypes.number,
  selectDate: PropTypes.func,
  selectedDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  timelineCustomModalOpen: PropTypes.bool,
  timelineEndDateLimit: PropTypes.string,
  timelineStartDateLimit: PropTypes.string,
  timeScale: PropTypes.string,
  timeScaleChangeUnit: PropTypes.string,
  toggleActiveCompareState: PropTypes.func,
  triggerTodayButton: PropTypes.func,
  updateAppNow: PropTypes.func,
  proj: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  describeDomainsUrl: PropTypes.string,
  cmrBaseUrl: PropTypes.string,
};
