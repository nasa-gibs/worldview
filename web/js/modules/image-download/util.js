import html2canvas from 'html2canvas';
import {
  get as lodashGet,
} from 'lodash';
import JSZip from 'jszip';
import canvasSize from 'canvas-size';
import { evaluate } from 'mathjs';
import { transform, get } from 'ol/proj';
import * as olExtent from 'ol/extent';
import olTileState from 'ol/TileState';
import initGdalJs from 'gdal3.js';
import util from '../../util/util';
import { formatDisplayDate } from '../date/util';
import { nearestInterval } from '../layers/util';
import { CRS } from '../map/constants';
import {
  GDAL_WASM_PATH,
  DRIVER_DICT,
  RESOLUTIONS_GEO,
  RESOLUTIONS_POLAR,
} from './constants';

const GEO_ESTIMATION_CONSTANT = 256.0;
const POLAR_ESTIMATION_CONSTANT = 0.002197265625;
export const GRANULE_LIMIT = 30;

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
const imageUtilProcessKMZOrbitTracks = (layersArray, layerWraps, opacities) => {
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
const imageUtilProcessWrap = (fileType, layersArray, layerWraps, opacities) => {
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

function getMetersPerUnit(projection, center = [0, 0]) {
  const units = projection.getUnits();
  let metersPerUnit = projection.getMetersPerUnit();

  if (units === 'degrees') metersPerUnit *= evaluate(`cos((${center[1]} * pi) / ${180})`);

  return metersPerUnit;
}

function convertResolutionToMetersPerPixel(resolution, projection, center = [0, 0]) {
  const metersPerUnit = getMetersPerUnit(projection, center);

  return evaluate(`${resolution} * ${metersPerUnit}`);
}

/*
 * Estimate appropriate Resolution based on zoom
 * This is only run if user has not already selected
 * a resolution
 */
export function imageUtilCalculateResolution(
  zoom,
  proj,
  center,
) {
  let resolution;
  const isGeoProjection = proj.id === 'geographic';
  const { crs, resolutions } = proj.selected || proj;
  const projection = get(crs);
  const nZoomLevels = resolutions.length;
  const currentZoom = zoom < 0 ? 0 : zoom;
  const curResolution = currentZoom >= nZoomLevels
    ? resolutions[nZoomLevels - 1]
    : resolutions[currentZoom];

  const currResolutionInMeters = convertResolutionToMetersPerPixel(curResolution, projection, center);

  const getResolutions = (config) => config.values.map((res) => res.value);

  // Find the closest match of resolution within the available values
  const possibleResolutions = isGeoProjection
    ? getResolutions(RESOLUTIONS_GEO)
    : getResolutions(RESOLUTIONS_POLAR);
  let bestDiff = Infinity;
  let bestIdx = -1;
  let currDiff = 0;
  for (let i = 0; i < possibleResolutions.length; i += 1) {
    currDiff = Math.abs(possibleResolutions[i] - currResolutionInMeters);
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
  return resolution;
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
export function imageUtilGetLayers(products, proj, activePalettes) {
  const layers = products.map((layer) => {
    let layerId = layer.id;
    if (layer.downloadId) {
      layerId = layer.downloadId;
    } else if (layer.projections[proj].id) {
      layerId = layer.projections[proj].id;
    } else if (layer.projections[proj].layer) {
      layerId = layer.projections[proj].layer;
    }
    const disabled = activePalettes?.[layer.id]?.maps?.[0]?.disabled;
    if (Array.isArray(disabled)) {
      return `${layerId}%28disabled=${disabled.join('-')}%29`;
    }
    return layerId;
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
 * Get the granule date string for each layer and whether or not the granule dates were truncated
 * @param {Array} layerDefs
 * @returns {Object} { truncated: Boolean, value: String }
 */
export function getTruncatedGranuleDates(layerDefs) {
  let numGranules = 0;
  let truncated = false;

  return layerDefs.reduce((acc, def, i) => {
    let granuleDatesString = acc.value;
    if (!def.granuleDates) {
      return {
        truncated,
        value: granuleDatesString,
      };
    }
    granuleDatesString = `${acc.value}${i};`; // ensure that each granule layer gets an index
    if (numGranules >= GRANULE_LIMIT) { // limit number of granules to GRANULE_LIMIT
      truncated = true;

      return {
        truncated,
        value: granuleDatesString,
      };
    }
    const numToAdd = GRANULE_LIMIT - numGranules;
    const truncatedDates = def.granuleDates.slice(0, numToAdd);
    numGranules += truncatedDates.length;
    const processedDates = truncatedDates.map((date) => date.split(':').filter((d) => d !== '00Z').join(':'));
    return {
      truncated,
      value: `${granuleDatesString}${processedDates.join(',')},`,
    };
  }, {
    truncated: false,
    value: '',
  });
}

/**
 * Calculate ground resolution from map state and target spatial resolution
 * @param {Number} targetMetersPerPixel - Target spatial resolution in meters per pixel
 * @param {Object} projection - Map projection
 * @param {Number} mapResolution - Current map resolution
 * @param {Array} center - Map center coordinates
 * @returns {Number} - Scale factor to apply to map
 */
function calculateScaleFactor(targetMetersPerPixel, projection, mapResolution, center) {
  const currentResolutionInMeters = convertResolutionToMetersPerPixel(mapResolution, projection, center);

  // Calculate scale factor needed to achieve target resolution
  return evaluate(`${currentResolutionInMeters} / ${targetMetersPerPixel}`);
}

export const estimateMaxCanvasSize = () => canvasSize.maxArea();

export async function estimateMaxImageSize() {
  const { height: maxHeight, width: maxWidth } = await estimateMaxCanvasSize();

  const devicePixelRatio = window.devicePixelRatio || 1;
  const aoiMaxHeight = maxHeight / devicePixelRatio;
  const aoiMaxWidth = maxWidth / devicePixelRatio;

  return {
    height: Math.floor(aoiMaxHeight),
    width: Math.floor(aoiMaxWidth),
  };
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
export function getDownloadUrl(url, proj, layerDefs, bbox, dimensions, dateTime, fileType, isWorldfile, markerCoordinates, activePalettes) {
  const { crs } = proj.selected;
  const {
    layersArray,
    layerWraps,
    opacities,
  } = imageUtilProcessWrap(
    fileType,
    imageUtilGetLayers(layerDefs, proj.id, activePalettes),
    imageUtilGetLayerWrap(layerDefs),
    imageUtilGetLayerOpacities(layerDefs),
  );

  const imgFormat = fileType || 'image/jpeg';
  const { height, width } = dimensions;
  const snappedDateTime = getLatestIntervalTime(layerDefs, dateTime);
  const granuleDates = getTruncatedGranuleDates(layerDefs).value;
  const colormaps = layerDefs.map((layer) => layer.palette?.id);
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
  if (Array.isArray(colormaps) && colormaps.length > 0) {
    params.push(`colormaps=${colormaps.join(',')}`);
  }
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
      return validCoords.concat([mCoord[0], mCoord[1]]);
    }, []);
    params.push(`MARKER=${coords.join(',')}`);
  }
  return `${url}?${params.join('&')}&ts=${Date.now()}`;
}

/**
 * Convert a PNG image to a georeferenced KML file
 * @param {Blob} pngBlob - The input PNG Blob
 * @param {Object} options - Additional options for georeferencing
 * @param {Array} options.extent - Bounding box [minX, minY, maxX, maxY] in map units
 * @param {String} options.crs - The Coordinate Reference System identifier (e.g., 'EPSG:4326')
 * @param {String} options.name - Optional name for the KML overlay (default: 'Image Overlay')
 * @param {String} options.description - Optional description for the KML overlay
 * @returns {Promise<Blob>} - A promise that resolves to the KML Blob
 */
export function convertPngToKml(pngBlob, options) {
  return new Promise((resolve, reject) => {
    try {
      // Validate input
      if (!(pngBlob instanceof Blob)) return reject(new Error('Input must be a Blob'));

      // KML requires coordinates in EPSG:4326 (WGS84)
      if (options.crs !== 'EPSG:4326') return reject(new Error('KML requires WGS84 coordinates'));

      const reader = new FileReader();

      reader.onload = () => {
        try {
          // Extract the base64 part of the data URL
          const dataUrl = reader.result;
          const base64Data = dataUrl.split(',')[1];

          const [minX, minY, maxX, maxY] = options.extent;

          // Create the KML document
          const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
            <kml xmlns="http://www.opengis.net/kml/2.2">
              <Document>
                <name>${options.name || 'Image Overlay'}</name>
                <GroundOverlay>
                  <name>${options.name || 'Image Overlay'}</name>
                  ${options.description ? `<description>${options.description}</description>` : ''}
                  <Icon>
                    <href>data:image/png;base64,${base64Data}</href>
                  </Icon>
                  <LatLonBox>
                    <north>${maxY}</north>
                    <south>${minY}</south>
                    <east>${maxX}</east>
                    <west>${minX}</west>
                    <rotation>0</rotation>
                  </LatLonBox>
                </GroundOverlay>
              </Document>
            </kml>`;
          // Create the KML Blob
          const kmlBlob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
          resolve(kmlBlob);
        } catch (error) {
          console.error('Error creating KML content:', error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read image data'));

      reader.readAsDataURL(pngBlob);
    } catch (error) {
      console.error('Error creating KML:', error);
      reject(error);
    }
  });
}

/**
 * Convert a input Blob to a properly georeferenced GeoTIFF Blob
 * @param {Blob} pngBlob - The input TIFF Blob
 * @param {Object} options - Additional options for georeferencing
 * @param {Array} options.extent - Bounding box [minX, minY, maxX, maxY] in map units
 * @param {String} options.crs - The Coordinate Reference System identifier (e.g., 'EPSG:4326')
 * @param {Number} options.metersPerPixel - Ground resolution in meters per pixel
 * @param {Number} options.captureWidth - Width of the output image in pixels
 * @param {Number} options.captureHeight - Height of the output image in pixels
 * @param {String} options.inputFormat - Input image format (default: 'png')
 * @param {String} options.outputFormat - Output image format (default: 'tif')
 * @param {Boolean} options.worldfile - Whether to create a worldfile
 * @param {String} options.name - Optional name for the output file
 * @param {String} options.description - Optional description for the output file
 * @returns {Promise<Blob>} - A promise that resolves to the GeoTIFF Blob
 */
export async function georeference (inputBlob, options) {
  let {
    outputFormat = 'tif',
  } = options;
  const {
    inputFormat = 'png',
    crs = 'EPSG:4326',
    captureHeight,
    captureWidth,
  } = options;
  if (outputFormat === 'tiff' || outputFormat === 'geotiff') outputFormat = 'tif'; // Normalize tiff to tif for consistency
  if (outputFormat === 'jpeg') outputFormat = 'jpg'; // Normalize jpg to jpeg for consistency
  if (outputFormat === 'kml') {
    const blob = await convertPngToKml(inputBlob, options);

    return [
      {
        name: 'image.kml',
        blob,
      },
    ];
  }
  const worldfile = options.worldfile ? 'YES' : 'NO';

  const file = new File([inputBlob], `image.${inputFormat}`, { type: `image/${inputFormat}` });
  const gdal = await initGdalJs({ path: GDAL_WASM_PATH, useWorker: true });
  const openResult = await gdal.open(file);
  const dataset = openResult.datasets[0];

  const width = captureWidth || dataset.info.size[0];
  const height = captureHeight || dataset.info.size[1];
  const extent = options.extent.map((coord) => `${coord}`);
  const driver = DRIVER_DICT[outputFormat];

  const translateOpts = [
    '-strict',
    '-of', driver, // Output format
    '-a_srs', crs, // Set the spatial reference system
    '-outsize', `${width}`, `${height}`, // Set the output size
    '-r', 'average', // Resampling method
    '-a_ullr', extent[0], extent[3], extent[2], extent[1], // Set the bounding box
  ];
  if (driver !== 'GTiff') {
    translateOpts.push('-co', `WORLDFILE=${worldfile}`); // Create a world file if requested
  } else {
    translateOpts.push('-co', `TFW=${worldfile}`); // Create ESRI tfw file
  }

  // For JPEG output, ensure RGB color space by selecting only RGB bands and setting color interpretation
  if (driver === 'JPEG') {
    const jpegOpts = [
      '-co', 'QUALITY=75', // Maximum quality
      '-b', '1', '-b', '2', '-b', '3', // Select only RGB bands, drop alpha
      '-colorinterp', 'red,green,blue', // RGB color interpretation
    ];
    translateOpts.push(...jpegOpts);
  }

  const translate = await gdal.gdal_translate(dataset, translateOpts);

  gdal.close(dataset);

  const files = translate.all.map((p) => ({ path: p.local }));
  const imageFilePath = files.find((f) => f.path.endsWith(`.${outputFormat}`))?.path;
  const worldFilePath = files.find((f) => f.path.endsWith('.wld') || f.path.endsWith('.tfw'))?.path;
  const imageFileBytes = await gdal.getFileBytes(imageFilePath);
  const imageFileName = imageFilePath.split('/').pop();
  const imageFileBlob = new Blob([imageFileBytes]);
  const output = [
    {
      name: imageFileName,
      blob: imageFileBlob,
    },
  ];
  if (worldFilePath) {
    const worldfileBytes = await gdal.getFileBytes(worldFilePath);
    const worldFileName = worldFilePath.split('/').pop();
    const worldFileBlob = new Blob([worldfileBytes], { type: 'text/plain' });
    output.push({
      name: worldFileName,
      blob: worldFileBlob,
    });
  }

  return output;
}

/**
 * Update high-resolution tile grids for a specific layer
 * @param {*} layer - The OpenLayers layer to update
 * @returns {Function} - A function to restore the original tile grids
 */
function updateHighResTileGrids(layer, abortSignal, tileMatrixID = -1) {
  const originalSource = layer.getSource();
  if (typeof originalSource?.getTileGrid !== 'function') return () => null; // No tile grid to update
  const SourceConstructor = originalSource.constructor;
  const originalTileGrid = originalSource.getTileGrid();
  const TileGridConstructor = originalTileGrid.constructor;
  const resolutions = originalTileGrid.getResolutions();
  if (typeof originalTileGrid.getMatrixIds !== 'function') return () => null; // No matrix IDs to update
  const matrixIds = originalTileGrid.getMatrixIds?.();
  const maxResolutions = resolutions.slice(0, tileMatrixID + 1);
  const maxMatrixIds = matrixIds ? matrixIds.slice(0, tileMatrixID + 1) : undefined;

  const tileGrid = new TileGridConstructor({
    ...originalTileGrid,
    origin: originalTileGrid.getOrigin?.() || originalTileGrid.origin_,
    extent: originalTileGrid.getExtent?.() || originalTileGrid.extent_,
    resolutions: maxResolutions,
    matrixIds: maxMatrixIds,
    tileSize: originalTileGrid.getTileSize?.() || originalTileGrid.tileSize_,
    minZoom: tileMatrixID,
    maxZoom: tileMatrixID,
  });

  const originalTileLoadFunction = originalSource.getTileLoadFunction?.() || originalSource.tileLoadFunction_;

  const cancellableTileLoadFunction = async (tile, src) => {
    tile.setState(olTileState.LOADING);
    try {
      const response = await fetch(src, { signal: abortSignal });
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      await originalTileLoadFunction(tile, imageUrl);
      URL.revokeObjectURL(imageUrl);
      tile.setState(olTileState.LOADED);
    } catch (error) {
      tile.setState(olTileState.ERROR);
    }
  };
  const sourceOptions = {
    ...originalSource,
    urls: originalSource.getUrls?.() || originalSource.urls_,
    format: originalSource.getFormat?.() || originalSource.format_,
    projection: originalSource.getProjection?.() || originalSource.projection_,
    tileGrid,
    layer: originalSource.getLayer?.() || originalSource.layer_,
    tileLoadFunction: cancellableTileLoadFunction,
    matrixSet: originalSource.getMatrixSet?.() || originalSource.matrixSet_,
    dimensions: originalSource.getDimensions?.() || originalSource.dimensions_,
    crossOrigin: 'anonymous',
  };

  const hrSource = new SourceConstructor(sourceOptions);
  layer.setSource(hrSource);

  return () => layer.setSource(originalSource);
}

/**
 * Toggle high-resolution tile grids for all layers in the map
 * @param {Object} map - The OpenLayers map instance
 * @returns {Function} - A function to restore the original tile grids
 */
function toggleHighResTileGrids (map, abortSignal, tileMatrixID) {
  const layers = map.getAllLayers();
  const restoreSources = layers
    .filter((layer) => layer.isVisible())
    .map((layer) => updateHighResTileGrids(layer, abortSignal, tileMatrixID));

  return () => restoreSources.forEach((restoreSource) => restoreSource());
}

/**
 * Create a restore function for the map and (optionally) configure high-resolution tile grids
 * @param {Object} map
 * @returns {Function} - A function to restore the original map state
 */
function createMapRestore(map, extent, abortSignal, tileMatrixID) {
  const mapElement = map.getTargetElement();
  const originalView = map.getView();
  const ViewConstructor = originalView.constructor;
  const newView = new ViewConstructor({
    center: originalView.getCenter(),
    resolution: originalView.getResolution(),
    projection: originalView.getProjection(),
    zoom: originalView.getZoom(),
    rotation: originalView.getRotation(),
    maxZoom: originalView.getMaxZoom(),
    minZoom: originalView.getMinZoom(),
    extent: extent || originalView.getExtent(),
    maxResolution: originalView.getMaxResolution(),
    minResolution: originalView.getMinResolution(),
    resolutions: originalView.getResolutions(),
    multiWorld: false,
    showFullExtent: true,
    smoothResolutionConstraint: false,
  });
  map.setView(newView);
  const originalStyleWidth = mapElement.style.width;
  const originalStyleHeight = mapElement.style.height;

  const restoreLayers = toggleHighResTileGrids(map, abortSignal, tileMatrixID);

  return () => {
    // Restore original map size
    restoreLayers();
    map.setView(originalView);
    mapElement.style.width = originalStyleWidth;
    mapElement.style.height = originalStyleHeight;
    map.updateSize();
  };
}

// function rejectIfAborted(abortSignal, reject, restoreMap) {
//   if (abortSignal?.aborted) {
//     restoreMap?.();
//     reject(new DOMException('Snapshot operation was cancelled', 'AbortError'));
//   }
// }

/**
 * Initiates a download and waits for a reasonable delay to simulate download completion
 * @param {Blob} blob - The blob to download
 * @param {String} filename - The filename for the download
 * @param {AbortSignal} abortSignal - Optional abort signal
 * @returns {Promise} - Resolves when download is initiated and delay is complete
 */
async function initiateDownload(blob, filename, abortSignal, parentReject) {
  // Check if cancelled before starting download
  // rejectIfAborted(abortSignal, parentReject);

  // Wait for download to initiate with cancellation support
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, 0);

    if (abortSignal) {
      const abortHandler = () => {
        clearTimeout(timeoutId);
        reject(new DOMException('Snapshot operation was cancelled', 'AbortError'));
      };

      if (abortSignal.aborted) {
        clearTimeout(timeoutId);
        reject(new DOMException('Snapshot operation was cancelled', 'AbortError'));
        return;
      }

      abortSignal.addEventListener('abort', abortHandler, { once: true });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      // Clean up the event listener when the timeout completes
      setTimeout(() => {
        abortSignal.removeEventListener('abort', abortHandler);
      }, 0);
    }
  });
}

function getExtentFromPixelBbox(pixelBbox, map) {
  const [minPixelX, minPixelY, maxPixelX, maxPixelY] = pixelBbox;

  // Calculate geographic extent
  const topLeft = map.getCoordinateFromPixel([minPixelX, minPixelY]);
  const topRight = map.getCoordinateFromPixel([maxPixelX, minPixelY]);
  const bottomLeft = map.getCoordinateFromPixel([minPixelX, maxPixelY]);
  const bottomRight = map.getCoordinateFromPixel([maxPixelX, maxPixelY]);

  // Put everything in the correct order
  const minX = Math.min(topLeft[0], bottomLeft[0]);
  const maxX = Math.max(topRight[0], bottomRight[0]);
  const minY = Math.min(bottomLeft[1], bottomRight[1]);
  const maxY = Math.max(topLeft[1], topRight[1]);
  const extent = [minX, minY, maxX, maxY];

  return extent;
}

async function fitViewToExtent(map, extent) {
  return new Promise((resolve) => {
    const view = map.getView();
    // the callback option in view.fit is called before the view is actually fitted in safari, so we need to wait for the render complete event
    map.once('rendercomplete', () => resolve());
    view.fit(extent, { callback: () => map.render() });
  });
}

async function waitForRenderComplete(map) {
  return new Promise((resolve) => {
    map.once('rendercomplete', () => resolve());
    map.render();
  });
}

/**
 * Create a snapshot of the map with the given options
 * @param {Object} options - Snapshot configuration options
 * @param {String} options.format - Output format (e.g., 'tif', 'png', 'kmz')
 * @param {Number} options.metersPerPixel - Target spatial resolution in meters per pixel
 * @param {Array} options.pixelBbox - Pixel bounding box [minX, minY, maxX, maxY]
 * @param {Object} options.map - OpenLayers map instance
 * @param {Boolean} options.worldfile - Whether to include a worldfile
 * @param {Boolean} options.useHighResTileGrids - Whether to use high resolution tile grids
 * @param {AbortSignal} options.abortSignal - Optional AbortController signal to cancel the operation
 * @returns {Promise<void>} - Promise that resolves when snapshot is complete
 * @throws {DOMException} - Throws AbortError if the operation is cancelled
 */
export async function snapshot(options) {
  const { height: maxHeight = 0, width: maxWidth = 0 } = await estimateMaxCanvasSize();

  const {
    format,
    metersPerPixel,
    pixelBbox,
    map,
    worldfile,
    abortSignal,
    filename = 'Worldview Snapshot',
    projection,
  } = options;

  // Check if operation was cancelled before starting
  if (abortSignal?.aborted) {
    throw new DOMException('Snapshot operation was cancelled before starting', 'AbortError');
  }

  // Save original viewport size
  const [originalWidth, originalHeight] = map.getSize();
  const extent = getExtentFromPixelBbox(pixelBbox, map);

  const isGeoProjection = projection.id === 'geographic';

  const config = isGeoProjection ? RESOLUTIONS_GEO : RESOLUTIONS_POLAR;
  const tileMatrixID = config.values.find((res) => res.value === metersPerPixel)?.tileMatrixID;

  // Create a restore function for the map state. This also manages the use of high-res tilegrids for the layers.
  const restoreMap = createMapRestore(map, extent, abortSignal, tileMatrixID);
  const view = map.getView();

  // Add abort event listener to clean up if cancelled
  const abortHandler = () => {
    restoreMap();
  };

  if (abortSignal) {
    abortSignal.addEventListener('abort', abortHandler);
  }

  await fitViewToExtent(map, extent);

  const viewResolution = view.getResolution();

  // Calculate scale factor based on target spatial resolution
  const center = view.getCenter();
  const scaleFactor = calculateScaleFactor(
    metersPerPixel,
    view.getProjection(),
    viewResolution,
    center,
  );

  // Scale the entire map up to the target resolution
  const scaledMapWidth = evaluate(`${originalWidth} * ${scaleFactor}`);
  const scaledMapHeight = evaluate(`${originalHeight} * ${scaleFactor}`);
  const devicePixelRatio = window.devicePixelRatio || 1;
  const scaledMapWidthWithDPR = evaluate(`${scaledMapWidth} * ${devicePixelRatio}`);
  const scaledMapHeightWithDPR = evaluate(`${scaledMapHeight} * ${devicePixelRatio}`);

  if (scaledMapWidthWithDPR > maxWidth || scaledMapHeightWithDPR > maxHeight) throw new Error(`Scaled area exceeds maximum allowed size: ${maxWidth}x${maxHeight}. Current size: ${Math.floor(scaledMapWidthWithDPR)}x${Math.floor(scaledMapHeightWithDPR)}.`);

  const scaledResolution = evaluate(`${viewResolution} / ${scaleFactor}`);
  const mapElement = map.getTargetElement();

  map.setSize([scaledMapWidth, scaledMapHeight]);
  mapElement.style.width = `${scaledMapWidth}px`;
  mapElement.style.height = `${scaledMapHeight}px`;
  map.updateSize();
  view.setResolution(scaledResolution);

  await waitForRenderComplete(map);

  // Check if operation was cancelled at the start
  // rejectIfAborted(abortSignal, reject, restoreMap);

  const topLeft = olExtent.getTopLeft(extent);
  const bottomLeft = olExtent.getBottomLeft(extent);
  const topRight = olExtent.getTopRight(extent);

  const aoiPixelTopLeft = map.getPixelFromCoordinate(topLeft);
  const aoiPixelBottomLeft = map.getPixelFromCoordinate(bottomLeft);
  const aoiPixelTopRight = map.getPixelFromCoordinate(topRight);

  const aoiPixelXOffset = aoiPixelTopLeft[0];
  const aoiPixelYOffset = aoiPixelTopLeft[1];
  const aoiPixelWidth = Math.abs(evaluate(`${aoiPixelTopRight[0]} - ${aoiPixelTopLeft[0]}`));
  const aoiPixelHeight = Math.abs(evaluate(`${aoiPixelBottomLeft[1]} - ${aoiPixelTopLeft[1]}`));

  const [mapWidth, mapHeight] = map.getSize();

  const dpr = window.devicePixelRatio || 1;

  // Create our output canvas with exact dimensions we want
  const outputWidth = evaluate(`${aoiPixelWidth} * ${dpr}`);
  const outputHeight = evaluate(`${aoiPixelHeight} * ${dpr}`);
  const outputCanvas = new OffscreenCanvas(outputWidth, outputHeight);

  const ctx = outputCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = false; // Disable smoothing for pixel-perfect rendering

  // Scale the context to ensure correct drawing operations
  ctx.scale(dpr, dpr);

  const capturedCanvas = new OffscreenCanvas(mapWidth * dpr, mapHeight * dpr);

  // Check if operation was cancelled before html2canvas
  // rejectIfAborted(abortSignal, reject, restoreMap);

  // Capture the map at its new scaled size
  await html2canvas(mapElement, {
    canvas: capturedCanvas,
    backgroundColor: null,
    useCORS: true,
    allowTaint: true,
    scrollX: 0,
    scrollY: 0,
    scale: dpr,
    logging: false,
    imageTimeout: 0,
    removeContainer: true,
    ignoreElements: (element) => element.classList.contains('ol-overlaycontainer-stopevent'), // this is super finicky, maybe prep the mapElement by hiding elements using css,
  });

  const sourceX = evaluate(`${aoiPixelXOffset} * ${dpr}`);
  const sourceY = evaluate(`${aoiPixelYOffset} * ${dpr}`);
  const sourceWidth = outputCanvas.width; // Use the actual width of the output canvas
  const sourceHeight = outputCanvas.height; // Use the actual height of the output canvas

  const capturedCtx = capturedCanvas.getContext('2d');
  capturedCtx.imageSmoothingEnabled = false; // Disable smoothing for pixel-perfect rendering
  const capturedImageData = capturedCtx.getImageData(
    Math.round(sourceX), // source x
    sourceY, // source y
    sourceWidth, // source width
    sourceHeight, // source height
    { colorSpace: 'srgb' },
  );

  ctx.colorSpace = 'srgb';

  ctx.putImageData(
    capturedImageData,
    0, // dest x
    0, // dest y
    0, // source x
    0, // source y
    sourceWidth, // dest width
    sourceHeight, // dest height
  );

  // Reset map to original size
  restoreMap();

  // Check if operation was cancelled before processing image
  // rejectIfAborted(abortSignal, reject);

  const pngBlob = await outputCanvas.convertToBlob({
    type: 'image/png',
    quality: 1, // Maximum quality
  });

  const crs = map.getView().getProjection().getCode();

  // Check if operation was cancelled before georeferencing
  // rejectIfAborted(abortSignal, reject);

  const georeferencedOutput = await georeference(pngBlob, {
    extent,
    crs,
    metersPerPixel,
    captureWidth: outputWidth / dpr,
    captureHeight: outputHeight / dpr,
    inputFormat: 'png',
    outputFormat: format === 'kmz' ? 'kml' : format,
    worldfile,
    name: 'Worldview Snapshot',
    description: 'Snapshot created with NASA Worldview',
  });

  if (georeferencedOutput.length > 1 || format === 'kmz') {
    // Check if operation was cancelled before creating zip
    // rejectIfAborted(abortSignal, reject);

    const zip = new JSZip();
    georeferencedOutput.forEach(({ name, blob }) => zip.file(name, blob));
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
      mimeType: format !== 'kmz' ? 'application/zip' : 'application/vnd.google-earth.kmz',
    });

    // Final check before download
    // rejectIfAborted(abortSignal, reject);

    return initiateDownload(zipBlob, `${filename}.${format !== 'kmz' ? 'zip' : 'kmz'}`, abortSignal);
  }
  // Final check before download
  // rejectIfAborted(abortSignal, reject);

  const { blob } = georeferencedOutput[0];
  return initiateDownload(blob, `${filename}.${format}`, abortSignal);
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

export function imageSizeValid(options) {
  const {
    maxHeight,
    maxWidth,
    map,
    resolution,
    pixelBbox,
  } = options;

  const imgWidth = Math.abs(pixelBbox[1][0] - pixelBbox[0][0]);
  const imgHeight = Math.abs(pixelBbox[1][1] - pixelBbox[0][1]);
  const view = map.getView();
  const projection = view.getProjection();
  const center = view.getCenter();
  const extent = getExtentFromPixelBbox(pixelBbox, map);
  const viewResolution = view.getResolutionForExtent(extent);

  const scaleFactor = calculateScaleFactor(
    resolution,
    projection,
    viewResolution,
    center,
  );

  const mapSize = map.getSize();
  const [scaledWidth, scaledHeight] = mapSize.map((size) => size * scaleFactor);

  const isZero = imgHeight === 0 && imgWidth === 0;
  const isTooBig = scaledWidth > maxHeight || scaledHeight > maxWidth;

  if (isZero || isTooBig) return false;

  return true;
}

export function getDimensions(map, bounds, resolution) {
  const projection = map.getView().getProjection();
  const center = map.getView().getCenter();
  const metersPerUnit = getMetersPerUnit(projection, center);

  const mapWidth = Math.abs(bounds[1][0] - bounds[0][0]) * metersPerUnit;
  const mapHeight = Math.abs(bounds[1][1] - bounds[0][1]) * metersPerUnit;

  const imgWidth = Math.round(mapWidth / resolution);
  const imgHeight = Math.round(mapHeight / resolution);

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
