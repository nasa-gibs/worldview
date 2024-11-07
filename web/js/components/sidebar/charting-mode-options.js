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
  toggleAOISelected,
  updateChartingAOICoordinates,
  updateChartingDateSelection,
  updateRequestInProgressAction,
  updateRequestStatusMessageAction,
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
let draw;

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
  };


  function getActiveChartingLayer() {
    const liveLayers = getLiveLayers();
    const filteredLayerList = liveLayers.filter((layer) => layer.id === activeLayer);
    if (filteredLayerList.length > 0) {
      return filteredLayerList[0];
    }
    return null;
  }

  function formatDateForChartRequest(dateStr) {
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
   * Provides a default AOI of the entire map if unspecified, otherwise modifies the Openlayers coordinates for use with Egis API
   * @param {Object} aoi (Area Of Interest)
   */
  function convertOLcoordsToEnvelope(aoi) {
    // let polygonCoordinates = [[-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90]];
    // if (aoi !== null) {
    //   const aoiMinX = aoi[0];
    //   const aoiMinY = aoi[1];
    //   const aoiMaxX = aoi[2];
    //   const aoiMaxY = aoi[3];

    //   polygonCoordinates = [
    //     [aoiMinX, aoiMinY], // Bottom-left
    //     [aoiMinX, aoiMaxY], // Top-left
    //     [aoiMaxX, aoiMaxY], // Top-right
    //     [aoiMaxX, aoiMinY], // Bottom-right
    //     [aoiMinX, aoiMinY], // Closing the loop (Bottom-left again)
    //   ];
    // }
    // return `${JSON.stringify(
    //   {
    //     rings: [polygonCoordinates],
    //     spatialReference: { wkid: 4326 },
    //   },
    // )}`;
    let envelopeCoordinates = {
      xmin: -10,
      ymin: -10,
      xmax: 10,
      ymax: 10,
      spatialReference: { wkid: 4326 },
    };
    if (aoi !== null) {
      const aoiMinX = aoi[0];
      const aoiMinY = aoi[1];
      const aoiMaxX = aoi[2];
      const aoiMaxY = aoi[3];

      envelopeCoordinates = {
        xmin: aoiMinX,
        ymin: aoiMinY,
        xmax: aoiMaxX,
        ymax: aoiMaxY,
        spatialReference: { wkid: 4326 },
      };
    }
    return JSON.stringify(envelopeCoordinates);
  }

  /**
   * Returns the ImageStat request parameters based on the provided layer
   * @param {Object} layerInfo
   * @param {String} timeSpanSelection | 'Date' for single date, 'Range' for date range, 'series' for time series charting
   */
  function getImageStatRequestParameters(layerInfo, timeSpan) {
    const startDateForImageStat = formatDateForChartRequest(primaryDate);
    const endDateForImageStat = formatDateForChartRequest(secondaryDate);
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

  function getImageStatStatsRequestURI(uriParameters) {
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
  async function getChartData(simpleStatsURI) {
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

  /**
   * Returns the EGIS request parameters based on the provided layer
   * @param {string} dateString | Time in YYYY-MM-DD format
   *
   * @returns {integer} | Epoch time representation of the provided string
   */
  // function convertToMsSinceEpoch(dateString) {
  //   const date = new Date(dateString);
  //   const millisecondsSinceEpoch = date.getTime(); // Time in milliseconds since Jan 1, 1970
  //   return millisecondsSinceEpoch;
  // }

  /**
   * Returns the Heatmax request parameters based on the provided layer
   * @param {Object} layerInfo
   * @param {String} timeSpanSelection | 'Date' for single date, 'Range' for date range, 'series' for time series charting
   */
  async function getHeatmaxRequestParameters(layerInfo, timeSpan) {
    // Example epoch timestamps
    // December 31, 2015 --> 1451520000000
    // December 31, 2022 --> 1672488000000
    // December 31, 2023 --> 1704024000000
    // December 31, 2050 --> 2556100800000
    // December 31, 2075 --> 3345019200000
    // December 31, 2099 --> 4102444800000

    // Uncomment this block to use the dates from the datepicker
    // const startDate = formatDateForChartRequest(primaryDate);
    // const endDate = formatDateForChartRequest(secondaryDate);
    // const startEpochTime = convertToMsSinceEpoch(startDate);
    // const endEpochTime = convertToMsSinceEpoch(endDate);
    // const time = `${startEpochTime},${endEpochTime}`;

    // Hardcoded timeframe of Dec 31, 2022 - Dec 31, 2023
    // const startTime = -599616000086;
    // const endTime = 4133894400000;

    const geometry = convertOLcoordsToEnvelope(aoiCoordinates);
    const geometryType = 'esriGeometryEnvelope';
    const sampleDistance = '';
    const sampleCount = '';
    const mosaicRule = `${JSON.stringify({
      ascending: true,
      multidimensionalDefinition: [
        {
          variableName: 'tasmax_ssp126',
          dimensionName: 'StdTime',
          values: [[-599616000086, 4133894400000]],
          isSlice: false,
        },
        // {
        //   variableName: layerInfo.id,
        //   dimensionName: 'StdTime',
        //   values: [[startTime, endTime]],
        //   isSlice: false,
        // },
      ],
    })}`;

    // const t = {
    //   ascending: true,
    //   multidimensionalDefinition: [
    //     {
    //       variableName: 'tasmax_ssp126',
    //       dimensionName: 'StdTime',
    //       values: [[-599616000086, 4133894400000]],
    //       isSlice: false,
    //     },
    //     {
    //       variableName: 'heatmax_ssp370',
    //       dimensionName: 'StdTime',
    //       values: [[-599616000086, 4133894400000]],
    //       isSlice: false,
    //     },
    //   ],
    // };


    const pixelSize = '';
    const returnFirstValueOnly = 'true';
    const interpolation = 'RSP_BilinearInterpolation';
    const outFields = '';
    const sliceId = '';
    const time = '';
    const f = 'json';

    return {
      geometryType,
      geometry,
      sampleDistance,
      sampleCount,
      mosaicRule,
      pixelSize,
      returnFirstValueOnly,
      interpolation,
      outFields,
      sliceId,
      time,
      f,
    };
  }

  /**
   * Returns the EGIS request parameters based on the provided layer
   * @param {Object} layerInfo
   * @param {String} timeSpanSelection | 'Date' for single date, 'Range' for date range, 'series' for time series charting
   */
  async function getEgisRequestParameters(layerInfo, timeSpan) {
    // Example epoch timestamps
    // December 31, 2015 --> 1451520000000
    // December 31, 2050 --> 2556100800000
    // December 31, 2075 --> 3345019200000
    // December 31, 2099 --> 4102444800000

    // Uncomment this block to use the dates from the datepicker
    // const startDate = formatDateForChartRequest(primaryDate);
    // const endDate = formatDateForChartRequest(secondaryDate);
    // const startEpochTime = convertToMsSinceEpoch(startDate);
    // const endEpochTime = convertToMsSinceEpoch(endDate);
    // const time = `${startEpochTime},${endEpochTime}`;

    // Hardcoded timeframe of Dec 31, 2015 - Dec 31, 2099
    // const time = '1451520000000,4102444800000';
    const time = '1451520000000+-+4102444800000';

    const geometry = convertOLcoordsToEnvelope(aoiCoordinates);
    const geometryType = 'esriGeometryEnvelope';
    const sampleDistance = '';
    const sampleCount = '';
    const mosaicRule = `${JSON.stringify({
      multidimensionalDefinition: [
        {
          // variableName: 'tmax_above_100',
          variableName: 'heatmax_ssp126',
          dimensionName: 'StdTime',
        },
      ],
    })}`;
    const pixelSize = '';
    const returnFirstValueOnly = 'true';
    const interpolation = 'RSP_BilinearInterpolation';
    const outFields = '*';
    const sliceId = '';

    const f = 'json';

    return {
      geometryType,
      geometry,
      sampleDistance,
      sampleCount,
      mosaicRule,
      pixelSize,
      returnFirstValueOnly,
      interpolation,
      outFields,
      sliceId,
      time,
      f,
    };
  }

  function getHeatmaxStatsRequestURI(uriParameters, baseURI) {
    const {
      geometryType,
      geometry,
      sampleDistance,
      sampleCount,
      mosaicRule,
      pixelSize,
      returnFirstValueOnly,
      interpolation,
      outFields,
      sliceId,
      time,
      f,
    } = uriParameters;
    const params = new URLSearchParams({
      geometryType,
      geometry,
      sampleDistance,
      sampleCount,
      mosaicRule,
      pixelSize,
      returnFirstValueOnly,
      interpolation,
      outFields,
      sliceId,
      time,
      f,
    });

    const requestURL = `${baseURI}?${params.toString()}`;

    return requestURL;
  }

  function getEgisStatsRequestURI(uriParameters, baseURI) {
    const {
      geometryType,
      geometry,
      sampleDistance,
      sampleCount,
      mosaicRule,
      pixelSize,
      returnFirstValueOnly,
      interpolation,
      outFields,
      sliceId,
      time,
      f,
    } = uriParameters;
    const params = new URLSearchParams({
      geometryType,
      geometry,
      sampleDistance,
      sampleCount,
      mosaicRule,
      pixelSize,
      returnFirstValueOnly,
      interpolation,
      outFields,
      sliceId,
      time,
      f,
    });

    const requestURL = `${baseURI}?${params.toString()}`;

    return requestURL;
  }

  function getKeysFromObj(data) {
    return Object.keys(data);
  }

  function calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
  }
  function calculateMean(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function calculateStandardDeviation(values) {
    const mean = calculateMean(values);
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Process the ImageStat (GIBS) data for use in the Recharts library
   * @param {Object} data | This contains the name (dates) & min, max, stddev, etc. for each step requested
   */
  function formatEgisDataForRecharts(data) {
    const rechartsData = [];
    const temperatureValues = [];
    data.samples.forEach((item) => {
      const tmaxValue = parseFloat(item.attributes.tmax_above_100);
      temperatureValues.push(tmaxValue);
    });
    data.samples.forEach((item) => {
      const date = new Date(item.attributes.StdTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      const tmaxValue = parseFloat(item.attributes.tmax_above_100);

      rechartsData.push({
        name: dateString,
        min: Math.min(...temperatureValues),
        max: Math.max(...temperatureValues),
        mean: tmaxValue,
        median: calculateMedian(temperatureValues),
        stddev: calculateStandardDeviation(temperatureValues),
      });
    });

    return rechartsData;
  }

  /**
   * Process the Prototype Heatmax data for use in the Recharts library
   * @param {Object} data | This contains the name (dates) & min, max, stddev, etc. for each step requested
   */
  function formatHeatmaxDataForRecharts(data) {
    const rechartsData = [];
    const dataValues = [];
    data.samples.forEach((item) => {
      const value = parseFloat(item.value);
      dataValues.push(value);
    });
    data.samples.forEach((item) => {
      const date = new Date(item.attributes.StdTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      const tmaxValue = parseFloat(item.value);

      rechartsData.push({
        name: dateString,
        min: Math.min(...dataValues),
        max: Math.max(...dataValues),
        mean: tmaxValue,
        median: calculateMedian(dataValues),
        stddev: calculateStandardDeviation(dataValues),
      });
    });
    return rechartsData;
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
      const requestURI = getImageStatStatsRequestURI(uriParameters);
      const data = await getChartData(requestURI);

      if (!data.ok) {
        updateChartRequestStatus(false, 'Chart request failed.');
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
          source: 'GIBS',
        });
        updateChartRequestStatus(false, 'Success');
      } else {
        displaySimpleStats(dataToRender);
        updateChartRequestStatus(false, 'Success');
      }
    } else if (requestedLayerSource === 'EGIS-WMS') {
      const uriParameters = await getEgisRequestParameters(layerInfo, timeSpanSelection);
      const baseURI = requestedLayerSource === 'EGIS-WMS'
        ? 'https://gis.earthdata.nasa.gov/UAT/rest/services/cmip6_staging_climdex_tmaxXF_ACCESS_CM2_ssp126_nc/ImageServer/getSamples'
        // : 'https://gis.earthdata.nasa.gov/maphost/rest/services/EIC/heatmax_median_multivariate/ImageServer/getSamples';
        : 'https://gis.earthdata.nasa.gov/maphost/rest/services/EIC/heatmax_median_multivariate_annual/ImageServer/getSamples';

      const requestURI = getEgisStatsRequestURI(uriParameters, baseURI);
      const data = await getChartData(requestURI);
      if (!data.ok || data.body?.error) {
        updateChartRequestStatus(false, 'Chart request failed.');
        return;
      }

      const unitOfMeasure = 'Days of maximum temperature over 100F';
      const dataToRender = {
        title: layerInfo.title,
        subtitle: layerInfo.subtitle,
        unit: unitOfMeasure,
        ...data.body,
        ...uriParameters,
      };

      const rechartsData = formatEgisDataForRecharts(dataToRender);

      displayChart({
        title: dataToRender.title,
        subtitle: dataToRender.subtitle,
        unit: dataToRender.unit,
        data: rechartsData,
        source: 'EGIS',
      });
      updateChartRequestStatus(false, 'Success');
    } else if (requestedLayerSource === 'heatmax-WMS') {
      const uriParameters = await getHeatmaxRequestParameters(layerInfo, timeSpanSelection);
      // const baseURI = 'https://gis.earthdata.nasa.gov/maphost/rest/services/EIC/heatmax_median_multivariate/ImageServer/getSamples';
      // const baseURI = 'https://gis.earthdata.nasa.gov/maphost/rest/services/EIC/heatmax_median_multivariate_historical_annual/ImageServer/getSamples';
      // const baseURI = 'https://gis.earthdata.nasa.gov/eic/rest/services/tasmax_yearly_median/ImageServer/getSamples';
      const baseURI = 'https://gis.earthdata.nasa.gov/UAT/rest/services/EIC/tasmax_yearly_median/ImageServer/getSamples';
      const requestURI = getHeatmaxStatsRequestURI(uriParameters, baseURI);
      const data = await getChartData(requestURI);
      if (!data.ok || data.body?.error) {
        updateChartRequestStatus(false, 'Chart request failed.');
        return;
      }

      const unitOfMeasure = 'Heatmax';
      const dataToRender = {
        title: layerInfo.title,
        subtitle: layerInfo.subtitle,
        unit: unitOfMeasure,
        ...data.body,
        ...uriParameters,
      };

      const rechartsData = formatHeatmaxDataForRecharts(dataToRender);

      displayChart({
        title: dataToRender.title,
        subtitle: dataToRender.subtitle,
        unit: dataToRender.unit,
        data: rechartsData,
        source: 'Heatmax',
      });
      updateChartRequestStatus(false, 'Success');
    } else {
      // handle requests for layers outside of GIBS here!
      updateChartRequestStatus(false, 'This layer is not configured for charting mode.');
    }
  }

  function onDateIconClick() {
    const layerInfo = getActiveChartingLayer();
    const layerStartDate = new Date(layerInfo.dateRanges[0].startDate);
    const layerEndDate = new Date(layerInfo.dateRanges[layerInfo.dateRanges.length - 1].endDate);
    openChartingDateModal({ layerStartDate, layerEndDate }, timeSpanSelection);
  }

  const { screenHeight, screenWidth } = props;

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
   * Convert pixel value to latitude longitude value
   * @param {Array} pixelX
   * @param {Array} pixelY
   *
   * @returns {Array}
   */
  function getLatLongFromPixelValue(pixelX, pixelY) {
    const { proj, olMap } = props;
    const coordinate = olMap.getCoordinateFromPixel([Math.floor(pixelX), Math.floor(pixelY)]);
    const { crs } = proj.selected;
    const [x, y] = olProj.transform(coordinate, crs, CRS.GEOGRAPHIC);

    return [Number(x.toFixed(4)), Number(y.toFixed(4))];
  }

  const [bottomLeftLatLong, setBottomLeftLatLong] = useState(getLatLongFromPixelValue(x, y2));
  const [topRightLatLong, setTopRightLatLong] = useState(getLatLongFromPixelValue(x2, y));

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
    setBottomLeftLatLong(getLatLongFromPixelValue(newBoundaries.x, newBoundaries.y2));
    setTopRightLatLong(getLatLongFromPixelValue(newBoundaries.x2, newBoundaries.y));
    updateAOICoordinates([...bottomLeftLatLong, ...topRightLatLong]);
  }

  const layerInfo = getActiveChartingLayer();
  const aoiTextPrompt = 'Area of Interest:';
  const oneDateBtnStatus = timeSpanSelection === 'date' ? 'btn-active' : '';
  const dateRangeBtnStatus = timeSpanSelection === 'date' ? '' : 'btn-active';
  const dateRangeValue = timeSpanSelection === 'range' ? `${primaryDate} - ${secondaryDate}` : primaryDate;
  const chartRequestMessage = chartRequestInProgress ? 'In progress...' : '';
  const requestBtnText = timeSpanSelection === 'date' ? 'Generate Statistics' : 'Generate Chart';
  const aoiBtnText = aoiActive ? 'Area Selected' : 'Entire Screen';

  return (
    <div
      id="wv-charting-mode-container"
      className="wv-charting-mode-container"
      style={{ display: isChartingActive && !isMobile ? 'block' : 'none' }}
    >
      <h1 className="charting-title">Charting Mode</h1>
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
        <span>{layerInfo && layerInfo.title}</span>
      </div>
      <div className="charting-aoi-container">
        <h3>{aoiTextPrompt}</h3>
        <CustomButton
          id="edit-coordinates"
          aria-label={aoiBtnText}
          className="edit-coordinates btn"
          onClick={onAreaOfInterestButtonClick}
          text={aoiBtnText}
        />
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
          text={requestBtnText}
        />
      </div>
      <div className="charting-request-status">
        {chartRequestMessage}
        {requestStatusMessage}
      </div>
      <div className="charting-request-status" />
      {aoiActive && (
        <Crop
          x={x}
          y={y}
          width={x2 - x}
          height={y2 - y}
          maxHeight={screenHeight}
          maxWidth={screenWidth}
          onChange={onBoundaryUpdate}
          onClose={onAreaOfInterestButtonClick}
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
    charting, map, proj, config, layers, date, palettes, screenSize,
  } = state;
  const renderedPalettes = palettes.rendered;
  const activeLayers = layers.active.layers;
  const { crs } = proj.selected;
  const { screenWidth, screenHeight } = screenSize;
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
    screenWidth,
    screenHeight,
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
