import OlLayerGroup from 'ol/layer/Group';
import OlGeomLineString from 'ol/geom/LineString';
import {
  throttle as lodashThrottle,
  each as lodashEach,
} from 'lodash';
import {
  ADD_GRANULE_LAYER_DATES,
  UPDATE_GRANULE_LAYER_DATES,
} from '../../modules/layers/constants';
import { OPEN_BASIC } from '../../modules/modal/constants';
import {
  getCacheOptions,
} from '../../modules/layers/util';
import {
  getDateArrayFromObject,
  getCMRQueryDates,
  getIndexForSortedInsert,
  getCMRQueryDateUpdateOptions,
  isWithinDateRange,
} from './util';

const CMR_AJAX_OPTIONS = {
  url: 'https://cmr.earthdata.nasa.gov/search/',
  headers: {
    'Client-Id': 'Worldview',
  },
  traditional: true,
  dataType: 'json',
  timeout: 45 * 1000,
};
const CMR_QUERY_PREFIX = `${CMR_AJAX_OPTIONS.url}granules.json?shortName=`;

export default function granuleLayerBuilder(cache, store, createLayerWMTS) {
  const self = {};
  self.init = function() {
    self.proj = null;
    self.granuleLayers = {};
    self.CMRDateRanges = {
      active: {},
      activeB: {},
    };
    self.CMRDataStore = {};
    self.throttleDispathCMRErrorDialog = lodashThrottle(
      dispathCMRErrorDialog.bind(this),
      30000,
      { leading: true, trailing: false },
    );
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
    if (!self.CMRDataStore[id]) {
      self.CMRDataStore[id] = {};
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
        const coordPair = [];
        coordPair.unshift(polygons[i]);
        coordPair.unshift(polygons[i + 1]);
        polygonReorder.push(coordPair);
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
      self.CMRDataStore[id][date] = {
        date,
        polygons: polygonReorder,
        dayNight,
      };
    });
  };

  /**
   * Display error dialog in the event of no CMR data returned during valid date range
   *
   * @method dispathCMRErrorDialog
   * @static
   * @param {string} title
   * @returns {void}
  */
  const dispathCMRErrorDialog = (title) => {
    store.dispatch({
      type: OPEN_BASIC,
      headerText: `${title} is unavailable at this time.`,
      bodyText: 'The Common Metadata Repository(CMR) service that provides metadata for this granule layer is currently unavailable. Please try again later.',
    });
  };

  /**
   * Query CMR to get dates filtered by day_night_flag
   *
   * @method getQueriedGranuleDates
   * @static
   * @param {object} def - Layer specs
   * @param {object} selectedDate - current selected date (Note: may not return this date, but this date will be the max returned)
   * @param {string} activeKey
   * @param {string} projection
   * @returns {array} collection of granule objects with filtered granuleDates to select from
      * @param {string} granuleDate - UTC date string
      * @param {array} polygon - CMR granule polygon geometry
  */
  self.getQueriedGranuleDates = (def, date, activeKey, projection) => {
    const {
      endDate, startDate, id, title, visible,
    } = def;
    // TODO: USE GRANULE LAYER ID
    const layerId = 'VJ102MOD';

    const { startQueryDate, endQueryDate } = getCMRQueryDates(date);
    const queryDateRange = `${startQueryDate.toISOString()},${endQueryDate.toISOString()}`;
    const query = `${CMR_QUERY_PREFIX + layerId}&temporal=${queryDateRange}&pageSize=2000`;

    // update range/extend range checks and new dates (if applicable)
    const CMRDateStoreForLayer = self.CMRDateRanges[activeKey][id];
    const {
      canExtendRange,
      needRangeUpdate,
      rangeStart,
      rangeEnd,
    } = getCMRQueryDateUpdateOptions(
      CMRDateStoreForLayer,
      date,
      startQueryDate,
      endQueryDate,
    );

    // make cmr request with -6 days back through +1 day forward
    // if layer id and query date range not previously requested, then fetch, process, and add to CMR query object
    if (!CMRDateStoreForLayer || (CMRDateStoreForLayer && needRangeUpdate)) {
      // update local CMR date object for layer
      let startDateRange = startQueryDate;
      let endDateRange = endQueryDate;
      if (!CMRDateStoreForLayer) {
        self.CMRDateRanges[activeKey][id] = {};
      } else if (canExtendRange) {
        startDateRange = rangeStart;
        endDateRange = rangeEnd;
      }
      self.CMRDateRanges[activeKey][id].startDate = new Date(startDateRange);
      self.CMRDateRanges[activeKey][id].endDate = new Date(endDateRange);

      return fetch(query, CMR_AJAX_OPTIONS)
        .then((response) => response.json())
        .then((data) => {
        // handle valid, empty response due to CMR issues
          if (data.feed.entry.length === 0) {
            const dateWithinRange = isWithinDateRange(date, startDate, endDate);
            // only show modal error if layer not set to hidden and outside of selected date range
            if (visible && dateWithinRange) {
              // throttled to 30 seconds
              self.throttleDispathCMRErrorDialog(title);
            }
            return [];
          }
          addGranuleCMRDateData(data, layerId, projection);
          return processGranuleDateObjects(layerId, date, startQueryDate);
        })
        .catch((error) => {
          throw error;
        });
    }
    // user previously queried CMR granule dates
    return processGranuleDateObjects(layerId, date, startQueryDate);
  };

  /**
   *
   * Process CMR granule data into granule date objects
   *
   * @method processGranuleDateObjects
   * @static
   * @param {String} layerId
   * @param {Object} date
   * @param {Object} startQueryDate
   * @returns {Array} reducedGranuleDates
  */
  const processGranuleDateObjects = (layerId, date, startQueryDate) => {
    const selected = `${new Date(date).toISOString().split('.')[0]}Z`;
    const queryStart = `${new Date(startQueryDate).toISOString().split('.')[0]}Z`;

    const granuleDates = self.CMRDataStore[layerId];
    const granuleDateKeys = granuleDates
      ? Object.keys(granuleDates)
      : [];

    let hitQueryStartDate = false;
    let hitSelectedDate = false;
    return granuleDateKeys.reduce((granuleDateObjects, item) => {
      if (!hitQueryStartDate && (item === queryStart || new Date(item) > startQueryDate)) {
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
   * @param {object} state - App state
   * @param {object} attributes - Layer specs
   * @returns {array} collection of OpenLayers TileLayers
  */
  const createGranuleDatesLayer = (granuleDates, def, state, attributes) => {
    const { period, id } = def;
    const { group, proj } = attributes;
    const granuleLayers = granuleDates.map((granuleDate) => {
      const { date, polygons } = granuleDate;
      const granuleISOKey = `${id}:${proj}:${date}::${group}`;

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
    const granuleDates = getDateArrayFromObject(granulesObject);

    // init group/projection specific granule day storage
    if (self.granuleLayers[id] === undefined || proj !== self.proj) {
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
      // add unique set of sorted dates to granule layer store
      const dateArray = [...new Set(self.granuleLayers[id][group].sortedDates)];
      lodashEach(granuleDates, (date) => {
        dateArray.splice(getIndexForSortedInsert(dateArray, date), 0, date);
      });
      self.granuleLayers[id][group].sortedDates = dateArray;
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
  self.getGranuleLayer = (def, attributes, granuleAttributes) => {
    const {
      endDate, id, subtitle, startDate,
    } = def;
    const state = store.getState();
    const { layers } = state;
    const { proj, group } = attributes;
    const {
      granuleCount,
      filteredGranules,
      updatedGranules,
    } = granuleAttributes;
    if (!updatedGranules) {
      processGranuleLayer(def, filteredGranules, attributes);
    }

    let layer = createGranuleDatesLayer(filteredGranules, def, state, attributes);
    // use updated layers or get array of granule dates from filteredGranules
    const filteredGranuleCollection = updatedGranules || getDateArrayFromObject(filteredGranules);
    const mostRecentGranuleDate = filteredGranuleCollection[filteredGranuleCollection.length - 1];
    const isMostRecentDateOutOfRange = new Date(mostRecentGranuleDate).getTime() > new Date(endDate).getTime();

    const includedDates = [];
    const layerGroupEntries = [];
    lodashEach(filteredGranuleCollection, (date) => {
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
    layer.set('granuleGroup', true);
    layer.set('layerId', `${id}-${group}`);
    // layer.wv = Object.assign(attributes, granuleAttributes);
    // console.log(layer.wv);

    // create geometry object with date:polygons key/value pair filtering out granules outside date range
    const granuleGeometry = filteredGranules.reduce((dates, granuleObject) => {
      const { date, polygons } = granuleObject;
      if (!isMostRecentDateOutOfRange && isWithinDateRange(new Date(date), startDate, endDate)) {
        dates[date] = polygons;
      }
      return dates;
    }, {});

    const returnedDates = isMostRecentDateOutOfRange ? [] : includedDates;
    const satelliteInstrumentGroup = `${subtitle}`;
    const isLayerBeingUpdated = !!layers.granuleLayers[group][id];

    // shared granule store object values
    const granuleStoreObject = {
      id,
      dates: returnedDates,
      activeKey: group,
      count: granuleCount,
      geometry: granuleGeometry,
    };
    // add vs update - conditional granule store type OR condtional params
    if (isLayerBeingUpdated) {
      const activeSatelliteInstrumentGroup = layers.granuleSatelliteInstrumentGroup[group];
      const activeGeometry = layers.granuleGeometry[group];

      const newGranuleGeometry = activeSatelliteInstrumentGroup === satelliteInstrumentGroup
        ? granuleGeometry
        : activeGeometry;

      // granule layer updated
      store.dispatch(Object.assign(
        granuleStoreObject,
        {
          type: UPDATE_GRANULE_LAYER_DATES,
          granuleGeometry: newGranuleGeometry,
        },
      ));
    } else {
      // granule layer added/initialized
      // Note: a newly added granule layer will default to be the selected granule
      // satellite instrument group with geometry updated
      store.dispatch(Object.assign(
        granuleStoreObject,
        {
          type: ADD_GRANULE_LAYER_DATES,
          satelliteInstrumentGroup,
        },
      ));
    }
    self.proj = proj;
    return layer;
  };

  /**
   * Granule layer request process
   *
   * @method createGranuleLayerProcess
   * @static
   * @param {object} granuleOptions
   * @param {object} state
   * @param {object} def
   * @param {object} activeKey
   * @param {object} date
   * @returns {object} granuleAttributes
   */
  self.createGranuleLayerProcess = (
    granuleOptions,
    state,
    def,
    activeKey,
    date,
  ) => {
    const proj = state.proj.selected;
    let updatedGranules = false;
    let granuleCount = 20;
    if (granuleOptions) {
      granuleCount = granuleOptions.granuleCount || 20;
      if (granuleOptions.granuleDates && granuleOptions.granuleDates.length) {
        if (granuleOptions.granuleDates.length !== granuleOptions.granuleCount) {
          updatedGranules = false;
        } else {
          updatedGranules = granuleOptions.granuleDates.reverse();
        }
      }
    }

    if (!updatedGranules) {
      const granuleState = state.layers.granuleLayers[activeKey][def.id];
      if (granuleState) {
        granuleCount = granuleState.count;
      }
    }

    // get granule dates waiting for CMR query and filtering (if necessary)
    return new Promise((resolve) => {
      resolve(self.getQueriedGranuleDates(def, date, activeKey, proj.id));
    }).then((availableGranuleDates) => {
      const dayNightFilter = 'DAY'; // 'DAY', 'NIGHT', 'BOTH'
      const filteredGranuleDates = self.filterGranuleDates(
        availableGranuleDates,
        dayNightFilter,
        granuleCount,
      );
      return filteredGranuleDates;
    }).then((filteredGranuleDates) => ({
      filteredGranules: filteredGranuleDates,
      granuleCount,
      updatedGranules,
    }));
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
