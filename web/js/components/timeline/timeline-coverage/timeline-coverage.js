import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UncontrolledTooltip } from 'reactstrap';
import moment from 'moment';
import googleTagManager from 'googleTagManager';
import {
  isEqual as lodashIsEqual,
} from 'lodash';
import { timeScaleOptions } from '../../../modules/date/constants';
import {
  filterProjLayersWithStartDate,
  getMaxLayerEndDates,
} from '../../../modules/date/util';
import { getActiveLayers } from '../../../modules/layers/selectors';
import { toggleCustomContent } from '../../../modules/modal/actions';
import Scrollbars from '../../util/scrollbar';
import Switch from '../../util/switch';
import LayerCoverageInfoModal from './info-modal';
import CoverageItemList from './coverage-item-list';

/*
 * Timeline Layer Coverage Panel for temporal coverage.
 *
 * @class TimelineLayerCoveragePanel
 */

class TimelineLayerCoveragePanel extends Component {
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
      endDate, futureTime, startDate, ongoing,
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

    return {
      visible,
      leftOffset,
      width,
      isWidthGreaterThanRendered,
      layerStartBeforeAxisFront,
      layerEndBeforeAxisBack,
    };
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
  addMatchingCoverageToTimeline = (isChecked, layers) => {
    const { setMatchingTimelineCoverage } = this.props;
    const dateRange = this.getNewMatchingDatesRange(layers);
    setMatchingTimelineCoverage(dateRange, isChecked);
    this.setState({
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
