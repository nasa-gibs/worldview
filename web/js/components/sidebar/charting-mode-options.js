import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import { connect } from 'react-redux';
import { Draw as OlInteractionDraw } from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw.js';
import { Vector as OlVectorLayer } from 'ol/layer';
import { transform } from 'ol/proj';
import { Vector as OlVectorSource } from 'ol/source';
import {
  toggleChartingAOIOnOff,
  updateChartingAOICoordinates,
  toggleAOISelected,
  updateChartingDateSelection,
} from '../../modules/charting/actions';
import { openCustomContent } from '../../modules/modal/actions';
import { CRS } from '../../modules/map/constants';
import { areCoordinatesWithinExtent } from '../../modules/location-search/util';
import ChartingInfo from '../charting/charting-info.js';
import ChartingStatistics from '../charting/charting-statistics.js';
import ChartingDateComponent from '../charting/charting-date-component';
import ChartingChartComponent from '../charting/charting-chart-component';
import {
  drawStyles, vectorStyles,
} from '../charting/charting-aoi-style.js';

const AOIFeatureObj = {};
const vectorLayers = {};
const sources = {};
let init = false;
let draw;

function ChartingModeOptions (props) {
  const {
    activeLayer,
    activeLayers,
    toggleAreaOfInterestActive,
    toggleAreaOfInterestSelected,
    updateAOICoordinates,
    openChartingInfoModal,
    onChartDateButtonClick,
    displaySimpleStats,
    displayChart,
    openChartingDateModal,
    olMap,
    crs,
    proj,
    projections,
    isChartingActive,
    isMobile,
    aoiSelected,
    aoiActive,
    aoiCoordinates,
    timeSpanSelection,
    timeSpanStartDate,
    timeSpanEndDate,
    timelineStartDate,
    timelineEndDate,
  } = props;

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

  /**
   * Processes the start & end times & aligns them with the timeline if values are undefined
   */
  function initializeDates(start, end) {
    let startDate;
    let endDate;
    if (start === undefined) {
      startDate = timelineStartDate; // SHOULD BE date.selected
    } else {
      startDate = start;
    }
    if (end === undefined) {
      endDate = timelineEndDate;
    } else {
      endDate = end; // should be date.selectedB
    }
    return { initialStartDate: startDate, initialEndDate: endDate };
  }

  const onAreaOfInterestButtonClick = (evt) => {
    toggleAreaOfInterestActive();
    if (!aoiActive) {
      beginDrawingAOI();
    } else {
      endDrawingAreaOfInterest();
    }
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

  /**
   * Triggers when draw is completed
   */
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

  /**
   * End the AOI draw interaction
   */
  function endDrawingAreaOfInterest () {
    if (draw) {
      olMap.removeInteraction(draw);
    }
  }

  /**
   * Clear any existing AOI's from the current map projection
   */
  function resetAreaOfInterest() {
    Object.values(AOIFeatureObj[crs]).forEach(
      ({ feature, overlay }) => {
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

  function getAreaOfInterestCoordinates(geometry) {
    updateAOICoordinates(geometry.getExtent());
  }

  function getActiveChartingLayer() {
    const liveLayers = getLiveLayers();
    const filteredLayerList = liveLayers.filter((layer) => layer.id === activeLayer);
    if (filteredLayerList.length > 0) {
      return filteredLayerList[0];
    }
    return null;
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

  function getFormattedDateForRequest(dateStr) {
    const dateParts = dateStr.split(' ');
    const year = dateParts[0];
    const month = `0${new Date(Date.parse(dateStr)).getMonth() + 1}`.slice(-2);
    const day = dateParts[2];
    return `${year}-${month}-${day}`;
  }

  async function onChartOrStatsButtonClick(requestType) {
    const layerInfo = getActiveChartingLayer();
    if (layerInfo == null) {
      // abort with warning
      console.log('No valid layer detected.');
      return;
    }
    const uriParameters = getRequestParameters(layerInfo, requestType);
    const requestURI = getSimpleStatsRequestURL(uriParameters);
    const data = await getRequestData(requestURI);
    const dataToRender = {
      title: layerInfo.title, subtitle: layerInfo.subtitle, ...data, ...uriParameters,
    };
    if (requestType === 'chart') {
      const rechartsData = formatDataForRecharts(dataToRender);
      displayChart({ title: dataToRender.title, subtitle: dataToRender.subtitle, data: rechartsData });
    } else {
      displaySimpleStats(dataToRender);
    }
  }

  function getFormattedAreaOfInterest(aoi) {
    if (aoi == null) {
      return [-90, -180, 90, 180];
    }
    // lat/lon needs to be lon/lat; swap index 0 & 1, and index 2 & 3
    return [aoi[1], aoi[0], aoi[3], aoi[2]];
  }
  function getRequestParameters(layerInfo, requestType) {
    const formattedStartDate = getFormattedDateForRequest(primaryDate);
    const formattedEndDate = getFormattedDateForRequest(secondaryDate);
    const formattedAreaOfInterest = getFormattedAreaOfInterest(aoiCoordinates);
    return {
      timestamp: formattedStartDate, // start date
      endTimestamp: formattedEndDate, // end date
      type: requestType === 'chart' ? 'series' : timeSpanSelection, // Use 'date' for a single date, 'range' for a summary of a range, or 'series' for data from a sample of dates within a range.
      steps: 10, // the number of days selected within a given range/series. Use '1' for just the start and end date, '2' for start date, end date and middle date, etc.
      layer: layerInfo.id, // Layer to be pulled from gibs api. e.g. 'GHRSST_L4_MUR_Sea_Surface_Temperature'
      colormap: `${layerInfo.palette.id}.xml`, // Colormap to use to decipher layer. e.g. 'GHRSST_Sea_Surface_Temperature.xml'
      areaOfInterestCoords: formattedAreaOfInterest, // Bounding box of latitude and longitude.
      bins: 10, // Number of bins to used in returned histogram. e.g. 10
      scale: 1, // unused
    };
  }

  function getSimpleStatsRequestURL(uriParameters) {
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

  async function getRequestData(simpleStatsURI) {
    const requestOptions = {
      method: 'GET',
      redirect: 'follow',
    };

    try {
      const response = await fetch(simpleStatsURI, requestOptions);
      const data = await response.text();
      return JSON.parse(data);
    } catch (error) {
      console.log('Error requesting simple statistis', error);
    }
  }

  function formatDataForRecharts(data) {
    // min, max, mean, median, stdev
    const xAxisNames = getXAxisNames(data.min);
    const rechartsData = [];
    for (let i = 0; i < xAxisNames.length; i++) {
      const name = xAxisNames[i];
      const entry = {
        name: name.split('T')[0],
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

  function getXAxisNames(data) {
    return Object.keys(data);
  }

  let aoiTextPrompt = 'Select Area of Interest';
  if (aoiSelected) {
    aoiTextPrompt = 'Area of Interest Selected';
  }

  let singleDateBtnStatus = '';
  let dateRangeBtnStatus = '';
  if (timeSpanSelection === 'date') {
    singleDateBtnStatus = 'btn-active';
    dateRangeBtnStatus = '';
  } else {
    singleDateBtnStatus = '';
    dateRangeBtnStatus = 'btn-active';
  }

  let dateRangeValue = primaryDate;
  if (timeSpanSelection === 'range') {
    dateRangeValue = `${primaryDate} - ${secondaryDate}`;
  }

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
            className={`charting-button ${singleDateBtnStatus}`}
            onClick={() => onChartDateButtonClick('date')}
          >
            Single Date
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
          <div className="charting-calendar-container">
            <FontAwesomeIcon
              icon={faCalendarDay}
              onClick={openChartingDateModal}
            />
          </div>
          <div className="charting-info-container">
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
            id="charting-simple-stats-button"
            className="charting-button"
            onClick={() => onChartOrStatsButtonClick('stats')}
          >
            Request Simple Stats
          </Button>
          <Button
            id="charting-create-chart-button"
            className="charting-button"
            onClick={() => onChartOrStatsButtonClick('chart')}
          >
            Request Chart
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}

const mapStateToProps = (state, ownProps) => {
  const {
    charting, map, proj, config, layers, date,
  } = state;
  const activeLayers = layers.active.layers;
  const { crs } = proj.selected;
  const {
    activeLayer, aoiActive, aoiCoordinates, aoiSelected, timeSpanSelection, timeSpanStartDate, timeSpanEndDate,
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
    crs,
    olMap: map.ui.selected,
    proj,
    projections,
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
  openChartingInfoModal: () => {
    // This is the charting tool info window from the wireframes
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
  openChartingDateModal: () => {
    dispatch(
      openCustomContent('CHARTING_DATE_MODAL', {
        headerText: 'Charting Mode Date Selection',
        backdrop: false,
        bodyComponent: ChartingDateComponent,
        wrapClassName: 'clickable-behind-modal',
        modalClassName: 'global-settings-modal toolbar-info-modal toolbar-modal',
      }),
    );
  },
  onChartDateButtonClick: (buttonClicked) => {
    dispatch(updateChartingDateSelection(buttonClicked));
  },
  displaySimpleStats: (data) => {
    // This is the modal to display the simple charting stats
    dispatch(
      openCustomContent('CHARTING-STATISTICS', {
        headerText: `${data.title} - ${data.subtitle} Simple Statistics`,
        backdrop: false,
        bodyComponent: ChartingStatistics,
        wrapClassName: 'clickable-behind-modal',
        modalClassName: 'stats-dialog',
        bodyComponentProps: {
          data,
        },
      }),
    );
  },
  displayChart: (liveData) => {
    console.log(liveData);
    dispatch(
      openCustomContent('CHARTING-CHART', {
        headerText: `${liveData.title} - ${liveData.subtitle}`,
        backdrop: false,
        bodyComponent: ChartingChartComponent,
        wrapClassName: 'clickable-behind-modal',
        modalClassName: 'chart-dialog',
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
  aoiCoordinates: PropTypes.array,
  timeSpanSelection: PropTypes.string,
  timeSpanStartDate: PropTypes.instanceOf(Date),
  timeSpanEndDate: PropTypes.instanceOf(Date),
  toggleAreaOfInterestActive: PropTypes.func,
  toggleAreaOfInterestSelected: PropTypes.func,
  updateAOICoordinates: PropTypes.func,
  openChartingInfoModal: PropTypes.func,
  openChartingDateModal: PropTypes.func,
  onChartDateButtonClick: PropTypes.func,
  displaySimpleStats: PropTypes.func,
  displayChart: PropTypes.func,
  olMap: PropTypes.object,
  crs: PropTypes.string,
  proj: PropTypes.object,
  projections: PropTypes.array,
  aoiActive: PropTypes.bool,
  timelineStartDate: PropTypes.instanceOf(Date),
  timelineEndDate: PropTypes.instanceOf(Date),
};
