import OlLayerGroup from 'ol/layer/Group';
import OlGeomLineString from 'ol/geom/LineString';
import lodashEach from 'lodash/each';
import util from '../../util/util';

import { ADD_GRANULE_LAYER_DATES } from '../../modules/layers/constants';
import { OPEN_BASIC } from '../../modules/modal/constants';
import {
  getCacheOptions,
} from '../../modules/layers/util';

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
 * Find index for date string to add to sorted array of date strings
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
   * @returns {array} collection of granule objects with filtered granuleDayTimes to select from
      * @param {string} granuleDayTime - UTC date string
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
          return processGranuleDateObject(layerId, selectedDate, startQueryDate, endQueryDate);
        })
        .catch((error) => {
          throw error;
        });
    }
    // user previously queried CMR granule dates
    return processGranuleDateObject(layerId, selectedDate, startQueryDate, endQueryDate);
  };

  /**
 * Query CMR to get dates filtered by day_night_flag
 *
 * @method processGranuleDateObject
 * @static
 * @param {String} layerId
 * @param {Object} selectedDate
 * @param {Object} startQueryDate
 * @param {Object} endQueryDate
 * @returns {Array} reducedGranuleDates
  */
  const processGranuleDateObject = (layerId, selectedDate, startQueryDate, endQueryDate) => {
    const selected = `${new Date(selectedDate).toISOString().split('.')[0]}Z`;
    // const queryStart = new Date(startQueryDate).toISOString().split('.')[0] + 'Z';
    // const queryEnd = new Date(endQueryDate);
    const granuleDates = self.granuleCMRData[layerId];
    const granuleDateKeys = granuleDates
      ? Object.keys(granuleDates)
      : [];

    // TODO: hitquerystartdate to limit larger arrays when many dates are in cache object
    // const hitQueryStartDate = false;
    let hitSelectedDate = false;
    const reducedGranuleDates = granuleDateKeys.reduce((acc, item) => {
    // if (item === queryStart) {
    //   hitQueryStartDate = true;
    // }
    // if (hitQueryStartDate && !hitSelectedDate) {
      if (!hitSelectedDate) {
        const granuleObj = {
          date: item,
          polygons: granuleDates[item].polygons,
          dayNight: granuleDates[item].dayNight,
        };
        acc.push(granuleObj);
      }
      // selected date will be last possible date in reuturned collection
      if (item === selected) {
        hitSelectedDate = true;
      }
      return acc;
    }, []);

    return reducedGranuleDates;
  };

  /**
   * Create collection of granule TileLayers from range of granule times
   *
   * @method createGranuleDayLayers
   * @static
   * @param {array} granuleDayTimes - array of dates (already sorted)
   * @param {object} def - Layer specs
   * @param {object} proj - Layer projection
   * @param {object} state - App state
   * @param {object} attributes - Layer specs
   * @returns {array} collection of OpenLayers TileLayers
   */
  const createGranuleDayLayers = (granuleDayTimes, def, proj, state, attributes) => {
    const { period, id } = def;
    const granuleLayers = granuleDayTimes.map((granuleDateISO) => {
      const group = attributes.group || state.compare.activeDateStr;
      const { date, polygons } = granuleDateISO;
      const granuleISOKey = `${id}:${proj.id}:${date}::${group}`;

      // return cached layer if available
      const layerCache = cache.getItem(granuleISOKey);
      if (layerCache) {
        return layerCache;
      }

      self.granuleLayers[id][group].dates[date] = granuleISOKey;
      const granuleISODateObject = new Date(date);
      const dateOption = { date: granuleISODateObject, polygons };
      const layerPromise = new Promise((resolve) => {
        const createdLayer = createLayerWMTS(def, dateOption, null, state);
        // update attributes
        attributes.key = granuleISOKey;
        attributes.date = granuleISODateObject;
        createdLayer.wv = attributes;

        // save to cache and push
        cache.setItem(granuleISOKey, createdLayer, getCacheOptions(period, granuleISODateObject));
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
 * @param {array} granuleDayTimes - objects with granule date string and polygons
 * @param {object} attributes - Layer projection
 * @returns {Void}
 */
  const processGranuleLayer = (def, granuleDayTimes, attributes) => {
    const { proj, group } = attributes;
    const isActive = group === 'active';
    // reduce granuleDayTimes object to get an array of date strings
    const granuleDayTimesDates = granuleDayTimes.reduce((granuleDates, granuleObject) => {
      const granuleDate = granuleObject.date;
      granuleDates.push(granuleDate);
      return granuleDates;
    }, []);

    // init group/projection specific granule day storage
    if (self.granuleLayers[def.id] === undefined || proj.id !== self.proj) {
      const activeGranuleDayTimes = isActive ? granuleDayTimesDates : [];
      const activeBGranuleDayTimes = !isActive ? granuleDayTimesDates : [];

      self.granuleLayers[def.id] = {
        active: {
          sortedDates: activeGranuleDayTimes || [],
          dates: {},
        },
        activeB: {
          sortedDates: activeBGranuleDayTimes || [],
          dates: {},
        },
      };
    } else {
    // add sorted dates to granule layer store
      let dateArray = [...self.granuleLayers[def.id][group].sortedDates];
      dateArray = [...new Set(dateArray)];
      lodashEach(granuleDayTimesDates, (granuleDayTime) => {
        dateArray.splice(getIndexForSortedInsert(dateArray, granuleDayTime), 0, granuleDayTime);
      });
      // ! IS THERE ARE REASONABLE LIMIT ON SORTEDDATES? THEORETICALLY CAN GET TOO LARGE AND SLOW DOWN
      self.granuleLayers[def.id][group].sortedDates = [...new Set(dateArray)];
    }
  };

  /**
 *
 *
 * @method getGranuleLayer
 * @static
 * @param {object} def - Layer specs
 * @param {array} granuleDayTimes - objects with granule date string and polygons
 * @param {object} attributes - Layer projection
 * @returns {Void}
 */
  self.getGranuleLayer = (def, state, attributes, granuleAttributes) => {
    const { proj, group } = attributes;
    const {
      // geometry,
      granuleCount,
      filteredGranules,
      updatedGranules,
    } = granuleAttributes;
    // createLayers for trailing date range using granuleCount based on interval from dateRanges[0].dateInterval
    if (!updatedGranules) {
      processGranuleLayer(def, filteredGranules, attributes);
    }
    let layer = createGranuleDayLayers(filteredGranules, def, proj, state, attributes);
    const filteredGranulesCollection = filteredGranules.reduce((granuleDates, granuleObject) => {
      const granuleDate = granuleObject.date;
      granuleDates.push(granuleDate);
      return granuleDates;
    }, []);

    const mostRecentGranuleDate = filteredGranulesCollection[filteredGranulesCollection.length - 1];
    const isMostRecentDateOutOfRange = new Date(mostRecentGranuleDate).getTime() > new Date(def.endDate).getTime();

    let sortedDateCollection;
    if (updatedGranules) {
      sortedDateCollection = updatedGranules;
    } else {
      sortedDateCollection = filteredGranulesCollection;
    }

    const includedDates = [];
    const layerGroupEntries = [];
    lodashEach(Object.values(sortedDateCollection), (granuleDate) => {
    // check for layer in granuleCache
      const layerCacheKey = self.granuleLayers[def.id][group].dates[granuleDate];
      const layerCache = cache.getItem(layerCacheKey);
      if (layerCache) {
        layerGroupEntries.push(layerCache);
      } else {
        console.log(granuleDate, layerGroupEntries, layer, 'NOT IN LAYER CACHE');
        layerGroupEntries.push(layer);
      }
      includedDates.unshift(granuleDate);
    });

    // create new layergroup with granules
    layer = new OlLayerGroup({
      layers: layerGroupEntries,
    });
    layer.set('granule', true);
    layer.set('layerId', `${def.id}-${group}`);

    // make available for layer settings
    // const storedLayer = state.layers.granuleLayers[group][def.id];
    // if (storedLayer && storedLayer.geometry) {
    //   geometry = geometry || storedLayer.geometry;
    // }

    const isWithinDateRange = (date) => (def.startDate && def.endDate
      ? date.getTime() <= new Date(def.endDate).getTime() && date.getTime() >= new Date(def.startDate).getTime()
      : false);

    const granuleGeometry = filteredGranules.reduce((granuleDates, granuleObject) => {
      const granuleDate = granuleObject.date;
      const granulePolygon = granuleObject.polygons;
      if (!isMostRecentDateOutOfRange && isWithinDateRange(new Date(granuleDate))) {
        granuleDates[granuleDate] = granulePolygon;
      }
      return granuleDates;
    }, {});

    // const returnedDates = isMostRecentDateOutOfRange ? [] : includedDates.reverse();
    const returnedDates = isMostRecentDateOutOfRange ? [] : includedDates;
    const satelliteInstrumentGroup = `${def.satellite}_${def.instrument}`;
    store.dispatch({
      type: ADD_GRANULE_LAYER_DATES,
      satelliteInstrumentGroup,
      dates: returnedDates,
      id: def.id,
      activeKey: group,
      count: granuleCount,
      geometry: granuleGeometry,
    });
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
 * @returns {array} collection of granule objects with filtered granuleDayTimes
 */
  self.filterGranuleDates = (granuleDates, filterTarget, granuleCount) => {
  // granuleDates is full array of granule date objects
    const filteredDates = [];
    for (let i = granuleDates.length - 1; i >= 0; i -= 1) {
      const item = granuleDates[i];
      const { dayNight } = item;
      const areGranulesStillNeeded = filteredDates.length < granuleCount;
      if (areGranulesStillNeeded) {
        if (dayNight === filterTarget) {
          filteredDates.unshift(item);
        }
      }
    }
    return filteredDates;
  };


  self.init();
  return self;
}
