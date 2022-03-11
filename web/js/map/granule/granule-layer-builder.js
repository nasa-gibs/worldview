import OlLayerGroup from 'ol/layer/Group';

import {
  throttle as lodashThrottle,
  each as lodashEach,
} from 'lodash';
import {
  DEFAULT_NUM_GRANULES,
} from '../../modules/layers/constants';
import { updateGranuleLayerGeometry, addGranuleLayerDates } from '../../modules/layers/actions';
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
  getCMRQueryDates,
  getIndexForSortedInsert,
  getCMRQueryDateUpdateOptions,
  isWithinDateRange,
  getGranuleDateData,
} from './util';
import util from '../../util/util';

const CMR_BASE_GRANULE_URL = 'https://cmr.earthdata.nasa.gov/search/granules.json';
const CMR_AJAX_OPTIONS = {
  url: CMR_BASE_GRANULE_URL,
  headers: {
    'Client-Id': 'Worldview',
  },
  traditional: true,
  dataType: 'json',
  timeout: 30 * 1000,
};
const dayNightFilter = 'DAY'; // 'DAY', 'NIGHT', 'BOTH'

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
    const { startQueryDate, endQueryDate } = getCMRQueryDates(date);

    const shortName = 'VJ102MOD'; // USE GRANULE LAYER ID
    const params = {
      shortName,
      temporal: `${startQueryDate.toISOString()},${endQueryDate.toISOString()}`,
      pageSize: 2000,
    };

    const query = `${CMR_BASE_GRANULE_URL + util.toQueryString(params)}`;

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
      addGranuleCMRDateData(data, shortName);
      return getGranules(shortName, date, startQueryDate);
    }
    // user previously queried CMR granule dates
    return getGranules(shortName, date, startQueryDate);
  };

  /**
   * Process CMR granule data into granule date objects
   * @param {String} layerId
   * @param {Object} selectedDate
   * @param {Object} startQueryDate
   * @returns {Array} reducedGranuleDates
  */
  const getGranules = (layerId, selectedDate, startQueryDate) => {
    const selected = `${new Date(selectedDate).toISOString().split('.')[0]}Z`;
    const queryStart = `${new Date(startQueryDate).toISOString().split('.')[0]}Z`;
    const granuleDates = CMRDataStore[layerId];
    const granuleDateKeys = granuleDates ? Object.keys(granuleDates) : [];
    let hitSelectedDate;

    return granuleDateKeys.reduce((granuleDateObjects, date) => {
      const reachedStart = date === queryStart || new Date(date) > startQueryDate;
      if (!reachedStart || hitSelectedDate) {
        return granuleDateObjects;
      }
      hitSelectedDate = date === selected;
      granuleDateObjects.push({ ...granuleDates[date] });
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
      console.debug('create: ', granuleISOKey);
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
  const processGranuleLayer = (def, granuleDates, attributes) => {
    const { proj, group } = attributes;
    const { id } = def;
    const isActive = group === 'active';

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
      granuleDates.forEach((date) => {
        dateArray.splice(getIndexForSortedInsert(dateArray, date), 0, date);
      });
      granuleLayers[id][group].sortedDates = dateArray;
    }
  };

  /**
   *
   * @param {*} def
   * @param {*} group
   * @param {*} includedDates
   * @param {*} filteredGranules
   * @param {*} filteredGranuleCollection
   */
  const updateGranuleState = (layer) => {
    const state = store.getState();
    const {
      id, def, filteredGranules, reorderedGranules, granuleDates,
    } = layer.wv;
    const { endDate, subtitle, startDate } = def;
    const activeGranuleLayers = getActiveGranuleLayers(state);

    const mostRecentGranuleDate = granuleDates[0];
    const isMostRecentDateOutOfRange = new Date(mostRecentGranuleDate) > new Date(endDate);
    const updatedDates = isMostRecentDateOutOfRange ? [] : reorderedGranules || granuleDates;

    // create geometry object with date:polygons key/value pair filtering out granules outside date range
    const granuleGeometries = filteredGranules.reduce((dates, granuleObject) => {
      const { date, polygons } = granuleObject;
      if (!isMostRecentDateOutOfRange && isWithinDateRange(new Date(date), startDate, endDate)) {
        dates[date] = polygons;
      }
      return dates;
    }, {});

    const isLayerBeingUpdated = !!activeGranuleLayers[id];
    if (isLayerBeingUpdated) {
      store.dispatch(updateGranuleLayerGeometry(id, updatedDates, granuleGeometries));
    } else {
      store.dispatch(addGranuleLayerDates(id, granuleDates, granuleGeometries, `${subtitle}`));
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
    const { id } = def;
    const { proj, group } = attributes;
    const granuleAttributes = await getGranuleAttributes(def, options);
    const { filteredGranules, reorderedGranules, granuleDates } = granuleAttributes;

    if (!reorderedGranules) {
      processGranuleLayer(def, granuleDates, attributes);
    }
    let layer = await createGranuleDatesLayer(filteredGranules, def, attributes);

    const granuleTileLayers = (reorderedGranules || granuleDates)
      .map((date) => {
        const key = granuleLayers[id][group].dates[date];
        const cachedLayer = cache.getItem(key);
        return cachedLayer || layer;
      });

    layer = new OlLayerGroup({
      layers: granuleTileLayers,
    });
    layer.set('granuleGroup', true);
    layer.set('layerId', `${id}-${group}`);
    layer.wv = { ...attributes, ...granuleAttributes };
    currentProj = proj;
    updateGranuleState(layer);

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
    let reorderedGranules = false;
    let count = DEFAULT_NUM_GRANULES;

    if (options) {
      const { granuleCount, granuleDates } = options;
      count = granuleCount || DEFAULT_NUM_GRANULES;
      if (granuleDates && granuleDates.length) {
        reorderedGranules = granuleDates.length !== count ? false : granuleDates;
      }
    }

    if (!reorderedGranules) {
      const granuleState = getActiveGranuleLayers(state)[def.id];
      if (granuleState) {
        count = granuleState.count;
      }
    }

    // get granule dates waiting for CMR query and filtering (if necessary)
    const availableGranuleDates = await getQueriedGranuleDates(def, options.date);
    const filteredGranules = filterGranules(availableGranuleDates, count);
    return {
      count,
      granuleDates: filteredGranules.map(({ date }) => date),
      filteredGranules,
      reorderedGranules,
    };
  };

  /**
   * Get the last n granule dates
   * @param {Array} granuleDates
   * @param {number} granuleCount - number of granules to add to collection
   * @returns {array} collection of granule objects with filtered granuleDates
  */
  const filterGranules = (granuleDates, granuleCount) => {
    const dates = [];
    for (let i = granuleDates.length - 1; i >= 0 && dates.length < granuleCount; i -= 1) {
      const item = granuleDates[i];
      const { dayNight } = item;
      if (dayNight === dayNightFilter) {
        dates.unshift(item);
      }
    }
    return dates;
  };

  return {
    getGranuleLayer,
  };
}
