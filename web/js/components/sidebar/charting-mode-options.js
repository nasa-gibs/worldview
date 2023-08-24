import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import { connect } from 'react-redux';
import { Draw as OlInteractionDraw } from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw';
import { Vector as OlVectorLayer } from 'ol/layer';
import { transform } from 'ol/proj';
import { Vector as OlVectorSource } from 'ol/source';
import {
  toggleChartingAOIOnOff,
  toggleAOISelected,
  updateChartingAOICoordinates,
  updateChartingDateSelection,
  updateRequestInProgressAction,
  updateRequestStatusMessageAction,
} from '../../modules/charting/actions';
import { openCustomContent } from '../../modules/modal/actions';
import { CRS } from '../../modules/map/constants';
import { areCoordinatesWithinExtent } from '../../modules/location-search/util';
import ChartingInfo from '../charting/charting-info';
import SimpleStatistics from '../charting/simple-statistics';
import ChartingDateSelector from '../charting/charting-date-selector';
import ChartComponent from '../charting/chart-component';
import {
  drawStyles, vectorStyles,
} from '../charting/charting-area-of-interest-style';

const AOIFeatureObj = {};
const vectorLayers = {};
const sources = {};
let init = false;
let draw;

function ChartingModeOptions (props) {
  const {
    activeLayer,
    activeLayers,
    aoiActive,
    aoiCoordinates,
    aoiSelected,
    chartRequestInProgress,
    crs,
    displayChart,
    displaySimpleStats,
    isChartingActive,
    isMobile,
    onChartDateButtonClick,
    openChartingDateModal,
    openChartingInfoModal,
    olMap,
    proj,
    projections,
    renderedPalettes,
    requestStatusMessage,
    timelineStartDate,
    timelineEndDate,
    timeSpanEndDate,
    timeSpanSelection,
    timeSpanStartDate,
    toggleAreaOfInterestActive,
    toggleAreaOfInterestSelected,
    updateAOICoordinates,
    updateRequestInProgress,
    updateRequestStatusMessage,
  } = props;

  function endDrawingAreaOfInterest () {
    if (draw) {
      olMap.removeInteraction(draw);
    }
  }

  function resetAreaOfInterest() {
    Object.values(AOIFeatureObj[crs]).forEach(
      ({ feature }) => {
        sources[crs].removeFeature(feature);
      },
    );

    if (vectorLayers[crs]) {
      vectorLayers[crs].setMap(null);
      vectorLayers[crs] = null;
    }

    toggleAreaOfInterestSelected(false);
    updateAOICoordinates(null);
  }

  /**
   * Processes the start & end times & aligns them with the timeline if values are undefined
   * @param {Date} start
   * @param {Date} end
   */
  function initializeDates(start, end) {
    const startDate = start === undefined ? timelineStartDate : start;
    const endDate = end === undefined ? timelineEndDate : end;
    return { initialStartDate: startDate, initialEndDate: endDate };
  }

  /**
   * Filters the layers array & returns those with visible set to 'true'.
   */
  function getLiveLayers() {
    return activeLayers.filter((obj) => obj.visible === true);
  }

  function formatDateString(dateObj) {
    const date = new Date(dateObj);
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'short' });
    const day = `0${date.getDate()}`.slice(-2);
    return `${year} ${month} ${day}`;
  }

  function getAreaOfInterestCoordinates(geometry) {
    updateAOICoordinates(geometry.getExtent());
  }

  const drawEndCallback = ({ feature }) => {
    // Add the draw feature to the collection
    AOIFeatureObj[crs][feature.ol_uid] = {
      feature,
    };
    endDrawingAreaOfInterest();
    toggleAreaOfInterestActive();
    toggleAreaOfInterestSelected();
    getAreaOfInterestCoordinates(feature.getGeometry());
  };

  function beginDrawingAOI () {
    resetAreaOfInterest();
    draw = new OlInteractionDraw({
      source: sources[crs], // Destination source for the drawn features (i.e. VectorSource)
      type: 'Circle', // Geometry type of the geometries being drawn with this instance.
      style: drawStyles, // Style used to indicate Area of Interest
      // This is from measurement tool; validate area selected
      condition(e) {
        const pixel = [e.originalEvent.x, e.originalEvent.y];
        const coord = olMap.getCoordinateFromPixel(pixel);
        const tCoord = transform(coord, crs, CRS.GEOGRAPHIC);
        return areCoordinatesWithinExtent(proj, tCoord);
      },
      geometryFunction: createBox(), // Function that is called when a geometry's coordinates are updated.

    });
    olMap.addInteraction(draw);
    draw.on('drawend', drawEndCallback);

    if (!vectorLayers[crs]) {
      vectorLayers[crs] = new OlVectorLayer({
        source: sources[crs],
        style: vectorStyles,
        map: olMap,
      });
    }
  }

  useEffect(() => {
    if (!init) {
      projections.forEach((key) => {
        AOIFeatureObj[key] = {};
        vectorLayers[key] = null;
        sources[key] = new OlVectorSource({ wrapX: false });
      });
      init = true;
    }
  }, [projections]);

  useEffect(() => {
    resetAreaOfInterest();
    endDrawingAreaOfInterest();
  }, [isChartingActive]);

  const { initialStartDate, initialEndDate } = initializeDates(timeSpanStartDate, timeSpanEndDate);
  const primaryDate = formatDateString(initialStartDate);
  const secondaryDate = formatDateString(initialEndDate);

  const onAreaOfInterestButtonClick = (evt) => {
    toggleAreaOfInterestActive();
    if (!aoiActive) {
      beginDrawingAOI();
    } else {
      endDrawingAreaOfInterest();
    }
  };


  function getActiveChartingLayer() {
    const liveLayers = getLiveLayers();
    const filteredLayerList = liveLayers.filter((layer) => layer.id === activeLayer);
    if (filteredLayerList.length > 0) {
      return filteredLayerList[0];
    }
    return null;
  }

  function formatDateForImageStat(dateStr) {
    const dateParts = dateStr.split(' ');
    const year = dateParts[0];
    const month = `0${new Date(Date.parse(dateStr)).getMonth() + 1}`.slice(-2);
    const day = dateParts[2];
    return `${year}-${month}-${day}`;
  }

  function updateChartRequestStatus(status, message = '') {
    updateRequestInProgress(status);
    updateRequestStatusMessage(message);
  }

  /**
   * Provides a default AOI of the entire map if unspecified, and modifies the Openlayers coordinates for use with imageStat API
   * @param {Object} aoi (Area Of Interest)
   */
  function convertOLcoordsForImageStat(aoi) {
    if (aoi == null) {
      return [-90, -180, 90, 180];
    }
    // lat/lon needs to be lon/lat; swap index 0 & 1, and index 2 & 3
    return [aoi[1], aoi[0], aoi[3], aoi[2]];
  }

  /**
   * Returns the ImageStat request parameters based on the provided layer
   * @param {Object} layerInfo
   * @param {String} timeSpanSelection | 'Date' for single date, 'Range' for date range, 'series' for time series charting
   */
  function getImageStatRequestParameters(layerInfo, timeSpan) {
    const startDateForImageStat = formatDateForImageStat(primaryDate);
    const endDateForImageStat = formatDateForImageStat(secondaryDate);
    const AOIForImageStat = convertOLcoordsForImageStat(aoiCoordinates);
    return {
      timestamp: startDateForImageStat, // start date
      endTimestamp: endDateForImageStat, // end date
      type: timeSpan === 'range' ? 'series' : 'date',
      steps: 6, // the number of days selected within a given range/series. Use '1' for just the start and end date, '2' for start date, end date and middle date, etc.
      layer: layerInfo.id, // Layer to be pulled from gibs api. e.g. 'GHRSST_L4_MUR_Sea_Surface_Temperature'
      colormap: `${layerInfo.palette.id}.xml`, // Colormap to use to decipher layer. e.g. 'GHRSST_Sea_Surface_Temperature.xml'
      areaOfInterestCoords: AOIForImageStat, // Bounding box of latitude and longitude.
      bins: 10, // Number of bins to used in returned histogram. e.g. 10
      scale: 1, // unused
    };
  }

  function getImageStatStatsRequestURL(uriParameters) {
    const {
      type,
      timestamp,
      endTimestamp,
      steps,
      layer,
      colormap,
      areaOfInterestCoords,
      bins,
    } = uriParameters;
    let requestURL = `https://d1igaxm6d8pbn2.cloudfront.net/get_stats?_type=${type}&timestamp=${timestamp}&steps=${steps}&layer=${layer}&colormap=${colormap}&bbox=${areaOfInterestCoords}&bins=${bins}`;
    if (type !== 'date') {
      requestURL += `&end_timestamp=${endTimestamp}`;
    }
    return requestURL;
  }

  /**
   * Execute the ImageStat API request
   * @param {String} simpleStatsURI
   */
  async function getImageStatData(simpleStatsURI) {
    const requestOptions = {
      method: 'GET',
      redirect: 'follow',
    };

    try {
      const response = await fetch(simpleStatsURI, requestOptions);
      const data = await response.text();
      // This is the response when the imageStat server fails
      if (data === 'Internal Server Error') {
        return {
          ok: false,
          body: data,
        };
      }

      return {
        ok: true,
        body: JSON.parse(data),
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  function getKeysFromObj(data) {
    return Object.keys(data);
  }

  /**
   * Process the ImageStat (GIBS) data for use in the Recharts library
   * @param {Object} data | This contains the name (dates) & min, max, stddev, etc. for each step requested
   */
  function formatGIBSDataForRecharts(data) {
    const xAxisNames = getKeysFromObj(data.min);
    const rechartsData = [];
    for (let i = 0; i < xAxisNames.length; i += 1) {
      const name = xAxisNames[i];
      const entry = {
        name: name.split('T')[0], // Remove the time element from the date string
        min: data.min[name],
        max: data.max[name],
        mean: data.mean[name],
        median: data.median[name],
        stddev: data.stdev[name],
      };
      rechartsData.push(entry);
    }
    return rechartsData;
  }

  async function onRequestChartClick() {
    updateChartRequestStatus(true);
    const layerInfo = getActiveChartingLayer();
    if (layerInfo == null) {
      updateChartRequestStatus(false, 'No valid layer detected for request.');
      return;
    }
    const requestedLayerSource = layerInfo.projections.geographic.source;
    if (requestedLayerSource === 'GIBS:geographic') {
      const uriParameters = getImageStatRequestParameters(layerInfo, timeSpanSelection);
      const requestURI = getImageStatStatsRequestURL(uriParameters);
      const data = await getImageStatData(requestURI);

      if (!data.ok) {
        updateChartRequestStatus(false, 'Chart request failed.');
        return;
      }

      // unit determination: renderedPalettes
      const paletteName = layerInfo.palette.id;
      const paletteLegend = renderedPalettes[paletteName].maps[0].legend;
      const unitOfMeasure = Object.prototype.hasOwnProperty.call(paletteLegend, 'units') ? `(${paletteLegend.units})` : '';
      console.log(unitOfMeasure);
      const dataToRender = {
        title: layerInfo.title,
        subtitle: layerInfo.subtitle,
        unit: unitOfMeasure,
        ...data.body,
        ...uriParameters,
      };

      if (timeSpanSelection === 'range') {
        const rechartsData = formatGIBSDataForRecharts(dataToRender);
        displayChart({
          title: dataToRender.title,
          subtitle: dataToRender.subtitle,
          unit: dataToRender.unit,
          data: rechartsData,
        });
        updateChartRequestStatus(false, 'Success');
      } else {
        displaySimpleStats(dataToRender);
        updateChartRequestStatus(false, 'Success');
      }
    } else {
      // handle requests for layers outside of GIBS here!
      updateChartRequestStatus(false, 'Unable to process non-GIBS layer.');
    }
  }

  function onDateIconClick() {
    const layerInfo = getActiveChartingLayer();
    const layerStartDate = new Date(layerInfo.dateRanges[0].startDate);
    const layerEndDate = new Date(layerInfo.dateRanges[layerInfo.dateRanges.length - 1].endDate);
    openChartingDateModal({ layerStartDate, layerEndDate }, timeSpanSelection);
  }

  const aoiTextPrompt = aoiSelected ? 'Area of Interest Selected' : 'Select Area of Interest';
  const oneDateBtnStatus = timeSpanSelection === 'date' ? 'btn-active' : '';
  const dateRangeBtnStatus = timeSpanSelection === 'date' ? '' : 'btn-active';
  const dateRangeValue = timeSpanSelection === 'range' ? `${primaryDate} - ${secondaryDate}` : primaryDate;
  const chartRequestMessage = chartRequestInProgress ? 'In progress...' : '';

  return (
    <div
      id="wv-charting-mode-container"
      className="wv-charting-mode-container"
      style={{ display: isChartingActive && !isMobile ? 'block' : 'none' }}
    >
      <div className="charting-aoi-container">
        <h3>{aoiTextPrompt}</h3>
        <FontAwesomeIcon
          icon={faPencilAlt}
          onClick={onAreaOfInterestButtonClick}
        />
      </div>
      <div className="charting-timespan-container">
        <h3>Time Span:</h3>
        <ButtonGroup size="sm">
          <Button
            id="charting-date-single-button"
            className={`charting-button ${oneDateBtnStatus}`}
            onClick={() => onChartDateButtonClick('date')}
          >
            One Date
          </Button>
          <Button
            id="charting-date-range-button"
            className={`charting-button ${dateRangeBtnStatus}`}
            onClick={() => onChartDateButtonClick('range')}
          >
            Date Range
          </Button>
        </ButtonGroup>
      </div>
      <div className="charting-date-row">
        <div className="charting-date-container">
          {dateRangeValue}
        </div>
        <div className="charting-icons">
          <div id="charting-calendar-container" className="charting-calendar-container">
            <FontAwesomeIcon
              icon={faCalendarDay}
              onClick={onDateIconClick}
            />
          </div>
          <div id="charting-info-container" className="charting-info-container">
            <FontAwesomeIcon
              icon="info-circle"
              onClick={openChartingInfoModal}
            />
          </div>
        </div>
      </div>
      <div className="charting-buttons">
        <ButtonGroup size="sm">
          <Button
            id="charting-create-chart-button"
            className="charting-button"
            disabled={chartRequestInProgress}
            onClick={() => onRequestChartClick()}
          >
            Request Chart
          </Button>
        </ButtonGroup>
      </div>
      <div className="charting-request-status">
        {chartRequestMessage}
      </div>
      <div className="charting-request-status">
        {requestStatusMessage}
      </div>
    </div>
  );
}

const mapStateToProps = (state) => {
  const {
    charting, map, proj, config, layers, date, palettes,
  } = state;
  const renderedPalettes = palettes.rendered;
  const activeLayers = layers.active.layers;
  const { crs } = proj.selected;
  const {
    activeLayer, aoiActive, aoiCoordinates, aoiSelected, chartRequestInProgress, timeSpanSelection, timeSpanStartDate, timeSpanEndDate, requestStatusMessage,
  } = charting;
  const projections = Object.keys(config.projections).map((key) => config.projections[key].crs);
  const timelineStartDate = date.selected;
  const timelineEndDate = date.selectedB;
  return {
    activeLayers,
    activeLayer,
    aoiActive,
    aoiCoordinates,
    aoiSelected,
    chartRequestInProgress,
    crs,
    olMap: map.ui.selected,
    proj,
    projections,
    renderedPalettes,
    requestStatusMessage,
    timeSpanSelection,
    timeSpanEndDate,
    timeSpanStartDate,
    timelineStartDate,
    timelineEndDate,
  };
};

const mapDispatchToProps = (dispatch) => ({
  toggleAreaOfInterestActive: () => {
    dispatch(toggleChartingAOIOnOff());
  },
  toggleAreaOfInterestSelected: (featureSetting) => {
    dispatch(toggleAOISelected(featureSetting));
  },
  updateAOICoordinates: (extent) => {
    dispatch(updateChartingAOICoordinates(extent));
  },
  updateRequestInProgress: (status) => {
    dispatch(updateRequestInProgressAction(status));
  },
  updateRequestStatusMessage: (message) => {
    dispatch(updateRequestStatusMessageAction(message));
  },
  openChartingInfoModal: () => {
    dispatch(
      openCustomContent('CHARTING_INFO_MODAL', {
        headerText: 'Charting Tool',
        backdrop: false,
        bodyComponent: ChartingInfo,
        wrapClassName: 'clickable-behind-modal',
        modalClassName: 'global-settings-modal toolbar-info-modal toolbar-modal',
      }),
    );
  },
  openChartingDateModal: (dateObj, timeSpanSelection) => {
    dispatch(
      openCustomContent('CHARTING_DATE_MODAL', {
        headerText: 'Charting Mode Date Selection',
        backdrop: false,
        bodyComponent: ChartingDateSelector,
        wrapClassName: 'clickable-behind-modal',
        modalClassName: 'global-settings-modal toolbar-info-modal toolbar-modal',
        bodyComponentProps: {
          layerStartDate: dateObj.layerStartDate,
          layerEndDate: dateObj.layerEndDate,
          timeSpanSelection,
        },
      }),
    );
  },
  onChartDateButtonClick: (buttonClicked) => {
    dispatch(updateChartingDateSelection(buttonClicked));
  },
  displaySimpleStats: (data) => {
    dispatch(
      openCustomContent('CHARTING_STATS_MODAL', {
        headerText: `${data.title} - ${data.subtitle} Simple Statistics`,
        backdrop: false,
        bodyComponent: SimpleStatistics,
        wrapClassName: 'unclickable-behind-modal',
        modalClassName: 'stats-dialog',
        type: 'selection', // This forces the user to specifically close the modal
        bodyComponentProps: {
          data,
        },
      }),
    );
  },
  displayChart: (liveData) => {
    dispatch(
      openCustomContent('CHARTING-CHART', {
        headerText: `${liveData.title} - ${liveData.subtitle} ${liveData.unit}`,
        backdrop: false,
        bodyComponent: ChartComponent,
        wrapClassName: 'unclickable-behind-modal',
        modalClassName: 'chart-dialog',
        type: 'selection', // This forces the user to specifically close the modal
        bodyComponentProps: {
          liveData,
        },
      }),
    );
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChartingModeOptions);

ChartingModeOptions.propTypes = {
  activeLayers: PropTypes.array,
  activeLayer: PropTypes.string,
  isChartingActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  aoiSelected: PropTypes.bool,
  chartRequestInProgress: PropTypes.bool,
  aoiCoordinates: PropTypes.array,
  requestStatusMessage: PropTypes.string,
  timeSpanSelection: PropTypes.string,
  timeSpanStartDate: PropTypes.instanceOf(Date),
  timeSpanEndDate: PropTypes.instanceOf(Date),
  toggleAreaOfInterestActive: PropTypes.func,
  toggleAreaOfInterestSelected: PropTypes.func,
  updateRequestInProgress: PropTypes.func,
  updateRequestStatusMessage: PropTypes.func,
  updateAOICoordinates: PropTypes.func,
  openChartingInfoModal: PropTypes.func,
  openChartingDateModal: PropTypes.func,
  onChartDateButtonClick: PropTypes.func,
  displaySimpleStats: PropTypes.func,
  displayChart: PropTypes.func,
  olMap: PropTypes.object,
  crs: PropTypes.string,
  proj: PropTypes.object,
  renderedPalettes: PropTypes.object,
  projections: PropTypes.array,
  aoiActive: PropTypes.bool,
  timelineStartDate: PropTypes.instanceOf(Date),
  timelineEndDate: PropTypes.instanceOf(Date),
};
