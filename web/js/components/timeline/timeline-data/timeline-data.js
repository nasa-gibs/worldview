import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { UncontrolledTooltip } from 'reactstrap';
import moment from 'moment';
import {
  isEqual as lodashIsEqual,
} from 'lodash';
import {
  timeScaleOptions,
} from '../../../modules/date/constants';
import {
  filterProjLayersWithStartDate,
  getMaxLayerEndDates,
} from '../../../modules/date/util';
import { getActiveLayers } from '../../../modules/layers/selectors';
import Scrollbars from '../../util/scrollbar';
import Switch from '../../util/switch';
import DataItemList from './data-item-list';

/*
 * Timeline Data Panel for layer coverage.
 *
 * @class TimelineData
 */

class TimelineData extends Component {
  constructor(props) {
    super(props);
    this.state = {
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
    document.querySelector('.timeline-data-panel-container').addEventListener('wheel', (e) => e.stopPropagation(), { passive: false });
    // init populate of activeLayers
    this.addMatchingCoverageToTimeline(shouldIncludeHiddenLayers, layers);
  }

  shouldComponentUpdate(nextProps, nextState) {
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
      activeLayers,
      isProductPickerOpen,
      isDataCoveragePanelOpen,
      projection,
    } = this.props;
    const { shouldIncludeHiddenLayers } = this.state;

    if (!prevProps.isProductPickerOpen && isProductPickerOpen && isDataCoveragePanelOpen) {
      this.togglePanelOpenClose();
      return;
    }

    const projectionChange = prevProps.projection !== projection;
    const toggleHiddenChange = prevState.shouldIncludeHiddenLayers !== shouldIncludeHiddenLayers;
    // need to update layer toggles for show/hide/remove
    if (projectionChange || !lodashIsEqual(prevProps.activeLayers, activeLayers) || toggleHiddenChange) {
      // update coverage including layer added/removed and option changes (active/inactive)
      const layers = this.getActiveLayers(activeLayers);
      this.setActiveLayers(layers);
      this.addMatchingCoverageToTimeline(shouldIncludeHiddenLayers, layers);
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
  }

  /**
  * @desc get active layers
  * @param {Array} layerCollection
  * @returns {Array}
  */
  getActiveLayers = (layerCollection) => {
    const { shouldIncludeHiddenLayers } = this.state;
    const layers = layerCollection.filter((layer) => (shouldIncludeHiddenLayers
      ? layer.startDate
      : layer.startDate && layer.visible));
    return layers;
  }

  /**
  * @desc get line dimensions for given date range
  * @param {Object} layer
  * @param {String} rangeStart
  * @param {String} rangeEnd
  * @returns {Object} visible, leftOffset, width, isWidthGreaterThanRendered
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
      endDate, futureTime, startDate, inactive,
    } = layer;

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
    if (rangeEnd || inactive === true) {
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

    return {
      visible,
      leftOffset,
      width,
      isWidthGreaterThanRendered,
      layerStartBeforeAxisFront,
      layerEndBeforeAxisBack,
    };
  }

  /**
  * @desc handle open/close modal from clicking handle
  * @returns {void}
  */
  togglePanelOpenClose = () => {
    const {
      isDataCoveragePanelOpen,
      toggleDataCoveragePanel,
    } = this.props;
    toggleDataCoveragePanel(!isDataCoveragePanelOpen);
  }

  /**
  * @desc get startDate and endDate based on layers currently selected for matching coverage
  * @param {Array} layers
  * @returns {Object} startDate, endDate
  */
  // eslint-disable-next-line react/destructuring-assignment
  addMatchingCoverageToTimeline = (isChecked, layerCollection = this.state.activeLayers) => {
    const { setMatchingTimelineCoverage } = this.props;
    const layers = this.getActiveLayers(layerCollection);
    const dateRange = this.getNewMatchingDatesRange(layers);
    setMatchingTimelineCoverage(dateRange, isChecked);
    this.setState({
      activeLayers: layers,
      shouldIncludeHiddenLayers: isChecked,
    });
  }

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
    let startDate;
    let endDate = new Date(appNow);
    if (layers.length > 0) {
      // for each start date, find latest that is still below end date
      const startDates = layers.reduce((acc, x) => (x.startDate ? acc.concat(x.startDate) : acc), []);
      for (let i = 0; i < startDates.length; i += 1) {
        const date = new Date(startDates[i]);
        if (i === 0) {
          startDate = date;
        }
        if (date.getTime() > startDate.getTime()) {
          startDate = date;
        }
      }
      // for each end date, find earliest that is still after start date
      const endDates = getMaxLayerEndDates(layers, appNow);
      for (let i = 0; i < endDates.length; i += 1) {
        const date = new Date(endDates[i]);
        if (i === 0) {
          endDate = date;
        }
        if (date.getTime() < endDate.getTime()) {
          endDate = date;
        }
      }

      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
    }
  }

  render() {
    const {
      appNow,
      axisWidth,
      backDate,
      frontDate,
      isDataCoveragePanelOpen,
      parentOffset,
      positionTransformX,
      timeScale,
    } = this.props;
    const {
      activeLayers,
      shouldIncludeHiddenLayers,
    } = this.state;
    // filter current active layers
    const layers = activeLayers.filter((layer) => (shouldIncludeHiddenLayers
      ? layer.startDate
      : layer.startDate && layer.visible));

    const emptyLayers = activeLayers.length === 0;

    // handle conditional container styling
    const maxHeightScrollBar = '203px';
    const layerListItemHeigthConstant = emptyLayers
      ? 41
      : layers.length * 41;

    const dataAvailabilityHandleTopOffset = `${Math.max(-54 - layerListItemHeigthConstant, -259)}px`;

    const mainContainerWidth = `${axisWidth + 1}px`;
    const mainContainerHeight = `${Math.min(35 + layerListItemHeigthConstant, 240)}px`;
    const mainContainerLeftOffset = `${parentOffset - 10}px`;

    const animateBottomClassName = `animate-timeline-data-panel-slide-${isDataCoveragePanelOpen ? 'up' : 'down'}`;
    const panelChevronClassName = `wv-timeline-data-availability-handle-chevron-${isDataCoveragePanelOpen ? 'open' : 'closed'}`;
    const panelToggleLabelText = isDataCoveragePanelOpen ? 'Collapse data coverage panel' : 'Show data coverage panel';

    return (
      <>
        {/* Data Coverage Panel open/close handle */}
        <div
          id="timeline-data-availability-panel-handle"
          aria-label={panelToggleLabelText}
          onClick={this.togglePanelOpenClose}
          style={{
            right: Math.floor((axisWidth + 75) / 2),
            top: isDataCoveragePanelOpen ? dataAvailabilityHandleTopOffset : '-19px',
          }}
        >
          <UncontrolledTooltip placement="top" target="timeline-data-availability-panel-handle">
            {panelToggleLabelText}
          </UncontrolledTooltip>
          <div className={`wv-timeline-data-availability-handle-chevron ${panelChevronClassName}`} />
        </div>
        <div
          className={`timeline-data-panel-container ${animateBottomClassName}`}
          style={{
            width: mainContainerWidth,
            height: mainContainerHeight,
            left: mainContainerLeftOffset,
          }}
        >
          {/* Data Coverage Panel */}
          {isDataCoveragePanelOpen
          && (
          <div
            className="timeline-data-panel"
            style={{
              width: mainContainerWidth,
            }}
          >
            <header className="timeline-data-panel-header">
              <h3 className="timeline-data-panel-header-title">LAYER COVERAGE</h3>
              <Switch
                active={shouldIncludeHiddenLayers}
                border
                color="00457b"
                id="wv-toggle-data-matching-toggle"
                containerClassAddition="wv-toggle-data-matching-main"
                label="Include Hidden Layers"
                toggle={() => this.addMatchingCoverageToTimeline(!shouldIncludeHiddenLayers)}
              />
            </header>
            <Scrollbars style={{ maxHeight: maxHeightScrollBar }}>
              <DataItemList
                activeLayers={activeLayers}
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
});

TimelineData.propTypes = {
  activeLayers: PropTypes.array,
  appNow: PropTypes.object,
  axisWidth: PropTypes.number,
  backDate: PropTypes.string,
  frontDate: PropTypes.string,
  isDataCoveragePanelOpen: PropTypes.bool,
  isProductPickerOpen: PropTypes.bool,
  parentOffset: PropTypes.number,
  positionTransformX: PropTypes.number,
  projection: PropTypes.string,
  setMatchingTimelineCoverage: PropTypes.func,
  timelineStartDateLimit: PropTypes.string,
  timeScale: PropTypes.string,
  toggleDataCoveragePanel: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TimelineData);
