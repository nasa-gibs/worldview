import OlFeature from 'ol/Feature';
import { Vector as OlVectorLayer } from 'ol/layer';
import { Vector as OlVectorSource } from 'ol/source';
import {
  Fill as OlStyleFill,
  Stroke as OlStyleStroke,
  Style as OlStyle,
  Text as OlText,
} from 'ol/style';
import OlGeomLineString from 'ol/geom/LineString';
import { transform } from 'ol/proj';
import { Polygon as OlGeomPolygon } from 'ol/geom';
import * as OlExtent from 'ol/extent';
import util from '../../util/util';

/**
 * Shift granules to hande dateline cross.  Granules are shifted if:
 *  - granule date is same as app date and lat < 0
 *  - granule is from previous day
 *
 * @param {*} granules
 * @param {*} currentDate
 * @returns
 */
export const datelineShiftGranules = (granules, currentDate, crs) => {
  const currentDayDate = new Date(currentDate).getUTCDate();
  const datelineShiftNeeded = () => {
    if (crs !== 'EPSG:4326') return false;
    const sameDays = granules.every(({ date }) => new Date(date).getUTCDate() === currentDayDate);
    const someCross = granules.some(({ polygon }) => polygon.some(([lon]) => lon > 180 || lon < -180));
    return someCross && !sameDays;
  };

  return !datelineShiftNeeded() ? granules : granules.map((granule) => {
    const { date, polygon } = granule;
    const sameDay = currentDayDate === new Date(date).getUTCDate();
    const westSide = polygon.some(([lon]) => lon < 0);
    const shifted = !sameDay || (sameDay && westSide);
    return {
      date,
      polygon: shifted ? polygon.map(([lon, lat]) => [lon + 360, lat]) : polygon,
      shifted,
    };
  });
};

/**
 * Determine map extent for a single granule tile
 */
export const getGranuleTileLayerExtent = (polygon, extent) => {
  const polygonFootprint = new OlGeomPolygon([polygon]);
  const polygonExtent = polygonFootprint.getExtent();
  return Number.isFinite(polygonExtent[0]) ? polygonExtent : extent;
};

/**
 * Helper to find index for date string to add to sorted array of date strings
 *
 * @method getIndexForSortedInsert
 * @static
 * @param {object} array - array of dates (already sorted)
 * @param {string} date - date string ISO format
 * @returns {number} index
 */
export const getIndexForSortedInsert = (array, date) => {
  const newDate = new Date(date);
  const len = array.length;
  if (new Date(array[0]) > newDate) {
    return 0;
  }
  let i = 1;
  while (i < len && !(new Date(array[i]) > newDate && new Date(array[i - 1]) <= newDate)) {
    i += 1;
  }
  return i;
};

/**
 * Helper to check date is within known start/end range (if given, else false)
 *
 * @method isWithinDateRange
 * @static
 * @param {object} date - date object
 * @param {object} startDate - date object
 * @param {string} endDate - date object
 * @returns {boolean}
 */
export const isWithinDateRange = (date, startDate, endDate) => (startDate && endDate
  ? date.getTime() <= new Date(endDate).getTime() && date.getTime() >= new Date(startDate).getTime()
  : false);

/**
   *
   * @param {*} layer
   * @returns
   */
export const getGranuleFootprints = (layer) => {
  const {
    def, filteredGranules, granuleDates,
  } = layer.wv;
  const { endDate, startDate, dateRanges } = def;

  const mostRecentGranuleDate = granuleDates[0];
  const isMostRecentDateOutOfRange = new Date(mostRecentGranuleDate) > new Date(endDate);

  // TODO also shift laterally if necessary
  // NOTE polygon coords are in ["lon", "lat"] format

  // create geometry object with date:polygons key/value pair filtering out granules outside date range
  return filteredGranules.reduce((dates, { date, polygon }) => {
    const granuleDate = new Date(date);
    if (!isMostRecentDateOutOfRange && isWithinDateRange(granuleDate, startDate, endDate)) {
      // Only include granules that have imagery in this proj (determined by layer dateRanges)
      const hasImagery = dateRanges.some(
        ({ startDate: start, endDate: end }) => isWithinDateRange(granuleDate, start, end),
      );
      if (hasImagery) {
        dates[date] = polygon;
      }
    }
    return dates;
  }, {});
};

/**
 * Get CMR query dates for building query string and child processes
 *
 * @method getCMRQueryDates
 * @static
 * @param {object} selectedDate - date object
 * @returns {object}
    * @param {object} startQueryDate - date object
    * @param {object} endQueryDate - date object
  */
export const getCMRQueryDates = (selectedDate) => {
  // check if selectedDate is before or after 12 to determine date request range
  const date = new Date(selectedDate);
  const isDateAfterNoon = date.getUTCHours() > 12;

  const zeroedDate = util.clearTimeUTC(date);

  const dayBeforeDate = util.dateAdd(zeroedDate, 'day', -1);
  const dayAfterDate = util.dateAdd(zeroedDate, 'day', 1);
  const twoDayAfterDate = util.dateAdd(zeroedDate, 'day', 2);

  const startQueryDate = dayBeforeDate;
  let endQueryDate = isDateAfterNoon
    ? twoDayAfterDate
    : dayAfterDate;

  // set current date if on leading edge of time coverage
  endQueryDate = endQueryDate > new Date()
    ? new Date()
    : endQueryDate;

  return {
    startQueryDate,
    endQueryDate,
  };
};

/**
 * Get CMR query date update options to determine if selected date is within existing date range
 * and/or if that range can be extended vs updating
 *
 * @method getCMRQueryDateUpdateOptions
 * @static
 * @param {object} CMRDateStoreForLayer - cmr date store object with ranges
 * @param {object} date - date object
 * @param {object} startQueryDate - date object
 * @param {object} endQueryDate - date object
 * @returns {object}
    * @param {boolean} canExtendRange
    * @param {boolean} needRangeUpdate
    * @param {object} rangeStart - date object
    * @param {object} rangeEnd - date object
  */
export const getCMRQueryDateUpdateOptions = (CMRDateStoreForLayer, date, startQueryDate, endQueryDate) => {
  let canExtendRange = false;
  let needRangeUpdate = true;
  let rangeStart;
  let rangeEnd;

  if (!CMRDateStoreForLayer) {
    return {
      canExtendRange,
      needRangeUpdate,
    };
  }

  // need to determine start and end
  const dateTime = date.getTime();
  const newStartTime = startQueryDate.getTime();
  const newEndTime = endQueryDate.getTime();

  const currentStartTime = CMRDateStoreForLayer.startDate.getTime();
  const currentEndTime = CMRDateStoreForLayer.endDate.getTime();

  // boolean comparison checks for date relativity
  const newStartBeforeCurrentCMRStart = newStartTime < currentStartTime;
  const newStartSameOrBeforeCurrentCMREnd = newStartTime < currentEndTime;

  const newStartAfterCurrentCMRStart = newStartTime > currentStartTime;
  const newEndSameOrAfterCurentCMRStart = newEndTime >= currentStartTime;

  const newStartSameOrAfterCurrentStart = newStartTime >= currentStartTime;
  const newEndSameOrBeforeCurrentEnd = newEndTime <= currentEndTime;

  const newStartEqualsCurrentCMREnd = newStartTime === currentEndTime;
  const newEndEqualsCurrentCMRStart = newEndTime === currentStartTime;

  const newEndCanExtendCurrentCMREnd = newStartBeforeCurrentCMRStart && newEndSameOrAfterCurentCMRStart;
  const newStartCanExtendCurrentCMRStart = newStartAfterCurrentCMRStart && newStartSameOrBeforeCurrentCMREnd;

  if (newStartSameOrAfterCurrentStart && newEndSameOrBeforeCurrentEnd) {
    needRangeUpdate = false;
  }

  // add 1 day to start time to allow cushion for filtered out DAY/NIGHT flags on granules
  const currentStartTimePlusOne = util.dateAdd(new Date(currentStartTime), 'day', 1);
  const currentStartTimePlusOneTime = currentStartTimePlusOne.getTime();

  const dateSameOrAfterCurrentCMRStartPlusOne = dateTime >= currentStartTimePlusOneTime;
  const dateSameOrBeforeCurrentCMREnd = dateTime <= currentEndTime;

  if (dateSameOrAfterCurrentCMRStartPlusOne && dateSameOrBeforeCurrentCMREnd) {
    needRangeUpdate = false;
  } else {
    // ex: current      [4][5][6][7][8]
    //     new [1][2][3][4][5]
    // ex: current            [6][7][8][9][10]
    //     new [1][2][3][4][5]
    if (newEndEqualsCurrentCMRStart || newEndCanExtendCurrentCMREnd) {
      rangeStart = newStartTime;
      rangeEnd = currentEndTime;
      canExtendRange = true;
    }
    // ex: current [1][2][3][4][5]
    //     new              [4][5][6][7][8]
    // ex: current [1][2][3][4][5]
    //     new                    [6][7][8][9][10]
    if (newStartEqualsCurrentCMREnd || newStartCanExtendCurrentCMRStart) {
      rangeStart = currentStartTime;
      rangeEnd = newEndTime;
      canExtendRange = true;
    }
  }

  return {
    canExtendRange,
    needRangeUpdate,
    rangeStart,
    rangeEnd,
  };
};

/**
 * Transform granule data from CMR response
 *
 * @param {*} entry
 * @param {*} date
 * @param {*} projection
 * @returns
 */
export const transformGranuleData = (entry, date, crs) => {
  const line = new OlGeomLineString([]);
  const maxDistance = crs === 'EPSG:4326' ? 270 : Number.POSITIVE_INFINITY;
  const points = entry.polygons[0][0].split(' ');
  const dayNight = entry.day_night_flag;
  const polygonCoords = [];

  for (let i = 0; i < points.length; i += 2) {
    const lat = Number(points[i]);
    const lon = Number(points[i + 1]);
    polygonCoords.push([lon, lat]);
  }

  const firstCoords = polygonCoords[0];
  const polygon = polygonCoords.map(([lon, lat]) => {
    let newLon = lon;
    line.setCoordinates([firstCoords, [lon, lat]]);
    // Modify coords if length exceeded
    if (line.getLength() > maxDistance) {
      newLon = lon > 0 ? lon - 360 : lon + 360;
    }
    return transform([newLon, lat], 'EPSG:4326', crs);
  });

  return {
    date,
    polygon,
    dayNight,
  };
};

export const transformGranulesForProj = (granules, crs) => granules.map((granule) => {
  const transformedPolygon = granule.polygon.map((coords) => transform(coords, 'EPSG:4326', crs));
  return {
    ...granule,
    polygon: transformedPolygon,
  };
});

/**
 * Check if coordinates and polygon extent are within and not exceeding max extent
 *
 * @param {Object} polygon
 * @param {Array} coords
 * @param {Array} maxExtent
 *
 * @return {Boolean}
 */
export const areCoordinatesAndPolygonExtentValid = (polygon, coords, maxExtent) => {
  const areCoordsWithinPolygon = polygon.intersectsCoordinate(coords);
  // check is polygon footprint is within max extent, will allow partial corners within max extent
  const doesPolygonIntersectMaxExtent = polygon.intersectsExtent(maxExtent);
  // check if polygon is larger than maxExtent - helpful to catch most large polar granules
  const polygonExtent = polygon.getExtent();
  const isPolygonLargerThanMaxExtent = OlExtent.containsExtent(polygonExtent, maxExtent);

  return areCoordsWithinPolygon
    && doesPolygonIntersectMaxExtent
    && !isPolygonLargerThanMaxExtent;
};

/**
 * Exposes methods to create vector layer for a granule polygon and add to the map
 *
 * @param {*} map
 * @returns
 */
export const granuleFootprint = (map) => {
  let currentGranule = {};
  let vectorLayer = {};
  const vectorSource = new OlVectorSource({
    wrapX: false,
    useSpatialIndex: false,
  });

  const getVectorLayer = (text) => new OlVectorLayer({
    className: 'granule-map-footprint',
    source: vectorSource,
    style: [
      new OlStyle({
        fill: new OlStyleFill({ color: 'rgb(0, 123, 255, 0.25)' }),
        stroke: new OlStyleStroke({
          color: 'rgb(0, 123, 255, 0.65)',
          width: 3,
        }),
        text: new OlText({
          textAlign: 'center',
          text,
          font: '18px monospace',
          fill: new OlStyleFill({ color: 'white' }),
          stroke: new OlStyleStroke({ color: 'black', width: 2 }),
          overflow: true,
        }),
      }),
    ],
  });

  const drawFootprint = (granuleGeometry, date) => {
    if (currentGranule[date]) {
      return;
    }
    const clearGranule = () => {
      currentGranule = {};
      map.removeLayer(vectorLayer);
      vectorSource.clear();
    };
    if (!currentGranule[date]) {
      clearGranule();
    }
    if (!granuleGeometry || !date) {
      clearGranule();
      return;
    }
    currentGranule[date] = true;
    const geometry = new OlGeomPolygon([granuleGeometry]);
    const featureFootprint = new OlFeature({ geometry });
    vectorSource.addFeature(featureFootprint);
    const newVectorLayer = getVectorLayer(date);
    vectorLayer = newVectorLayer;
    map.addLayer(vectorLayer);
  };

  return {
    drawFootprint,
  };
};
