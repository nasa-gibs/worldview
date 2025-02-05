import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as olProj from 'ol/proj';
import { Button, ButtonGroup, UncontrolledTooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Vector as OlVectorSource } from 'ol/source';
import CustomButton from '../util/button';
import Crop from '../util/image-crop';
import util from '../../util/util';
import {
  toggleChartingAOIOnOff,
  updateChartingAOICoordinates,
  updateChartingDateSelection,
  updateRequestInProgressAction,
  updateModalOpenAction,
  updateRequestStatusMessageAction,
  changeChartingStartDate,
  changeChartingEndDate,
} from '../../modules/charting/actions';
import { openCustomContent } from '../../modules/modal/actions';
import { CRS } from '../../modules/map/constants';
import ChartingInfo from '../charting/charting-info';
import SimpleStatistics from '../charting/simple-statistics';
import ChartingDateSelector from '../charting/charting-date-selector';
import ChartComponent from '../charting/chart-component';

const AOIFeatureObj = {};
const vectorLayers = {};
const sources = {};
let init = false;

function ChartingModeOptions(props) {
  const {
    activeLayer,
    activeLayers,
    aoiActive,
    aoiCoordinates,
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
    projections,
    renderedPalettes,
    requestStatusMessage,
    timelineStartDate,
    timelineEndDate,
    timeSpanEndDate,
    timeSpanSelection,
    timeSpanStartDate,
    toggleAreaOfInterestActive,
    updateAOICoordinates,
    updateRequestInProgress,
    updateModalOpen,
    updateRequestStatusMessage,
    screenHeight,
    screenWidth,
    onUpdateStartDate,
    onUpdateEndDate,
    fromButton,
    isChartOpen,
    isModalOpen,
    modalId,
  } = props;

  if (!olMap) return null;

  const [isPostRender, setIsPostRender] = useState(false);
  const [boundaries, setBoundaries] = useState({
    x: screenWidth / 2 - 100,
    y: screenHeight / 2 - 100,
    x2: screenWidth / 2 + 100,
    y2: screenHeight / 2 + 100,
  });
  const {
    x, y, y2, x2,
  } = boundaries;

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

  function getActiveChartingLayer() {
    const liveLayers = getLiveLayers();
    const filteredLayerList = liveLayers.filter((layer) => layer.id === activeLayer);
    if (filteredLayerList.length > 0) {
      return filteredLayerList[0];
    }
    return null;
  }

  const { initialStartDate, initialEndDate } = initializeDates(timeSpanStartDate, timeSpanEndDate);
  const primaryDate = formatDateString(initialStartDate);
  const secondaryDate = formatDateString(initialEndDate);

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
    onUpdateStartDate(initialStartDate);
    onUpdateEndDate(initialEndDate);
  }, []);

  useEffect(() => {
    if (fromButton) {
      setIsPostRender(true);
    }
  }, [fromButton]);

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

  useEffect(() => {
    if (modalId === 'CHARTING-CHART' || modalId === 'CHARTING_STATS_MODAL') {
      updateModalOpen(isModalOpen);
      if (!isModalOpen) {
        updateChartRequestStatus(false, '');
      }
    }
  }, [isModalOpen, modalId]);

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
      steps: 20, // the number of days selected within a given range/series. Use '1' for just the start and end date, '2' for start date, end date and middle date, etc.
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
    let requestURL = `https://worldview.sit.earthdata.nasa.gov/service/imagestat/get_stats?_type=${type}&timestamp=${timestamp}&steps=${steps}&layer=${layer}&colormap=${colormap}&bbox=${areaOfInterestCoords}&bins=${bins}`;
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
    if (chartRequestInProgress) return;
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
        updateChartRequestStatus(false, 'An error has occurred while requesting the charting data. Please try again in a few minutes.');
        return;
      }

      // unit determination: renderedPalettes
      const paletteName = layerInfo.palette.id;
      const paletteLegend = renderedPalettes[paletteName].maps[0].legend;
      const unitOfMeasure = Object.prototype.hasOwnProperty.call(paletteLegend, 'units') ? `(${paletteLegend.units})` : '';
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

  useEffect(() => {
    const isOpen = (modalId === 'CHARTING-CHART' || modalId === 'CHARTING_STATS_MODAL') && isModalOpen;
    if (isChartOpen && !isOpen && Object.keys(renderedPalettes).length > 0) {
      const layerInfo = getActiveChartingLayer();
      const paletteName = layerInfo.palette.id;
      if (renderedPalettes[paletteName]) {
        onRequestChartClick();
      }
    }
  }, [isChartOpen, renderedPalettes]);

  function onDateIconClick() {
    const layerInfo = getActiveChartingLayer();
    const layerStartDate = new Date(layerInfo.dateRanges[0].startDate);
    const layerEndDate = new Date(layerInfo.dateRanges[layerInfo.dateRanges.length - 1].endDate);
    const dateModalInput = {
      layerStartDate,
      layerEndDate,
      timeSpanStartDate: primaryDate,
      timeSpanEndDate: secondaryDate,
    };
    openChartingDateModal(dateModalInput, timeSpanSelection);
  }

  /**
   * Convert pixel value to latitude longitude value
   * @param {Array} pixelX
   * @param {Array} pixelY
   *
   * @returns {Array}
   */
  function getLatLongFromPixelValue(pixelX, pixelY) {
    const coordinate = olMap.getCoordinateFromPixel([Math.floor(pixelX), Math.floor(pixelY)]);
    if (!coordinate) return [0, 0];
    const [x, y] = olProj.transform(coordinate, crs, CRS.GEOGRAPHIC);

    return [Number(x.toFixed(4)), Number(y.toFixed(4))];
  }

  const [bottomLeftLatLong, setBottomLeftLatLong] = useState(getLatLongFromPixelValue(x, y2));
  const [topRightLatLong, setTopRightLatLong] = useState(getLatLongFromPixelValue(x2, y));

  olMap.once('postrender', () => {
    setIsPostRender(true);
    if (isPostRender || !aoiCoordinates || aoiCoordinates.length === 0) return;
    const bottomLeft = olMap.getPixelFromCoordinate([aoiCoordinates[0], aoiCoordinates[1]]);
    const topRight = olMap.getPixelFromCoordinate([aoiCoordinates[2], aoiCoordinates[3]]);
    const newBoundaries = {
      x: bottomLeft[0],
      y: topRight[1],
      x2: topRight[0],
      y2: bottomLeft[1],
    };
    setBoundaries(newBoundaries);
    setBottomLeftLatLong(getLatLongFromPixelValue(x, y2));
    setTopRightLatLong(getLatLongFromPixelValue(x2, y));
  });

  /**
  * Update latitude longitude values on
  * crop change
  * @param {Object} boundaries
  *
  * @returns {null}
  */
  function onBoundaryUpdate(boundaries) {
    const {
      x, y, width, height,
    } = boundaries;
    const newBoundaries = {
      x,
      y,
      x2: x + width,
      y2: y + height,
    };
    setBoundaries(newBoundaries);
    const bottomLeft = getLatLongFromPixelValue(newBoundaries.x, newBoundaries.y2);
    const topRight = getLatLongFromPixelValue(newBoundaries.x2, newBoundaries.y);
    setBottomLeftLatLong(bottomLeft);
    setTopRightLatLong(topRight);
    updateAOICoordinates([...bottomLeft, ...topRight]);
  }

  const onAreaOfInterestButtonClick = (setAOIActive) => {
    if (setAOIActive) {
      updateAOICoordinates(null);
    } else {
      const {
        x, y, x2, y2,
      } = boundaries;
      onBoundaryUpdate({
        x, y, width: x2 - x, height: y2 - y,
      });
    }
    if (aoiActive !== setAOIActive) {
      toggleAreaOfInterestActive();
    }
  };

  const layerInfo = getActiveChartingLayer();
  const aoiTextPrompt = 'Area of Interest:';
  const oneDateBtnStatus = timeSpanSelection === 'date' ? 'btn-active' : '';
  const dateRangeBtnStatus = timeSpanSelection === 'date' ? '' : 'btn-active';
  const dateRangeValue = timeSpanSelection === 'range' ? `${primaryDate} - ${secondaryDate}` : primaryDate;
  const chartRequestMessage = chartRequestInProgress ? 'In progress...' : '';
  const requestBtnText = timeSpanSelection === 'date' ? 'Generate Statistics' : 'Generate Chart';
  const entireScreenBtnStatus = aoiActive ? '' : 'btn-active';
  const aoiSelectedBtnStatus = aoiActive ? 'btn-active' : '';

  return (
    <div
      id="wv-charting-mode-container"
      className="wv-charting-mode-container"
      style={{ display: isChartingActive && !isMobile ? 'block' : 'none' }}
    >
      <h1 className="charting-title">Charting Mode - BETA</h1>
      <div id="charting-info-container" className="charting-info-container">
        <span id="charting-info-icon">
          <FontAwesomeIcon
            icon="info-circle"
            onClick={openChartingInfoModal}
          />
          <UncontrolledTooltip
            id="center-align-tooltip"
            placement="bottom"
            target="charting-info-icon"
          >
            Charting Information
          </UncontrolledTooltip>
        </span>
      </div>
      <div className="charting-subtitle">
        <h3>Layer: </h3>
        <span id="charting-layer-name">
          {layerInfo && layerInfo.title}
          <UncontrolledTooltip
            id="center-align-tooltip"
            placement="right"
            target="charting-layer-name"
          >
            {layerInfo && layerInfo.title}
          </UncontrolledTooltip>
        </span>
      </div>
      <div className="charting-aoi-title-container">
        <h3>{aoiTextPrompt}</h3>
      </div>
      <div className="charting-aoi-container">
        <ButtonGroup>
          <Button
            id="charting-date-single-button"
            className={`charting-button ${entireScreenBtnStatus}`}
            onClick={() => onAreaOfInterestButtonClick(false)}
          >
            Entire Screen
          </Button>
          <Button
            id="charting-date-range-button"
            className={`charting-button ${aoiSelectedBtnStatus}`}
            onClick={() => onAreaOfInterestButtonClick(true)}
          >
            Area Selected
          </Button>
        </ButtonGroup>
      </div>
      <div className="charting-timespan-container">
        <h3>Time:</h3>
        <ButtonGroup>
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
          <CustomButton
            id="charting-date-button"
            aria-label={dateRangeValue}
            className="charting-date-button btn"
            onClick={onDateIconClick}
            text={dateRangeValue}
          />
        </div>
      </div>
      <div className="charting-buttons">
        <CustomButton
          id="charting-create-button"
          aria-label={requestBtnText}
          className="charting-create-button btn wv-button red"
          onClick={() => onRequestChartClick()}
          valid={!chartRequestInProgress}
          text={requestBtnText}
        />
      </div>
      <div className="charting-request-status">
        {chartRequestMessage}
        {requestStatusMessage}
      </div>
      <div className="charting-request-status" />
      {aoiActive && isPostRender && (
        <Crop
          x={x}
          y={y}
          width={x2 - x}
          height={y2 - y}
          maxHeight={screenHeight}
          maxWidth={screenWidth}
          onChange={onBoundaryUpdate}
          onClose={() => onAreaOfInterestButtonClick(false)}
          bottomLeftStyle={{
            left: x,
            top: y2 + 5,
            width: x2 - x,
          }}
          topRightStyle={{
            left: x,
            top: y - 20,
            width: x2 - x,
          }}
          coordinates={{
            bottomLeft: util.formatCoordinate(bottomLeftLatLong),
            topRight: util.formatCoordinate(topRightLatLong),
          }}
          showCoordinates
        />
      )}
    </div>
  );
}

const mapStateToProps = (state) => {
  const {
    charting, map, proj, config, layers, date, palettes, screenSize, modal,
  } = state;
  const renderedPalettes = palettes.rendered;
  const activeLayers = layers.active.layers;
  const { crs } = proj.selected;
  const { screenWidth, screenHeight } = screenSize;
  const {
    activeLayer, aoiActive, aoiCoordinates, aoiSelected, chartRequestInProgress, timeSpanSelection, timeSpanStartDate, timeSpanEndDate, requestStatusMessage, fromButton, isChartOpen,
  } = charting;
  const {
    isOpen, id,
  } = modal;
  const projections = Object.keys(config.projections).map((key) => config.projections[key].crs);
  const timelineStartDate = date.selected < date.selectedB ? date.selected : date.selectedB;
  const timelineEndDate = date.selected < date.selectedB ? date.selectedB : date.selected;
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
    screenWidth,
    screenHeight,
    fromButton,
    isChartOpen,
    isModalOpen: isOpen,
    modalId: id,
  };
};

const mapDispatchToProps = (dispatch) => ({
  toggleAreaOfInterestActive: () => {
    dispatch(toggleChartingAOIOnOff());
  },
  updateAOICoordinates: (extent) => {
    dispatch(updateChartingAOICoordinates(extent));
  },
  updateRequestInProgress: (status) => {
    dispatch(updateRequestInProgressAction(status));
  },
  updateModalOpen: (status) => {
    dispatch(updateModalOpenAction(status));
  },
  updateRequestStatusMessage: (message) => {
    dispatch(updateRequestStatusMessageAction(message));
  },
  openChartingInfoModal: () => {
    dispatch(
      openCustomContent('CHARTING_INFO_MODAL', {
        headerText: 'Charting Tool - BETA',
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
  onUpdateStartDate(date) {
    dispatch(changeChartingStartDate(date));
  },
  onUpdateEndDate(date) {
    dispatch(changeChartingEndDate(date));
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
  updateRequestInProgress: PropTypes.func,
  updateModalOpen: PropTypes.func,
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
  fromButton: PropTypes.bool,
  isChartOpen: PropTypes.bool,
  isModalOpen: PropTypes.bool,
  modalId: PropTypes.string,
};
