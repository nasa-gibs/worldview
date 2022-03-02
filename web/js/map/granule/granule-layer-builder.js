import OlLayerGroup from 'ol/layer/Group';

import {
  throttle as lodashThrottle,
  each as lodashEach,
} from 'lodash';
import {
  ADD_GRANULE_LAYER_DATES,
  UPDATE_GRANULE_LAYER_DATES,
} from '../../modules/layers/constants';
import {
  updateGranuleLayerDates,
} from '../../modules/layers/actions';
import { getActiveGranuleLayers } from '../../modules/layers/selectors';
import {
  startLoading,
  stopLoading,
} from '../../modules/loading/actions';
import { openBasicContent } from '../../modules/modal/actions';
import {
  getCacheOptions,
} from '../../modules/layers/util';
import {
  getDateArrayFromObject,
  getCMRQueryDates,
  getIndexForSortedInsert,
  getCMRQueryDateUpdateOptions,
  isWithinDateRange,
  getGranuleDateData,
} from './util';

const CMR_AJAX_OPTIONS = {
  url: 'https://cmr.earthdata.nasa.gov/search/',
  headers: {
    'Client-Id': 'Worldview',
  },
  traditional: true,
  dataType: 'json',
  timeout: 30 * 1000,
};
const CMR_QUERY_PREFIX = `${CMR_AJAX_OPTIONS.url}granules.json?shortName=`;

export default function granuleLayerBuilder(cache, store, createLayerWMTS) {
  const CMRDateRanges = {
    active: {},
    activeB: {},
  };
  const CMRDataStore = {};
  const granuleLayers = {};
  let currentProj;

  const throttleDispathCMRErrorDialog = lodashThrottle(
    dispathCMRErrorDialog.bind(this),
    CMR_AJAX_OPTIONS.timeout,
    { leading: true, trailing: false },
  );

  function dispathCMRErrorDialog (title) {
    const bodyText = 'The Common Metadata Repository(CMR) service that provides metadata for this granule layer is currently unavailable. Please try again later.';
    const modalHeader = `${title} is unavailable at this time.`;
    store.dispatch(openBasicContent(modalHeader, bodyText));
  }

  const showLoading = () => {
    store.dispatch(startLoading('Loading', 'Retrieving granule metadata'));
  };

  const hideLoading = () => {
    store.dispatch(stopLoading());
  };

  /**
   * Add granule cmr data to granule cmr object with date as key
   * @param {data} CMR data
   * @param {id} layer id
   * @returns {Void}
  */
  const addGranuleCMRDateData = (data, id) => {
    const { proj: { selected: { id: projection } } } = store.getState();
    if (!CMRDataStore[id]) {
      CMRDataStore[id] = {};
    }
    lodashEach(Object.values(data.feed.entry), (entry) => {
      const date = `${entry.time_start.split('.')[0]}Z`;
      CMRDataStore[id][date] = getGranuleDateData(entry, date, projection);
    });
  };

  /**
   * Query CMR to get dates filtered by day_night_flag
   * @param {object} def - Layer specs
   * @param {object} selectedDate - current selected date (Note: may not return this date, but this date will be the max returned)
   * @param {string} activeKey
   * @param {string} projection
   * @returns {array} collection of granule objects with filtered granuleDates to select from
      * @param {string} granuleDate - UTC date string
      * @param {array} polygon - CMR granule polygon geometry
  */
  const getQueriedGranuleDates = async (def, date) => {
    const { compare: { activeString } } = store.getState();
    const {
      endDate, startDate, id, title, visible,
    } = def;

    // TODO: USE GRANULE LAYER ID
    const layerId = 'VJ102MOD';

    const { startQueryDate, endQueryDate } = getCMRQueryDates(date);
    const queryDateRange = `${startQueryDate.toISOString()},${endQueryDate.toISOString()}`;
    const query = `${CMR_QUERY_PREFIX + layerId}&temporal=${queryDateRange}&pageSize=500`;

    // update range/extend range checks and new dates (if applicable)
    const CMRDateStoreForLayer = CMRDateRanges[activeString][id];
    const {
      canExtendRange,
      needRangeUpdate,
      rangeStart,
      rangeEnd,
    } = getCMRQueryDateUpdateOptions(CMRDateStoreForLayer, date, startQueryDate, endQueryDate);

    // if layer id and query date range not previously requested, then fetch, process, and add to CMR query object
    if (!CMRDateStoreForLayer || (CMRDateStoreForLayer && needRangeUpdate)) {
      // update local CMR date object for layer
      let startDateRange = startQueryDate;
      let endDateRange = endQueryDate;
      if (!CMRDateStoreForLayer) {
        CMRDateRanges[activeString][id] = {};
      } else if (canExtendRange) {
        startDateRange = rangeStart;
        endDateRange = rangeEnd;
      }
      CMRDateRanges[activeString][id].startDate = new Date(startDateRange);
      CMRDateRanges[activeString][id].endDate = new Date(endDateRange);

      showLoading();
      const response = await fetch(query, CMR_AJAX_OPTIONS);
      const data = await response.json();
      hideLoading();

      if (data.feed.entry.length === 0) {
        const dateWithinRange = isWithinDateRange(date, startDate, endDate);
        // only show modal error if layer not set to hidden and outside of selected date range
        if (visible && dateWithinRange) {
          throttleDispathCMRErrorDialog(title);
        }
        return [];
      }
      addGranuleCMRDateData(data, layerId);
      return processGranuleDateObjects(layerId, date, startQueryDate);
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
    const granuleDates = CMRDataStore[layerId];
    const granuleDateKeys = granuleDates ? Object.keys(granuleDates) : [];
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
   * @param {array} granueDates - array of dates (already sorted)
   * @param {object} def - Layer specs
   * @param {object} state - App state
   * @param {object} attributes - Layer specs
   * @returns {array} collection of OpenLayers TileLayers
  */
  const createGranuleDatesLayer = async (granuleDates, def, attributes) => {
    const { period, id } = def;
    const { group, proj } = attributes;

    const layerPromises = granuleDates.map(async (granuleDate) => {
      const { date, polygons } = granuleDate;
      const granuleISOKey = `${id}:${proj}:${date}::${group}`;
      let layer = cache.getItem(granuleISOKey);
      if (layer) {
        return layer;
      }
      granuleLayers[id][group].dates[date] = granuleISOKey;
      const granuleISODate = new Date(date);
      const dateOption = { date: granuleISODate, polygons };
      layer = await createLayerWMTS(def, dateOption, null, store.getState(), { polygons });
      attributes.key = granuleISOKey;
      attributes.date = granuleISODate;
      layer.wv = attributes;
      cache.setItem(granuleISOKey, layer, getCacheOptions(period, granuleISODate));
      layer.setVisible(false);
      return layer;
    });

    const layers = await Promise.all(layerPromises);
    return layers;
  };

  /**
   * Process granule layer to determine if init creation/proj change or adding to exisiting collection
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
    if (granuleLayers[id] === undefined || proj !== currentProj) {
      const activeGranuleDates = isActive ? granuleDates : [];
      const activeBGranuleDates = !isActive ? granuleDates : [];

      granuleLayers[id] = {
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
      const dateArray = [...new Set(granuleLayers[id][group].sortedDates)];
      lodashEach(granuleDates, (date) => {
        dateArray.splice(getIndexForSortedInsert(dateArray, date), 0, date);
      });
      granuleLayers[id][group].sortedDates = dateArray;
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
  const getGranuleLayer = async (def, attributes, options) => {
    const {
      endDate, id, subtitle, startDate,
    } = def;
    const state = store.getState();
    const { layers } = state;
    const { proj, group } = attributes;
    const granuleAttributes = await getGranuleAttributes(def, options);
    const {
      granuleCount,
      filteredGranules,
      updatedGranules,
    } = granuleAttributes;

    if (!updatedGranules) {
      processGranuleLayer(def, filteredGranules, attributes);
    }

    let layer = await createGranuleDatesLayer(filteredGranules, def, attributes);
    // use updated layers or get array of granule dates from filteredGranules
    const filteredGranuleCollection = updatedGranules || getDateArrayFromObject(filteredGranules);
    const mostRecentGranuleDate = filteredGranuleCollection[filteredGranuleCollection.length - 1];
    const isMostRecentDateOutOfRange = new Date(mostRecentGranuleDate).getTime() > new Date(endDate).getTime();

    const includedDates = [];
    const layerGroupEntries = [];
    lodashEach(filteredGranuleCollection, (date) => {
    // check for layer in granuleCache
      const layerCacheKey = granuleLayers[id][group].dates[date];
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
    layer.wv = Object.assign(attributes, granuleAttributes);

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
    currentProj = proj;
    return layer;
  };

  /**
   * Granule layer request process
   *
   * @method getGranuleAttributes
   * @static
   * @param {object} options
   * @param {object} state
   * @param {object} def
   * @param {object} group
   * @param {object} date
   * @returns {object} granuleAttributes
   */
  const getGranuleAttributes = async (def, options) => {
    const state = store.getState();
    let updatedGranules = false;
    let granuleCount = 20;

    if (options) {
      const { granuleCount, granuleDates } = options;
      const count = granuleCount || 20;
      if (granuleDates && granuleDates.length) {
        updatedGranules = granuleDates.length !== count ? false : granuleDates.reverse();
      }
    }

    if (!updatedGranules) {
      const granuleState = getActiveGranuleLayers(state)[def.id];
      if (granuleState) {
        granuleCount = granuleState.count;
      }
    }

    // get granule dates waiting for CMR query and filtering (if necessary)
    const availableGranuleDates = await getQueriedGranuleDates(def, options.date);
    const dayNightFilter = 'DAY'; // 'DAY', 'NIGHT', 'BOTH'
    const filteredGranuleDates = filterGranuleDates(availableGranuleDates, dayNightFilter, granuleCount);
    return {
      filteredGranules: filteredGranuleDates,
      granuleCount,
      updatedGranules,
    };
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
  const filterGranuleDates = (granuleDates, filterTarget, granuleCount) => {
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

  return {
    getGranuleLayer,
  };
}
