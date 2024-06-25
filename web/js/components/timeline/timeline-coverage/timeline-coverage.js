import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UncontrolledTooltip } from 'reactstrap';
import moment from 'moment';
import {
  isEqual as lodashIsEqual,
} from 'lodash';
import googleTagManager from 'googleTagManager';
import { timeScaleOptions } from '../../../modules/date/constants';
import {
  filterProjLayersWithStartDate,
} from '../../../modules/date/util';
import { getActiveLayers } from '../../../modules/layers/selectors';
import { toggleCustomContent } from '../../../modules/modal/actions';
import Scrollbars from '../../util/scrollbar';
import Switch from '../../util/switch';
import LayerCoverageInfoModal from './info-modal';
import CoverageItemList from './coverage-item-list';

function makeTime(date) {
  return new Date(date).getTime();
}

function mergeSortedGranuleDateRanges(granules) {
  return granules.reduce((acc, [start, end]) => {
    if (!acc.length) return [[start, end]];
    const startTime = makeTime(start);
    const endTime = makeTime(end);
    const lastRangeEndTime = makeTime(acc.at(-1)[1]);
    const lastRangeStartTime = makeTime(acc.at(-1)[0]);
    if ((startTime >= lastRangeStartTime && startTime <= lastRangeEndTime) && (endTime >= lastRangeStartTime && endTime <= lastRangeEndTime)) { // within current range, ignore
      return acc;
    }
    if (startTime > lastRangeEndTime) { // discontinuous, add new range
      return [...acc, [start, end]];
    }
    if (startTime <= lastRangeEndTime && endTime > lastRangeEndTime) { // intersects current range, merge
      return acc.with(-1, [acc.at(-1)[0], end]);
    }
    return acc;
  }, []);
}

async function requestGranules(params) {
  const {
    shortName,
    extent,
    startDate,
    endDate,
  } = params;
  const granules = [];
  let hits = Infinity;
  let searchAfter = false;
  const url = `https://cmr.earthdata.nasa.gov/search/granules.json?shortName=${shortName}&bounding_box=${extent.join(',')}&temporal=${startDate}/${endDate}&sort_key=start_date&pageSize=2000`;
  /* eslint-disable no-await-in-loop */
  do { // run the query at least once
    const headers = searchAfter ? { 'Cmr-Search-After': searchAfter, 'Client-Id': 'Worldview' } : { 'Client-Id': 'Worldview' };
    const res = await fetch(url, { headers });
    searchAfter = res.headers.get('Cmr-Search-After');
    hits = parseInt(res.headers.get('Cmr-Hits'), 10);
    const data = await res.json();
    granules.push(...data.feed.entry);
  } while (searchAfter || hits > granules.length); // searchAfter will not be present if there are no more results https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html#search-after

  return granules;
}

async function getLayerGranuleRanges(layer) {
  const extent = [-180, -90, 180, 90];
  const startDate = new Date(layer.startDate).toISOString();
  const endDate = layer.endDate ? new Date(layer.endDate).toISOString() : new Date().toISOString();
  const shortName = layer.conceptIds?.[0]?.shortName;
  const nrtParams = {
    shortName,
    extent,
    startDate,
    endDate,
  };
  const nrtGranules = await requestGranules(nrtParams);
  let nonNRTGranules = [];
  if (shortName.includes('_NRT')) { // if NRT, also get non-NRT granules
    const nonNRTShortName = shortName.replace('_NRT', '');
    const nonNRTParams = {
      shortName: nonNRTShortName,
      extent,
      startDate,
      endDate,
    };
    nonNRTGranules = await requestGranules(nonNRTParams);
  }
  const granules = [...nonNRTGranules, ...nrtGranules];
  const granuleDateRanges = granules.map(({ time_start: timeStart, time_end: timeEnd }) => [timeStart, timeEnd]);
  const mergedGranuleDateRanges = mergeSortedGranuleDateRanges(granuleDateRanges); // merge overlapping granule ranges to simplify rendering

  return mergedGranuleDateRanges;
}

async function mapGranulesToLayers(layers) {
  const promises = layers.map(async (layer) => {
    if (!layer.cmrAvailability) return layer;

    const ranges = await getLayerGranuleRanges(layer);

    return { ...layer, granules: ranges };
  });
  const cmrLayers = await Promise.all(promises);

  return cmrLayers;
}

/*
 * Timeline Layer Coverage Panel for temporal coverage.
 *
 * @class TimelineLayerCoveragePanel
 */

class TimelineLayerCoveragePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cmrLayers: [],
      activeLayers: [],
      shouldIncludeHiddenLayers: false,
    };
  }

  componentDidMount() {
    const { activeLayers } = this.props;
    const { shouldIncludeHiddenLayers } = this.state;

    const layers = this.getActiveLayers(activeLayers);
    this.setActiveLayers(layers);
    // prevent bubbling to parent which the wheel event is blocked for timeline zoom in/out wheel event
    document.querySelector('.timeline-layer-coverage-container').addEventListener('wheel', (e) => e.stopPropagation(), { passive: false });
    // init populate of activeLayers
    this.addMatchingCoverageToTimeline(shouldIncludeHiddenLayers, layers);
  }

  shouldComponentUpdate(nextProps) {
    const {
      timeScale,
      frontDate,
      backDate,
    } = this.props;

    // prevent repeated rendering on timescale change updates
    if (nextProps.timeScale !== timeScale) {
      const isFrontDateSame = nextProps.frontDate === frontDate;
      const isBackDateSame = nextProps.backDate === backDate;
      if (isFrontDateSame && isBackDateSame) {
        return false;
      }
    }
    return true;
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      appNow,
      activeLayers,
      isProductPickerOpen,
      isTimelineLayerCoveragePanelOpen,
      projection,
    } = this.props;
    const { shouldIncludeHiddenLayers } = this.state;

    if (!prevProps.isProductPickerOpen && isProductPickerOpen && isTimelineLayerCoveragePanelOpen) {
      this.togglePanelOpenClose();
      return;
    }

    const updatedActiveLayers = this.getActiveLayers(activeLayers);
    // eslint-disable-next-line react/destructuring-assignment
    const layersChange = !lodashIsEqual(updatedActiveLayers, this.state.activeLayers);
    const projectionChange = prevProps.projection !== projection;
    const toggleHiddenChange = prevState.shouldIncludeHiddenLayers !== shouldIncludeHiddenLayers;
    const appNowUpdated = prevProps.appNow !== appNow;
    if (projectionChange || toggleHiddenChange || layersChange || appNowUpdated) {
      // update coverage including layer added/removed and option changes (active/inactive)
      this.setActiveLayers(updatedActiveLayers);
      this.addMatchingCoverageToTimeline(shouldIncludeHiddenLayers, updatedActiveLayers);
    }
  }

  /**
  * @desc set active layers
  * @param {Array} layers
  * @returns {void}
  */
  setActiveLayers = (layers) => {
    this.setState({
      activeLayers: layers,
    });
  };

  /**
  * @desc get active layers
  * @param {Array} layers
  * @returns {Array}
  */
  getActiveLayers = (layers) => {
    const { shouldIncludeHiddenLayers } = this.state;
    return layers.filter((layer) => (shouldIncludeHiddenLayers ? true : layer.visible));
  };

  /**
  * @desc get line dimensions for given date range
  * @param {Object} layer
  * @param {String} rangeStart
  * @param {String} rangeEnd
  * @returns {Array} visible, leftOffset, width, isWidthGreaterThanRendered
  */
  getMatchingCoverageLineDimensions = (layer, rangeStart, rangeEnd) => {
    const {
      appNow,
      axisWidth,
      backDate,
      frontDate,
      positionTransformX,
      timeScale,
      timelineStartDateLimit,
    } = this.props;
    const {
      futureTime, ongoing,
    } = layer;

    if (layer.granules?.length) {
      return layer.granules.map(([startDate, endDate]) => {
        const { gridWidth } = timeScaleOptions[timeScale].timeAxis;
        const axisFrontDate = new Date(frontDate).getTime();
        const axisBackDate = new Date(backDate).getTime();
        let layerStart;
        const layerEnd = new Date(endDate).getTime();

        if (rangeStart || startDate) {
          layerStart = new Date(startDate).getTime();
        } else {
          layerStart = new Date(timelineStartDateLimit).getTime();
        }

        let visible = true;
        if (layerStart >= axisBackDate || layerEnd <= axisFrontDate) {
          visible = false;
        }

        let leftOffset = 0;
        const isWidthGreaterThanRendered = layerStart < axisFrontDate || layerEnd > axisBackDate;
        const layerStartBeforeAxisFront = layerStart <= axisFrontDate;
        const layerEndBeforeAxisBack = layerEnd <= axisBackDate;
        // oversized width allows axis drag buffer
        let width = axisWidth * 5;
        if (visible) {
          if (layerStartBeforeAxisFront) {
            leftOffset = 0;
          } else {
            // positive diff means layerStart more recent than axisFrontDate
            const diff = moment.utc(layerStart).diff(axisFrontDate, timeScale, true);
            const gridDiff = gridWidth * diff;
            leftOffset = gridDiff + positionTransformX;
          }
          if (layerEndBeforeAxisBack) {
            // positive diff means layerEnd earlier than back date
            const diff = moment.utc(layerEnd).diff(axisFrontDate, timeScale, true);
            const gridDiff = gridWidth * diff;
            width = gridDiff + positionTransformX - leftOffset;
          }
        }

        return {
          visible,
          leftOffset,
          width,
          isWidthGreaterThanRendered,
          layerStartBeforeAxisFront,
          layerEndBeforeAxisBack,
        };
      });
    }
    const { startDate, endDate } = layer;
    const { gridWidth } = timeScaleOptions[timeScale].timeAxis;
    const axisFrontDate = new Date(frontDate).getTime();
    const axisBackDate = new Date(backDate).getTime();
    let layerStart;
    let layerEnd;

    if (rangeStart || startDate) {
      layerStart = new Date(rangeStart || startDate).getTime();
    } else {
      layerStart = new Date(timelineStartDateLimit).getTime();
    }
    if (rangeEnd || !ongoing) {
      layerEnd = new Date(rangeEnd || endDate).getTime();
    } else if (futureTime && endDate) {
      layerEnd = new Date(endDate).getTime();
    } else {
      layerEnd = new Date(appNow).getTime();
    }

    let visible = true;
    if (layerStart >= axisBackDate || layerEnd <= axisFrontDate) {
      visible = false;
    }

    let leftOffset = 0;
    const isWidthGreaterThanRendered = layerStart < axisFrontDate || layerEnd > axisBackDate;
    const layerStartBeforeAxisFront = layerStart <= axisFrontDate;
    const layerEndBeforeAxisBack = layerEnd <= axisBackDate;
    // oversized width allows axis drag buffer
    let width = axisWidth * 5;
    if (visible) {
      if (layerStartBeforeAxisFront) {
        leftOffset = 0;
      } else {
        // positive diff means layerStart more recent than axisFrontDate
        const diff = moment.utc(layerStart).diff(axisFrontDate, timeScale, true);
        const gridDiff = gridWidth * diff;
        leftOffset = gridDiff + positionTransformX;
      }
      if (layerEndBeforeAxisBack) {
        // positive diff means layerEnd earlier than back date
        const diff = moment.utc(layerEnd).diff(axisFrontDate, timeScale, true);
        const gridDiff = gridWidth * diff;
        width = gridDiff + positionTransformX - leftOffset;
      }
    }

    return [{
      visible,
      leftOffset,
      width,
      isWidthGreaterThanRendered,
      layerStartBeforeAxisFront,
      layerEndBeforeAxisBack,
    }];
  };

  /**
  * @desc handle open/close modal from clicking handle
  * @returns {void}
  */
  togglePanelOpenClose = () => {
    const {
      isTimelineLayerCoveragePanelOpen,
      toggleLayerCoveragePanel,
    } = this.props;
    toggleLayerCoveragePanel(!isTimelineLayerCoveragePanelOpen);
  };

  /**
  * @desc add matching coverage to timeline
  * @param {Boolean} isChecked
  * @param {Array} layers
  * @returns {void}
  */
  // eslint-disable-next-line react/destructuring-assignment
  addMatchingCoverageToTimeline = async (isChecked, layers) => {
    const { setMatchingTimelineCoverage } = this.props;
    const cmrLayers = await mapGranulesToLayers(layers);
    const dateRange = this.getNewMatchingDatesRange(cmrLayers);
    setMatchingTimelineCoverage(dateRange, isChecked);
    this.setState({
      cmrLayers,
      activeLayers: layers,
      shouldIncludeHiddenLayers: isChecked,
    });
  };

  /**
  * @desc get startDate and endDate based on layers currently selected for matching coverage
  * @param {Array} layers
  * @returns {Object}
    * @param {String} startDate
    * @param {String} endDate
  */
  getNewMatchingDatesRange = (layers) => {
    const {
      appNow,
    } = this.props;
    if (layers.length > 0) {
      return layers.flatMap(({ granules, startDate, endDate }) => {
        if (!granules?.length) {
          return [{ startDate, endDate: endDate || appNow }];
        }

        return granules.map(([start, end]) => ({ startDate: start, endDate: end }));
      });
    }
  };

  stopPropagation = (e) => {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
  };

  /**
  * @desc render info button for layer coverage panel coverage info modal
  * @returns {DOM Object}
  */
  renderInfoButton = () => {
    const { onInfoClick } = this.props;
    const layerInfoBtnId = 'layer-coverage-info-button';
    const layerInfoBtnTitle = 'Timeline Layer Coverage Information';

    return (
      <a
        id={layerInfoBtnId}
        aria-label={layerInfoBtnTitle}
        className={layerInfoBtnId}
        onMouseDown={this.stopPropagation}
        onClick={() => onInfoClick()}
      >
        <FontAwesomeIcon icon="question-circle" className="layer-coverage-info-button-icon" />
      </a>
    );
  };

  /**
  * @desc handle dynamic conditional container styling, className, and text label generation
  * @returns {Object}
  */
  getConditionalStyles = () => {
    const {
      axisWidth,
      isTimelineLayerCoveragePanelOpen,
      parentOffset,
    } = this.props;
    const {
      activeLayers,
    } = this.state;

    // conditional style properties
    const maxHeightScrollBar = '203px';
    const layerListItemHeightConstant = Math.max(1, activeLayers.length) * 41;
    const layerCoveragePanelHandleTopOffset = `${Math.max(-54 - layerListItemHeightConstant, -259)}px`;

    const mainContainerWidth = `${axisWidth + 1}px`;
    const mainContainerHeight = `${Math.min(35 + layerListItemHeightConstant, 240)}px`;
    const mainContainerLeftOffset = `${parentOffset - 10}px`;

    // conditional classNames and label text
    const isPanelOpenClassName = `timeline-layer-coverage-${isTimelineLayerCoveragePanelOpen ? 'open' : 'closed'}`;
    const panelChevronClassName = `timeline-layer-coverage-panel-handle-chevron-${isTimelineLayerCoveragePanelOpen ? 'open' : 'closed'}`;
    const panelToggleLabelText = isTimelineLayerCoveragePanelOpen ? 'Collapse layer coverage panel' : 'Show layer coverage panel';

    // conditional style objects
    const panelHandleStyle = {
      right: Math.floor((axisWidth + 75) / 2),
      top: isTimelineLayerCoveragePanelOpen ? layerCoveragePanelHandleTopOffset : '-19px',
    };
    const panelContainerStyle = {
      width: mainContainerWidth,
      height: isTimelineLayerCoveragePanelOpen ? mainContainerHeight : 0,
      left: mainContainerLeftOffset,
      display: isTimelineLayerCoveragePanelOpen ? 'block' : 'none',
    };
    const layerCoverageStyle = { width: mainContainerWidth };
    const scrollbarStyle = { maxHeight: maxHeightScrollBar };

    return {
      panelHandleStyle,
      panelContainerStyle,
      layerCoverageStyle,
      scrollbarStyle,
      panelToggleLabelText,
      panelChevronClassName,
      isPanelOpenClassName,
    };
  };

  render() {
    const {
      appNow,
      axisWidth,
      backDate,
      frontDate,
      isTimelineLayerCoveragePanelOpen,
      positionTransformX,
      timeScale,
    } = this.props;
    const {
      cmrLayers,
      activeLayers,
      shouldIncludeHiddenLayers,
    } = this.state;

    const {
      panelHandleStyle,
      panelContainerStyle,
      layerCoverageStyle,
      scrollbarStyle,
      panelToggleLabelText,
      panelChevronClassName,
      isPanelOpenClassName,
    } = this.getConditionalStyles();

    return (
      <>
        {/* Timeline Layer Coverage Panel open/close handle */}
        <div
          id="timeline-layer-coverage-panel-handle"
          aria-label={panelToggleLabelText}
          onClick={this.togglePanelOpenClose}
          style={panelHandleStyle}
        >
          <UncontrolledTooltip id="center-align-tooltip" placement="top" target="timeline-layer-coverage-panel-handle">
            {panelToggleLabelText}
          </UncontrolledTooltip>
          <div className={`timeline-layer-coverage-panel-handle-chevron ${panelChevronClassName}`} />
        </div>
        <div
          className={`timeline-layer-coverage-container ${isPanelOpenClassName}`}
          style={panelContainerStyle}
        >
          {/* Timeline Layer Coverage Panel */}
          {isTimelineLayerCoveragePanelOpen
          && (
          <div
            className="timeline-layer-coverage"
            style={layerCoverageStyle}
          >
            <header className="timeline-layer-coverage-header">
              <h3 className="timeline-layer-coverage-header-title">LAYER COVERAGE</h3>
              {this.renderInfoButton()}
              <Switch
                active={shouldIncludeHiddenLayers}
                border
                color="00457b"
                id="toggle-layer-coverage-include-hidden"
                containerClassAddition="toggle-layer-coverage-include-hidden"
                label="Include Hidden Layers"
                toggle={() => this.addMatchingCoverageToTimeline(!shouldIncludeHiddenLayers, activeLayers)}
              />
            </header>
            <Scrollbars style={scrollbarStyle}>
              <CoverageItemList
                activeLayers={cmrLayers}
                appNow={appNow}
                axisWidth={axisWidth}
                backDate={backDate}
                frontDate={frontDate}
                getMatchingCoverageLineDimensions={this.getMatchingCoverageLineDimensions}
                timeScale={timeScale}
                positionTransformX={positionTransformX}
              />
            </Scrollbars>
          </div>
          )}
        </div>
      </>
    );
  }
}

function mapStateToProps(state) {
  const {
    date,
    modal,
    proj,
  } = state;
  const {
    appNow,
  } = date;

  // handle active layer filtering
  const activeLayers = getActiveLayers(state);
  const projection = proj.id;
  const activeLayersFiltered = filterProjLayersWithStartDate(activeLayers, projection);
  const isProductPickerOpen = modal.isOpen && modal.id === 'LAYER_PICKER_COMPONENT';

  return {
    activeLayers: activeLayersFiltered,
    appNow,
    isProductPickerOpen,
    projection,
  };
}

const mapDispatchToProps = (dispatch) => ({
  onInfoClick: () => {
    const key = 'TIMELINE_LAYER_COVERAGE_INFO_MODAL';
    googleTagManager.pushEvent({
      event: 'layer_coverage_panel_info',
    });
    dispatch(
      toggleCustomContent(key, {
        headerText: 'Timeline Layer Coverage',
        backdrop: false,
        size: 'lg',
        bodyComponent: LayerCoverageInfoModal,
        modalClassName: ' timeline-layer-coverage-info-modal',
        wrapClassName: 'clickable-behind-modal',
        desktopOnly: true,
      }),
    );
  },
});

TimelineLayerCoveragePanel.propTypes = {
  activeLayers: PropTypes.array,
  appNow: PropTypes.object,
  axisWidth: PropTypes.number,
  backDate: PropTypes.string,
  frontDate: PropTypes.string,
  isTimelineLayerCoveragePanelOpen: PropTypes.bool,
  isProductPickerOpen: PropTypes.bool,
  onInfoClick: PropTypes.func,
  parentOffset: PropTypes.number,
  positionTransformX: PropTypes.number,
  projection: PropTypes.string,
  setMatchingTimelineCoverage: PropTypes.func,
  timelineStartDateLimit: PropTypes.string,
  timeScale: PropTypes.string,
  toggleLayerCoveragePanel: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TimelineLayerCoveragePanel);
