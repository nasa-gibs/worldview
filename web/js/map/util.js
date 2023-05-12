import * as olExtent from 'ol/extent';
import OlGeomLineString from 'ol/geom/LineString';
import {
  RESOLUTION_FOR_LARGE_WMS_TILES,
  RESOLUTION_FOR_SMALL_WMS_TILES,
} from '../modules/map/constants';
import util from '../util/util';

const ZOOM_DURATION = 250;

/*
 * Setting a zoom action
 *
 * @function self.zoomAction
 * @static
 *
 * @param {Object} map - OpenLayers Map Object
 * @param {number} amount - Direction and
 *  amount to zoom
 * @param {number} duration - length of animation
 * @param {array} center - point to center zoom
 *
 * @returns {void}
 */
export function mapUtilZoomAction(map, amount, duration, center) {
  const zoomDuration = duration || ZOOM_DURATION;
  const centerPoint = center || undefined;
  const view = map.getView();
  const zoom = view.getZoom();
  const minZoom = view.getMinZoom();
  const maxZoom = view.getMaxZoom();

  let newZoom = zoom + amount;
  const newZoomBelowMin = newZoom < minZoom;
  const newZoomExceedsMax = newZoom > maxZoom;
  // if newZoom is animating, it may not be an integer
  // and will require revising to within min/max zoom constraints
  if (zoom < maxZoom && newZoomExceedsMax) {
    newZoom = maxZoom;
  } else if (zoom > minZoom && newZoomBelowMin) {
    newZoom = minZoom;
  } else if (newZoomExceedsMax || newZoomBelowMin) {
    return;
  }

  const isAnimating = view.getAnimating();
  view.animate({
    zoom: newZoom,
    duration: isAnimating ? 0 : zoomDuration,
    center: centerPoint,
  });
}

/**
 *
 * @param {Array} tileSize Size of tile to be returned in pixels
 *
 * @returns {Array} WMS Layer resolutions
 */
export function getGeographicResolutionWMS(tileSize) {
  if (!tileSize || !tileSize.length) return RESOLUTION_FOR_LARGE_WMS_TILES;
  return tileSize[0] === 256 ? RESOLUTION_FOR_SMALL_WMS_TILES : RESOLUTION_FOR_LARGE_WMS_TILES;
}

/**
 * Create x/y/z vectortile requester url
 * @param {Date} date
 * @param {string} layerName
 * @param {String} tileMatrixSet
 *
 * @return {String} URL
 */
export function createVectorUrl(date, layerName, tileMatrixSet) {
  const time = util.toISOStringSeconds(util.roundTimeOneMinute(date));
  const params = [
    `TIME=${time}`,
    `layer=${layerName}`,
    `tilematrixset=${tileMatrixSet}`,
    'Service=WMTS',
    'Request=GetTile',
    'Version=1.0.0',
    'FORMAT=application%2Fvnd.mapbox-vector-tile',
    'TileMatrix={z}',
    'TileCol={x}',
    'TileRow={y}',
  ];
  return `?${params.join('&')}`;
}

/**
 *
 * @param {Object} def
 * @param {String} projId
 */
export function mergeBreakpointLayerAttributes(def, projId) {
  const { breakPointLayer } = def;
  if (breakPointLayer) {
    const updatedBreakPointLayer = { ...breakPointLayer, ...breakPointLayer.projections[projId] };
    return { ...def, breakPointLayer: updatedBreakPointLayer };
  } return def;
}

/**
   *
   * @param {*} currentDeg
   * @param {*} currentView
   */
export function saveRotation(currentDeg, currentView) {
  if (Math.abs(currentDeg) === 360) {
    currentView.setRotation(0);
  } else if (Math.abs(currentDeg) >= 360) {
    const newNadVal = (360 - Math.abs(currentDeg)) * (Math.PI / 180);
    if (currentDeg < 0) {
      currentView.setRotation(newNadVal);
    } else {
      currentView.setRotation(-newNadVal);
    }
  }
}

/**
 * Gets the best zoom level for the middle of the flight animation
 *
 * @param  {integer} distance distance of the animation in map units
 * @param  {integer} start    starting zoom level
 * @param  {integer} end      ending zoom level
 * @param  {object} view     map view
 * @return {integer}          best zoom level for flight animation
 */
const getBestZoom = function(distance, start, end, view) {
  const idealLength = 1500;
  const lines = [2, 3, 4, 5, 6, 7, 8].map((zoom) => ({
    zoom,
    pixels: distance / view.getResolutionForZoom(zoom),
  }));
  const bestFit = lines.sort((a, b) => Math.abs(idealLength - a.pixels) - Math.abs(idealLength - b.pixels))[0];
  return Math.max(2, Math.min(bestFit.zoom, start - 1, end - 1));
};

/**
   * Moves the map with a "flying" animation
   *
   * @param  {Array} endPoint  Ending coordinates
   * @param  {integer} endZoom Ending Zoom Level
   * @return {Promise}         Promise that is fulfilled when animation completes
   */
export function fly (map, proj, endPoint, endZoom = 5, rotation = 0, isKioskModeActive) {
  const view = map.getView();
  const polarProjectionCheck = proj.selected.id !== 'geographic'; // boolean if current projection is polar
  view.cancelAnimations();
  const startPoint = view.getCenter();
  const startZoom = Math.floor(view.getZoom());
  if (endPoint.length > 2) endPoint = olExtent.getCenter(endPoint);
  const extent = view.calculateExtent();
  const hasEndInView = olExtent.containsCoordinate(extent, endPoint);
  const line = new OlGeomLineString([startPoint, endPoint]);
  const distance = line.getLength(); // In map units, which is usually degrees
  const distanceDuration = polarProjectionCheck ? distance / 50000 : distance; // limit large polar projection distances from coordinate transforms
  let duration = isKioskModeActive
    ? Math.max(5000, 2 * Math.floor(distanceDuration * 20 + 1000)) // Minimum 5 seconds, approx 12 seconds to go 360 degrees
    : Math.floor(distanceDuration * 20 + 1000); // approx 6 seconds to go 360 degrees

  const animationPromise = function(...args) {
    return new Promise((resolve, reject) => {
      args.push((complete) => {
        if (complete) resolve();
        if (!complete) reject(new Error('Animation interrupted!'));
      });
      view.animate(...args);
    }).catch(() => {});
  };
  if (hasEndInView) {
    // allow faster fly with nearby events
    duration = duration < 1200 ? duration / 2 : duration;
    // If the event is already visible, don't zoom out
    return Promise.all([
      animationPromise({
        center: endPoint,
        duration,
        rotation,
      }),
      animationPromise({
        zoom: endZoom,
        duration,
        rotation,
      }),
    ]);
  }
  // Default animation zooms out to arc
  return Promise.all([
    animationPromise({
      center: endPoint,
      duration,
      rotation,
    }),
    animationPromise(
      {
        zoom: getBestZoom(distance, startZoom, endZoom, view),
        duration: duration / 2,
        rotation,
      },
      { zoom: endZoom, duration: duration / 2, rotation },
    ),
  ]);
}

export const crossesDateLine = ([active], [next]) => Math.abs(active - next) > 180;

export const getOverDateLineCoordinates = (coordinates) => {
  const long = coordinates[0];
  const lat = coordinates[1];
  return long < 0
    ? [Math.abs(180 + 180 - Math.abs(long)), lat]
    : [-Math.abs(180 + 180 - Math.abs(long)), lat];
};

export const getExtent = (proj) => (proj.selected.id === 'geographic'
  ? [-250, -90, 250, 90]
  : [-180, -90, 180, 90]);

// Called in formatReduxDate when subdaily layers are active
// The timezone in the tile request URL parameter & selected date in redux are different
// Updates the redux date string to match the url parameter timezone
export function updateReduxDateTimezone(reduxDate, urlDate) {
  const parsedReduxDate = new Date(reduxDate);
  const parsedUrlDate = new Date(urlDate);
  // Get the timezone offset in minutes and convert it to milliseconds
  const timezoneOffsetMillis = parsedUrlDate.getTimezoneOffset() * 60 * 1000;
  // Apply the timezone offset to the reduxDate
  const adjustedReduxDate = new Date(parsedReduxDate.getTime() + timezoneOffsetMillis);
  // Set the hour of the adjustedReduxDate to match the hour of the urlDate
  adjustedReduxDate.setHours(parsedUrlDate.getHours());
  // Round down the minutes to the nearest multiple of 10
  const roundedMinutes = Math.floor(parsedUrlDate.getMinutes() / 10) * 10;
  // Set the rounded minutes
  adjustedReduxDate.setMinutes(roundedMinutes);
  // Format the updated reduxDate back to a string
  const year = adjustedReduxDate.getFullYear();
  const month = String(adjustedReduxDate.getMonth() + 1).padStart(2, '0');
  const day = String(adjustedReduxDate.getDate()).padStart(2, '0');
  const hours = String(adjustedReduxDate.getHours()).padStart(2, '0');
  const minutes = String(adjustedReduxDate.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
}

// Used in layerbuilder and TileErrorHandler
// Formats the selected date in redux to match the date url parameter from error tiles
export function formatReduxDate(reduxDate, urlDate, isSubdailyLayer) {
  const date = new Date(reduxDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  if (isSubdailyLayer) {
    const formattedReduxDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    const timezoneAdjustedReduxDate = updateReduxDateTimezone(formattedReduxDate, urlDate);
    return timezoneAdjustedReduxDate;
  }
  return `${year}-${month}-${day}T00:00:00`;
}

// Used in layerbuilder to extract date param from tile error url
export function extractDateFromTileErrorURL(url) {
  const regex = /TIME=([\d-]+T(?:\d{2}:\d{2}:\d{2})?)/;
  const match = url.match(regex);

  if (match && match[1]) {
    return match[1];
  }
  console.error('Date not found in the URL.');
  return null;
}

// Updates the format of the appNow date to a date format of YYYY-MM-DD
export function formatSelectedDate(date) {
  const dateObj = new Date(date);

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}
