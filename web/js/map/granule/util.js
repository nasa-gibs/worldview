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
import debounce from 'lodash/debounce';
import util from '../../util/util';
import { CRS } from '../../modules/map/constants';

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
  const datelineShiftNeeded = (() => {
    if (crs !== CRS.GEOGRAPHIC) return false;
    const sameDays = granules.every(({ date }) => new Date(date).getUTCDate() === currentDayDate);
    return !sameDays;
  })();
  return !datelineShiftNeeded ? granules : granules.map((granule) => {
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
 * @param {string} startDate - date string
 * @param {string} endDate - date string
 * @returns {boolean}
 */
export const isWithinDateRange = (date, startDate, end) => {
  const endDate = end || new Date();
  return startDate && endDate
    ? new Date(date).getTime() <= new Date(endDate).getTime()
    && new Date(date).getTime() >= new Date(startDate).getTime()
    : false;
};

/**
 * Determine if a granule polygon falls within the specified bounds of
 * imagery for a given projection
 *
 * @param {*} crs
 * @param {*} granule
 * @returns
 */
export const isWithinBounds = (crs, granule) => {
  if (crs === CRS.GEOGRAPHIC || crs === CRS.WEB_MERCATOR) {
    return granule.polygon.every(([lat, lon]) => lon > -65 && lon < 65);
  }
  if (crs === CRS.ANTARCTIC) {
    return granule.polygon.every(([lat, lon]) => lon < -40);
  }
  if (crs === CRS.ARCTIC) {
    return granule.polygon.every(([lat, lon]) => lon > 40);
  }
};

export const getGranuleFootprints = (layer) => {
  const {
    def, visibleGranules, granuleDates,
  } = layer.wv;
  const { endDate, startDate } = def;
  const mostRecentGranuleDate = granuleDates[0];
  const isMostRecentDateOutOfRange = new Date(mostRecentGranuleDate) > new Date(endDate);

  return visibleGranules.reduce((dates, { date, polygon }) => {
    const granuleDate = new Date(date);
    if (!isMostRecentDateOutOfRange && isWithinDateRange(granuleDate, startDate, endDate)) {
      dates[date] = polygon;
    }
    return dates;
  }, {});
};

/**
 * Get start/end dates for CMR granule query. We need a broader range
 * for polar granules since only a few granules from each swath are
 * visible at the poles
 * .
 * @param {string} crs
 * @param {object} selectedDate - date object
 * @returns {object}
    * @param {object} startQueryDate - date object
    * @param {object} endQueryDate - date object
  */
export const getCMRQueryDates = (crs, selectedDate) => {
  const date = new Date(selectedDate);
  if (crs === CRS.GEOGRAPHIC || crs === CRS.WEB_MERCATOR) {
    return {
      startQueryDate: util.dateAdd(date, 'hour', -12),
      endQueryDate: util.dateAdd(date, 'hour', 4),
    };
  }
  // Polar projections
  return {
    startQueryDate: util.dateAdd(date, 'hour', -48),
    endQueryDate: util.dateAdd(date, 'hour', 4),
  };
};

/**
 * Get the URL parameters for a CMR request for granule browse
 * @param {*} def - layer definition
 * @param {*} date - "current" date from which to base the query
 * @param {*} crs
 * @returns
 */
export const getParamsForGranuleRequest = (def, date, crs) => {
  const dayNightFilter = 'DAY';
  const bboxForProj = {
    [CRS.WEB_MERCATOR]: [-180, -65, 180, 65],
    [CRS.GEOGRAPHIC]: [-180, -65, 180, 65],
    [CRS.ANTARCTIC]: [-180, -90, 180, -65],
    [CRS.ARCTIC]: [-180, 65, 180, 90],
  };
  const { startQueryDate, endQueryDate } = getCMRQueryDates(crs, date);

  const getShortName = () => {
    try {
      let { shortName } = def.conceptIds[0];
      [shortName] = shortName.split('_');
      return shortName;
    } catch (e) {
      console.error(`Could not get shortName for a collection associated with layer ${def.id}`);
    }
  };

  return {
    shortName: getShortName(),
    startDate: startQueryDate.toISOString(),
    endDate: endQueryDate.toISOString(),
    dayNight: dayNightFilter,
    bbox: bboxForProj[crs],
    pageSize: 500,
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
  const maxDistance = crs === CRS.GEOGRAPHIC ? 270 : Number.POSITIVE_INFINITY;
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
    return [newLon, lat];
  });

  return {
    date,
    polygon,
    dayNight,
  };
};

export const transformGranulesForProj = (granules, crs) => granules.map((granule) => {
  const transformedPolygon = granule.polygon.map((coords) => transform(coords, CRS.GEOGRAPHIC, crs));
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
export const areCoordinatesAndPolygonExtentValid = (points, coords, maxExtent) => {
  const polygon = new OlGeomPolygon([points]);

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
export const granuleFootprint = (map, initialIsMobile) => {
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

  const removeFootprint = () => {
    currentGranule = {};
    map.removeLayer(vectorLayer);
    vectorSource.clear();
  };

  const drawFootprint = (points, date) => {
    const geometry = new OlGeomPolygon([points]);
    const featureFootprint = new OlFeature({ geometry });
    const newVectorLayer = getVectorLayer(date);
    vectorSource.addFeature(featureFootprint);
    vectorLayer = newVectorLayer;
    map.addLayer(vectorLayer);
  };

  const debouncedDrawFootprint = debounce(drawFootprint, 850);

  const addFootprint = (points, date) => {
    if (currentGranule[date]) {
      return;
    }
    if (!points || !date) {
      removeFootprint();
      return;
    }
    if (!currentGranule[date]) {
      removeFootprint();
    }
    currentGranule[date] = true;
    if (initialIsMobile) {
      debouncedDrawFootprint(points, date);
    } else {
      drawFootprint(points, date, 'addFootprint');
    }
  };

  const updateFootprint = (points, date) => {
    removeFootprint();
    if (initialIsMobile) {
      debouncedDrawFootprint(points, date);
    } else {
      drawFootprint(points, date, 'addFootprint');
    }
  };

  return {
    addFootprint,
    updateFootprint,
  };
};
