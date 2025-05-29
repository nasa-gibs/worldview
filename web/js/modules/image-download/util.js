import html2canvas from 'html2canvas';
import {
  get as lodashGet,
} from 'lodash';
import JSZip from 'jszip';
import { transform, getPointResolution } from 'ol/proj';
import initGdalJs from 'gdal3.js';
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
 * Convert a PNG image to TIFF format
 * @param {Blob} pngBlob - The PNG image as a Blob
 * @returns {Promise<Blob>} - A promise that resolves to the TIFF Blob
 */
export function convertPngToTiff(pngBlob) {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!(pngBlob instanceof Blob)) reject(new Error('Input must be a Blob'));

    // Create an object URL from the blob
    const objectUrl = URL.createObjectURL(pngBlob);

    // Create an image element to load the PNG data
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      // Revoke the object URL to free memory
      URL.revokeObjectURL(objectUrl);

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
      ifd.setUint32(entryOffset + 4, 1, true); // 1 extra sample
      ifd.setUint16(entryOffset + 8, 1, true); // Value 1 = Associated alpha data (premultiplied)
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

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image from Blob'));
    };

    img.src = objectUrl;
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
export async function convertTiffToGeoTiff (tiffBlob, options) {
  const proj4Defs = {
    'EPSG:4326': 'epsg:4326',
    'EPSG:3413': '+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs +type=crs',
    'EPSG:3031': '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs +type=crs',
  };
  const file = new File([tiffBlob], 'image.tif', { type: 'image/tiff' });
  const gdal = await initGdalJs({ path: 'https://cdn.jsdelivr.net/npm/gdal3.js@2.8.1/dist/package', useWorker: false });
  const openResult = await gdal.open(file);
  const dataset = openResult.datasets[0];
  const srs = proj4Defs[options.crs];

  const width = options.captureWidth || options.width || dataset.info.size[0];
  const height = options.captureHeight || options.height || dataset.info.size[1];
  const bbox = options.bbox.map((coord) => `${coord}`);

  const translateOpts = [
    '-strict',
    '-stats',
    '-of', 'GTiff', // Output format
    '-a_srs', srs, // Set the spatial reference system
    '-outsize', `${width}`, `${height}`, // Set the output size
    '-r', 'average', // Resampling method
    '-a_ullr', `${bbox[0]}`, `${bbox[3]}`, `${bbox[2]}`, `${bbox[1]}`, // Set the bounding box
  ];

  const translated = await gdal.gdal_translate(dataset, translateOpts);

  gdal.close(dataset);
  const output = await gdal.getFileBytes(translated);
  const blob = new Blob([output], { type: 'image/tiff' });

  return blob;
}

/**
 * Convert a PNG image to a georeferenced KML file
 * @param {Blob} imageBlob - The input PNG Blob
 * @param {Object} options - Additional options for georeferencing
 * @param {Array} options.bbox - Bounding box [minX, minY, maxX, maxY] in map units
 * @param {String} options.crs - The Coordinate Reference System identifier (e.g., 'EPSG:4326')
 * @param {String} options.name - Optional name for the KML overlay (default: 'Image Overlay')
 * @param {String} options.description - Optional description for the KML overlay
 * @returns {Promise<Blob>} - A promise that resolves to the KML Blob
 */
export function convertPngToKml(pngBlob, options) {
  return new Promise((resolve, reject) => {
    try {
      // Validate input
      if (!(pngBlob instanceof Blob)) reject(new Error('Input must be a Blob'));

      // KML requires coordinates in EPSG:4326 (WGS84)
      if (options.crs !== 'EPSG:4326') reject(new Error('KML requires WGS84 coordinates'));

      const reader = new FileReader();

      reader.onload = () => {
        try {
          // Extract the base64 part of the data URL
          const dataUrl = reader.result;
          const base64Data = dataUrl.split(',')[1];

          const [minX, minY, maxX, maxY] = options.bbox;

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

export function createWorldFile(options) {
  const { bbox, width, height } = options;

  // Validate inputs
  if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
    throw new Error('Invalid bbox parameter');
  }
  if (!width || !height || width <= 0 || height <= 0) {
    throw new Error('Invalid width or height parameters');
  }

  const [minX, minY, maxX, maxY] = bbox;

  // Calculate pixel size (map units per pixel)
  const pixelWidth = (maxX - minX) / width;
  const pixelHeight = (maxY - minY) / height;

  // Calculate the center of the top-left pixel
  // World file uses pixel center coordinates, not corner
  const halfPixelWidth = pixelWidth / 2;
  const halfPixelHeight = pixelHeight / 2;
  const topLeftX = minX + halfPixelWidth;
  const topLeftY = maxY - halfPixelHeight; // Y is flipped in world files

  // Create the world file content with high precision decimal formatting
  // World files need very precise decimal values
  const worldFileContent = [
    pixelWidth.toFixed(16), // x-scale (pixel width)
    (0).toFixed(16), // y-rotation (typically 0)
    (0).toFixed(16), // x-rotation (typically 0)
    (-pixelHeight).toFixed(16), // y-scale (negative because origin is at top)
    topLeftX.toFixed(16), // top-left x-coordinate (pixel center)
    topLeftY.toFixed(16), // top-left y-coordinate (pixel center)
  ].join('\n');

  // Create the world file blob
  const worldFileBlob = new Blob([worldFileContent], { type: 'text/plain' });
  return worldFileBlob;
}

/**
 * Convert map units (meters per pixel) to image resolution (DPI)
 * @param {Number} metersPerPixel - Ground resolution in meters per pixel
 * @param {Number} [latitude=0] - Latitude in degrees (needed for geographic projections)
 * @returns {Number} - Image resolution in DPI
 */
export function convertMetersPerPixelToResolution (metersPerPixel) {
  // Standard constants
  const INCHES_PER_METER = 39.3701; // 1 meter = 39.3701 inches
  const STANDARD_DPI = 96; // Base screen resolution

  if (metersPerPixel <= 0) {
    console.warn('Invalid meters per pixel value:', metersPerPixel);
    return STANDARD_DPI;
  }

  // For very high resolution (small meters per pixel), cap the result
  // to avoid unreasonably large DPI values
  const minimumMetersPerPixel = 0.01;
  const effectiveMetersPerPixel = Math.max(metersPerPixel, minimumMetersPerPixel);

  // Calculate raw DPI value
  const pixelsPerMeter = 1 / effectiveMetersPerPixel;
  const dpi = pixelsPerMeter * INCHES_PER_METER;

  // Round to a reasonable value to avoid strange numbers
  // Find the closest standard resolution
  const standardResolutions = [72, 96, 150, 300, 600, 1200, 2400, 4800];

  let closestDPI = STANDARD_DPI;
  let minDiff = Infinity;

  standardResolutions.forEach((standardDPI) => {
    const diff = Math.abs(dpi - standardDPI);
    if (diff < minDiff) {
      minDiff = diff;
      closestDPI = standardDPI;
    }
  });

  return closestDPI;
}

/**
 * Calculate ground resolution from map state and target DPI
 * @param {Number} dpi - Target resolution in DPI
 * @param {Object} projection - Map projection
 * @param {Number} mapResolution - Current map resolution
 * @param {Array} center - Map center coordinates
 * @returns {Number} - Ground resolution in meters per pixel
 */
export function calculateGroundResolution (dpi, projection, mapResolution, center) {
  // Scale factor based on ratio of target DPI to standard DPI
  const scaleFactor = dpi / 96;

  // Get scaled resolution in map units
  const scaledResolution = getPointResolution(
    projection,
    mapResolution / scaleFactor,
    center,
  );

  // Calculate resulting resolution in map units
  const resolutionInMapUnits = scaledResolution * scaleFactor;

  // Convert to meters if needed
  const units = projection.getUnits();
  let resolutionInMeters = resolutionInMapUnits;

  if (units === 'degrees') {
    // For geographic projections, convert degrees to meters
    const latitude = center[1];
    const metersPerDegree = 111319.9 * Math.cos((latitude * Math.PI) / 180);
    resolutionInMeters = resolutionInMapUnits * metersPerDegree;
  }

  return resolutionInMeters;
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
    const dpi = 300;
    const view = map.getView();

    // Save original map size
    const mapElement = map.getTargetElement();
    const originalStyleWidth = mapElement.style.width;
    const originalStyleHeight = mapElement.style.height;

    // Save original viewport size
    const [originalWidth, originalHeight] = map.getSize();
    const viewResolution = map.getView().getResolution();

    // Calculate geographic extent
    const topLeft = map.getCoordinateFromPixel([xOffset, yOffset]);
    const topRight = map.getCoordinateFromPixel([xOffset + width, yOffset]);
    const bottomLeft = map.getCoordinateFromPixel([xOffset, yOffset + height]);
    const bottomRight = map.getCoordinateFromPixel([xOffset + width, yOffset + height]);

    // Calculate bounds
    const minX = Math.min(topLeft[0], bottomLeft[0]);
    const maxX = Math.max(topRight[0], bottomRight[0]);
    const minY = Math.min(bottomLeft[1], bottomRight[1]);
    const maxY = Math.max(topLeft[1], topRight[1]);
    const bbox = [minX, minY, maxX, maxY];

    const projection = view.getProjection();
    // Calculate scale factor based on resolution
    const scaleFactor = dpi / 96;

    // Scale the entire map up to the target resolution
    const scaledMapWidth = originalWidth * scaleFactor;
    const scaledMapHeight = originalHeight * scaleFactor;

    // Calculate scaled positions for cropping
    const scaledXOffset = xOffset * scaleFactor;
    const scaledYOffset = yOffset * scaleFactor;
    const scaledWidth = width * scaleFactor;
    const scaledHeight = height * scaleFactor;
    const scaledResolution = viewResolution / scaleFactor;

    map.once('rendercomplete', async () => {
      try {
        const zip = new JSZip();
        // map.renderSync();

        // Create our output canvas with exact dimensions we want
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = scaledWidth;
        outputCanvas.height = scaledHeight;
        const ctx = outputCanvas.getContext('2d');

        // Capture the map at its new scaled size
        const capturedCanvas = await html2canvas(map.getViewport(), {
          backgroundColor: null,
          useCORS: true,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
          scale: 1, // No additional scaling since we already scaled the map
          logging: false,
          imageTimeout: 0,
          removeContainer: true,
        });

        // Draw only the selected region to our output canvas
        ctx.drawImage(
          capturedCanvas,
          scaledXOffset, // source x
          scaledYOffset, // source y
          scaledWidth, // source width
          scaledHeight, // source height
          0, // dest x
          0, // dest y
          scaledWidth, // dest width
          scaledHeight, // dest height
        );

        // Reset map to original size
        mapElement.style.width = originalStyleWidth;
        mapElement.style.height = originalStyleHeight;
        map.updateSize();
        view.setResolution(viewResolution);

        outputCanvas.toBlob(async (blob) => {
          const crs = map.getView().getProjection().getCode();
          const tiffBlob = await convertPngToTiff(blob); // Convert PNG blob to TIFF Blob
          const geoTiffBlob = await convertTiffToGeoTiff(tiffBlob, {
            bbox,
            crs,
            resolution: dpi,
            captureWidth: scaledWidth,
            captureHeight: scaledHeight,
          });
          const url = URL.createObjectURL(geoTiffBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `screenshot${crs}.tif`;
          link.click();
          URL.revokeObjectURL(url);

          // const worldFileBlob = await createWorldFile({
          //   bbox,
          //   width: scaledWidth,
          //   height: scaledHeight,
          // });

          // zip.file('screenshot.png', blob);
          // zip.file('screenshot.tif', tiffBlob);
          // zip.file('screenshot.pgw', worldFileBlob);
          // const zipBlob = await zip.generateAsync({
          //   type: 'blob',
          //   compression: 'DEFLATE',
          //   compressionOptions: { level: 9 },
          //   mimeType: 'application/zip',
          // });

          // const url = URL.createObjectURL(zipBlob);
          // const link = document.createElement('a');
          // link.href = url;
          // link.download = 'screenshotPNG.zip';
          // link.click();
          // URL.revokeObjectURL(url);

          // const kmlBlob = await convertPngToKml(blob, {
          //   bbox,
          //   crs: map.getView().getProjection().getCode(),
          //   name: 'Worldview Snapshot',
          //   description: 'Snapshot created with NASA Worldview',
          // });
          // zip.file('screenshot.kml', kmlBlob);
          // const kmzBlob = await zip.generateAsync({
          //   type: 'blob',
          //   compression: 'DEFLATE',
          //   compressionOptions: { level: 9 },
          //   mimeType: 'application/vnd.google-earth.kmz',
          // });

          // const url = URL.createObjectURL(kmzBlob);
          // const link = document.createElement('a');
          // link.href = url;
          // link.download = 'screenshot.kmz';
          // link.click();
          // URL.revokeObjectURL(url);

          resolve(url);
          document.body.style.cursor = 'auto';
        }, format, 1);
      } catch (error) {
        // Reset map size in case of error
        mapElement.style.width = originalStyleWidth;
        mapElement.style.height = originalStyleHeight;
        map.updateSize();
        view.setResolution(viewResolution);

        console.error('Error creating screenshot:', error);
        document.body.style.cursor = 'auto';
        reject(error);
      }
    });

    // Resize the map container
    mapElement.style.width = `${scaledMapWidth}px`;
    mapElement.style.height = `${scaledMapHeight}px`;
    map.updateSize();
    view.setResolution(scaledResolution);

    map.renderSync();
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
