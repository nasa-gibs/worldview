import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import {
  isEqual as lodashIsEqual,
} from 'lodash';
import {
  timeScaleOptions,
} from '../../../modules/date/constants';
import Scrollbars from '../../util/scrollbar';
import Switch from '../../util/switch';
import LayerDataItems from './layer-data-items';

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
      hoveredTooltip: {},
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

  componentDidUpdate(prevProps, prevState) {
    const { activeLayers } = this.props;
    const { shouldIncludeHiddenLayers } = this.state;

    const toggleHiddenChange = prevState.shouldIncludeHiddenLayers !== shouldIncludeHiddenLayers;
    // need to update layer toggles for show/hide/remove
    if (!lodashIsEqual(prevProps.activeLayers, activeLayers) || toggleHiddenChange) {
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
  * @returns {Object} visible, leftOffset, width, borderRadius, toolTipPlacement
  */
  getMatchingCoverageLineDimensions = (layer, rangeStart, rangeEnd) => {
    const {
      appNow,
      axisWidth,
      backDate,
      frontDate,
      position,
      timeScale,
      timelineStartDateLimit,
      transformX,
    } = this.props;

    const postionTransformX = position + transformX;
    const { gridWidth } = timeScaleOptions[timeScale].timeAxis;
    const axisFrontDate = new Date(frontDate).getTime();
    const axisBackDate = new Date(backDate).getTime();
    let layerStart; let
      layerEnd;

    if (rangeStart || layer.startDate) {
      layerStart = new Date(rangeStart || layer.startDate).getTime();
    } else {
      layerStart = new Date(timelineStartDateLimit).getTime();
    }
    if (rangeEnd || layer.inactive === true) {
      layerEnd = new Date(rangeEnd || layer.endDate).getTime();
    } else {
      layerEnd = new Date(appNow).getTime();
    }

    let visible = true;
    if (layerStart >= axisBackDate || layerEnd <= axisFrontDate) {
      visible = false;
    }

    let leftOffset = 0;
    let borderRadiusLeft = '0';
    let borderRadiusRight = '0';

    let width = axisWidth * 2;
    if (visible) {
      if (layerStart <= axisFrontDate) {
        leftOffset = 0;
      } else {
        // positive diff means layerStart more recent than axisFrontDate
        const diff = moment.utc(layerStart).diff(axisFrontDate, timeScale, true);
        const gridDiff = gridWidth * diff;
        leftOffset = gridDiff + postionTransformX;
        borderRadiusLeft = '3px';
      }

      if (layerEnd <= axisBackDate) {
        // positive diff means layerEnd earlier than back date
        const diff = moment.utc(layerEnd).diff(axisFrontDate, timeScale, true);
        const gridDiff = gridWidth * diff;
        width = gridDiff + postionTransformX - leftOffset;
        borderRadiusRight = '3px';
      }
    }

    const borderRadius = `${borderRadiusLeft} ${borderRadiusRight} ${borderRadiusRight} ${borderRadiusLeft}`;
    const toolTipPlacement = 'auto';

    return {
      visible,
      leftOffset,
      width,
      borderRadius,
      toolTipPlacement,
    };
  }

  /**
  * @desc handle hovering on line and adding active tooltip
  * @param {String} input
  * @returns {void}
  */
  hoverOnToolTip = (input) => {
    this.setState({
      hoveredTooltip: { [input]: true },
    });
  }

  /**
  * @desc handle hovering off line and removing active tooltip
  * @returns {void}
  */
  hoverOffToolTip = () => {
    this.setState({
      hoveredTooltip: {},
    });
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
  * @returns {Object} startDate, endDate
  */
  getNewMatchingDatesRange = (layers) => {
    const { appNow } = this.props;
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
      // for each end date, find earlier that is still after start date
      const endDates = layers.reduce((acc, x) => (x.endDate ? acc.concat(x.endDate) : acc), []);
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
      hoveredLayer,
      isDataCoveragePanelOpen,
      parentOffset,
      timeScale,
    } = this.props;
    const {
      activeLayers,
      hoveredTooltip,
      shouldIncludeHiddenLayers,
    } = this.state;
    // filter current active layers
    const layers = activeLayers.filter((layer) => (shouldIncludeHiddenLayers
      ? layer.startDate
      : layer.startDate && layer.visible));

    // handle conditional styling
    const maxHeightScrollBar = '203px';
    const layerListItemHeigthConstant = layers.length * 41;

    const dataAvailabilityHandleTopOffset = `${Math.max(-54 - layerListItemHeigthConstant, -259)}px`;

    const mainContainerWidth = `${axisWidth + 78}px`;
    const mainContainerHeight = `${Math.min(35 + layerListItemHeigthConstant, 240)}px`;
    const mainContainerLeftOffset = `${parentOffset - 10}px`;

    const animateBottomClassName = `animate-timeline-data-panel-slide-${isDataCoveragePanelOpen ? 'up' : 'down'}`;
    const panelChevronClassName = `wv-timeline-data-availability-handle-chevron-${isDataCoveragePanelOpen ? 'open' : 'closed'}`;

    return (
      <>
        {/* Data Coverage Panel open/close handle */}
        <div
          id="timeline-data-availability-panel-handle"
          onClick={this.togglePanelOpenClose}
          style={{
            right: Math.floor((axisWidth + 75) / 2),
            top: isDataCoveragePanelOpen ? dataAvailabilityHandleTopOffset : '-19px',
          }}
        >
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
                color="00457b"
                id="wv-toggle-data-matching-toggle"
                containerId="wv-toggle-data-matching-main"
                label="Include Hidden Layers"
                toggle={() => this.addMatchingCoverageToTimeline(!shouldIncludeHiddenLayers)}
              />
            </header>
            <Scrollbars style={{ maxHeight: maxHeightScrollBar }}>
              <LayerDataItems
                activeLayers={activeLayers}
                appNow={appNow}
                axisWidth={axisWidth}
                backDate={backDate}
                frontDate={frontDate}
                getMatchingCoverageLineDimensions={this.getMatchingCoverageLineDimensions}
                hoveredLayer={hoveredLayer}
                hoveredTooltip={hoveredTooltip}
                hoverOffToolTip={this.hoverOffToolTip}
                hoverOnToolTip={this.hoverOnToolTip}
                timeScale={timeScale}
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
    compare,
    layers,
    date,
  } = state;
  const {
    appNow,
  } = date;

  const activeLayers = layers[compare.activeString].filter((activeLayer) => activeLayer.startDate);
  const { hoveredLayer } = layers;

  return {
    activeLayers,
    hoveredLayer,
    appNow,
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
  hoveredLayer: PropTypes.string,
  isDataCoveragePanelOpen: PropTypes.bool,
  parentOffset: PropTypes.number,
  position: PropTypes.number,
  setMatchingTimelineCoverage: PropTypes.func,
  timelineStartDateLimit: PropTypes.string,
  timeScale: PropTypes.string,
  toggleDataCoveragePanel: PropTypes.func,
  transformX: PropTypes.number,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TimelineData);
