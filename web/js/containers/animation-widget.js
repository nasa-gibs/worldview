import React from 'react';
import { connect } from 'react-redux';
import {
  find as lodashFind,
  get as lodashGet,
  cloneDeep as lodashCloneDeep,
} from 'lodash';
import googleTagManager from 'googleTagManager';
import PropTypes from 'prop-types';
import Slider, { Handle } from 'rc-slider';
import { Tooltip } from 'reactstrap';
import Draggable from 'react-draggable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import util from '../util/util';
import ErrorBoundary from './error-boundary';
import TimeSelector from '../components/date-selector/date-selector';
import LoopButton from '../components/animation-widget/loop-button';
import PlayButton from '../components/animation-widget/play-button';
import TimeScaleIntervalChange from '../components/timeline/timeline-controls/interval-timescale-change';
import CustomIntervalSelectorWidget from '../components/timeline/custom-interval-selector/interval-selector-widget';
import PlayQueue from '../components/animation-widget/play-queue';
import Notify from '../components/image-download/notify';
import promiseImageryForTime from '../modules/map/selectors';
import GifContainer from './gif';
import {
  selectDate,
  selectInterval,
  changeCustomInterval,
  toggleCustomModal,
} from '../modules/date/actions';
import {
  timeScaleFromNumberKey,
  timeScaleToNumberKey,
  customModalType,
} from '../modules/date/constants';
import {
  getQueueLength,
  getMaxQueueLength,
  snapToIntervalDelta,
} from '../modules/animation/util';
import {
  hasSubDaily as hasSubDailySelector,
  getLayers,
  dateRange as getDateRange,
} from '../modules/layers/selectors';
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
import { clearGraticule, refreshGraticule } from '../modules/layers/actions';
import { hasCustomPaletteInActiveProjection } from '../modules/palettes/util';


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
      hoverGif: false,
      widgetPosition: {
        x: (props.screenWidth / 2) - halfWidgetWidth,
        y: -10,
      },
      collapsed: false,
      collapsedWidgetPosition: { x: 0, y: 0 },
      userHasMovedWidget: false,
    };
    this.onDateChange = this.onDateChange.bind(this);
    this.onIntervalSelect = this.onIntervalSelect.bind(this);
    this.onLoop = this.onLoop.bind(this);
    this.openGif = this.openGif.bind(this);
    this.toggleHoverGif = this.toggleHoverGif.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.toggleCollapse = this.toggleCollapse.bind(this);
    this.onCollapsedDrag = this.onCollapsedDrag.bind(this);
    this.onExpandedDrag = this.onExpandedDrag.bind(this);
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

  getPromise(bool, type, action, title) {
    const { notify } = this.props;
    if (bool) {
      return notify(type, action);
    }
    return Promise.resolve(type);
  }

  openGif() {
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
    } = this.props;
    const {
      startDate,
      endDate,
    } = this.zeroDates();

    if (numberOfFrames >= maxFrames) {
      return;
    }
    const paletteStore = lodashCloneDeep(activePalettes);

    this.getPromise(hasCustomPalettes, 'palette', clearCustoms, 'Notice').then(
      () => {
        this.getPromise(
          isRotated,
          'rotate',
          clearRotate,
          'Reset rotation',
        ).then(() => {
          this.getPromise(
            hasGraticule,
            'graticule',
            clearGraticule,
            'Remove Graticule?',
          ).then(() => {
            onUpdateStartAndEndDate(startDate, endDate);
          }).then(() => {
            googleTagManager.pushEvent({
              event: 'GIF_create_animated_button',
            });
            this.onCloseGif = () => {
              refreshStateAfterGif(hasCustomPalettes ? paletteStore : undefined, rotation, hasGraticule);
              toggleGif();
            };
            toggleGif();
          });
        });
      },
    );
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

  onDateChange(date, id) {
    const { onUpdateStartDate, onUpdateEndDate } = this.props;
    if (id === 'start') {
      onUpdateStartDate(date);
    } else {
      onUpdateEndDate(date);
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
      timeScale = Number(timeScaleToNumberKey[timeScale]);
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

  /**
  * @desc handle SET of custom time scale panel
  * @param {Number} delta
  * @param {Number} timeScale
  * @returns {void}
  */
  changeCustomInterval = (delta, timeScale) => {
    const { changeCustomInterval } = this.props;
    changeCustomInterval(delta, timeScale);
  };

  toggleHoverGif() {
    const { hoverGif } = this.state;
    this.setState({ hoverGif: !hoverGif });
  }

  renderToolTip() {
    const { numberOfFrames } = this.props;
    const { hoverGif } = this.state;
    const elemExists = document.querySelector('#create-gif-button');
    const showTooltip = elemExists && hoverGif && numberOfFrames >= maxFrames;
    return (
      <Tooltip
        placement="right"
        isOpen={showTooltip}
        target="create-gif-button"
      >
        Too many frames were selected.
        {' '}
        <br />
        Please request less than 40 frames if you would like to generate a GIF.
      </Tooltip>
    );
  }

  renderCollapsedWidget() {
    const {
      onClose,
      isPlaying,
      onPushPause,
      hasSubdailyLayers,
    } = this.props;
    const { collapsedWidgetPosition } = this.state;
    return (
      <Draggable
        bounds="body"
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
      customSelected,
      customDelta,
      customInterval,
      numberOfFrames,
      animationCustomModalOpen,
      hasSubdailyLayers,
    } = this.props;
    const { speed, widgetPosition } = this.state;
    const gifDisabled = numberOfFrames >= maxFrames;
    return (
      <Draggable
        bounds="body"
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
                setTimeScaleIntervalChangeUnit={this.onIntervalSelect}
                customIntervalZoomLevel={timeScaleFromNumberKey[customInterval]}
                customSelected={customSelected}
                customDelta={customDelta}
                timeScaleChangeUnit={interval}
                hasSubdailyLayers={hasSubdailyLayers}
              />
              {' Increments'}
            </div>

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
              />
              <span className="wv-slider-label">{sliderLabel}</span>
            </div>

            {/* Create Gif */}
            <a
              id="create-gif-button"
              title={!gifDisabled ? 'Create Animated GIF' : ''}
              className={gifDisabled ? 'wv-icon-case disabled' : 'wv-icon-case'}
              onClick={this.openGif}
              onMouseEnter={this.toggleHoverGif}
              onMouseLeave={this.toggleHoverGif}
            >
              <FontAwesomeIcon icon="file-video" id="wv-animation-widget-file-video-icon" className="wv-animation-widget-icon" />
            </a>
            {this.renderToolTip()}

            {/* From/To Date/Time Selection */}
            <div className="wv-anim-dates-case">
              <TimeSelector
                id="start"
                idSuffix="animation-widget-start"
                date={startDate}
                onDateChange={this.onDateChange}
                maxDate={endDate}
                minDate={minDate}
                subDailyMode={subDailyMode}
              />
              <div className="thru-label">To</div>
              <TimeSelector
                id="end"
                idSuffix="animation-widget-end"
                date={endDate}
                onDateChange={this.onDateChange}
                maxDate={maxDate}
                minDate={startDate}
                subDailyMode={subDailyMode}
              />
            </div>
            <FontAwesomeIcon icon="chevron-down" className="wv-minimize" onClick={this.toggleCollapse} />
            <FontAwesomeIcon icon="times" className="wv-close" onClick={onClose} />

            {/* Custom time interval selection */}
            <CustomIntervalSelectorWidget
              customDelta={customDelta}
              customIntervalZoomLevel={customInterval}
              customIntervalModalOpen={animationCustomModalOpen}
              changeCustomInterval={this.changeCustomInterval}
              hasSubdailyLayers={hasSubdailyLayers}
            />
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
      layers,
      hasCustomPalettes,
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
            layers={layers}
            interval={interval}
            delta={delta}
            speed={speed}
            selectDate={selectDate}
            togglePlaying={onPushPause}
            promiseImageryForTime={promiseImageryForTime}
            onClose={onPushPause}
          />
        )}

        {collapsed ? this.renderCollapsedWidget() : this.renderExpandedWidget()}

      </ErrorBoundary>
    );
  }
}

function mapStateToProps(state) {
  const {
    layers,
    compare,
    animation,
    date,
    sidebar,
    modal,
    palettes,
    config,
    map,
    proj,
    browser,
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
  const activeStr = compare.activeString;
  const activeDateStr = compare.isCompareA ? 'selected' : 'selectedB';
  const hasSubdailyLayers = hasSubDailySelector(layers[activeStr]);
  const activeLayersForProj = getLayers(
    layers[activeStr],
    { proj: proj.id },
    state,
  );
  const hasFutureLayers = activeLayersForProj.filter((layer) => layer.futureTime).length > 0;
  const layerDateRange = getDateRange({}, activeLayersForProj);
  const activePalettes = palettes[activeStr];
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

  const animationIsActive = isActive
    && browser.greaterThan.small
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
    timeScaleFromNumberKey[useInterval],
    customSelected && customDelta ? customDelta : delta,
    maxFrames,
  );
  const { rotation } = map;
  return {
    appNow,
    screenWidth: browser.screenWidth,
    animationCustomModalOpen,
    customSelected,
    startDate,
    endDate,
    activePalettes,
    currentDate: date[activeDateStr],
    minDate,
    maxDate,
    isActive: animationIsActive,
    hasFutureLayers,
    hasSubdailyLayers,
    subDailyMode,
    delta: customSelected && customDelta ? customDelta : delta,
    interval: timeScaleFromNumberKey[useInterval] || 'day',
    customDelta: customDelta || 1,
    customInterval: customInterval || 3,
    numberOfFrames,
    sliderLabel: 'Frames Per Second',
    layers: getLayers(layers[activeStr], {}, state),
    speed,
    isPlaying,
    looping: loop,
    hasCustomPalettes,
    map,
    promiseImageryForTime: (date, layers) => promiseImageryForTime(date, layers, state),
    isGifActive: gifActive,
    isCompareActive: compare.active,
    isRotated: Boolean(rotation !== 0),
    rotation,
    hasGraticule: Boolean(
      lodashGet(
        lodashFind(layers[activeStr], { id: 'Graticule' }) || {},
        'visible',
      ),
    ),
  };
}
const mapDispatchToProps = (dispatch) => ({
  selectDate: (val) => {
    dispatch(selectDate(val));
  },
  notify: (type, action, title) => new Promise((resolve, reject, cancel) => {
    const bodyComponentProps = {
      bodyText: notificationWarnings[type],
      cancel: () => {
        dispatch(onToggle());
      },
      accept: () => {
        dispatch(action());
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
  refreshStateAfterGif: (activePalettes, rotation, isGraticule) => {
    if (activePalettes) {
      dispatch(refreshPalettes(activePalettes));
    }
    if (rotation) {
      dispatch(refreshRotation(rotation));
    }
    if (isGraticule) {
      dispatch(refreshGraticule(isGraticule));
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
  changeCustomInterval: (delta, timeScale) => {
    dispatch(changeCustomInterval(delta, timeScale));
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
  changeCustomInterval: PropTypes.func,
  currentDate: PropTypes.object,
  customDelta: PropTypes.number,
  customInterval: PropTypes.number,
  customSelected: PropTypes.bool,
  delta: PropTypes.number,
  endDate: PropTypes.object,
  hasCustomPalettes: PropTypes.bool,
  hasFutureLayers: PropTypes.bool,
  hasGraticule: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool,
  interval: PropTypes.string,
  isActive: PropTypes.bool,
  isGifActive: PropTypes.bool,
  isPlaying: PropTypes.bool,
  isRotated: PropTypes.bool,
  layers: PropTypes.array,
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
