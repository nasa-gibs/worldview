import React, { useState, useEffect, useRef } from 'react';
import {
  debounce as lodashDebounce,
} from 'lodash';
import PropTypes from 'prop-types';
import * as olProj from 'ol/proj';
import {
  Button,
  ButtonGroup,
  UncontrolledTooltip,
  Spinner,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Vector as OlVectorSource } from 'ol/source';
import CustomButton from '../util/button';
import Crop from '../util/image-crop';
import util from '../../util/util';
import {
  updateChartingAOICoordinates,
  updateChartingDateSelection,
  updateRequestInProgressAction,
  updateModalOpenAction,
  changeChartingStartDate,
  changeChartingEndDate,
} from '../../modules/charting/actions';
import { openCustomContent } from '../../modules/modal/actions';
import { CRS } from '../../modules/map/constants';
import ChartingInfo from '../charting/charting-info';
import ChartingError from '../charting/charting-error';
import SimpleStatistics from '../charting/simple-statistics';
import ChartingDateSelector from '../charting/charting-date-selector';
import ChartComponent from '../charting/chart-component';
import LatLongSelect from '../image-download/lat-long-inputs';
import Checkbox from '../util/checkbox';

const AOIFeatureObj = {};
const vectorLayers = {};
const sources = {};
let init = false;
const STEP_NUM = 31;

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
    openChartingErrorModal,
    olMap,
    projections,
    renderedPalettes,
    timelineStartDate,
    timelineEndDate,
    timeSpanEndDate,
    timeSpanSelection,
    timeSpanStartDate,
    updateAOICoordinates,
    updateRequestInProgress,
    updateModalOpen,
    screenHeight,
    screenWidth,
    onUpdateStartDate,
    onUpdateEndDate,
    fromButton,
    isChartOpen,
    isModalOpen,
    modalId,
    sidebarHeight,
    viewExtent,
    maxExtent,
  } = props;

  if (!olMap) return null;

  const isMounted = useRef(false);
  const [isPostRender, setIsPostRender] = useState(false);
  const [mapViewChecked, setMapViewChecked] = useState(false);
  const [isWithinWings, setIsWithinWings] = useState(false);
  const [boundaries, setBoundaries] = useState({
    x: screenWidth / 2 - 100,
    y: screenHeight / 2 - 100,
    x2: screenWidth / 2 + 100,
    y2: screenHeight / 2 + 100,
  });
  const {
    x, y, y2, x2,
  } = boundaries;

  const debouncedUpdateAOICoordinates = lodashDebounce(updateAOICoordinates, 50);

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
    isMounted.current = true;
    onUpdateStartDate(initialStartDate);
    onUpdateEndDate(initialEndDate);
    if (maxExtent) {
      let inLeftWing;
      let inRightWing;
      if (aoiCoordinates && aoiCoordinates.length > 0) {
        inLeftWing = aoiCoordinates[0] < maxExtent[0] && aoiCoordinates[2] < maxExtent[0];
        inRightWing = aoiCoordinates[0] > maxExtent[2] && aoiCoordinates[2] > maxExtent[2];
      } else {
        inLeftWing = bottomLeftLatLong[0] < maxExtent[0] && topRightLatLong[0] < maxExtent[0];
        inRightWing = bottomLeftLatLong[0] > maxExtent[2] && topRightLatLong[0] > maxExtent[2];
      }
      setIsWithinWings(inLeftWing || inRightWing);
    }
    return () => {
      isMounted.current = false;
    };
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

  function updateChartRequestStatus(status) {
    updateRequestInProgress(status);
  }

  useEffect(() => {
    if (modalId === 'CHARTING-CHART' || modalId === 'CHARTING-STATS-MODAL') {
      updateModalOpen(isModalOpen);
      if (!isModalOpen) {
        updateChartRequestStatus(false);
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
      steps: STEP_NUM, // the number of days selected within a given range/series. Use '1' for just the start and end date, '2' for start date, end date and middle date, etc.
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
    let requestURL = `https://worldview.earthdata.nasa.gov/service/imagestat/get_stats?_type=${type}&timestamp=${timestamp}&steps=${steps}&layer=${layer}&colormap=${colormap}&bbox=${areaOfInterestCoords}&bins=${bins}`;
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

  function formatToThreeDigits(str) {
    return parseFloat(parseFloat(str).toFixed(3));
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
        min: formatToThreeDigits(data.min[name]),
        max: formatToThreeDigits(data.max[name]),
        mean: formatToThreeDigits(data.mean[name]),
        median: formatToThreeDigits(data.median[name]),
        stddev: formatToThreeDigits(data.stdev[name]),
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
      updateChartRequestStatus(false);
      openChartingErrorModal('No valid layer detected for request.');
      return;
    }
    const requestedLayerSource = layerInfo.projections.geographic.source;
    if (requestedLayerSource === 'GIBS:geographic') {
      const uriParameters = getImageStatRequestParameters(layerInfo, timeSpanSelection);
      const requestURI = getImageStatStatsRequestURL(uriParameters);
      const data = await getImageStatData(requestURI);

      if (!isMounted.current) {
        updateChartRequestStatus(false);
        return;
      }

      if (!data.ok) {
        updateChartRequestStatus(false);
        openChartingErrorModal('An error has occurred while requesting the charting data. Please try again in a few minutes.');
        return;
      }

      // unit determination: renderedPalettes
      const paletteName = layerInfo.palette.id;
      const paletteLegend = renderedPalettes[paletteName].maps[0].legend;
      const unitOfMeasure = Object.prototype.hasOwnProperty.call(paletteLegend, 'units') ? `${paletteLegend.units}` : '';
      const dataToRender = {
        title: layerInfo.title,
        subtitle: layerInfo.subtitle,
        unit: unitOfMeasure,
        ...data.body,
        ...uriParameters,
      };

      if (timeSpanSelection === 'range') {
        const rechartsData = formatGIBSDataForRecharts(dataToRender);
        const numRangeDays = Math.floor((Date.parse(initialEndDate) - Date.parse(initialStartDate)) / 86400000);
        displayChart({
          title: dataToRender.title,
          subtitle: dataToRender.subtitle,
          unit: dataToRender.unit,
          data: rechartsData,
          startDate: primaryDate,
          endDate: secondaryDate,
          numRangeDays,
          isTruncated: numRangeDays > STEP_NUM,
          STEP_NUM,
        });
        updateChartRequestStatus(false);
      } else {
        displaySimpleStats(dataToRender);
        updateChartRequestStatus(false);
      }
    } else {
      // handle requests for layers outside of GIBS here!
      updateChartRequestStatus(false);
    }
  }

  useEffect(() => {
    const isOpen = (modalId === 'CHARTING-CHART' || modalId === 'CHARTING-STATS-MODAL') && isModalOpen;
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
    document.body.style.setProperty('--charting-date-modal-offset', `${sidebarHeight - 50}px`);
    openChartingDateModal(dateModalInput, timeSpanSelection);
  }

  useEffect(() => {
    const isOpen = modalId === 'CHARTING-DATE-MODAL' && isModalOpen;
    if (!isOpen) return;
    onDateIconClick();
  }, [sidebarHeight]);

  olMap.once('postrender', () => {
    setIsPostRender(true);
    if (isPostRender) return;
    const layerInfo = getActiveChartingLayer();
    if (layerInfo) {
      const layerStartDate = new Date(layerInfo.dateRanges[0].startDate);
      const layerEndDate = new Date(layerInfo.dateRanges[layerInfo.dateRanges.length - 1].endDate);
      const startDate = initialStartDate < layerStartDate ? layerStartDate : initialStartDate;
      const endDate = initialEndDate > layerEndDate ? layerEndDate : initialEndDate;
      onUpdateStartDate(startDate);
      onUpdateEndDate(endDate);
    }
    if (!aoiCoordinates || aoiCoordinates.length === 0) {
      const bottomLeft = getLatLongFromPixelValue(x, y2);
      const topRight = getLatLongFromPixelValue(x2, y);
      setBottomLeftLatLong(bottomLeft);
      setTopRightLatLong(topRight);
      if (maxExtent) {
        const inLeftWing = bottomLeft[0] < maxExtent[0] && topRight[0] < maxExtent[0];
        const inRightWing = bottomLeft[0] > maxExtent[2] && topRight[0] > maxExtent[2];
        setIsWithinWings(inLeftWing || inRightWing);
      }
      return;
    }
    if (viewExtent.every((val, index) => val === aoiCoordinates[index])) {
      setMapViewChecked(true);
    }
    const bottomLeft = olMap.getPixelFromCoordinate([aoiCoordinates[0], aoiCoordinates[1]]);
    const topRight = olMap.getPixelFromCoordinate([aoiCoordinates[2], aoiCoordinates[3]]);
    const newBoundaries = {
      x: bottomLeft[0],
      y: topRight[1],
      x2: topRight[0],
      y2: bottomLeft[1],
    };
    setBoundaries(newBoundaries);
    setBottomLeftLatLong([aoiCoordinates[0], aoiCoordinates[1]]);
    setTopRightLatLong([aoiCoordinates[2], aoiCoordinates[3]]);
    if (maxExtent) {
      const inLeftWing = aoiCoordinates[0] < maxExtent[0] && aoiCoordinates[2] < maxExtent[0];
      const inRightWing = aoiCoordinates[0] > maxExtent[2] && aoiCoordinates[2] > maxExtent[2];
      setIsWithinWings(inLeftWing || inRightWing);
    }
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
    debouncedUpdateAOICoordinates([...bottomLeft, ...topRight]);
    setMapViewChecked(false);
    if (maxExtent) {
      const inLeftWing = bottomLeft[0] < maxExtent[0] && topRight[0] < maxExtent[0];
      const inRightWing = bottomLeft[0] > maxExtent[2] && topRight[0] > maxExtent[2];
      setIsWithinWings(inLeftWing || inRightWing);
    }
  }

  function onLatLongChange(coordsArray) {
    const bottomLeft = [coordsArray[0], coordsArray[1]];
    const topRight = [coordsArray[2], coordsArray[3]];
    const bottomLeftPixel = olMap.getPixelFromCoordinate(bottomLeft);
    const topRightPixel = olMap.getPixelFromCoordinate(topRight);
    const newBoundaries = {
      x: bottomLeftPixel[0],
      y: topRightPixel[1],
      x2: topRightPixel[0],
      y2: bottomLeftPixel[1],
    };
    setBoundaries(newBoundaries);
    setBottomLeftLatLong(bottomLeft);
    setTopRightLatLong(topRight);
    debouncedUpdateAOICoordinates([...bottomLeft, ...topRight]);
    setMapViewChecked(false);
    if (maxExtent) {
      const inLeftWing = bottomLeft[0] < maxExtent[0] && topRight[0] < maxExtent[0];
      const inRightWing = bottomLeft[0] > maxExtent[2] && topRight[0] > maxExtent[2];
      setIsWithinWings(inLeftWing || inRightWing);
    }
  }

  function toggleMapView() {
    if (!mapViewChecked) {
      onLatLongChange(viewExtent);
    } else {
      const boundaries = {
        x: screenWidth / 2 - 100,
        y: screenHeight / 2 - 100,
        width: 200,
        height: 200,
      };
      onBoundaryUpdate(boundaries);
    }
    setMapViewChecked(!mapViewChecked);
  }


  const spinnerStyle = {
    width: '12px',
    height: '12px',
  };
  const layerInfo = getActiveChartingLayer();
  const aoiTextPrompt = 'Area:';
  const oneDateBtnStatus = timeSpanSelection === 'date' ? 'btn-active' : '';
  const dateRangeBtnStatus = timeSpanSelection === 'date' ? '' : 'btn-active';
  const dateRangeValue = timeSpanSelection === 'range' ? `${primaryDate} - ${secondaryDate}` : primaryDate;
  let requestBtnText = timeSpanSelection === 'date' ? 'Generate Statistics' : 'Generate Chart';
  if (chartRequestInProgress) {
    requestBtnText = (
      <div>
        In Progress&nbsp;
        <Spinner style={spinnerStyle} color="light" />
      </div>
    );
  }
  const lonlats = [
    bottomLeftLatLong,
    topRightLatLong,
  ];

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
      <div className="charting-aoi-container">
        <h3>{aoiTextPrompt}</h3>
        <LatLongSelect
          viewExtent={viewExtent}
          geoLatLong={lonlats}
          onLatLongChange={onLatLongChange}
          crs={crs}
        />
      </div>
      <Checkbox
        id="map-view-checkbox"
        checked={mapViewChecked}
        onCheck={toggleMapView}
        label="Select Entire Screen"
      />
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
          valid={!chartRequestInProgress && !isWithinWings}
          text={requestBtnText}
        />
      </div>
      {aoiActive && isPostRender && (
        <Crop
          x={x}
          y={y}
          width={x2 - x}
          height={y2 - y}
          maxHeight={screenHeight}
          maxWidth={screenWidth}
          onChange={onBoundaryUpdate}
          onClose={() => {}}
          keepSelection
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
  const { crs, maxExtent } = proj.selected;
  const { screenWidth, screenHeight } = screenSize;
  const {
    activeLayer, aoiActive, aoiCoordinates, aoiSelected, chartRequestInProgress, timeSpanSelection, timeSpanStartDate, timeSpanEndDate, fromButton, isChartOpen,
  } = charting;
  const {
    isOpen, id,
  } = modal;
  const projections = Object.keys(config.projections).map((key) => config.projections[key].crs);
  const timelineStartDate = date.selected < date.selectedB ? date.selected : date.selectedB;
  const timelineEndDate = date.selected < date.selectedB ? date.selectedB : date.selected;
  const olMap = map.ui.selected;
  const mapView = olMap?.getView();
  const viewExtent = mapView?.calculateExtent(olMap.getSize());
  return {
    activeLayers,
    activeLayer,
    aoiActive,
    aoiCoordinates,
    aoiSelected,
    chartRequestInProgress,
    crs,
    olMap,
    proj,
    projections,
    renderedPalettes,
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
    viewExtent,
    maxExtent,
  };
};

const mapDispatchToProps = (dispatch) => ({
  updateAOICoordinates: (extent) => {
    dispatch(updateChartingAOICoordinates(extent));
  },
  updateRequestInProgress: (status) => {
    dispatch(updateRequestInProgressAction(status));
  },
  updateModalOpen: (status) => {
    dispatch(updateModalOpenAction(status));
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
      openCustomContent('CHARTING-DATE-MODAL', {
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
      openCustomContent('CHARTING-STATS-MODAL', {
        headerText: `BETA | ${data.title} - ${data.subtitle}${data.unit ? ` (${data.unit})` : ''} Simple Statistics`,
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
        headerText: `BETA | ${liveData.title} - ${liveData.subtitle}${liveData.unit ? ` (${liveData.unit})` : ''}`,
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
  openChartingErrorModal: (msg) => {
    dispatch(
      openCustomContent('CHARTING_ERROR_MODAL', {
        headerText: 'Charting Error',
        backdrop: false,
        bodyComponent: ChartingError,
        wrapClassName: 'clickable-behind-modal',
        modalClassName: 'chart-error',
        bodyComponentProps: {
          msg,
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
  timeSpanSelection: PropTypes.string,
  timeSpanStartDate: PropTypes.instanceOf(Date),
  timeSpanEndDate: PropTypes.instanceOf(Date),
  updateRequestInProgress: PropTypes.func,
  updateModalOpen: PropTypes.func,
  updateAOICoordinates: PropTypes.func,
  openChartingInfoModal: PropTypes.func,
  openChartingDateModal: PropTypes.func,
  onChartDateButtonClick: PropTypes.func,
  displaySimpleStats: PropTypes.func,
  displayChart: PropTypes.func,
  openChartingErrorModal: PropTypes.func,
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
  sidebarHeight: PropTypes.number,
  viewExtent: PropTypes.array,
  maxExtent: PropTypes.array,
};
