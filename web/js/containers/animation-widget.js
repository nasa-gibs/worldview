import React from 'react';
import { connect } from 'react-redux';
import {
  find as lodashFind,
  filter as lodashFilter,
  get as lodashGet,
  cloneDeep as lodashCloneDeep,
} from 'lodash';
import googleTagManager from 'googleTagManager';
import PropTypes from 'prop-types';
import Slider, { Handle } from 'rc-slider';
import { UncontrolledTooltip } from 'reactstrap';
import Draggable from 'react-draggable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import util from '../util/util';
import ErrorBoundary from './error-boundary';
import DateRangeSelector from '../components/date-selector/date-range-selector';
import LoopButton from '../components/animation-widget/loop-button';
import PlayButton from '../components/animation-widget/play-button';
import TimeScaleIntervalChange from '../components/timeline/timeline-controls/timescale-interval-change';
import CustomIntervalSelector from '../components/timeline/custom-interval-selector/custom-interval-selector';
import PlayQueue from '../components/animation-widget/play-queue';
import Notify from '../components/image-download/notify';
import { promiseImageryForTime } from '../modules/map/util';
import GifContainer from './gif';
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
  getQueueLength,
  getMaxQueueLength,
  snapToIntervalDelta,
} from '../modules/animation/util';
import {
  subdailyLayersActive,
  getActiveLayers,
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
  toggleComponentGifActive,
} from '../modules/animation/actions';
import { notificationWarnings } from '../modules/image-download/constants';
import { onToggle, openCustomContent } from '../modules/modal/actions';
import { clearCustoms, refreshPalettes } from '../modules/palettes/actions';
import { clearRotate, refreshRotation } from '../modules/map/actions';
import {
  clearGraticule, refreshGraticule, hideLayers, showLayers,
} from '../modules/layers/actions';
import { hasCustomPaletteInActiveProjection } from '../modules/palettes/util';
import { getNonDownloadableLayers, getNonDownloadableLayerWarning, hasNonDownloadableVisibleLayer } from '../modules/image-download/util';


const RangeHandle = (props) => {
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
};

const widgetWidth = 334;
const subdailyWidgetWidth = 460;
const maxFrames = 40;

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
    const halfWidgetWidth = (props.subDailyMode ? subdailyWidgetWidth : widgetWidth) / 2;
    this.state = {
      speed: props.speed,
      widgetPosition: {
        x: (props.screenWidth / 2) - halfWidgetWidth,
        y: -25,
      },
      collapsed: false,
      collapsedWidgetPosition: { x: 0, y: 0 },
      userHasMovedWidget: false,
    };
    this.onDateChange = this.onDateChange.bind(this);
    this.onIntervalSelect = this.onIntervalSelect.bind(this);
    this.onLoop = this.onLoop.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.toggleCollapse = this.toggleCollapse.bind(this);
    this.onCollapsedDrag = this.onCollapsedDrag.bind(this);
    this.onExpandedDrag = this.onExpandedDrag.bind(this);
  }

  componentDidMount() {
    const { isEmbedModeActive } = this.props;
    if (isEmbedModeActive) {
      this.setState({
        collapsed: true,
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
    this.setState((prevState) => ({
      collapsed: !prevState.collapsed,
    }));
  }

  /**
   * Prevent drag when interacting with child elements (e.g. buttons)
   * Only allow drag when targeting "background" elements
   * @param {*} e
   * @param {*} data
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

  getPromise(bool, type, action) {
    const { visibleLayersForProj } = this.props;
    const { notify } = this.props;
    if (bool) {
      return notify(type, action, visibleLayersForProj);
    }
    return Promise.resolve(type);
  }

  /**
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

  /**
   * Changes selected default or custom interval in header and
   * changes left/right date arrow increments
   *
   * @method onIntervalSelect
   *
   * @param {string} timeScale - clicked header string (ex: 'day', 'year', '12 day')
   *  component
   *
   * @return {void}
   */
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

  /**
   * update global store startDate, endDate, and isPlaying
   *
   * @method onPushPlay
   *
   * @return {void}
   */
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
  zeroDates = () => {
    const { subDailyMode } = this.props;
    let {
      startDate,
      endDate,
    } = this.props;
    if (subDailyMode) {
      // for subdaily, zero start and end dates to UTC XX:YY:00:00
      startDate.setUTCSeconds(0);
      startDate.setUTCMilliseconds(0);
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
  }

  /**
  * @desc show/hide custom interval modal
  * @param {Boolean} isOpen
  * @returns {void}
  */
  toggleCustomIntervalModal = (isOpen) => {
    const { toggleCustomModal } = this.props;
    toggleCustomModal(isOpen, customModalType.ANIMATION);
  };

  renderCollapsedWidget() {
    const {
      onClose,
      isPlaying,
      onPushPause,
      hasSubdailyLayers,
    } = this.props;
    const { collapsedWidgetPosition } = this.state;
    const cancelSelector = '.no-drag, svg';
    return (
      <Draggable
        bounds="body"
        cancel={cancelSelector}
        onStart={this.handleDragStart}
        position={collapsedWidgetPosition}
        onDrag={this.onCollapsedDrag}
      >
        <div
          className={`wv-animation-widget-wrapper minimized${hasSubdailyLayers ? ' subdaily' : ''}`}
        >
          <div
            id="wv-animation-widget"
            className="wv-animation-widget minimized"
          >
            <PlayButton
              playing={isPlaying}
              play={this.onPushPlay}
              pause={onPushPause}
            />
            <FontAwesomeIcon icon="chevron-up" className="wv-expand" onClick={this.toggleCollapse} />
            <FontAwesomeIcon icon="times" className="wv-close" onClick={onClose} />
          </div>
        </div>
      </Draggable>
    );
  }

  renderCreateGifButton() {
    const {
      toggleGif,
      onUpdateStartAndEndDate,
      hasCustomPalettes,
      isRotated,
      hasGraticule,
      rotation,
      activePalettes,
      numberOfFrames,
      refreshStateAfterGif,
      hasNonDownloadableLayer,
      visibleLayersForProj,
      proj,
    } = this.props;
    const gifDisabled = numberOfFrames >= maxFrames;
    const elemExists = document.querySelector('#create-gif-button');
    const showWarning = elemExists && numberOfFrames >= maxFrames;
    const warningMessage = (
      <span>
        Too many frames were selected.
        <br />
        Please request less than 40 frames if you would like to generate a GIF.
      </span>
    );
    const labelText = 'Create an animated GIF';

    const openGif = async () => {
      const { startDate, endDate } = this.zeroDates();
      if (numberOfFrames >= maxFrames) {
        return;
      }
      const nonDownloadableLayers = hasNonDownloadableLayer ? getNonDownloadableLayers(visibleLayersForProj) : null;
      const paletteStore = lodashCloneDeep(activePalettes);

      await this.getPromise(hasCustomPalettes, 'palette', clearCustoms, 'Notice');
      await this.getPromise(isRotated, 'rotate', clearRotate, 'Reset rotation');
      await this.getPromise(hasGraticule && proj.id === 'geographic', 'graticule', clearGraticule, 'Remove Graticule?');
      await this.getPromise(hasNonDownloadableLayer, 'layers', hideLayers, 'Remove Layers?');
      await onUpdateStartAndEndDate(startDate, endDate);
      googleTagManager.pushEvent({
        event: 'GIF_create_animated_button',
      });
      this.onCloseGif = () => {
        refreshStateAfterGif(hasCustomPalettes ? paletteStore : undefined, rotation, hasGraticule, nonDownloadableLayers);
        toggleGif();
      };
      toggleGif();
    };

    return (
      <a
        id="create-gif-button"
        aria-label={labelText}
        className={gifDisabled ? 'wv-icon-case no-drag disabled' : 'wv-icon-case no-drag'}
        onClick={openGif}
      >
        <FontAwesomeIcon
          id="wv-animation-widget-file-video-icon"
          className="wv-animation-widget-icon"
          icon="file-video"
        />
        <UncontrolledTooltip
          placement="right"
          target="create-gif-button"
        >
          {showWarning ? warningMessage : labelText}
        </UncontrolledTooltip>
      </a>

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
            {this.renderCreateGifButton()}

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
      endDate,
      onPushPause,
      isActive,
      hasCustomPalettes,
      isDistractionFreeModeActive,
      promiseImageryForTime,
      selectDate,
      currentDate,
      isGifActive,
      delta,
      interval,
    } = this.props;
    const { speed, collapsed } = this.state;
    const maxLength = getMaxQueueLength(speed);
    const queueLength = getQueueLength(
      startDate,
      endDate,
      speed,
      interval,
      delta,
    );

    const snappedCurrentDate = snapToIntervalDelta(
      currentDate,
      startDate,
      endDate,
      interval,
      delta,
    );

    if (!isActive) {
      return null;
    }
    if (isGifActive) {
      return <GifContainer onClose={this.onCloseGif} />;
    }
    return (
      <ErrorBoundary>
        {isPlaying && (
          <PlayQueue
            isLoopActive={looping}
            isPlaying={isPlaying}
            canPreloadAll={queueLength <= maxLength}
            currentDate={snappedCurrentDate}
            startDate={startDate}
            endDate={endDate}
            hasCustomPalettes={hasCustomPalettes}
            maxQueueLength={maxLength}
            queueLength={queueLength}
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
            {collapsed ? this.renderCollapsedWidget() : this.renderExpandedWidget()}
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
    palettes,
    config,
    map,
    browser,
    ui,
    proj,
  } = state;
  const {
    startDate, endDate, speed, loop, isPlaying, isActive, gifActive,
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
  const activeLayers = getActiveLayers(state);
  const hasSubdailyLayers = subdailyLayersActive(state);
  const activeLayersForProj = getAllActiveLayers(state);
  const hasFutureLayers = activeLayersForProj.filter((layer) => layer.futureTime).length > 0;
  const layerDateRange = getDateRange({}, activeLayersForProj);
  const activePalettes = palettes[compare.activeString];
  const hasCustomPalettes = hasCustomPaletteInActiveProjection(
    activeLayersForProj,
    activePalettes,
  );
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
    && (browser.greaterThan.small || isEmbedModeActive)
    && lodashGet(map, 'ui.selected.frameState_')
    && sidebar.activeTab !== 'download' // No Animation when data download is active
    && !compare.active
    && !(modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT'); // No Animation when Image download is open

  if (!hasSubdailyLayers) {
    interval = interval > 3 ? 3 : interval;
    customInterval = customInterval > 3 ? 3 : customInterval;
  }
  const useInterval = customSelected ? customInterval || 3 : interval;
  const subDailyInterval = useInterval > 3;
  const subDailyMode = subDailyInterval && hasSubdailyLayers;
  const numberOfFrames = util.getNumberOfDays(
    startDate,
    endDate,
    TIME_SCALE_FROM_NUMBER[useInterval],
    customSelected && customDelta ? customDelta : delta,
    maxFrames,
  );
  const { rotation } = map;
  const visibleLayersForProj = lodashFilter(activeLayersForProj, 'visible');
  return {
    appNow,
    screenWidth: browser.screenWidth,
    animationCustomModalOpen,
    customSelected,
    startDate,
    endDate,
    activePalettes,
    currentDate: getSelectedDate(state),
    minDate,
    maxDate,
    isActive: animationIsActive,
    isDistractionFreeModeActive,
    hasFutureLayers,
    hasSubdailyLayers,
    subDailyMode,
    delta: customSelected && customDelta ? customDelta : delta,
    interval: TIME_SCALE_FROM_NUMBER[useInterval] || 'day',
    customDelta: customDelta || 1,
    customInterval: customInterval || 3,
    numberOfFrames,
    sliderLabel: 'Frames Per Second',
    speed,
    isPlaying,
    looping: loop,
    hasCustomPalettes,
    map,
    proj,
    hasNonDownloadableLayer: hasNonDownloadableVisibleLayer(visibleLayersForProj),
    visibleLayersForProj,
    promiseImageryForTime: (date) => promiseImageryForTime(state, date),
    isGifActive: gifActive,
    isCompareActive: compare.active,
    isEmbedModeActive,
    isRotated: Boolean(rotation !== 0),
    rotation,
    hasGraticule: Boolean(
      lodashGet(
        lodashFind(activeLayers, { id: 'Graticule' }) || {},
        'visible',
      ),
    ),
  };
}
const mapDispatchToProps = (dispatch) => ({
  selectDate: (val) => {
    dispatch(selectDate(val));
  },
  notify: (type, action, visibleLayersForProj) => new Promise((resolve, reject, cancel) => {
    const nonDownloadableLayers = type !== 'layers' ? null : getNonDownloadableLayers(visibleLayersForProj);
    const bodyComponentProps = {
      bodyText: type !== 'layers' ? notificationWarnings[type] : getNonDownloadableLayerWarning(nonDownloadableLayers),
      cancel: () => {
        dispatch(onToggle());
      },
      accept: () => {
        dispatch(action(nonDownloadableLayers));
        dispatch(onToggle());
        resolve();
      },
    };
    dispatch(
      openCustomContent(`image_download_notify_${type}`, {
        headerText: 'Notify',
        bodyComponent: Notify,
        size: 'sm',
        modalClassName: 'notify',
        bodyComponentProps,
      }),
    );
  }),
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
    dispatch(toggleComponentGifActive());
  },
  refreshStateAfterGif: (activePalettes, rotation, isGraticule, nonDownloadableLayers) => {
    if (activePalettes) {
      dispatch(refreshPalettes(activePalettes));
    }
    if (rotation) {
      dispatch(refreshRotation(rotation));
    }
    if (isGraticule) {
      dispatch(refreshGraticule(isGraticule));
    }
    if (nonDownloadableLayers) {
      dispatch(showLayers(nonDownloadableLayers));
    }
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
  activePalettes: PropTypes.object,
  animationCustomModalOpen: PropTypes.bool,
  visibleLayersForProj: PropTypes.array,
  currentDate: PropTypes.object,
  customDelta: PropTypes.number,
  customInterval: PropTypes.number,
  delta: PropTypes.number,
  endDate: PropTypes.object,
  hasCustomPalettes: PropTypes.bool,
  hasFutureLayers: PropTypes.bool,
  hasGraticule: PropTypes.bool,
  hasNonDownloadableLayer: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool,
  interval: PropTypes.string,
  isActive: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  isGifActive: PropTypes.bool,
  isPlaying: PropTypes.bool,
  isRotated: PropTypes.bool,
  looping: PropTypes.bool,
  maxDate: PropTypes.object,
  minDate: PropTypes.object,
  notify: PropTypes.func,
  numberOfFrames: PropTypes.number,
  onClose: PropTypes.func,
  onIntervalSelect: PropTypes.func,
  onPushLoop: PropTypes.func,
  onPushPause: PropTypes.func,
  onPushPlay: PropTypes.func,
  onSlide: PropTypes.func,
  onUpdateEndDate: PropTypes.func,
  onUpdateStartAndEndDate: PropTypes.func,
  onUpdateStartDate: PropTypes.func,
  promiseImageryForTime: PropTypes.func,
  proj: PropTypes.object,
  refreshStateAfterGif: PropTypes.func,
  rotation: PropTypes.number,
  screenWidth: PropTypes.number,
  selectDate: PropTypes.func,
  sliderLabel: PropTypes.string,
  speed: PropTypes.number,
  startDate: PropTypes.object,
  subDailyMode: PropTypes.bool,
  toggleCustomModal: PropTypes.func,
  toggleGif: PropTypes.func,
};
