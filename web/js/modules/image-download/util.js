import {
  each as lodashEach,
  get as lodashGet,
} from 'lodash';
import { transform } from 'ol/proj';
import util from '../../util/util';
import { formatDisplayDate } from '../date/util';
import { nearestInterval } from '../layers/util';
import { CRS } from '../map/constants';

const GEO_ESTIMATION_CONSTANT = 256.0;
const POLAR_ESTIMATION_CONSTANT = 0.002197265625;
const GRANULE_LIMIT = 15;

/**
 * Get a date time snapped to the interval of the layer with the shortest interval.
 * This should give us the snapped time closest to the current app time.
 * @param {Object} layerDefs - layer definitions for all visible layers
 * @param {Date} dateTime - current application dateTime
 * @returns {Date}
 */
export function getLatestIntervalTime(layerDefs, dateTime) {
  const subDailyDefs = layerDefs.filter((def) => def.period === 'subdaily') || [];
  const defsSortedByInterval = subDailyDefs.sort((defA, defB) => {
    const intervalA = Number(lodashGet(defA, 'dateRanges[0].dateInterval'));
    const intervalB = Number(lodashGet(defB, 'dateRanges[0].dateInterval'));
    return intervalA - intervalB;
  });

  return subDailyDefs.length
    ? nearestInterval(defsSortedByInterval[0], dateTime)
    : new Date(dateTime.setUTCHours(0, 0, 0, 0));
}

/**
 * KMZ Only: Process original orbit track layers to split into two separate
 * ayers and repeat wrap and opacity values for original
 * @param {Array} layersArray
 * @param {Array} layerWraps
 * @param {Array} opacities
 * @returns {Object} layersArray, layerWraps, opacities
 */
const imageUtilProcessKMZOrbitTracks = function(layersArray, layerWraps, opacities) {
  const processedLayersArray = [...layersArray];
  const processedLayerWraps = [...layerWraps];
  const processedOpacities = [...opacities];

  let mod = 0;
  // check for OrbitTracks in layersArray
  for (let i = 0; i < layersArray.length; i += 1) {
    const layerId = layersArray[i];
    if (layerId.includes('OrbitTracks')) {
      // track index for modifications from splicing
      const idx = i + mod;
      // revise OrbitTracks layerId requested to individual 'Lines' and 'Points' layers
      // ex: 'OrbitTracks_Aqua_Ascending' is revised in the request as:
      // 'OrbitTracks_Aqua_Ascending_Points' and 'OrbitTracks_Aqua_Ascending_Lines'
      processedLayersArray.splice(idx, 1, `${layerId}_Lines`, `${layerId}_Points`);
      // repeat wrap and opacity values for revised 'Lines' and 'Points' layers
      const wrap = processedLayerWraps[idx];
      processedLayerWraps.splice(idx, 0, wrap);
      if (opacities.length > 0) {
        const opacity = processedOpacities[idx];
        processedOpacities.splice(idx, 0, opacity);
      }

      mod += 1;
    }
  }

  return {
    layersArray: processedLayersArray,
    layerWraps: processedLayerWraps,
    opacities: processedOpacities,
  };
};

/**
 * Wrap to handle image util processes with additional KMZ processing if applicable
 * @param {String/Boolean} fileType (false for default 'image/jpeg')
 * @param {Array} layersArray
 * @param {Array} layerWraps
 * @param {Array} opacities
 * @returns {Object} layersArray, layerWraps, opacities
 */
const imageUtilProcessWrap = function(fileType, layersArray, layerWraps, opacities) {
  if (fileType === 'application/vnd.google-earth.kmz') {
    return imageUtilProcessKMZOrbitTracks(layersArray, layerWraps, opacities);
  }
  return {
    layersArray,
    layerWraps,
    opacities,
  };
};

export function imageUtilEstimateResolution(resolution, isGeoProjection) {
  return isGeoProjection
    ? resolution / POLAR_ESTIMATION_CONSTANT
    : resolution / GEO_ESTIMATION_CONSTANT;
}

/*
 * Estimate appropriate Resolution based on zoom
 * This is only run if user has not already selected
 * a resolution
 */
export function imageUtilCalculateResolution(
  zoom,
  isGeoProjection,
  resolutions,
) {
  let resolution;
  const nZoomLevels = resolutions.length;
  const currentZoom = zoom < 0 ? 0 : zoom;
  const curResolution = currentZoom >= nZoomLevels
    ? resolutions[nZoomLevels - 1]
    : resolutions[currentZoom];

  // Estimate the option value used by "wv-image-resolution"
  const resolutionEstimate = imageUtilEstimateResolution(
    curResolution,
    isGeoProjection,
  );

  // Find the closest match of resolution within the available values
  const possibleResolutions = isGeoProjection
    ? [0.125, 0.25, 0.5, 1, 2, 4, 20, 40]
    : [1, 2, 4, 20, 40];
  let bestDiff = Infinity;
  let bestIdx = -1;
  let currDiff = 0;
  for (let i = 0; i < possibleResolutions.length; i += 1) {
    currDiff = Math.abs(possibleResolutions[i] - resolutionEstimate);
    if (currDiff < bestDiff) {
      resolution = possibleResolutions[i];
      bestDiff = currDiff;
      bestIdx = i;
    }
  }

  // Bump up resolution in certain cases where default is too low
  if (bestIdx > 0) {
    if (isGeoProjection) {
      switch (currentZoom) {
        case 3:
        case 4:
        case 6:
        case 7:
          resolution = possibleResolutions[bestIdx - 1];
          break;
        default:
          break;
      }
    } else {
      switch (currentZoom) {
        case 1:
        case 2:
        case 4:
        case 5:
          resolution = possibleResolutions[bestIdx - 1];
          break;
        default:
          break;
      }
    }
  }
  return resolution.toString();
}

/*
 * Retrieves active layers by day
 *
 * @method getLayersForDay
 * @private
 *
 * @param {array} array of layers
 *
 * @returns {array} array of layer ids
 *
 */
export function imageUtilGetLayers(products, proj) {
  const layers = [];
  lodashEach(products, (layer) => {
    if (layer.downloadId) {
      layers.push(layer.downloadId);
    } else if (layer.projections[proj].id) {
      layers.push(layer.projections[proj].id);
    } else if (layer.projections[proj].layer) {
      layers.push(layer.projections[proj].layer);
    } else {
      layers.push(layer.id);
    }
  });
  return layers;
}

/*
 * Retrieves opacities from palettes
 *
 * @method getOpacities
 * @private
 *
 * @param {array} array of layers
 *
 * @returns {array} array of opacities
 *
 */
export function imageUtilGetLayerOpacities(layers) {
  const opacities = [];
  let found = false;
  layers.forEach((layer) => {
    let opacity = '';
    if ('opacity' in layer && layer.opacity !== 1) {
      opacity = layer.opacity;
      found = true;
    } else {
      opacity = '';
    }
    opacities.push(opacity);
  });
  if (!found) {
    return [];
  }
  return opacities;
}

export function imageUtilGetLayerWrap(layers) {
  return layers.map((layer) => {
    if (layer.wrapX) {
      return 'x';
    }
    if (layer.wrapadjacentdays) {
      return 'day';
    }
    return 'none';
  }) || [];
}

/**
 * Given a bounding box as an array of a lower left coordinate pair
 * and an upper right coordinate pair, return the BBOX parameter value
 * suitable in a WMS 1.3 call. For EPSG:4326, the coordinates are in
 * Y,X order, otherwise in X,Y order.
 */
export function bboxWMS13(lonlats, crs) {
  if (crs === CRS.GEOGRAPHIC) {
    return `${lonlats[0][1]},${lonlats[0][0]},${lonlats[1][1]},${
      lonlats[1][0]
    }`;
  }
  return `${lonlats[0][0]},${lonlats[0][1]},${lonlats[1][0]},${
    lonlats[1][1]
  }`;
}

/**
 * Get the snapshots URL to download an image
 * @param {String} url
 * @param {Object} proj
 * @param {Array} layer(s) objects
 * @param {Array} lonlats
 * @param {Object} dimensions
 * @param {Date} dateTime
 * @param {String/Boolean} fileType (false for default 'image/jpeg')
 * @param {Boolean} isWorldfile
 * @param {Array} markerCoordinates
 */
export function getDownloadUrl(url, proj, layerDefs, bbox, dimensions, dateTime, fileType, isWorldfile, markerCoordinates) {
  const { crs } = proj.selected;
  const {
    layersArray,
    layerWraps,
    opacities,
  } = imageUtilProcessWrap(
    fileType,
    imageUtilGetLayers(layerDefs, proj.id),
    imageUtilGetLayerWrap(layerDefs),
    imageUtilGetLayerOpacities(layerDefs),
  );

  const imgFormat = fileType || 'image/jpeg';
  const { height, width } = dimensions;
  const snappedDateTime = getLatestIntervalTime(layerDefs, dateTime);
  let numGranules = 0;
  const granuleDates = layerDefs.reduce((acc, def, i) => {
    let granuleDatesString = acc;
    if (!def.granuleDates) return granuleDatesString;
    granuleDatesString = `${acc}${i};`; // ensure that each granule layer gets an index
    if (numGranules >= GRANULE_LIMIT) return granuleDatesString; // limit number of granules
    const numToAdd = GRANULE_LIMIT - numGranules;
    const truncatedDates = def.granuleDates.slice(0, numToAdd);
    numGranules += truncatedDates.length;
    const processedDates = truncatedDates.map((date) => date.split(':').filter((d) => d !== '00Z').join(':'));
    return `${granuleDatesString}${processedDates.join(',')},`;
  }, '');
  const params = [
    'REQUEST=GetSnapshot',
    `TIME=${util.toISOStringSeconds(snappedDateTime)}`,
    `BBOX=${bboxWMS13(bbox, crs)}`,
    `CRS=${crs}`,
    `LAYERS=${layersArray.join(',')}`,
    `WRAP=${layerWraps.join(',')}`,
    `FORMAT=${imgFormat}`,
    `WIDTH=${width}`,
    `HEIGHT=${height}`,
  ];
  if (granuleDates.length > 0) {
    params.push(`granule_dates=${granuleDates}`);
  }
  if (opacities.length > 0) {
    params.push(`OPACITIES=${opacities.join(',')}`);
  }
  if (isWorldfile) {
    params.push('WORLDFILE=true');
  }

  // handle adding coordinates marker
  if (markerCoordinates.length > 0) {
    const coords = markerCoordinates.reduce((validCoords, { longitude: lon, latitude: lat }) => {
      const mCoord = transform([lon, lat], CRS.GEOGRAPHIC, crs);
      // const inExtent = containsCoordinate(boundingExtent(bbox), mCoord);
      return validCoords.concat([mCoord[0], mCoord[1]]);
    }, []);
    params.push(`MARKER=${coords.join(',')}`);
  }
  return `${url}?${params.join('&')}&ts=${Date.now()}`;
}

export function imageUtilGetConversionFactor(proj) {
  if (proj === 'geographic') return POLAR_ESTIMATION_CONSTANT;
  return GEO_ESTIMATION_CONSTANT;
}

/*
 * Retrieves coordinates from pixel
 * @returns {array} array of coords
 */
export function imageUtilGetCoordsFromPixelValues(pixels, map) {
  const {
    x, y, x2, y2,
  } = pixels;
  return [
    map.getCoordinateFromPixel([Math.floor(x), Math.floor(y2)]),
    map.getCoordinateFromPixel([Math.floor(x2), Math.floor(y)]),
  ];
}

export function imageUtilGetPixelValuesFromCoords(bottomLeft, topRight, map) {
  const [x, y2] = map.getPixelFromCoordinate([bottomLeft[0], bottomLeft[1]]);
  const [x2, y] = map.getPixelFromCoordinate([topRight[0], topRight[1]]);
  return {
    x: Math.round(x),
    y: Math.round(y),
    x2: Math.round(x2),
    y2: Math.round(y2),
  };
}

export function imageSizeValid(imgHeight, imgWidth, maxSize) {
  if (imgHeight === 0 && imgWidth === 0) {
    return false;
  }
  if (imgHeight > maxSize || imgWidth > maxSize) {
    return false;
  }
  return true;
}

export function getDimensions(projection, bounds, resolution) {
  const conversionFactor = imageUtilGetConversionFactor(projection);
  const imgWidth = Math.round(
    Math.abs(bounds[1][0] - bounds[0][0])
    / conversionFactor
    / Number(resolution),
  );
  const imgHeight = Math.round(
    Math.abs(bounds[1][1] - bounds[0][1])
    / conversionFactor
    / Number(resolution),
  );
  return { width: imgWidth, height: imgHeight };
}
export function getPercentageFromPixel(maxDimension, dimension) {
  return Math.round((dimension / maxDimension) * 100);
}
export function getPixelFromPercentage(maxDimension, percent) {
  return Math.round((percent / 100) * maxDimension);
}

/**
 * Find if there are layers that cannot be downloaded
 * @param {Array} visibleLayers
 *
 * @return {Bool}
 */
export function hasNonDownloadableVisibleLayer(visibleLayers) {
  return visibleLayers.some(({ disableSnapshot = false }) => disableSnapshot);
}
/**
 * Get string of layers to be removed if alert is accepted
 * @param {Array} nonDownloadableLayers
 *
 * @return {String}
 */
export function getNamesOfNondownloadableLayers(nonDownloadableLayers) {
  let names = '';
  if (nonDownloadableLayers.length) {
    nonDownloadableLayers.forEach((obj) => {
      const str = names ? `, ${obj.title || obj.id}` : obj.title || obj.id;
      names += str;
    });
  }
  return names;
}
/**
 * Get warning that shows layers that will be removed if notification is accepted
 * @param {Array} nonDownloadableLayers
 *
 * @return {String}
 */
export function getNonDownloadableLayerWarning(nonDownloadableLayer) {
  const layerStr = getNamesOfNondownloadableLayers(nonDownloadableLayer);
  if (!layerStr) return '';
  const multiLayers = layerStr.indexOf(',') > -1;
  const layerPluralStr = multiLayers ? 'layers' : 'layer';
  const thisTheseStr = multiLayers ? 'these' : 'this';
  return `The ${layerStr} ${layerPluralStr} cannot be included in a snapshot. Would you like to temporarily hide ${thisTheseStr} layer?`;
}
/**
 * Get array of layers that will be removed if notification is accepted
 * @param {Array} visibleLayers
 *
 * @return {Array}
 */
export function getNonDownloadableLayers(visibleLayers) {
  return visibleLayers.filter(({ disableSnapshot = false }) => disableSnapshot);
}
/**
 * Get dateline message for selecting snapshot area
 * @param {Object} date
 * @param {Array} geolonlat1
 * @param {Array} geolonlat2
 * @param {Object} proj
 *
 * @return {String}
 */
export function getAlertMessageIfCrossesDateline(date, geolonlat1, geolonlat2, proj) {
  const { maxExtent, id } = proj.selected;
  let alertMessage = '';
  if (id === 'geographic') {
    const crossesNextDay = geolonlat1[0] < maxExtent[0];
    const crossesPrevDay = geolonlat2[0] > maxExtent[2];
    const zeroedDate = util.clearTimeUTC(date);
    const nextDay = formatDisplayDate(util.dateAdd(zeroedDate, 'day', 1));
    const prevDay = formatDisplayDate(util.dateAdd(zeroedDate, 'day', -1));
    const buildString = (lineStr, dateStr) => `The selected snapshot area crosses ${lineStr} and uses imagery from the ${dateStr}.`;
    if (crossesNextDay && crossesPrevDay) {
      // snapshot extends over both map wings
      alertMessage = buildString('both datelines', `previous day ${prevDay} and next day ${nextDay}`);
    } else if (crossesNextDay) {
      // min longitude less than maxExtent min longitude (-180 geographic)
      alertMessage = buildString('the dateline', `next day ${nextDay}`);
    } else if (crossesPrevDay) {
      // max longitude greater than maxExtent max longitude (180 geographic)
      alertMessage = buildString('the dateline', `previous day ${prevDay}`);
    }
  }
  return alertMessage;
}
