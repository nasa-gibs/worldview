import OlLayerGroup from 'ol/layer/Group';
import OlGeomLineString from 'ol/geom/LineString';
import lodashEach from 'lodash/each';
import util from '../../util/util';
import {
  ADD_GRANULE_LAYER_DATES,
  UPDATE_GRANULE_LAYER_DATES,
} from '../../modules/layers/constants';
import { OPEN_BASIC } from '../../modules/modal/constants';
import {
  getCacheOptions,
} from '../../modules/layers/util';

/**
 * Helper to reduce granules object to array of date strings
 *
 * @method getGranuleDateArrayFromObject
 * @static
 * @param {object} granulesObject
 * @returns {array} array of granule date strings
 */
const getGranuleDateArrayFromObject = (granulesObject) => granulesObject.reduce((dates, granuleObject) => {
  const { date } = granuleObject;
  dates.push(date);
  return dates;
}, []);

/**
 * Helper to find index for date string to add to sorted array of date strings
 *
 * @method getIndexForSortedInsert
 * @static
 * @param {object} array - array of dates (already sorted)
 * @param {string} date - date string ISO format
 * @returns {number} index
 */
const getIndexForSortedInsert = (array, date) => {
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
const isWithinDateRange = (date, startDate, endDate) => (startDate && endDate
  ? date.getTime() <= new Date(endDate).getTime() && date.getTime() >= new Date(startDate).getTime()
  : false);

export default function granuleLayerBuilder(cache, store, createLayerWMTS) {
  const self = {};

  self.init = function() {
    self.proj = null;
    self.granuleLayers = {};
    self.CMRDateRanges = {
      active: {},
      activeB: {},
    };
    self.granuleCMRData = {};
  };

  /**
 * Add granule cmr data to granule cmr object with date as key
 *
 * @method addGranuleCMRDateData
 * @static
 * @param {data} CMR data
 * @param {id} layerId
 * @returns {Void}
 */
  const addGranuleCMRDateData = (data, id, projection) => {
  // init id object if first time loading cmr data
    if (!self.granuleCMRData[id]) {
      self.granuleCMRData[id] = {};
    }
    const line = new OlGeomLineString([]);
    const maxDistance = projection === 'geographic' ? 270 : Number.POSITIVE_INFINITY;
    lodashEach(Object.values(data.feed.entry), (entry) => {
      const date = `${entry.time_start.split('.')[0]}Z`;
      const polygons = entry.polygons[0][0].split(' ');
      const dayNight = entry.day_night_flag;

      // build the array of arrays polygon
      let polygonReorder = [];
      for (let i = 0; i < polygons.length; i += 2) {
        const tuple = [];
        tuple.unshift(polygons[i]);
        tuple.unshift(polygons[i + 1]);
        polygonReorder.push(tuple);
      }

      // add coordinates that exceeed max distance to table for revision
      const coordOverMaxDistance = {};
      const firstCoords = polygonReorder[0];
      for (let j = 0; j < polygonReorder.length; j += 1) {
      // get current long coord in pair and measure against first coord to get length
        const currentCoords = polygonReorder[j];
        line.setCoordinates([firstCoords, currentCoords]);
        const lineLength = line.getLength();

        // if length is over max distance (geographic restriction only) add to table
        if (lineLength > maxDistance) {
          const longCoord = currentCoords[0];
          if (coordOverMaxDistance[longCoord]) {
            coordOverMaxDistance[longCoord] += 1;
          } else {
            coordOverMaxDistance[longCoord] = 1;
          }
        }
      }

      // check if long coord exceeded max and revise coord +/- 360 to handle meridian crossing
      const coordinatesRevised = Object.keys(coordOverMaxDistance).length >= 1;
      if (coordinatesRevised) {
        polygonReorder = polygonReorder.map((coord) => {
          const ind0 = coord[0];
          if (coordOverMaxDistance[ind0] && coordOverMaxDistance[ind0] >= 1) {
            const numInd0 = Number(ind0);
            const revise = numInd0 > 0
              ? numInd0 - 360
              : numInd0 + 360;
            coord[0] = revise.toString();
          }
          return coord;
        });
      }
      self.granuleCMRData[id][date] = {
        date,
        polygons: polygonReorder,
        dayNight,
      };
    });
  };

  /**
   * Query CMR to get dates filtered by day_night_flag
   *
   * @method getQueriedGranuleDates
   * @static
   * @param {object} def - Layer specs
   * @param {object} selectedDate - current selected date (Note: may not return this date, but this date will be the max returned)
   * @returns {array} collection of granule objects with filtered granuleDates to select from
      * @param {string} granuleDate - UTC date string
      * @param {array} polygon - CMR granule polygon geometry
   */
  self.getQueriedGranuleDates = (def, selectedDate, activeKey, projection) => {
  // TODO: USE GRANULE LAYER ID
    const layerId = 'VJ102MOD';
    const ajaxOptions = {
      url: 'https://cmr.earthdata.nasa.gov/search/',
      headers: {
        'Client-Id': 'Worldview',
      },
      traditional: true,
      dataType: 'json',
      timeout: 45 * 1000,
    };

    // note:
    // https://cmr.earthdata.nasa.gov/search/granules.json?shortName=VJ102MOD&temporal=2019-09-24T00:00:00.000Z,2019-09-25T00:00:00.000Z&pageSize=1000
    // 2019-09-24T00:00:00.000Z  to   2019-09-25T00:00:00.000Z
    // first date returned -  time_start: "2019-09-23T23:54:00.000Z",    time_end: "2019-09-24T00:00:00.000Z",
    // last date returned  -  time_start: "2019-09-25T00:00:00.000Z",    time_end: "2019-09-25T00:06:00.000Z",
    // seems to rely on START date relies on matching time_end   and   END date relies on matching time_start?
    // curious

    // check if selectedDate is before or after 12 to determine date request range
    const selectedDateTemp = new Date(selectedDate);
    const isSelectedDateAfterNoon = selectedDateTemp.getUTCHours() > 12;

    const zeroedSelectedDate = util.clearTimeUTC(selectedDateTemp);

    const dayBeforeSelectedDate = util.dateAdd(zeroedSelectedDate, 'day', -1);
    const dayAfterSelectedDate = util.dateAdd(zeroedSelectedDate, 'day', 1);
    const twoDayAfterSelectedDate = util.dateAdd(zeroedSelectedDate, 'day', 2);

    const startQueryDate = isSelectedDateAfterNoon
      ? zeroedSelectedDate
      : dayBeforeSelectedDate;
    let endQueryDate = isSelectedDateAfterNoon
      ? twoDayAfterSelectedDate
      : dayAfterSelectedDate;

    // set current date if on leading edge of time coverage
    endQueryDate = endQueryDate > new Date()
      ? new Date()
      : endQueryDate;

    const queryPrefix = 'https://cmr.earthdata.nasa.gov/search/granules.json?shortName=';
    const queryDateRange = `${startQueryDate.toISOString()},${endQueryDate.toISOString()}`;
    const query = `${queryPrefix + layerId}&temporal=${queryDateRange}&pageSize=1000`;

    // if layer id and query date range not previously requested, then fetch, process, and add to CMR query object
    const hasLayerIdBeenQueried = self.CMRDateRanges[activeKey][def.id];
    if (!hasLayerIdBeenQueried || (hasLayerIdBeenQueried && !hasLayerIdBeenQueried[queryDateRange])) {
      if (!hasLayerIdBeenQueried) {
        self.CMRDateRanges[activeKey][def.id] = {};
      }
      self.CMRDateRanges[activeKey][def.id][queryDateRange] = true;
      return fetch(query, ajaxOptions)
        .then((response) => response.json())
        .then((data) => {
        // handle valid, empty response due to CMR issues
          if (data.feed.entry.length === 0) {
            store.dispatch({
              type: OPEN_BASIC,
              headerText: `${def.title} is unavailable at this time.`,
              bodyText: 'The Common Metadata Repository(CMR) service that provides metadata for this granule layer is currently unavailable. Please try again later.',
            });
            return [];
          }
          addGranuleCMRDateData(data, layerId, projection);
          return processGranuleDateObjects(layerId, selectedDate, startQueryDate);
        })
        .catch((error) => {
          throw error;
        });
    }
    // user previously queried CMR granule dates
    return processGranuleDateObjects(layerId, selectedDate, startQueryDate);
  };

  /**
 * Query CMR to get dates filtered by day_night_flag
 *
 * @method processGranuleDateObjects
 * @static
 * @param {String} layerId
 * @param {Object} selectedDate
 * @param {Object} startQueryDate
 * @returns {Array} reducedGranuleDates
  */
  const processGranuleDateObjects = (layerId, selectedDate, startQueryDate) => {
    const selected = `${new Date(selectedDate).toISOString().split('.')[0]}Z`;
    const queryStart = `${new Date(startQueryDate).toISOString().split('.')[0]}Z`;

    const granuleDates = self.granuleCMRData[layerId];
    const granuleDateKeys = granuleDates
      ? Object.keys(granuleDates)
      : [];

    let hitQueryStartDate = false;
    let hitSelectedDate = false;
    return granuleDateKeys.reduce((granuleDateObjects, item) => {
      if (item === queryStart) {
        hitQueryStartDate = true;
      }
      if (hitQueryStartDate && !hitSelectedDate) {
        if (!hitSelectedDate) {
          const { polygons, dayNight } = granuleDates[item];
          const granuleObj = {
            date: item,
            polygons,
            dayNight,
          };
          granuleDateObjects.push(granuleObj);
        }
        // selected date will be last possible date in reuturned collection
        if (item === selected) {
          hitSelectedDate = true;
        }
      }
      return granuleDateObjects;
    }, []);
  };

  /**
   * Create collection of granule TileLayers from range of granule times
   *
   * @method createGranuleDatesLayer
   * @static
   * @param {array} granueDates - array of dates (already sorted)
   * @param {object} def - Layer specs
   * @param {object} proj - Layer projection
   * @param {object} state - App state
   * @param {object} attributes - Layer specs
   * @returns {array} collection of OpenLayers TileLayers
   */
  const createGranuleDatesLayer = (granuleDates, def, proj, state, attributes) => {
    const { period, id } = def;
    const { group } = attributes;
    const granuleLayers = granuleDates.map((granuleDate) => {
      const { date, polygons } = granuleDate;
      const granuleISOKey = `${id}:${proj.id}:${date}::${group}`;

      // return cached layer if available
      const layerCache = cache.getItem(granuleISOKey);
      if (layerCache) {
        return layerCache;
      }

      self.granuleLayers[id][group].dates[date] = granuleISOKey;
      const granuleISODate = new Date(date);
      const dateOption = { date: granuleISODate, polygons };
      const layerPromise = new Promise((resolve) => {
        const createdLayer = createLayerWMTS(def, dateOption, null, state);
        // update attributes
        attributes.key = granuleISOKey;
        attributes.date = granuleISODate;
        createdLayer.wv = attributes;

        // save to cache and push
        cache.setItem(granuleISOKey, createdLayer, getCacheOptions(period, granuleISODate));
        createdLayer.setVisible(false);
        resolve(createdLayer);
      });
      return layerPromise;
    });
    return new Promise((resolve) => Promise.all(granuleLayers).then((results) => {
      resolve(results);
    }));
  };

  /**
 * Process granule layer to determine if init creation/proj change or adding to exisiting collection
 *
 * @method processGranuleLayer
 * @static
 * @param {object} def - Layer specs
 * @param {array} granulesObject - objects with granule date string and polygons
 * @param {object} attributes - Layer projection
 * @returns {Void}
 */
  const processGranuleLayer = (def, granulesObject, attributes) => {
    const { proj, group } = attributes;
    const { id } = def;
    const isActive = group === 'active';
    // reduce granulesObject object to get an array of date strings
    const granuleDates = getGranuleDateArrayFromObject(granulesObject);

    // init group/projection specific granule day storage
    if (self.granuleLayers[id] === undefined || proj.id !== self.proj) {
      const activeGranuleDates = isActive ? granuleDates : [];
      const activeBGranuleDates = !isActive ? granuleDates : [];

      self.granuleLayers[id] = {
        active: {
          sortedDates: activeGranuleDates,
          dates: {},
        },
        activeB: {
          sortedDates: activeBGranuleDates,
          dates: {},
        },
      };
    } else {
      // add sorted dates to granule layer store
      let dateArray = [...self.granuleLayers[id][group].sortedDates];
      dateArray = [...new Set(dateArray)];
      lodashEach(granuleDates, (date) => {
        dateArray.splice(getIndexForSortedInsert(dateArray, date), 0, date);
      });
      // ! IS THERE ARE REASONABLE LIMIT ON SORTEDDATES? THEORETICALLY CAN GET TOO LARGE AND SLOW DOWN
      self.granuleLayers[id][group].sortedDates = [...new Set(dateArray)];
    }
  };

  /**
 *
 *
 * @method getGranuleLayer
 * @static
 * @param {object} def - Layer specs
 * @param {array} granuleDates - objects with granule date string and polygons
 * @param {object} attributes - Layer projection
 * @returns {Void}
 */
  self.getGranuleLayer = (def, blah, attributes, granuleAttributes) => {
    const {
      endDate, id, instrument, satellite, startDate,
    } = def;
    const state = store.getState();
    const { proj, group } = attributes;
    const {
      granuleCount,
      filteredGranules,
      updatedGranules,
    } = granuleAttributes;
    if (!updatedGranules) {
      processGranuleLayer(def, filteredGranules, attributes);
    }

    let layer = createGranuleDatesLayer(filteredGranules, def, proj, state, attributes);
    // use updated layers or get array of granule dates from filteredGranules
    const filteredGranulesCollection = updatedGranules || getGranuleDateArrayFromObject(filteredGranules);
    const mostRecentGranuleDate = filteredGranulesCollection[filteredGranulesCollection.length - 1];
    const isMostRecentDateOutOfRange = new Date(mostRecentGranuleDate).getTime() > new Date(endDate).getTime();

    const includedDates = [];
    const layerGroupEntries = [];
    lodashEach(filteredGranulesCollection, (date) => {
    // check for layer in granuleCache
      const layerCacheKey = self.granuleLayers[id][group].dates[date];
      const layerCache = cache.getItem(layerCacheKey);
      if (layerCache) {
        layerGroupEntries.push(layerCache);
      } else {
        layerGroupEntries.push(layer);
      }
      includedDates.unshift(date);
    });

    // create new layergroup with granules
    layer = new OlLayerGroup({
      layers: layerGroupEntries,
    });
    layer.set('granule', true);
    layer.set('layerId', `${id}-${group}`);

    // create geometry object with date:polygons key/value pair filtering out granules outside date range
    const granuleGeometry = filteredGranules.reduce((dates, granuleObject) => {
      const { date, polygons } = granuleObject;
      if (!isMostRecentDateOutOfRange && isWithinDateRange(new Date(date), startDate, endDate)) {
        dates[date] = polygons;
      }
      return dates;
    }, {});

    const returnedDates = isMostRecentDateOutOfRange ? [] : includedDates;
    const satelliteInstrumentGroup = `${satellite}_${instrument}`;
    const isLayerBeingUpdated = !!state.layers.granuleLayers[group][def.id];
    // add vs update - conditional store type OR condtional params
    if (isLayerBeingUpdated) {
      const activeSatelliteInstrumentGroup = state.layers.granuleSatelliteInstrumentGroup[group];
      const activeGeometry = state.layers.granuleGeometry[group];

      const newGranuleGeometry = activeSatelliteInstrumentGroup === satelliteInstrumentGroup
        ? granuleGeometry
        : activeGeometry;

      // granule layer updated
      store.dispatch({
        type: UPDATE_GRANULE_LAYER_DATES,
        id,
        activeKey: group,
        dates: returnedDates,
        count: granuleCount,
        geometry: granuleGeometry,
        granuleGeometry: newGranuleGeometry,
      });
    } else {
      // granule layer added/initialized
      // Note: a newly added granule layer will default to be the selected granule
      // satellite instrument group with geometry updated
      store.dispatch({
        type: ADD_GRANULE_LAYER_DATES,
        satelliteInstrumentGroup,
        dates: returnedDates,
        id,
        activeKey: group,
        count: granuleCount,
        geometry: granuleGeometry,
      });
    }
    self.proj = proj.id;
    return layer;
  };

  /**
 * Filter date objects by day_night_flag
 *
 * @method filterGranuleDates
 * @static
 * @param {Array} granuleDates
 * @param {string} filterTarget - day_night_flag to filter out
 * @param {number} granuleCount - number of granules to add to collection
 * @returns {array} collection of granule objects with filtered granuleDates
 */
  self.filterGranuleDates = (granuleDates, filterTarget, granuleCount) => {
    // granuleDates is full array of granule date objects
    const dates = [];
    for (let i = granuleDates.length - 1; i >= 0 && dates.length < granuleCount; i -= 1) {
      const item = granuleDates[i];
      const { dayNight } = item;
      if (dayNight === filterTarget) {
        dates.unshift(item);
      }
    }
    return dates;
  };


  self.init();
  return self;
}
