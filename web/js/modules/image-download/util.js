import html2canvas from 'html2canvas';
import {
  get as lodashGet,
} from 'lodash';
import { transform } from 'ol/proj';
import util from '../../util/util';
import { formatDisplayDate } from '../date/util';
import { nearestInterval } from '../layers/util';
import { CRS } from '../map/constants';

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
      // const inExtent = containsCoordinate(boundingExtent(bbox), mCoord);
      return validCoords.concat([mCoord[0], mCoord[1]]);
    }, []);
    params.push(`MARKER=${coords.join(',')}`);
  }
  return `${url}?${params.join('&')}&ts=${Date.now()}`;
}

/**
 * Get the device pixels per millimeter
 * @returns {number} The number of pixels per millimeter
 */
function getDevicePixelsPerMillimeter() {
  // Create a temporary div element with a known size in millimeters
  const div = document.createElement('div');
  div.style.width = '10mm';
  div.style.height = '10mm';
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  document.body.appendChild(div);

  // Get the size of the div in pixels
  const pixelsPerMillimeter = div.offsetWidth / 10;

  // Remove the temporary div element
  document.body.removeChild(div);

  // Adjust for device pixel ratio
  return pixelsPerMillimeter * window.devicePixelRatio;
}

/**
 * Convert a PNG image (provided as a data URL) to TIFF
 * @param {String} dataUrl - The data URL of the input PNG file
 * @returns {Promise<Blob>} - A promise that resolves to the TIFF Blob
 */
export async function convertPngToTiff(dataUrl) {
  return new Promise((resolve, reject) => {
    try {
      // Create an image element to load the PNG data
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        // Create a canvas to draw the image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image on the canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Get the image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Create the TIFF header and IFD
        const header = new Uint8Array([
          0x49, 0x49, // Little endian byte order
          0x2A, 0x00, // TIFF identifier (42)
          0x08, 0x00, 0x00, 0x00, // Offset to first IFD
        ]);

        // Calculate offsets and sizes
        const samplesPerPixel = 4; // RGBA
        const bitsPerSample = [8, 8, 8, 8]; // 8 bits per sample for each channel

        // IFD entries
        const ifdCount = 14;
        const ifdSize = 2 + ifdCount * 12 + 4; // 2 for count, 12 per entry, 4 for next IFD offset
        const bitsPerSampleOffset = 8 + ifdSize;
        const stripOffsetsOffset = bitsPerSampleOffset + bitsPerSample.length * 2;
        const stripByteCountsOffset = stripOffsetsOffset + 4;
        const imageDataOffset = stripByteCountsOffset + 4;

        // Create the IFD
        const ifd = new DataView(new ArrayBuffer(ifdSize));
        ifd.setUint16(0, ifdCount, true); // Number of IFD entries

        let entryOffset = 2;

        // Set IFD entries
        // ImageWidth
        ifd.setUint16(entryOffset, 256, true);
        ifd.setUint16(entryOffset + 2, 4, true); // LONG
        ifd.setUint32(entryOffset + 4, 1, true);
        ifd.setUint32(entryOffset + 8, img.width, true);
        entryOffset += 12;

        // ImageLength
        ifd.setUint16(entryOffset, 257, true);
        ifd.setUint16(entryOffset + 2, 4, true); // LONG
        ifd.setUint32(entryOffset + 4, 1, true);
        ifd.setUint32(entryOffset + 8, img.height, true);
        entryOffset += 12;

        // BitsPerSample
        ifd.setUint16(entryOffset, 258, true);
        ifd.setUint16(entryOffset + 2, 3, true); // SHORT
        ifd.setUint32(entryOffset + 4, samplesPerPixel, true);
        ifd.setUint32(entryOffset + 8, bitsPerSampleOffset, true);
        entryOffset += 12;

        // Compression (no compression)
        ifd.setUint16(entryOffset, 259, true);
        ifd.setUint16(entryOffset + 2, 3, true); // SHORT
        ifd.setUint32(entryOffset + 4, 1, true);
        ifd.setUint16(entryOffset + 8, 1, true);
        entryOffset += 12;

        // PhotometricInterpretation (RGB)
        ifd.setUint16(entryOffset, 262, true);
        ifd.setUint16(entryOffset + 2, 3, true); // SHORT
        ifd.setUint32(entryOffset + 4, 1, true);
        ifd.setUint16(entryOffset + 8, 2, true);
        entryOffset += 12;

        // StripOffsets
        ifd.setUint16(entryOffset, 273, true);
        ifd.setUint16(entryOffset + 2, 4, true); // LONG
        ifd.setUint32(entryOffset + 4, 1, true);
        ifd.setUint32(entryOffset + 8, imageDataOffset, true);
        entryOffset += 12;

        // SamplesPerPixel
        ifd.setUint16(entryOffset, 277, true);
        ifd.setUint16(entryOffset + 2, 3, true); // SHORT
        ifd.setUint32(entryOffset + 4, 1, true);
        ifd.setUint16(entryOffset + 8, samplesPerPixel, true);
        entryOffset += 12;

        // RowsPerStrip
        ifd.setUint16(entryOffset, 278, true);
        ifd.setUint16(entryOffset + 2, 4, true); // LONG
        ifd.setUint32(entryOffset + 4, 1, true);
        ifd.setUint32(entryOffset + 8, img.height, true);
        entryOffset += 12;

        // StripByteCounts
        ifd.setUint16(entryOffset, 279, true);
        ifd.setUint16(entryOffset + 2, 4, true); // LONG
        ifd.setUint32(entryOffset + 4, 1, true);
        ifd.setUint32(entryOffset + 8, pixels.length, true);
        entryOffset += 12;

        // XResolution (72 dpi)
        ifd.setUint16(entryOffset, 282, true);
        ifd.setUint16(entryOffset + 2, 5, true); // RATIONAL
        ifd.setUint32(entryOffset + 4, 1, true);
        ifd.setUint32(entryOffset + 8, stripByteCountsOffset + 4, true);
        entryOffset += 12;

        // YResolution (72 dpi)
        ifd.setUint16(entryOffset, 283, true);
        ifd.setUint16(entryOffset + 2, 5, true); // RATIONAL
        ifd.setUint32(entryOffset + 4, 1, true);
        ifd.setUint32(entryOffset + 8, stripByteCountsOffset + 12, true);
        entryOffset += 12;

        // PlanarConfiguration (contiguous)
        ifd.setUint16(entryOffset, 284, true);
        ifd.setUint16(entryOffset + 2, 3, true); // SHORT
        ifd.setUint32(entryOffset + 4, 1, true);
        ifd.setUint16(entryOffset + 8, 1, true);
        entryOffset += 12;

        // ResolutionUnit (inch)
        ifd.setUint16(entryOffset, 296, true);
        ifd.setUint16(entryOffset + 2, 3, true); // SHORT
        ifd.setUint32(entryOffset + 4, 1, true);
        ifd.setUint16(entryOffset + 8, 2, true);
        entryOffset += 12;

        // ExtraSamples (alpha data)
        ifd.setUint16(entryOffset, 338, true);
        ifd.setUint16(entryOffset + 2, 3, true); // SHORT
        ifd.setUint32(entryOffset + 4, 1, true);
        ifd.setUint16(entryOffset + 8, 2, true);
        entryOffset += 12;

        // Next IFD offset (0 for last IFD)
        ifd.setUint32(entryOffset, 0, true);

        // Create the BitsPerSample array
        const bitsPerSampleArray = new Uint16Array(bitsPerSample);

        // Create the XResolution and YResolution values (72/1 as RATIONAL)
        const resolutionData = new DataView(new ArrayBuffer(16));
        resolutionData.setUint32(0, 72, true); // Numerator
        resolutionData.setUint32(4, 1, true); // Denominator
        resolutionData.setUint32(8, 72, true); // Numerator
        resolutionData.setUint32(12, 1, true); // Denominator

        // Combine all parts of the TIFF file
        const headerSize = header.length;

        const tiffData = new Uint8Array(imageDataOffset + pixels.length);
        tiffData.set(header, 0);
        tiffData.set(new Uint8Array(ifd.buffer), headerSize);
        tiffData.set(new Uint8Array(bitsPerSampleArray.buffer), bitsPerSampleOffset);
        tiffData.set(new Uint8Array(resolutionData.buffer), stripByteCountsOffset + 4);
        tiffData.set(pixels, imageDataOffset);

        // Create the TIFF Blob
        const tiffBlob = new Blob([tiffData], { type: 'image/tiff' });
        resolve(tiffBlob);
      };

      img.onerror = (error) => {
        reject(new Error('Failed to load image'));
      };

      img.src = dataUrl;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Convert a TIFF Blob to a properly georeferenced GeoTIFF Blob
 * @param {Blob} tiffBlob - The input TIFF Blob
 * @param {Object} options - Additional options for georeferencing
 * @param {Array} options.bbox - Bounding box [minX, minY, maxX, maxY] in map units
 * @param {String} options.crs - The Coordinate Reference System identifier (e.g., 'EPSG:4326')
 * @param {Number} options.resolution - Image resolution in DPI
 * @returns {Promise<Blob>} - A promise that resolves to the GeoTIFF Blob
 */
export async function convertTiffToGeoTiff(tiffBlob, options) {
  try {
    // Extract image data from TIFF
    const arrayBuffer = await tiffBlob.arrayBuffer();
    const dataView = new DataView(arrayBuffer);

    // Check for TIFF header
    const byteOrder = dataView.getUint16(0);
    const isLittleEndian = byteOrder === 0x4949; // 'II' for Intel (little-endian)
    if (byteOrder !== 0x4949 && byteOrder !== 0x4D4D) {
      throw new Error('Not a valid TIFF file');
    }

    // Skip to IFD
    const ifdOffset = dataView.getUint32(4, isLittleEndian);
    const numEntries = dataView.getUint16(ifdOffset, isLittleEndian);

    // Extract basic TIFF info
    let width = 0;
    let height = 0;
    let bitsPerSample = [];
    let samplesPerPixel = 0;
    let compression = 1;
    let photometric = 0;
    let stripOffsets = 0;
    let stripByteCounts = 0;
    let rowsPerStrip = 0;
    let planarConfig = 1;

    // Read IFD entries
    for (let i = 0; i < numEntries; i += 1) {
      const entryOffset = ifdOffset + 2 + (i * 12);
      const tag = dataView.getUint16(entryOffset, isLittleEndian);
      const count = dataView.getUint32(entryOffset + 4, isLittleEndian);
      const valueOffset = dataView.getUint32(entryOffset + 8, isLittleEndian);

      if (tag === 256) { // ImageWidth
        width = count === 1 ? valueOffset : dataView.getUint32(valueOffset, isLittleEndian);
      } else if (tag === 257) { // ImageLength
        height = count === 1 ? valueOffset : dataView.getUint32(valueOffset, isLittleEndian);
      } else if (tag === 258) { // BitsPerSample
        if (count === 1) {
          bitsPerSample = [valueOffset];
        } else {
          bitsPerSample = [];
          for (let j = 0; j < count; j += 1) {
            bitsPerSample.push(dataView.getUint16(valueOffset + j * 2, isLittleEndian));
          }
        }
      } else if (tag === 259) { // Compression
        compression = valueOffset;
      } else if (tag === 262) { // PhotometricInterpretation
        photometric = valueOffset;
      } else if (tag === 273) { // StripOffsets
        stripOffsets = count === 1 ? valueOffset : dataView.getUint32(valueOffset, isLittleEndian);
      } else if (tag === 277) { // SamplesPerPixel
        samplesPerPixel = valueOffset;
      } else if (tag === 278) { // RowsPerStrip
        rowsPerStrip = count === 1 ? valueOffset : dataView.getUint32(valueOffset, isLittleEndian);
      } else if (tag === 279) { // StripByteCounts
        stripByteCounts = count === 1 ? valueOffset : dataView.getUint32(valueOffset, isLittleEndian);
      } else if (tag === 284) { // PlanarConfiguration
        planarConfig = valueOffset;
      }
    }

    // Read image data
    const imageData = new Uint8Array(arrayBuffer, stripOffsets, stripByteCounts);

    // Calculate proper georeferencing parameters
    const [minX, minY, maxX, maxY] = options.bbox;
    const pixelWidth = (maxX - minX) / width;
    const pixelHeight = (maxY - minY) / height;


    // Create new GeoTIFF from scratch
    // Header (8 bytes)
    const header = new Uint8Array([
      0x49, 0x49, // Little endian
      0x2A, 0x00, // TIFF identifier
      0x08, 0x00, 0x00, 0x00, // Offset to first IFD
    ]);

    // Count basic + geo tags
    const numTags = 10 + 4; // Basic TIFF tags + GeoTIFF tags

    // Calculate offsets
    const ifdSize = 2 + (numTags * 12) + 4; // Count + entries + next IFD pointer
    const bitsPerSampleOffset = 8 + ifdSize;
    const geoKeyDirectoryOffset = bitsPerSampleOffset + (samplesPerPixel * 2);
    const modelPixelScaleOffset = geoKeyDirectoryOffset + 34;
    const modelTiepointOffset = modelPixelScaleOffset + 24;
    const geoAsciiParamsOffset = modelTiepointOffset + 48;
    const imageDataOffset = geoAsciiParamsOffset + options.crs.length + 1;

    // Create buffer for the GeoTIFF
    const totalSize = imageDataOffset + imageData.length;
    const buffer = new ArrayBuffer(totalSize);
    const newArray = new Uint8Array(buffer);
    const newView = new DataView(buffer);

    // Set header
    newArray.set(header, 0);

    // Set IFD count
    newView.setUint16(8, numTags, true);

    // Current position for IFD entries
    let pos = 10;

    // Basic TIFF tags
    // ImageWidth
    newView.setUint16(pos, 256, true);
    newView.setUint16(pos + 2, 4, true); // LONG
    newView.setUint32(pos + 4, 1, true);
    newView.setUint32(pos + 8, width, true);
    pos += 12;

    // ImageLength
    newView.setUint16(pos, 257, true);
    newView.setUint16(pos + 2, 4, true); // LONG
    newView.setUint32(pos + 4, 1, true);
    newView.setUint32(pos + 8, height, true);
    pos += 12;

    // BitsPerSample
    newView.setUint16(pos, 258, true);
    newView.setUint16(pos + 2, 3, true); // SHORT
    newView.setUint32(pos + 4, samplesPerPixel, true);
    newView.setUint32(pos + 8, bitsPerSampleOffset, true);
    pos += 12;

    // Compression
    newView.setUint16(pos, 259, true);
    newView.setUint16(pos + 2, 3, true); // SHORT
    newView.setUint32(pos + 4, 1, true);
    newView.setUint16(pos + 8, compression, true);
    pos += 12;

    // PhotometricInterpretation
    newView.setUint16(pos, 262, true);
    newView.setUint16(pos + 2, 3, true); // SHORT
    newView.setUint32(pos + 4, 1, true);
    newView.setUint16(pos + 8, photometric, true);
    pos += 12;

    // StripOffsets
    newView.setUint16(pos, 273, true);
    newView.setUint16(pos + 2, 4, true); // LONG
    newView.setUint32(pos + 4, 1, true);
    newView.setUint32(pos + 8, imageDataOffset, true);
    pos += 12;

    // SamplesPerPixel
    newView.setUint16(pos, 277, true);
    newView.setUint16(pos + 2, 3, true); // SHORT
    newView.setUint32(pos + 4, 1, true);
    newView.setUint16(pos + 8, samplesPerPixel, true);
    pos += 12;

    // RowsPerStrip
    newView.setUint16(pos, 278, true);
    newView.setUint16(pos + 2, 4, true); // LONG
    newView.setUint32(pos + 4, 1, true);
    newView.setUint32(pos + 8, rowsPerStrip || height, true);
    pos += 12;

    // StripByteCounts
    newView.setUint16(pos, 279, true);
    newView.setUint16(pos + 2, 4, true); // LONG
    newView.setUint32(pos + 4, 1, true);
    newView.setUint32(pos + 8, imageData.length, true);
    pos += 12;

    // PlanarConfiguration
    newView.setUint16(pos, 284, true);
    newView.setUint16(pos + 2, 3, true); // SHORT
    newView.setUint32(pos + 4, 1, true);
    newView.setUint16(pos + 8, planarConfig, true);
    pos += 12;

    // ModelPixelScaleTag (33550)
    newView.setUint16(pos, 33550, true);
    newView.setUint16(pos + 2, 12, true); // DOUBLE
    newView.setUint32(pos + 4, 3, true); // 3 values
    newView.setUint32(pos + 8, modelPixelScaleOffset, true);
    pos += 12;

    // ModelTiepointTag (33922)
    newView.setUint16(pos, 33922, true);
    newView.setUint16(pos + 2, 12, true); // DOUBLE
    newView.setUint32(pos + 4, 6, true); // 6 values
    newView.setUint32(pos + 8, modelTiepointOffset, true);
    pos += 12;

    // GeoKeyDirectoryTag (34735)
    newView.setUint16(pos, 34735, true);
    newView.setUint16(pos + 2, 3, true); // SHORT
    newView.setUint32(pos + 4, 16, true); // 4 keys * 4 values
    newView.setUint32(pos + 8, geoKeyDirectoryOffset, true);
    pos += 12;

    // GeoAsciiParamsTag (34737)
    newView.setUint16(pos, 34737, true);
    newView.setUint16(pos + 2, 2, true); // ASCII
    newView.setUint32(pos + 4, options.crs.length + 1, true); // Length including null terminator
    newView.setUint32(pos + 8, geoAsciiParamsOffset, true);
    pos += 12;

    // Next IFD offset (0 for last/only IFD)
    newView.setUint32(pos, 0, true);
    pos += 4;

    // Write BitsPerSample
    for (let i = 0; i < samplesPerPixel; i += 1) {
      newView.setUint16(bitsPerSampleOffset + (i * 2), bitsPerSample[i] || 8, true);
    }

    // Parse EPSG code from CRS
    let epsgCode = 4326; // Default to WGS84
    if (options.crs && options.crs.includes('EPSG:')) {
      epsgCode = parseInt(options.crs.split(':')[1], 10);
    }

    // Set GeoKeyDirectory values
    const geoKeys = [
      1, 1, 0, 4, // Version/revision/minor/number of keys
      1024, 0, 1, 2, // GTModelTypeGeoKey (2 = Geographic)
      1025, 0, 1, 1, // GTRasterTypeGeoKey (1 = PixelIsArea)
      2048, 0, 1, epsgCode, // GeographicTypeGeoKey (parsed from CRS)
      2054, 0, 1, 9001, // GeogLinearUnitsGeoKey (9001 = meters)
    ];
    for (let i = 0; i < geoKeys.length; i += 1) {
      newView.setUint16(geoKeyDirectoryOffset + (i * 2), geoKeys[i], true);
    }

    // Set ModelPixelScale values (pixel size in map units)
    // GeoTIFF expects [width_per_pixel, height_per_pixel, 0]
    newView.setFloat64(modelPixelScaleOffset, pixelWidth, true);
    newView.setFloat64(modelPixelScaleOffset + 8, pixelHeight, true);
    newView.setFloat64(modelPixelScaleOffset + 16, 0, true);

    // Set ModelTiepoint values (mapping between raster and map coordinates)
    // GeoTIFF expects [pixel_x, pixel_y, pixel_z, geo_x, geo_y, geo_z]
    // For upper-left origin point:
    newView.setFloat64(modelTiepointOffset, 0, true); // Pixel X
    newView.setFloat64(modelTiepointOffset + 8, 0, true); // Pixel Y
    newView.setFloat64(modelTiepointOffset + 16, 0, true); // Pixel Z
    newView.setFloat64(modelTiepointOffset + 24, minX, true); // Geo X (min X)
    newView.setFloat64(modelTiepointOffset + 32, maxY, true); // Geo Y (max Y - origin at top)
    newView.setFloat64(modelTiepointOffset + 40, 0, true); // Geo Z

    // Set GeoAsciiParams values (the CRS string)
    for (let i = 0; i < options.crs.length; i += 1) {
      newView.setUint8(geoAsciiParamsOffset + i, options.crs.charCodeAt(i));
    }
    newView.setUint8(geoAsciiParamsOffset + options.crs.length, 0); // Null terminator

    // Copy image data
    newArray.set(imageData, imageDataOffset);

    return new Blob([buffer], { type: 'image/tiff' });
  } catch (error) {
    console.error('Error creating GeoTIFF:', error);
    throw error;
  }
}

export function snapshot (options) {
  document.body.style.cursor = 'wait';
  return new Promise((resolve, reject) => {
    const {
      format,
      resolution,
      width,
      height,
      xOffset,
      yOffset,
      map,
    } = options;
    const devicePixelsPerMillimeter = getDevicePixelsPerMillimeter();
    const [mapWidth, mapHeight] = map.getSize();
    const widthMM = mapWidth / devicePixelsPerMillimeter; // Map width in millimeters
    const heightMM = mapHeight / devicePixelsPerMillimeter; // Map height in millimeters
    const dim = [widthMM, heightMM]; // size in mm

    const scaledWidth = Math.round((dim[0] * resolution) / 25.4); // 25.4 mm in an inch
    const scaledHeight = Math.round((dim[1] * resolution) / 25.4); // 25.4 mm in an inch

    const calcXOffset = ((xOffset / devicePixelsPerMillimeter) * resolution) / 25.4;
    const calcYOffset = ((yOffset / devicePixelsPerMillimeter) * resolution) / 25.4;
    const calcWidth = ((width / devicePixelsPerMillimeter) * resolution) / 25.4;
    const calcHeight = ((height / devicePixelsPerMillimeter) * resolution) / 25.4;

    // Get accurate geographic bounding box for the capture area
    const bottomLeft = map.getCoordinateFromPixel([xOffset, yOffset + height]);
    const topRight = map.getCoordinateFromPixel([xOffset + width, yOffset]);
    const bbox = [bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]];

    const exportOptions = {
      useCORS: true,
      allowTaint: true,
      width: calcWidth,
      height: calcHeight,
      x: calcXOffset,
      y: calcYOffset,
    };

    const geotiffOptions = {
      bbox,
      crs: map.getView().getProjection().getCode(),
      resolution,
    };

    map.once('rendercomplete', async () => {
      try {
        const canvas = await html2canvas(map.getViewport(), exportOptions);
        const dataURL = canvas.toDataURL(format);
        // Reset original map size
        map.getTargetElement().style.width = '';
        map.getTargetElement().style.height = '';
        map.updateSize();
        const tiffBlob = await convertPngToTiff(dataURL);
        const geoTiffBlob = await convertTiffToGeoTiff(tiffBlob, geotiffOptions);
        const url = URL.createObjectURL(geoTiffBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'output.tif';
        link.click();
        URL.revokeObjectURL(url);

        resolve(dataURL);
        document.body.style.cursor = 'auto';
      } catch (error) {
        console.error('Error creating GeoTIFF:', error);
        map.getTargetElement().style.width = '';
        map.getTargetElement().style.height = '';
        map.updateSize();
        document.body.style.cursor = 'auto';
        reject(error);
      }
    });

    // Set print size
    map.getTargetElement().style.height = `${scaledHeight}px`;
    map.getTargetElement().style.width = `${scaledWidth}px`;
    map.updateSize();
  });
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
