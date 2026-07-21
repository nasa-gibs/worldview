import { useState, useEffect, useRef } from 'react';
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

import googleTagManager from 'googleTagManager';
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
import { openCustomContent, onClose } from '../../modules/modal/actions';
import { CRS } from '../../modules/map/constants';
import ChartingInfo from '../charting/charting-info';
import ChartingError from '../charting/charting-error';
import SimpleStatistics from '../charting/simple-statistics';
import ChartingDateSelector from '../charting/charting-date-selector';
import ChartComponent from '../charting/chart-component';
import LatLongSelect from '../image-download/lat-long-inputs';
import Checkbox from '../util/checkbox';
import WaitOverlay from '../util/wait';

const AOIFeatureObj = {};
const vectorLayers = {};
const sources = {};
let init = false;
const STEP_NUM = 31;
const MAX_DAYS = 100;
const SERVER_ERROR_MESSAGE = 'An error has occurred while requesting the charting data. Please try again in a few minutes.';
const NO_DATA_ERROR_MESSAGE = 'No data was found for this request. Please check the layer, date(s) & location.';

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
    closeModal,
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
    date,
  } = props;

  if (!olMap) return null;

  const isMounted = useRef(false);
  const chartData = useRef({});
  const isErrordaysExpanded = useRef(false);
  const cancelChartRef = useRef(false);
  const [isPostRender, setIsPostRender] = useState(false);
  const [doRenderChart, setDoRenderChart] = useState(false);
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
  const debouncedModalClose = lodashDebounce(closeModal, 0);

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
    const [olProjX, olProjY] = olProj.transform(coordinate, crs, CRS.GEOGRAPHIC);

    return [Number(olProjX.toFixed(4)), Number(olProjY.toFixed(4))];
  }

  const [bottomLeftLatLong, setBottomLeftLatLong] = useState(getLatLongFromPixelValue(x, y2));
  const [topRightLatLong, setTopRightLatLong] = useState(getLatLongFromPixelValue(x2, y));

  function formatDateString(dateObj) {
    const dateString = new Date(dateObj);
    const year = dateString.getUTCFullYear();
    const month = dateString.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
    const day = `0${dateString.getUTCDate()}`.slice(-2);
    return `${year} ${month} ${day}`;
  }

  function getActiveChartingLayer() {
    const filteredLayerList = activeLayers.filter((layer) => layer.id === activeLayer);
    if (filteredLayerList.length > 0) {
      return filteredLayerList[0];
    }
    return null;
  }

  function toggleErrorDaysExpanded(val) {
    isErrordaysExpanded.current = val;
    displayChart(chartData.current, screenWidth, toggleErrorDaysExpanded, isErrordaysExpanded);
  }

  /**
  * Update latitude longitude values on
  * crop change
  * @param {Object} boundaryObj
  *
  * @returns {null}
  */
  const onBoundaryUpdate = (boundaryObj) => {
    const {
      x: xBoundary,
      y: yBoundary,
      width,
      height,
    } = boundaryObj;
    const newBoundaries = {
      x: xBoundary,
      y: yBoundary,
      x2: xBoundary + width,
      y2: yBoundary + height,
    };
    setBoundaries(newBoundaries);
    const bottomLeft = getLatLongFromPixelValue(newBoundaries.x, newBoundaries.y2);
    const topRight = getLatLongFromPixelValue(newBoundaries.x2, newBoundaries.y);
    setBottomLeftLatLong(bottomLeft);
    setTopRightLatLong(topRight);
    debouncedUpdateAOICoordinates([...bottomLeft, ...topRight]);
    setMapViewChecked(false);
  };

  const { initialStartDate, initialEndDate } = initializeDates(timeSpanStartDate, timeSpanEndDate);
  const primaryDate = formatDateString(initialStartDate);
  const secondaryDate = formatDateString(initialEndDate);

  useEffect(() => {
    const filteredLayers = activeLayers.filter((layer) => layer.id === activeLayer);
    const dateEarliest = activeLayer && filteredLayers.length > 0 && filteredLayers[0].startDate
      ? new Date(filteredLayers[0].startDate)
      : date.selected;
    const dateLatest = activeLayer && filteredLayers.length > 0 && filteredLayers[0].endDate
      ? new Date(filteredLayers[0].endDate)
      : date.appNow;
    let timeSpanFixedStartDate = timeSpanStartDate;
    let timeSpanFixedEndDate = timeSpanEndDate;
    if (dateEarliest > timeSpanStartDate || dateEarliest > timeSpanEndDate) {
      timeSpanFixedStartDate = dateEarliest;
      timeSpanFixedEndDate = util.dateAdd(dateEarliest, 'day', 10);
    }
    if (dateLatest < timeSpanStartDate || dateLatest < timeSpanEndDate) {
      timeSpanFixedStartDate = util.dateAdd(dateLatest, 'day', -10);
      timeSpanFixedEndDate = dateLatest;
    }
    onUpdateStartDate(timeSpanFixedStartDate);
    onUpdateEndDate(timeSpanFixedEndDate);
  }, [timeSpanStartDate, timeSpanEndDate, activeLayer]);

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
    if (!isMounted.current) return;
    const boundariesObj = {
      x,
      y,
      width: x2 - x,
      height: y2 - y,
    };
    onBoundaryUpdate(boundariesObj);
  }, [screenWidth, screenHeight]);

  useEffect(() => {
    isMounted.current = true;
    onUpdateStartDate(initialStartDate);
    onUpdateEndDate(initialEndDate);
    if (!aoiCoordinates || aoiCoordinates.length === 0) {
      debouncedUpdateAOICoordinates([...bottomLeftLatLong, ...topRightLatLong]);
    }
    return () => {
      isMounted.current = false;
      updateAOICoordinates([]);
      setIsWithinWings(null);
    };
  }, []);

  useEffect(() => {
    if (fromButton) {
      setIsPostRender(true);
    }
  }, [fromButton]);

  // Track whether the bounding box is within the wings of the map
  useEffect(() => {
    if (!maxExtent) return;

    let inLeftWing, inRightWing;

    if (aoiCoordinates && aoiCoordinates.length > 0) {
      inLeftWing = aoiCoordinates[0] < maxExtent[0];
      inRightWing = aoiCoordinates[2] > maxExtent[2];
    } else {
      inLeftWing = bottomLeftLatLong[0] < maxExtent[0];
      inRightWing = topRightLatLong[0] > maxExtent[2];
    }
    setIsWithinWings(inLeftWing || inRightWing);
  }, [maxExtent, aoiCoordinates, bottomLeftLatLong, topRightLatLong]);

  function formatDateForImageStat(dateObj) {
    const dateString = new Date(dateObj);
    const year = dateString.getUTCFullYear();
    const month = `0${dateString.getUTCMonth() + 1}`.slice(-2);
    const day = `0${dateString.getUTCDate()}`.slice(-2);
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

  useEffect(() => {
    if (!chartData.current ||
      Object.keys(chartData.current).length === 0 ||
      !isModalOpen || timeSpanSelection !== 'range') return;
    if (screenWidth < 768) {
      debouncedModalClose();
      updateModalOpen(false);
    }
    displayChart(chartData.current, screenWidth, toggleErrorDaysExpanded, isErrordaysExpanded);
  }, [screenWidth]);

  function onCancelChart() {
    updateModalOpen(false);
    updateChartRequestStatus(false);
    cancelChartRef.current = true;
  }

  /**
   * Provides a default AOI of the entire map if unspecified,
   * and modifies the Openlayers coordinates for use with imageStat API
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
   * @param {String} timeSpanSelection | 'Date' for single date, 'Range' for date range, 'series'
   * for time series charting
   */
  function getImageStatRequestParameters(layerInfo, timeSpan, startDate, endDate) {
    const startDateForImageStat = formatDateForImageStat(startDate);
    const endDateForImageStat = formatDateForImageStat(endDate);
    const AOIForImageStat = convertOLcoordsForImageStat(aoiCoordinates);
    return {
      timestamp: startDateForImageStat, // start date
      endTimestamp: endDateForImageStat, // end date
      type: timeSpan === 'range' ? 'series' : 'date',
      steps: STEP_NUM, // the number of days selected within a given range/series. Use '1' for just
      // the start and end date, '2' for start date, end date and middle date, etc.
      layer: layerInfo.id, // Layer to be pulled from gibs api.
      // e.g. 'GHRSST_L4_MUR_Sea_Surface_Temperature'
      colormap: `${layerInfo.palette.id}.xml`, // Colormap to use to decipher layer.
      // e.g. 'GHRSST_Sea_Surface_Temperature.xml'
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

  // eslint-disable-next-line
  const mockData = [
    // eslint-disable-next-line
    `{"status": 204, "details": "No results found for the request.", "errors": {"error_count": 31, "error_days": ["2023-05-25T00:00:00Z", "2023-06-03T00:00:00Z", "2023-06-12T00:00:00Z", "2023-06-21T00:00:00Z", "2023-06-30T00:00:00Z", "2023-07-09T00:00:00Z", "2023-07-18T00:00:00Z", "2023-07-27T00:00:00Z", "2023-08-05T00:00:00Z", "2023-08-14T00:00:00Z", "2023-08-23T00:00:00Z", "2023-09-01T00:00:00Z", "2023-09-10T00:00:00Z", "2023-09-19T00:00:00Z", "2023-09-28T00:00:00Z", "2023-10-07T00:00:00Z", "2023-10-16T00:00:00Z", "2023-10-25T00:00:00Z", "2023-11-03T00:00:00Z", "2023-11-12T00:00:00Z", "2023-11-21T00:00:00Z", "2023-11-30T00:00:00Z", "2023-12-09T00:00:00Z", "2023-12-18T00:00:00Z", "2023-12-27T00:00:00Z", "2024-01-05T00:00:00Z", "2024-01-14T00:00:00Z", "2024-01-23T00:00:00Z", "2024-02-01T00:00:00Z", "2024-02-10T00:00:00Z", "2024-02-25T00:00:00Z"]}}`,
    // eslint-disable-next-line
    `{"mean": {"2024-07-10T00:00:00Z": 1298570339506173.0, "2024-07-19T00:00:00Z": 1396611280864197.5, "2024-07-28T00:00:00Z": 1966755709876543.0, "2024-08-06T00:00:00Z": 2334351095679012.5, "2024-08-15T00:00:00Z": 1845970462962963.0, "2024-08-24T00:00:00Z": 1169353456790123.5, "2024-09-02T00:00:00Z": 2583643209876543.0, "2024-09-11T00:00:00Z": 1410417268518518.5, "2024-09-20T00:00:00Z": 1233416867283950.8, "2024-09-29T00:00:00Z": 1501184876543210.0, "2024-10-08T00:00:00Z": 1302489537037037.0, "2024-10-17T00:00:00Z": 2373889891975308.5, "2024-10-26T00:00:00Z": 2643220216049383.0, "2024-11-04T00:00:00Z": 2028689305555555.2, "2024-11-13T00:00:00Z": 2602564475308642.0, "2024-11-28T00:00:00Z": 2371455595667870.0}, "median": {"2024-07-10T00:00:00Z": "1380000000000000.0", "2024-07-19T00:00:00Z": "1380000000000000.0", "2024-07-28T00:00:00Z": "2120000000000000.0", "2024-08-06T00:00:00Z": "2330000000000000.0", "2024-08-15T00:00:00Z": "1700000000000000.0", "2024-08-24T00:00:00Z": "1270000000000000.0", "2024-09-02T00:00:00Z": "2330000000000000.0", "2024-09-11T00:00:00Z": "1480000000000000.0", "2024-09-20T00:00:00Z": "1270000000000000.0", "2024-09-29T00:00:00Z": "1480000000000000.0", "2024-10-08T00:00:00Z": "1270000000000000.0", "2024-10-17T00:00:00Z": "2330000000000000.0", "2024-10-26T00:00:00Z": "2760000000000000.0", "2024-11-04T00:00:00Z": "1910000000000000.0", "2024-11-13T00:00:00Z": "2650000000000000.0", "2024-11-28T00:00:00Z": "2230000000000000.0"}, "max": {"2024-07-10T00:00:00Z": 2010000000000000.0, "2024-07-19T00:00:00Z": 2010000000000000.0, "2024-07-28T00:00:00Z": 2540000000000000.0, "2024-08-06T00:00:00Z": 3180000000000000.0, "2024-08-15T00:00:00Z": 2860000000000000.0, "2024-08-24T00:00:00Z": 1480000000000000.0, "2024-09-02T00:00:00Z": 3820000000000000.0, "2024-09-11T00:00:00Z": 2440000000000000.0, "2024-09-20T00:00:00Z": 2120000000000000.0, "2024-09-29T00:00:00Z": 2120000000000000.0, "2024-10-08T00:00:00Z": 2760000000000000.0, "2024-10-17T00:00:00Z": 3290000000000000.0, "2024-10-26T00:00:00Z": 3500000000000000.0, "2024-11-04T00:00:00Z": 3180000000000000.0, "2024-11-13T00:00:00Z": 3920000000000000.0, "2024-11-28T00:00:00Z": 4880000000000000.0}, "min": {"2024-07-10T00:00:00Z": 424000000000000.0, "2024-07-19T00:00:00Z": 954000000000000.0, "2024-07-28T00:00:00Z": 1060000000000000.0, "2024-08-06T00:00:00Z": 848000000000000.0, "2024-08-15T00:00:00Z": 954000000000000.0, "2024-08-24T00:00:00Z": 424000000000000.0, "2024-09-02T00:00:00Z": 1590000000000000.0, "2024-09-11T00:00:00Z": 424000000000000.0, "2024-09-20T00:00:00Z": 424000000000000.0, "2024-09-29T00:00:00Z": 1060000000000000.0, "2024-10-08T00:00:00Z": -0.0, "2024-10-17T00:00:00Z": 1380000000000000.0, "2024-10-26T00:00:00Z": 2120000000000000.0, "2024-11-04T00:00:00Z": 848000000000000.0, "2024-11-13T00:00:00Z": 742000000000000.0, "2024-11-28T00:00:00Z": 848000000000000.0}, "stdev": {"2024-07-10T00:00:00Z": 393067350223359.5, "2024-07-19T00:00:00Z": 300738169224156.94, "2024-07-28T00:00:00Z": 395720655558837.2, "2024-08-06T00:00:00Z": 537627406981821.44, "2024-08-15T00:00:00Z": 548312497288835.25, "2024-08-24T00:00:00Z": 281343284568871.88, "2024-09-02T00:00:00Z": 751094440263429.9, "2024-09-11T00:00:00Z": 648841978273369.4, "2024-09-20T00:00:00Z": 454008793817523.9, "2024-09-29T00:00:00Z": 278720982688842.7, "2024-10-08T00:00:00Z": 606685302457284.6, "2024-10-17T00:00:00Z": 464465422578780.0, "2024-10-26T00:00:00Z": 386527060875228.0, "2024-11-04T00:00:00Z": 681491009750089.6, "2024-11-13T00:00:00Z": 764387845698488.8, "2024-11-28T00:00:00Z": 1061628543981786.1}, "stderr": "382824688884.0622", "hist": [["0.0", "87482"], ["488000000000000.0", "341868"], ["976000000000000.0", "854218"], ["1464000000000000.0", "1104676"], ["1952000000000000.0", "690118"], ["2440000000000000.0", "659648"], ["2928000000000000.0", "239040"], ["3416000000000000.0", "78186"], ["3904000000000000.0", "13778"], ["4392000000000000.0", "18426"]], "errors": {"error_count": 15, "error_days": ["2024-02-26T00:00:00Z", "2024-03-06T00:00:00Z", "2024-03-15T00:00:00Z", "2024-03-24T00:00:00Z", "2024-04-02T00:00:00Z", "2024-04-11T00:00:00Z", "2024-04-20T00:00:00Z", "2024-04-29T00:00:00Z", "2024-05-08T00:00:00Z", "2024-05-17T00:00:00Z", "2024-05-26T00:00:00Z", "2024-06-04T00:00:00Z", "2024-06-13T00:00:00Z", "2024-06-22T00:00:00Z", "2024-07-01T00:00:00Z"]}}`,
    // eslint-disable-next-line
    `{"mean": {"2024-11-29T00:00:00Z": 2362192129629629.5, "2024-12-17T00:00:00Z": 2818459259259259.5, "2024-12-26T00:00:00Z": 2555032716049382.5, "2025-01-04T00:00:00Z": 2694089043209877.0, "2025-01-13T00:00:00Z": 4472722530864197.5, "2025-01-22T00:00:00Z": 3908756404320987.5, "2025-01-31T00:00:00Z": 0, "2025-02-09T00:00:00Z": 4674034336419753.0, "2025-02-18T00:00:00Z": 4558620679012346.0, "2025-02-27T00:00:00Z": 3006325848765432.5, "2025-03-08T00:00:00Z": 5272614429012345.0, "2025-03-17T00:00:00Z": 2376134336419753.0, "2025-03-26T00:00:00Z": 2125870524691358.0, "2025-04-04T00:00:00Z": 1577604043209876.8, "2025-04-13T00:00:00Z": 1258674043209876.8, "2025-04-22T00:00:00Z": 2667074922839506.0, "2025-05-01T00:00:00Z": 2003061805555555.5, "2025-05-10T00:00:00Z": 2155233179012345.8, "2025-05-19T00:00:00Z": 1953246064814814.8, "2025-05-28T00:00:00Z": 1470706712962963.0, "2025-06-06T00:00:00Z": 1235315401234568.0, "2025-06-15T00:00:00Z": 1752439814814814.8, "2025-06-24T00:00:00Z": 1743416373456790.0, "2025-07-03T00:00:00Z": 2749083487654321.0, "2025-07-12T00:00:00Z": 2263141280864197.5, "2025-07-21T00:00:00Z": 3094957021604938.5, "2025-07-30T00:00:00Z": 2030017592592592.5, "2025-08-08T00:00:00Z": 1077574737654321.0, "2025-08-17T00:00:00Z": 2568771682098765.0, "2025-09-01T00:00:00Z": 871387376543209.9}, "median": {"2024-11-29T00:00:00Z": "2230000000000000.0", "2024-12-17T00:00:00Z": "2650000000000000.0", "2024-12-26T00:00:00Z": "2330000000000000.0", "2025-01-04T00:00:00Z": "2650000000000000.0", "2025-01-13T00:00:00Z": "4450000000000000.0", "2025-01-22T00:00:00Z": "3820000000000000.0", "2025-01-31T00:00:00Z": 0, "2025-02-09T00:00:00Z": "4560000000000000.0", "2025-02-18T00:00:00Z": "4350000000000000.0", "2025-02-27T00:00:00Z": "2970000000000000.0", "2025-03-08T00:00:00Z": "5300000000000000.0", "2025-03-17T00:00:00Z": "2440000000000000.0", "2025-03-26T00:00:00Z": "2230000000000000.0", "2025-04-04T00:00:00Z": "1380000000000000.0", "2025-04-13T00:00:00Z": "1060000000000000.0", "2025-04-22T00:00:00Z": "2540000000000000.0", "2025-05-01T00:00:00Z": "2010000000000000.0", "2025-05-10T00:00:00Z": "2010000000000000.0", "2025-05-19T00:00:00Z": "1910000000000000.0", "2025-05-28T00:00:00Z": "1380000000000000.0", "2025-06-06T00:00:00Z": "954000000000000.0", "2025-06-15T00:00:00Z": "1700000000000000.0", "2025-06-24T00:00:00Z": "1590000000000000.0", "2025-07-03T00:00:00Z": "2760000000000000.0", "2025-07-12T00:00:00Z": "2330000000000000.0", "2025-07-21T00:00:00Z": "3180000000000000.0", "2025-07-30T00:00:00Z": "2010000000000000.0", "2025-08-08T00:00:00Z": "1060000000000000.0", "2025-08-17T00:00:00Z": "2440000000000000.0", "2025-09-01T00:00:00Z": "848000000000000.0"}, "max": {"2024-11-29T00:00:00Z": 3820000000000000.0, "2024-12-17T00:00:00Z": 4350000000000000.0, "2024-12-26T00:00:00Z": 3600000000000000.0, "2025-01-04T00:00:00Z": 3390000000000000.0, "2025-01-13T00:00:00Z": 5940000000000000.0, "2025-01-22T00:00:00Z": 4770000000000000.0, "2025-01-31T00:00:00Z": 0, "2025-02-09T00:00:00Z": 6250000000000000.0, "2025-02-18T00:00:00Z": 5940000000000000.0, "2025-02-27T00:00:00Z": 5720000000000000.0, "2025-03-08T00:00:00Z": 6150000000000000.0, "2025-03-17T00:00:00Z": 3070000000000000.0, "2025-03-26T00:00:00Z": 2970000000000000.0, "2025-04-04T00:00:00Z": 4660000000000000.0, "2025-04-13T00:00:00Z": 2330000000000000.0, "2025-04-22T00:00:00Z": 3920000000000000.0, "2025-05-01T00:00:00Z": 2540000000000000.0, "2025-05-10T00:00:00Z": 3390000000000000.0, "2025-05-19T00:00:00Z": 2650000000000000.0, "2025-05-28T00:00:00Z": 2230000000000000.0, "2025-06-06T00:00:00Z": 2330000000000000.0, "2025-06-15T00:00:00Z": 2540000000000000.0, "2025-06-24T00:00:00Z": 3180000000000000.0, "2025-07-03T00:00:00Z": 3600000000000000.0, "2025-07-12T00:00:00Z": 3390000000000000.0, "2025-07-21T00:00:00Z": 3820000000000000.0, "2025-07-30T00:00:00Z": 2650000000000000.0, "2025-08-08T00:00:00Z": 1800000000000000.0, "2025-08-17T00:00:00Z": 3290000000000000.0, "2025-09-01T00:00:00Z": 1590000000000000.0}, "min": {"2024-11-29T00:00:00Z": 1480000000000000.0, "2024-12-17T00:00:00Z": 1800000000000000.0, "2024-12-26T00:00:00Z": 2010000000000000.0, "2025-01-04T00:00:00Z": 1380000000000000.0, "2025-01-13T00:00:00Z": 3070000000000000.0, "2025-01-22T00:00:00Z": 3390000000000000.0, "2025-01-31T00:00:00Z": 0, "2025-02-09T00:00:00Z": 3390000000000000.0, "2025-02-18T00:00:00Z": 3180000000000000.0, "2025-02-27T00:00:00Z": 1700000000000000.0, "2025-03-08T00:00:00Z": 4660000000000000.0, "2025-03-17T00:00:00Z": 1170000000000000.0, "2025-03-26T00:00:00Z": 1170000000000000.0, "2025-04-04T00:00:00Z": 106000000000000.0, "2025-04-13T00:00:00Z": 212000000000000.0, "2025-04-22T00:00:00Z": 1590000000000000.0, "2025-05-01T00:00:00Z": 1380000000000000.0, "2025-05-10T00:00:00Z": 1480000000000000.0, "2025-05-19T00:00:00Z": 1380000000000000.0, "2025-05-28T00:00:00Z": 1060000000000000.0, "2025-06-06T00:00:00Z": 424000000000000.0, "2025-06-15T00:00:00Z": 1170000000000000.0, "2025-06-24T00:00:00Z": 742000000000000.0, "2025-07-03T00:00:00Z": 1910000000000000.0, "2025-07-12T00:00:00Z": 1380000000000000.0, "2025-07-21T00:00:00Z": 1800000000000000.0, "2025-07-30T00:00:00Z": 1480000000000000.0, "2025-08-08T00:00:00Z": 530000000000000.0, "2025-08-17T00:00:00Z": 1590000000000000.0, "2025-09-01T00:00:00Z": -0.0}, "stdev": {"2024-11-29T00:00:00Z": 629167147510070.2, "2024-12-17T00:00:00Z": 675505676754715.6, "2024-12-26T00:00:00Z": 461407804994569.8, "2025-01-04T00:00:00Z": 439369259374904.94, "2025-01-13T00:00:00Z": 697915570381725.4, "2025-01-22T00:00:00Z": 427328021772513.0, "2025-01-31T00:00:00Z": 0, "2025-02-09T00:00:00Z": 867210511110347.1, "2025-02-18T00:00:00Z": 734997778785277.8, "2025-02-27T00:00:00Z": 971745607695588.4, "2025-03-08T00:00:00Z": 539295213746220.25, "2025-03-17T00:00:00Z": 529069320596966.94, "2025-03-26T00:00:00Z": 568872213754392.6, "2025-04-04T00:00:00Z": 1077399302852067.6, "2025-04-13T00:00:00Z": 541726947060900.8, "2025-04-22T00:00:00Z": 723437892641811.4, "2025-05-01T00:00:00Z": 331516520370914.2, "2025-05-10T00:00:00Z": 512381119555483.8, "2025-05-19T00:00:00Z": 366023076932546.2, "2025-05-28T00:00:00Z": 354540697616880.9, "2025-06-06T00:00:00Z": 603930463173718.1, "2025-06-15T00:00:00Z": 327327363915495.06, "2025-06-24T00:00:00Z": 613241206570150.2, "2025-07-03T00:00:00Z": 517701141329160.4, "2025-07-12T00:00:00Z": 476075930999199.4, "2025-07-21T00:00:00Z": 449948955957975.75, "2025-07-30T00:00:00Z": 315886435972235.8, "2025-08-08T00:00:00Z": 326340047292317.7, "2025-08-17T00:00:00Z": 434501354649123.75, "2025-09-01T00:00:00Z": 407582269133795.0}, "stderr": "454862346656.93945", "hist": [["0.0", "188576"], ["625000000000000.0", "770038"], ["1250000000000000.0", "1409914"], ["1875000000000000.0", "1994970"], ["2500000000000000.0", "1248284"], ["3125000000000000.0", "688772"], ["3750000000000000.0", "383534"], ["4375000000000000.0", "429350"], ["5000000000000000.0", "231478"], ["5625000000000000.0", "171884"]], "errors": {"error_count": 1, "error_days": ["2024-12-08T00:00:00Z"]}}`,
    // eslint-disable-next-line
    `{"mean": {"2025-09-02T00:00:00Z": 1263596404320987.8, "2025-09-11T00:00:00Z": 2412414814814815.0, "2025-09-20T00:00:00Z": 1819447114197531.0, "2025-09-29T00:00:00Z": 4338623533950617.5, "2025-10-08T00:00:00Z": 2868823456790123.5, "2025-10-17T00:00:00Z": 1859784753086419.8, "2025-10-26T00:00:00Z": 969998796296296.2, "2025-11-04T00:00:00Z": 3517168904320987.5, "2025-11-13T00:00:00Z": 2992521682098765.5, "2025-11-22T00:00:00Z": 0, "2025-12-01T00:00:00Z": 2410808024691358.0, "2025-12-10T00:00:00Z": 848000000000000.0, "2025-12-19T00:00:00Z": 1176986373456790.0, "2025-12-28T00:00:00Z": 0, "2026-01-06T00:00:00Z": 0, "2026-01-15T00:00:00Z": 2630035416666666.5, "2026-01-24T00:00:00Z": 0, "2026-02-02T00:00:00Z": 3742260802469135.5, "2026-02-11T00:00:00Z": 5545614506172840.0, "2026-02-20T00:00:00Z": 7389896907216495.0, "2026-03-01T00:00:00Z": 3960576466049382.5, "2026-03-10T00:00:00Z": 3721199382716049.5, "2026-03-19T00:00:00Z": 4159307175925926.0, "2026-03-28T00:00:00Z": 1140770802469135.8, "2026-04-06T00:00:00Z": 1489383611111111.0, "2026-04-15T00:00:00Z": 2322318209876543.5, "2026-04-24T00:00:00Z": 2176131558641975.2, "2026-05-03T00:00:00Z": 1125514274691358.0, "2026-05-12T00:00:00Z": 1958229830246913.5, "2026-05-21T00:00:00Z": 1707812916666666.8, "2026-06-04T00:00:00Z": 3071444444444444.5}, "median": {"2025-09-02T00:00:00Z": "1270000000000000.0", "2025-09-11T00:00:00Z": "2440000000000000.0", "2025-09-20T00:00:00Z": "2010000000000000.0", "2025-09-29T00:00:00Z": "4240000000000000.0", "2025-10-08T00:00:00Z": "2760000000000000.0", "2025-10-17T00:00:00Z": "2010000000000000.0", "2025-10-26T00:00:00Z": "954000000000000.0", "2025-11-04T00:00:00Z": "3180000000000000.0", "2025-11-13T00:00:00Z": "2970000000000000.0", "2025-11-22T00:00:00Z": 0, "2025-12-01T00:00:00Z": "2440000000000000.0", "2025-12-10T00:00:00Z": "848000000000000.0", "2025-12-19T00:00:00Z": "1270000000000000.0", "2025-12-28T00:00:00Z": 0, "2026-01-06T00:00:00Z": 0, "2026-01-15T00:00:00Z": "2440000000000000.0", "2026-01-24T00:00:00Z": 0, "2026-02-02T00:00:00Z": "3600000000000000.0", "2026-02-11T00:00:00Z": "5720000000000000.0", "2026-02-20T00:00:00Z": "8160000000000000.0", "2026-03-01T00:00:00Z": "4030000000000000.0", "2026-03-10T00:00:00Z": "3710000000000000.0", "2026-03-19T00:00:00Z": "4240000000000000.0", "2026-03-28T00:00:00Z": "1270000000000000.0", "2026-04-06T00:00:00Z": "1480000000000000.0", "2026-04-15T00:00:00Z": "2330000000000000.0", "2026-04-24T00:00:00Z": "2010000000000000.0", "2026-05-03T00:00:00Z": "1170000000000000.0", "2026-05-12T00:00:00Z": "2120000000000000.0", "2026-05-21T00:00:00Z": "1590000000000000.0", "2026-06-04T00:00:00Z": "2970000000000000.0"}, "max": {"2025-09-02T00:00:00Z": 2120000000000000.0, "2025-09-11T00:00:00Z": 2860000000000000.0, "2025-09-20T00:00:00Z": 2860000000000000.0, "2025-09-29T00:00:00Z": 6360000000000000.0, "2025-10-08T00:00:00Z": 3820000000000000.0, "2025-10-17T00:00:00Z": 2760000000000000.0, "2025-10-26T00:00:00Z": 2970000000000000.0, "2025-11-04T00:00:00Z": 4880000000000000.0, "2025-11-13T00:00:00Z": 4030000000000000.0, "2025-11-22T00:00:00Z": 0, "2025-12-01T00:00:00Z": 3180000000000000.0, "2025-12-10T00:00:00Z": 1060000000000000.0, "2025-12-19T00:00:00Z": 2120000000000000.0, "2025-12-28T00:00:00Z": 0, "2026-01-06T00:00:00Z": 0, "2026-01-15T00:00:00Z": 4450000000000000.0, "2026-01-24T00:00:00Z": 0, "2026-02-02T00:00:00Z": 4880000000000000.0, "2026-02-11T00:00:00Z": 9650000000000000.0, "2026-02-20T00:00:00Z": 8160000000000000.0, "2026-03-01T00:00:00Z": 5410000000000000.0, "2026-03-10T00:00:00Z": 4660000000000000.0, "2026-03-19T00:00:00Z": 6890000000000000.0, "2026-03-28T00:00:00Z": 2330000000000000.0, "2026-04-06T00:00:00Z": 4350000000000000.0, "2026-04-15T00:00:00Z": 3070000000000000.0, "2026-04-24T00:00:00Z": 3820000000000000.0, "2026-05-03T00:00:00Z": 1590000000000000.0, "2026-05-12T00:00:00Z": 2970000000000000.0, "2026-05-21T00:00:00Z": 2970000000000000.0, "2026-06-04T00:00:00Z": 3920000000000000.0}, "min": {"2025-09-02T00:00:00Z": 848000000000000.0, "2025-09-11T00:00:00Z": 1700000000000000.0, "2025-09-20T00:00:00Z": 954000000000000.0, "2025-09-29T00:00:00Z": 3070000000000000.0, "2025-10-08T00:00:00Z": 1910000000000000.0, "2025-10-17T00:00:00Z": 742000000000000.0, "2025-10-26T00:00:00Z": -0.0, "2025-11-04T00:00:00Z": 2650000000000000.0, "2025-11-13T00:00:00Z": 1270000000000000.0, "2025-11-22T00:00:00Z": 0, "2025-12-01T00:00:00Z": 1800000000000000.0, "2025-12-10T00:00:00Z": 636000000000000.0, "2025-12-19T00:00:00Z": 0.0, "2025-12-28T00:00:00Z": 0, "2026-01-06T00:00:00Z": 0, "2026-01-15T00:00:00Z": 1590000000000000.0, "2026-01-24T00:00:00Z": 0, "2026-02-02T00:00:00Z": 2970000000000000.0, "2026-02-11T00:00:00Z": 2650000000000000.0, "2026-02-20T00:00:00Z": 6360000000000000.0, "2026-03-01T00:00:00Z": 2120000000000000.0, "2026-03-10T00:00:00Z": 2860000000000000.0, "2026-03-19T00:00:00Z": 2330000000000000.0, "2026-03-28T00:00:00Z": 106000000000000.0, "2026-04-06T00:00:00Z": -0.0, "2026-04-15T00:00:00Z": 1270000000000000.0, "2026-04-24T00:00:00Z": 1270000000000000.0, "2026-05-03T00:00:00Z": 636000000000000.0, "2026-05-12T00:00:00Z": 954000000000000.0, "2026-05-21T00:00:00Z": 530000000000000.0, "2026-06-04T00:00:00Z": 2230000000000000.0}, "stdev": {"2025-09-02T00:00:00Z": 350188796935905.3, "2025-09-11T00:00:00Z": 372559228238884.7, "2025-09-20T00:00:00Z": 495518032861936.8, "2025-09-29T00:00:00Z": 840804724361062.1, "2025-10-08T00:00:00Z": 596354152074664.9, "2025-10-17T00:00:00Z": 543639239006240.94, "2025-10-26T00:00:00Z": 836021576305261.2, "2025-11-04T00:00:00Z": 582030587251238.6, "2025-11-13T00:00:00Z": 653257062754889.6, "2025-11-22T00:00:00Z": 0, "2025-12-01T00:00:00Z": 388259397106853.2, "2025-12-10T00:00:00Z": 212000000000000.03, "2025-12-19T00:00:00Z": 513341735079869.75, "2025-12-28T00:00:00Z": 0, "2026-01-06T00:00:00Z": 0, "2026-01-15T00:00:00Z": 729507768563027.6, "2026-01-24T00:00:00Z": 0, "2026-02-02T00:00:00Z": 592500447888019.9, "2026-02-11T00:00:00Z": 1674887788439466.0, "2026-02-20T00:00:00Z": 890576663457778.5, "2026-03-01T00:00:00Z": 1015059627848595.1, "2026-03-10T00:00:00Z": 597787340949621.5, "2026-03-19T00:00:00Z": 1179741894412957.5, "2026-03-28T00:00:00Z": 563769421717384.0, "2026-04-06T00:00:00Z": 1335930795780275.8, "2026-04-15T00:00:00Z": 539317307631023.25, "2026-04-24T00:00:00Z": 577549348921144.0, "2026-05-03T00:00:00Z": 254059986773924.16, "2026-05-12T00:00:00Z": 531281540111495.6, "2026-05-21T00:00:00Z": 663958206725095.1, "2026-06-04T00:00:00Z": 414011631687854.25}, "stderr": "559804433986.9126", "hist": [["0.0", "717840"], ["965000000000000.0", "1631652"], ["1930000000000000.0", "1788578"], ["2895000000000000.0", "1324902"], ["3860000000000000.0", "680988"], ["4825000000000000.0", "193446"], ["5790000000000000.0", "105742"], ["6755000000000000.0", "50630"], ["7720000000000000.0", "32204"], ["8685000000000000.0", "13778"]]}`,
  ];

  // eslint-disable-next-line
  let mockCounter = 0;

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
      // const data = mockData[mockCounter++];

      // This is the response when the imageStat server fails
      if (!data || data === 'null') {
        return {
          ok: false,
          error: NO_DATA_ERROR_MESSAGE,
        };
      }
      if (data === 'Internal Server Error') {
        return {
          ok: false,
          error: SERVER_ERROR_MESSAGE,
        };
      }
      const parsedData = JSON.parse(data);
      if (parsedData.status === 204) {
        return {
          ok: false,
          error: NO_DATA_ERROR_MESSAGE,
        };
      }

      return {
        ok: true,
        body: parsedData,
      };
    } catch {
      return {
        ok: false,
        error: SERVER_ERROR_MESSAGE,
      };
    }
  }

  function getKeysFromObj(data) {
    return Object.keys(data);
  }

  function formatToThreeDigits(str) {
    return parseFloat(parseFloat(str).toFixed(3));
  }

  // Normalize error days input robustly (supports array, CSV, and "['...','...']" forms)
  function normalizeErrorDays(errors) {
    const raw = errors?.error_days;
    if (Array.isArray(raw)) return raw.map((s) => String(s));
    if (raw == null) return [];
    if (typeof raw !== 'string') return [String(raw)];

    const trimmed = raw.trim();

    // Try JSON parse if looks like an array; tolerate single quotes
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const jsonish = trimmed.replace(/'/g, '"');
        const arr = JSON.parse(jsonish);
        if (Array.isArray(arr)) return arr.map((s) => String(s));
      } catch {
        // fall through to manual split
      }
    }

    // Fallback: strip brackets, split on comma, strip surrounding quotes
    return trimmed
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((s) => String(s).trim()
        .replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  /**
   * Process the ImageStat (GIBS) data for use in the Recharts library
   * @param {Object} data | This contains the name (dates)
   * & min, max, stddev, etc. for each step requested
   */
  function formatGIBSDataForRecharts(data) {
    const xAxisNames = getKeysFromObj(data.min);
    // Add error days to data
    if (data.errors?.error_count > 0) {
      xAxisNames.push(...data.errors.error_days);
      xAxisNames.sort();
    }
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

  function combineData(input) {
    const inputArr = input;
    if (!inputArr || inputArr.length === 0) return inputArr;
    if (inputArr.length === 1) {
      if (inputArr[0].body && Object.prototype.hasOwnProperty.call(inputArr[0].body, 'errors')) {
        inputArr[0].body.errors.error_days = normalizeErrorDays(inputArr[0].body.errors);
      }
      return inputArr[0];
    }
    const output = {
      ok: true,
      body: {
        errors: {
          error_count: 0,
          error_days: [],
        },
        hist: [],
        max: {},
        mean: {},
        median: {},
        min: {},
        stderr: 0,
        stdev: {},
      },
    };
    if (inputArr.every((dataset) => !dataset.ok)) {
      output.ok = false;
      output.error = inputArr[0].error;
      return output;
    }
    inputArr?.forEach((dataset) => {
      if (dataset.ok && !!dataset.body) {
        Object.keys(dataset.body).forEach((key) => {
          if (key === 'errors') {
            const errorDays = normalizeErrorDays(dataset.body.errors);
            output.body.errors.error_count += dataset.body.errors.error_count;
            output.body.errors.error_days.push(...errorDays);
          } else if (key === 'hist') {
            output.body.hist.push(...dataset.body.hist);
          } else if (key === 'stderr') {
            output.body.stderr += parseFloat(dataset.body.stderr);
          } else {
            output.body[key] = { ...output.body[key], ...dataset.body[key] };
          }
        });
      }
    });
    return output;
  }

  async function onRequestChartClick() {
    if (chartRequestInProgress) return;
    updateChartRequestStatus(true);
    cancelChartRef.current = false;
    const layerInfo = getActiveChartingLayer();
    if (layerInfo == null) {
      updateChartRequestStatus(false);
      openChartingErrorModal('No valid layer detected for request.');
      return;
    }
    googleTagManager.pushEvent({
      event: 'chart_generated',
      charting: {
        layer_id: layerInfo.id,
        date_type: timeSpanSelection,
      },
    });
    const requestedLayerSource = layerInfo.projections.geographic.source;
    if (requestedLayerSource === 'GIBS:geographic') {
      const numDaysRequested = timeSpanSelection === 'range'
        ? Math.floor((initialEndDate - initialStartDate) / (1000 * 60 * 60 * 24)) + 1
        : 1;
      const requestsNeeded = Math.ceil(Math.min(MAX_DAYS, numDaysRequested) / STEP_NUM);
      const requestsSize = Math.ceil(numDaysRequested / requestsNeeded);
      const promises = [];
      for (let i = 0; i < requestsNeeded; i += 1) {
        const requestStartDate = new Date(initialStartDate.getTime());
        requestStartDate.setDate(requestStartDate.getDate() + (i * requestsSize));
        let requestEndDate = new Date(requestStartDate.getTime());
        requestEndDate.setDate(requestEndDate.getDate() + requestsSize - 1);
        if (requestEndDate > initialEndDate) {
          requestEndDate = new Date(initialEndDate.getTime());
        }
        const uriParameters = getImageStatRequestParameters(
          layerInfo,
          timeSpanSelection,
          requestStartDate,
          requestEndDate,
        );
        const requestURI = getImageStatStatsRequestURL(uriParameters);
        promises.push(getImageStatData(requestURI));
      }
      const dataArr = await Promise.all(promises);
      const data = combineData(dataArr);

      if (cancelChartRef.current) {
        return;
      }

      if (!isMounted.current) {
        updateChartRequestStatus(false);
        return;
      }

      if (!data.ok) {
        updateChartRequestStatus(false);
        openChartingErrorModal(data.error);
        return;
      }

      // unit determination: renderedPalettes
      const paletteName = layerInfo.palette.id;
      const paletteLegend = renderedPalettes[paletteName].maps[0].legend;
      const unitOfMeasure = Object.prototype.hasOwnProperty.call(paletteLegend, 'units')
        ? `${paletteLegend.units}`
        : '';
      const dataToRender = {
        title: layerInfo.title,
        subtitle: layerInfo.subtitle,
        unit: unitOfMeasure,
        ...data.body,
      };

      if (timeSpanSelection === 'range') {
        const rechartsData = formatGIBSDataForRecharts(dataToRender);
        const numRangeDays = Math.floor(
          (Date.parse(initialEndDate) - Date.parse(initialStartDate)) / 86400000,
        );
        const startDateFormatted = `${initialStartDate.getFullYear()}-${`0${initialStartDate.getMonth() + 1}`.slice(-2)}-${`0${initialStartDate.getDate()}`.slice(-2)}`;
        const endDateFormatted = `${initialEndDate.getFullYear()}-${`0${initialEndDate.getMonth() + 1}`.slice(-2)}-${`0${initialEndDate.getDate()}`.slice(-2)}`;
        const numPoints = STEP_NUM - (
          data?.body?.errors?.error_count > 0 ? data.body.errors.error_count : 0
        );
        chartData.current = {
          title: dataToRender.title,
          subtitle: dataToRender.subtitle,
          unit: dataToRender.unit,
          errors: dataToRender.errors,
          data: rechartsData,
          startDate: primaryDate,
          endDate: secondaryDate,
          startDateFormatted,
          endDateFormatted,
          numRangeDays,
          isTruncated: false,
          numPoints,
          coordinates: [...bottomLeftLatLong, ...topRightLatLong],
          layerId: layerInfo.id,
        };
        displayChart(chartData.current, screenWidth, toggleErrorDaysExpanded, isErrordaysExpanded);
        updateChartRequestStatus(false);
      } else {
        chartData.current = {
          title: dataToRender.title,
          subtitle: dataToRender.subtitle,
          unit: dataToRender.unit,
          statData: { ...data.body },
          date: primaryDate,
        };
        displaySimpleStats(chartData.current);
        updateChartRequestStatus(false);
      }
    } else {
      // handle requests for layers outside of GIBS here!
      updateChartRequestStatus(false);
    }
  }

  useEffect(() => {
    if (doRenderChart && isPostRender) {
      onRequestChartClick();
    }
  }, [doRenderChart, isPostRender]);

  useEffect(() => {
    const isOpen = (modalId === 'CHARTING-CHART' || modalId === 'CHARTING-STATS-MODAL') && isModalOpen;
    if (isChartOpen && !isOpen && Object.keys(renderedPalettes).length > 0) {
      const layerInfo = getActiveChartingLayer();
      const paletteName = layerInfo.palette.id;
      if (renderedPalettes[paletteName]) {
        setDoRenderChart(true);
      }
    }
  }, [isChartOpen, renderedPalettes]);

  const onDateIconClick = () => {
    const layerInfo = getActiveChartingLayer();
    const layerStartDate = layerInfo.startDate ? new Date(layerInfo.startDate) : date.selected;
    const layerEndDate = layerInfo.endDate ? new Date(layerInfo.endDate) : date.appNow;
    const dateModalInput = {
      layerStartDate,
      layerEndDate,
    };
    document.body.style.setProperty('--charting-date-modal-offset', `${sidebarHeight - 50}px`);
    openChartingDateModal(dateModalInput, timeSpanSelection);
  };

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
      const layerStartDate = layerInfo.startDate ? new Date(layerInfo.startDate) : date.selected;
      const layerEndDate = layerInfo.endDate ? new Date(layerInfo.endDate) : date.appNow;
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
      debouncedUpdateAOICoordinates([...bottomLeft, ...topRight]);
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
  });

  const onLatLongChange = (coordsArray) => {
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
  };

  const toggleMapView = () => {
    if (!mapViewChecked) {
      // Clamp extent values to the visible map area
      const clampedViewExtent = viewExtent.map((val, index) => {
        if (!maxExtent) return val;
        if (index % 2 === 0) {
          // Longitude value (x)
          return Math.min(Math.max(val, maxExtent[0]), maxExtent[2]);
        }
        // Latitude value (y)
        return Math.min(Math.max(val, maxExtent[1]), maxExtent[3]);
      });
      onLatLongChange(clampedViewExtent);
    } else {
      const boundariesObj = {
        x: screenWidth / 2 - 100,
        y: screenHeight / 2 - 100,
        width: 200,
        height: 200,
      };
      onBoundaryUpdate(boundariesObj);
    }
    setMapViewChecked(!mapViewChecked);
  };

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
            widthAuto
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
        <style>{`
          #charting-create-button:disabled {
            pointer-events: auto !important;
            cursor: not-allowed;
          }
        `}</style>
        {isWithinWings && (
          <UncontrolledTooltip
            id="charting-create-button"
            target="charting-create-button"
            placement="right"
          >
            Please adjust your AOI to be within the current day's extent to generate a chart.
          </UncontrolledTooltip>
        )}
      </div>
      {chartRequestInProgress && (
        <WaitOverlay
          statusText="Creating chart..."
          onCancel={() => onCancelChart()}
        />
      )}
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
            zIndex: 2,
          }}
          topRightStyle={{
            left: x,
            top: y - 20,
            width: x2 - x,
            zIndex: 2,
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
    activeLayer,
    aoiActive,
    aoiCoordinates,
    aoiSelected,
    chartRequestInProgress,
    timeSpanSelection, timeSpanStartDate, timeSpanEndDate, fromButton, isChartOpen,
  } = charting;
  const {
    isOpen, id,
  } = modal;
  const projections = Object.keys(config.projections).map((key) => config.projections[key].crs);
  const dateSelected = date.selected;
  const dateTenBefore = util.dateAdd(dateSelected, 'day', -10);
  const dateTenAfter = util.dateAdd(dateSelected, 'day', 10);
  const timelineStartDate = date.appNow < dateTenAfter
    ? dateTenBefore
    : dateSelected;
  const timelineEndDate = date.appNow < dateTenAfter
    ? dateSelected
    : dateTenAfter;
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
    timeSpanStartDate,
    timeSpanEndDate,
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
    date,
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
          ...dateObj,
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
        isDraggable: true,
        dragHandle: '.modal-header',
        offsetLeft: 'calc(50% - 150px)',
        offsetTop: 50,
        width: 300,
        height: 340,
        stayOnscreen: true,
        type: 'selection', // This forces the user to specifically close the modal
        bodyComponentProps: {
          data,
        },
      }),
    );
  },
  displayChart: (liveData, screenWidth, toggleErrorDaysExpanded, isErrordaysExpanded) => {
    const isWideModal = screenWidth >= 1150;
    const width = isWideModal ? 1150 : 650;
    const height = isWideModal ? 475 + (isErrordaysExpanded.current ? 35 : 0) : 855;
    const offsetTop = isWideModal ? 50 : 25;
    dispatch(
      openCustomContent('CHARTING-CHART', {
        headerText: (
          <>
            BETA |
            {` ${liveData.title} `}
            -
            {` ${liveData.subtitle}${liveData.unit ? ` (${liveData.unit})` : ''}`}
            <span className="charting-chart-subheader">
              from &nbsp;
              {liveData.startDateFormatted}
              &nbsp; to &nbsp;
              {liveData.endDateFormatted}
            </span>
          </>
        ),
        backdrop: false,
        bodyComponent: ChartComponent,
        wrapClassName: 'unclickable-behind-modal',
        modalClassName: 'chart-dialog',
        isDraggable: true,
        dragHandle: '.modal-header',
        offsetLeft: `calc(50% - ${width / 2}px)`,
        offsetTop,
        width,
        height,
        stayOnscreen: true,
        autoSetHeight: true,
        type: 'selection', // This forces the user to specifically close the modal
        bodyComponentProps: {
          liveData,
          toggleErrorDaysExpanded,
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
        wrapClassName: 'unclickable-behind-modal',
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
  closeModal() {
    dispatch(onClose());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChartingModeOptions);

ChartingModeOptions.propTypes = {
  activeLayers: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  activeLayer: PropTypes.string,
  isChartingActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  chartRequestInProgress: PropTypes.bool,
  aoiCoordinates: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
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
  closeModal: PropTypes.func,
  olMap: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  crs: PropTypes.string,
  renderedPalettes: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  projections: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  aoiActive: PropTypes.bool,
  timelineStartDate: PropTypes.instanceOf(Date),
  timelineEndDate: PropTypes.instanceOf(Date),
  fromButton: PropTypes.bool,
  isChartOpen: PropTypes.bool,
  isModalOpen: PropTypes.bool,
  modalId: PropTypes.string,
  sidebarHeight: PropTypes.number,
  viewExtent: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  maxExtent: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  date: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  onUpdateStartDate: PropTypes.func,
  onUpdateEndDate: PropTypes.func,
};
