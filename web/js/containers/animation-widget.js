import React from 'react';
import { connect } from 'react-redux';
import {
  without as lodashWithout,
  find as lodashFind,
  get as lodashGet
} from 'lodash';
import util from '../util/util';
import ErrorBoundary from './error-boundary';
import PropTypes from 'prop-types';
import Slider, { Handle } from 'rc-slider';
import TimeSelector from '../components/date-selector/date-selector';
import LoopButton from '../components/animation-widget/loop-button';
import PlayButton from '../components/animation-widget/play-button';
import AnimWidgetHeader from '../components/animation-widget/header';
import googleTagManager from 'googleTagManager';
import PlayQueue from '../components/animation-widget/play-queue';
import { Notify } from '../components/image-download/notify';
import { promiseImageryForTime } from '../modules/map/selectors';
import { selectDate, selectInterval } from '../modules/date/actions';
import GifContainer from './gif';
import {
  timeScaleFromNumberKey,
  timeScaleToNumberKey
} from '../modules/date/constants';
import { getQueueLength, getMaxQueueLength } from '../modules/animation/util';
import {
  hasSubDaily as hasSubDailySelector,
  getLayers
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
  toggleComponentGifActive
} from '../modules/animation/actions';
import { notificationWarnings } from '../modules/image-download/constants';
import { onToggle, openCustomContent } from '../modules/modal/actions';
import { clearCustoms } from '../modules/palettes/actions';
import { clearRotate } from '../modules/map/actions';
import { clearGraticule } from '../modules/layers/actions';
import { hasCustomPaletteInActiveProjection } from '../modules/palettes/util';

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
    this.onZoomSelect = this.onZoomSelect.bind(this);
    this.onLoop = this.onLoop.bind(this);
    this.openGif = this.openGif.bind(this);
  }
  static getDerivedStateFromProps(props, state) {
    if (props.speed !== state.speed && !state.isSliding) {
      return { speed: props.speed };
    } else return null;
  }
  getPromise(bool, type, action, title) {
    const { notify } = this.props;
    if (bool) {
      return notify(type, action);
    } else {
      return Promise.resolve(type);
    }
  }
  openGif() {
    const {
      toggleGif,
      hasCustomPalettes,
      isRotated,
      hasGraticule
    } = this.props;
    this.getPromise(hasCustomPalettes, 'palette', clearCustoms, 'Notice').then(
      () => {
        this.getPromise(
          isRotated,
          'rotate',
          clearRotate,
          'Reset rotation'
        ).then(() => {
          this.getPromise(
            hasGraticule,
            'graticule',
            clearGraticule,
            'Remove Graticule?'
          ).then(() => {
            toggleGif();
          });
        });
      }
    );
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
  /*
   * Changes selected default or custom interval in header and
   * changes left/right date arrow increments
   *
   * @method onZoomSelect
   *
   * @param {string} zoom - clicked header string (ex: 'day', 'year', '12 day')
   *  component
   *
   * @return {void}
   */
  onZoomSelect(zoom) {
    let { customDelta, customInterval, onZoomSelect } = this.props;
    let zoomToNumber = timeScaleToNumberKey[zoom]; // undefined if custom
    if (zoomToNumber) {
      onZoomSelect(1, zoomToNumber, false);
    } else {
      onZoomSelect(customDelta, customInterval, true);
    }
  }

  /*
   * Zeroes start and end animation dates to UTC 00:00:00 for predictable animation range
   * update global store startDate, endDate, and isPlaying
   *
   * @method onPushPlay
   *
   * @return {void}
   */
  onPushPlay = () => {
    const { onUpdateStartAndEndDate, onPushPlay } = this.props;
    // zero start and end dates to UTC 00:00:00
    let startDate = util.clearTimeUTC(this.props.startDate);
    let endDate = util.clearTimeUTC(this.props.endDate);
    onUpdateStartAndEndDate(startDate, endDate);
    onPushPlay();
  }

  render() {
    const {
      hasSubdailyLayers,
      increment,
      incrementArray,
      looping,
      isPlaying,
      maxDate,
      minDate,
      sliderLabel,
      startDate,
      endDate,
      onPushPause,
      isActive,
      interval,
      delta,
      layers,
      hasCustomPalettes,
      promiseImageryForTime,
      map,
      selectDate,
      currentDate,
      toggleGif,
      isGifActive,
      isCompareActive
    } = this.props;
    if (!isActive) {
      return '';
    } else if (isGifActive) {
      return <GifContainer onClose={toggleGif} />;
    } else {
      const maxLength = getMaxQueueLength(this.state.speed);
      const queueLength = getQueueLength(
        startDate,
        endDate,
        this.state.speed,
        interval,
        delta
      );
      return (
        <ErrorBoundary>
          {isPlaying ? (
            <PlayQueue
              endDate={endDate}
              loop={looping}
              isPlaying={isPlaying}
              currentDate={currentDate}
              canPreloadAll={queueLength <= maxLength}
              startDate={startDate}
              hasCustomPalettes={hasCustomPalettes}
              map={map}
              maxQueueLength={maxLength}
              queueLength={queueLength}
              layers={layers}
              interval={interval}
              delta={delta}
              speed={this.state.speed}
              selectDate={selectDate}
              togglePlaying={onPushPause}
              promiseImageryForTime={promiseImageryForTime}
              onClose={onPushPause}
            />
          ) : null}
          <div
            id="wv-animation-widget"
            className={
              'wv-animation-widget' + (hasSubdailyLayers ? ' subdaily' : '')
            }
          >
            <AnimWidgetHeader
              text={increment}
              toolTipTextArray={incrementArray}
              onClick={this.onZoomSelect}
            />

            <PlayButton
              playing={isPlaying}
              play={this.onPushPlay}
              pause={onPushPause}
            />
            <LoopButton looping={looping} onLoop={this.onLoop} />
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
              title={
                !isCompareActive
                  ? 'Create Animated GIF'
                  : 'Exit comparison mode to create GIF'
              }
              className={
                isCompareActive ? 'wv-icon-case disabled' : 'wv-icon-case'
              }
              disabled={isCompareActive}
              onClick={this.openGif}
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
    browser
  } = state;
  let {
    startDate,
    endDate,
    speed,
    loop,
    isPlaying,
    isActive,
    gifActive
  } = animation;
  const activeStr = compare.activeString;
  const activeDateStr = compare.isCompareA ? 'selected' : 'selectedB';
  const hasSubdailyLayers = hasSubDailySelector(layers[activeStr]);
  const zoomObj = getZoomObject(date, hasSubdailyLayers);
  let {
    customSelected,
    interval,
    delta,
    customInterval,
    customDelta,
    appNow
  } = date;
  const activeLayersForProj = getLayers(
    layers[activeStr],
    { proj: proj.id },
    state
  );
  const hasCustomPalettes = hasCustomPaletteInActiveProjection(
    activeLayersForProj,
    palettes[activeStr]
  );
  let minDate = new Date(config.startDate);
  let maxDate = appNow;

  return {
    startDate,
    endDate,
    currentDate: date[activeDateStr],
    minDate: minDate,
    maxDate: maxDate,
    isActive:
      isActive &&
      browser.greaterThan.small &&
      lodashGet(map, 'ui.selected.frameState_') &&
      sidebar.activeTab !== 'download' && // No Animation when data download is active
      !compare.active &&
      !(modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT'), // No Animation when Image download is open
    hasSubdailyLayers,
    incrementArray: zoomObj.array,
    increment: zoomObj.increment,
    customDelta: zoomObj.customDelta,
    customInterval: zoomObj.customInterval,
    sliderLabel: 'Frames Per Second',
    layers: getLayers(layers[activeStr], {}, state),
    speed,
    isPlaying,
    looping: loop,
    delta: customSelected && customDelta ? customDelta : delta || 1,
    interval: customSelected
      ? timeScaleFromNumberKey[customInterval] || 'day'
      : timeScaleFromNumberKey[interval] || 'day',
    hasCustomPalettes,
    map,
    promiseImageryForTime: (date, layers) => {
      return promiseImageryForTime(date, layers, state);
    },
    isGifActive: gifActive,
    isCompareActive: compare.active,
    isRotated: Boolean(map.rotation !== 0),
    hasGraticule: Boolean(
      lodashGet(
        lodashFind(layers[activeStr], { id: 'Graticule' }) || {},
        'visible'
      )
    )
  };
}
const mapDispatchToProps = dispatch => ({
  selectDate: val => {
    dispatch(selectDate(val));
  },
  notify: (type, action, title) => {
    return new Promise((resolve, reject, cancel) => {
      const bodyComponentProps = {
        bodyText: notificationWarnings[type],
        cancel: () => {
          dispatch(onToggle());
        },
        accept: () => {
          dispatch(action());
          dispatch(onToggle());
          resolve();
        }
      };
      dispatch(
        openCustomContent('image_download_notify_' + type, {
          headerText: 'Notify',
          bodyComponent: Notify,
          size: 'sm',
          modalClassName: 'notify',
          bodyComponentProps
        })
      );
    });
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
  toggleGif: () => {
    dispatch(toggleComponentGifActive());
  },
  onSlide: num => {
    dispatch(changeFrameRate(num));
  },
  onZoomSelect: (delta, zoom, customSelected) => {
    dispatch(selectInterval(delta, zoom, customSelected));
  },
  onUpdateStartDate(date) {
    dispatch(changeStartDate(date));
  },
  onUpdateEndDate(date) {
    dispatch(changeEndDate(date));
  },
  onUpdateStartAndEndDate: (startDate, endDate) => {
    dispatch(changeStartAndEndDate(startDate, endDate));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AnimationWidget);
RangeHandle.propTypes = {
  dragging: PropTypes.object,
  offset: PropTypes.number,
  value: PropTypes.number
};
AnimationWidget.propTypes = {
  currentDate: PropTypes.object,
  customDelta: PropTypes.number,
  customInterval: PropTypes.number,
  delta: PropTypes.number,
  endDate: PropTypes.object,
  hasCustomPalettes: PropTypes.bool,
  hasGraticule: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool,
  increment: PropTypes.string,
  incrementArray: PropTypes.array,
  interval: PropTypes.string,
  isActive: PropTypes.bool,
  isCompareActive: PropTypes.bool,
  isGifActive: PropTypes.bool,
  isPlaying: PropTypes.bool,
  isRotated: PropTypes.bool,
  layers: PropTypes.array,
  looping: PropTypes.bool,
  map: PropTypes.object,
  maxDate: PropTypes.object,
  minDate: PropTypes.object,
  notify: PropTypes.func,
  onClose: PropTypes.func,
  onDateChange: PropTypes.func,
  onPushLoop: PropTypes.func,
  onPushPause: PropTypes.func,
  onPushPlay: PropTypes.func,
  onSlide: PropTypes.func,
  onUpdateEndDate: PropTypes.func,
  onUpdateStartAndEndDate: PropTypes.func,
  onUpdateStartDate: PropTypes.func,
  onZoomSelect: PropTypes.func,
  promiseImageryForTime: PropTypes.func,
  selectDate: PropTypes.func,
  sliderLabel: PropTypes.string,
  speed: PropTypes.number,
  startDate: PropTypes.object,
  toggleGif: PropTypes.func
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
    zooms = [customText, 'year', 'month', 'day', 'hour', 'minute'];
  } else {
    zooms = [customText, 'year', 'month', 'day'];
  }
  if (dateModel.customSelected) {
    headerText = zooms[0];
  } else {
    let interval = dateModel.interval
      ? dateModel.interval
      : dateModel.selectedZoom - 1;
    headerText = '1 ' + zooms[interval];
  }
  let array = lodashWithout(zooms, headerText);
  return {
    increment: headerText,
    array: [...array],
    customDelta: dateModel.customDelta || 1,
    customInterval: dateModel.customInterval || 3
  };
};
