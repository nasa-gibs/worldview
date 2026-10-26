import { memo, useEffect, useRef, useState } from 'react';
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

/**
 * @desc stop event from bubling to the timeline
 * @param {*} e - event
 * @returns {void}
 */
const stopPropagation = (e) => {
  e.nativeEvent.stopImmediatePropagation();
  e.stopPropagation();
  e.preventDefault();
};

const TimelineLayerCoveragePanel = ({
  activeLayers: allActiveLayers,
  appNow,
  axisWidth,
  backDate,
  frontDate,
  isProductPickerOpen,
  isTimelineLayerCoveragePanelOpen,
  onInfoClick,
  parentOffset,
  positionTransformX,
  projection,
  setMatchingTimelineCoverage,
  timelineStartDateLimit,
  timeScale,
  toggleLayerCoveragePanel,
}) => {
  const [activeLayers, setActiveLayers] = useState([]);
  const [shouldIncludeHiddenLayers, setShouldIncludeHiddenLayers] = useState(false);
  const containerRef = useRef(null);
  const prevRef = useRef(null);

  /**
  * @desc get active layers
  * @param {Array} layers
  * @returns {Array}
  *
  * renamed from getActiveLayers to filterVisibleLayers so it does not conflict
  */
  const filterVisibleLayers = (layers) => {
    return layers.filter((layer) => (shouldIncludeHiddenLayers ? true : layer.visible));
  };

  /**
  * @desc get line dimensions for given date range
  * @param {Object} layer
  * @param {String} rangeStart
  * @param {String} rangeEnd
  * @returns {Array} visible, leftOffset, width, isWidthGreaterThanRendered
  */
  const getMatchingCoverageLineDimensions = (layer, rangeStart, rangeEnd) => {
    const {
      futureTime, granuleDateRanges, ongoing, startDate, endDate,
    } = layer;

    if (granuleDateRanges?.length) {
      return granuleDateRanges.map(([startDate, endDate]) => {
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
  const togglePanelOpenClose = () => {
    toggleLayerCoveragePanel(!isTimelineLayerCoveragePanelOpen);
  };

  /**
  * @desc get startDate and endDate based on layers currently selected for matching coverage
  * @param {Array} layers
  * @returns {Object}
    * @param {String} startDate
    * @param {String} endDate
  */
  const getNewMatchingDatesRange = (layers) => {
    if (layers.length > 0) {
      return layers.flatMap(({ granuleDateRanges, startDate, endDate }) => {
        if (!granuleDateRanges?.length) {
          return [{ startDate, endDate: endDate || appNow }];
        }

        return granuleDateRanges.map(([start, end]) => ({ startDate: start, endDate: end }));
      });
    }
    return undefined;
  };

  /**
  * @desc add matching coverage to timeline
  * @param {Boolean} isChecked
  * @param {Array} layers
  * @returns {void}
  */

  const addMatchingCoverageToTimeline = async (isChecked, layers) => {
    const dateRange = getNewMatchingDatesRange(layers);
    setMatchingTimelineCoverage(dateRange, isChecked);
    setActiveLayers(layers);
    setShouldIncludeHiddenLayers(isChecked);
  };

  // componentDidMount
  useEffect(() => {
    const container = containerRef.current;
    const onWheel = (e) => e.stopPropagation();
    container.addEventListener('wheel', onWheel, {passive: false});

    addMatchingCoverageToTimeline(shouldIncludeHiddenLayers, filterVisibleLayers(allActiveLayers));

    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, []);

  // componentDidUpdate
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = {
      appNow,
      isProductPickerOpen,
      projection,
      shouldIncludeHiddenLayers,
    };

    // skip the first render
    if (!prev) return;

    if (!prev.isProductPickerOpen && isProductPickerOpen && isTimelineLayerCoveragePanelOpen) {
      togglePanelOpenClose();
      return;
    }

    const updatedActiveLayers = filterVisibleLayers(allActiveLayers);

    const layersChange = !lodashIsEqual(updatedActiveLayers, activeLayers);
    const projectionChange = prev.projection !== projection;
    const toggleHiddenChange = prev.shouldIncludeHiddenLayers !== shouldIncludeHiddenLayers;
    const appNowUpdated = prev.appNow !== appNow;
    if (projectionChange || toggleHiddenChange || layersChange || appNowUpdated) {
      // update coverage including layer added/removed and option changes (active/inactive)
      addMatchingCoverageToTimeline(shouldIncludeHiddenLayers, updatedActiveLayers);
    }
  });

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

  const layerInfoBtnId = 'layer-coverage-info-button';
  const layerInfoBtnTitle = 'Timeline Layer Coverage Information';

  return (
    <>
      {/* Timeline Layer Coverage Panel open/close handle */}
      <button
        type="button"
        id="timeline-layer-coverage-panel-handle"
        aria-label={panelToggleLabelText}
        onClick={togglePanelOpenClose}
        style={panelHandleStyle}
      >
        <UncontrolledTooltip id="center-align-tooltip" placement="top" target="timeline-layer-coverage-panel-handle">
          {panelToggleLabelText}
        </UncontrolledTooltip>
        <div className={`timeline-layer-coverage-panel-handle-chevron ${panelChevronClassName}`} />
      </button>
      <div
        ref={containerRef}
        className={`timeline-layer-coverage-container ${isPanelOpenClassName}`}
        style={panelContainerStyle}
      >
        {/* Timeline Layer Coverage Panel */}
        {isTimelineLayerCoveragePanelOpen &&
        (
          <div
            className="timeline-layer-coverage"
            style={layerCoverageStyle}
          >
            <header className="timeline-layer-coverage-header">
              <h3 className="timeline-layer-coverage-header-title">LAYER COVERAGE</h3>
              <button
                type="button"
                id={layerInfoBtnId}
                aria-label={layerInfoBtnTitle}
                className={layerInfoBtnId}
                onMouseDown={stopPropagation}
                onClick={() => onInfoClick()}
              >
                <FontAwesomeIcon icon="question-circle" className="layer-coverage-info-button-icon" widthAuto />
              </button>
              <Switch
                active={shouldIncludeHiddenLayers}
                border
                color="00457b"
                id="toggle-layer-coverage-include-hidden"
                containerClassAddition="toggle-layer-coverage-include-hidden"
                label="Include Hidden Layers"
                toggle={() => addMatchingCoverageToTimeline(
                  !shouldIncludeHiddenLayers,
                  activeLayers,
                )}
              />
            </header>
            <Scrollbars style={scrollbarStyle}>
              <CoverageItemList
                activeLayers={activeLayers}
                appNow={appNow}
                axisWidth={axisWidth}
                backDate={backDate}
                frontDate={frontDate}
                getMatchingCoverageLineDimensions={getMatchingCoverageLineDimensions}
                timeScale={timeScale}
                positionTransformX={positionTransformX}
              />
            </Scrollbars>
          </div>
        )}
      </div>
    </>
  );
};

/**
* @desc memo comparator replacing shouldComponentUpdate - returns true to SKIP a render.
* Prevents repeated rendering on timescale change updates when the axis dates are unchanged.
* @param {Object} prevProps
* @param {Object} nextProps
* @returns {Boolean}
*/
const areEqual = (prevProps, nextProps) => nextProps.timeScale !== prevProps.timeScale &&
  nextProps.frontDate === prevProps.frontDate &&
  nextProps.backDate === prevProps.backDate;

const MemoizedTimelineLayerCoveragePanel = memo(TimelineLayerCoveragePanel, areEqual);

// exposed as a static for callers/tests that used the class static method
MemoizedTimelineLayerCoveragePanel.stopPropagation = stopPropagation;

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
  activeLayers: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  appNow: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
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
)(MemoizedTimelineLayerCoveragePanel);
