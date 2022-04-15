import OlLayerGroup from 'ol/layer/Group';
import { throttle as lodashThrottle } from 'lodash';
import { DEFAULT_NUM_GRANULES } from '../../modules/layers/constants';
import { updateGranuleLayerState } from '../../modules/layers/actions';
import { getGranuleLayer } from '../../modules/layers/selectors';
import {
  startLoading,
  stopLoading,
  LOADING_GRANULES,
} from '../../modules/loading/actions';
import { openBasicContent } from '../../modules/modal/actions';
import { getCacheOptions } from '../../modules/layers/util';
import { getGranulesUrl as getGranulesUrlSelector } from '../../modules/smart-handoff/selectors';
import {
  getCMRQueryDates,
  getCMRQueryDateUpdateOptions,
  isWithinDateRange,
  transformGranuleData,
  datelineShiftGranules,
  transformGranulesForProj,
} from './util';
import util from '../../util/util';

const { toISOStringSeconds } = util;
const dayNightFilter = 'DAY'; // 'DAY', 'NIGHT', 'BOTH'

export default function granuleLayerBuilder(cache, store, createLayerWMTS) {
  const CMRDataStore = {};
  const CMRDateRanges = {
    active: {},
    activeB: {},
  };
  const getGranuleUrl = getGranulesUrlSelector(store.getState());
  const baseGranuleUrl = getGranuleUrl();
  const CMR_AJAX_OPTIONS = {
    url: baseGranuleUrl,
    headers: { 'Client-Id': 'Worldview' },
    traditional: true,
    dataType: 'json',
    timeout: 30 * 1000,
  };
  const throttleDispathCMRErrorDialog = lodashThrottle(
    dispathCMRErrorDialog.bind(this),
    CMR_AJAX_OPTIONS.timeout,
    { leading: true, trailing: false },
  );

  function dispathCMRErrorDialog (title) {
    const bodyText = `The Common Metadata Repository(CMR) service that
                      provides metadata for this granule layer, ${title}, is currently unavailable.
                      Please try again later.`;
    const modalHeader = 'Granules unavailable at this time.';
    store.dispatch(openBasicContent(modalHeader, bodyText));
  }

  const showLoading = () => {
    store.dispatch(startLoading(LOADING_GRANULES));
  };

  const hideLoading = () => {
    store.dispatch(stopLoading(LOADING_GRANULES));
  };

  /**
   * Add granule cmr data to granule cmr object with date as key
   * @param {data} CMR data
   * @param {id} layer id
  */
  const addGranuleCMRDateData = (data, id) => {
    const { proj: { selected: { crs } } } = store.getState();
    if (!CMRDataStore[id]) {
      CMRDataStore[id] = {};
    }
    Object.values(data).forEach((entry) => {
      const date = toISOStringSeconds(entry.time_start);
      CMRDataStore[id][date] = transformGranuleData(entry, date, crs);
    });
  };

  /**
   * Query CMR to get dates filtered by day_night_flag
   * @param {object} def - Layer specs
   * @param {object} date - current selected date (Note: may not return this date, but this date will be the max returned)
  */
  const getQueriedGranuleDates = async (def, date, activeString) => {
    const {
      endDate, startDate, id, title, visible,
    } = def;
    const { startQueryDate, endQueryDate } = getCMRQueryDates(date);
    const getGranulesUrl = getGranulesUrlSelector(store.getState());

    const shortName = 'VJ102MOD'; // USE GRANULE LAYER ID
    const params = {
      shortName,
      startDate: startQueryDate.toISOString(),
      endDate: endQueryDate.toISOString(),
      pageSize: 2000,
    };

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
      let data;
      try {
        const response = await fetch(getGranulesUrl(params), CMR_AJAX_OPTIONS);
        data = await response.json();
        data = data.feed.entry;

        if (data.length === 0) {
          const dateWithinRange = isWithinDateRange(date, startDate, endDate);
          // only show modal error if layer not set to hidden and outside of selected date range
          if (visible && dateWithinRange) {
            throttleDispathCMRErrorDialog(title);
          }
          return [];
        }
      } catch (e) {
        console.error(e);
        throttleDispathCMRErrorDialog(title);
        return [];
      } finally {
        hideLoading();
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
    const selected = toISOStringSeconds(selectedDate);
    const queryStart = toISOStringSeconds(startQueryDate);
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
   * @param {object} attributes - Layer specs
   * @returns {array} collection of OpenLayers TileLayers
  */
  const createGranuleTileLayers = async (granules, def, attributes) => {
    const { period, id } = def;
    const { group, proj } = attributes;

    const layerPromises = granules.map(async (granule) => {
      const { date, polygon, shifted } = granule;
      const granuleISOKey = `${id}:${proj}:${date}::${group}:${shifted ? 'shifted' : ''}`;
      let tileLayer = cache.getItem(granuleISOKey);
      if (tileLayer) {
        return tileLayer;
      }
      const granuleISODate = new Date(date);
      const options = { date: granuleISODate, polygon, shifted };

      tileLayer = await createLayerWMTS(def, options, null, store.getState());

      attributes.key = granuleISOKey;
      attributes.date = granuleISODate;
      tileLayer.wv = attributes;
      cache.setItem(granuleISOKey, tileLayer, getCacheOptions(period, granuleISODate));
      tileLayer.setVisible(false);
      return tileLayer;
    });

    const layers = await Promise.all(layerPromises);
    return layers;
  };

  /**
   * @method createGranuleLayer
   * @param {object} def - Layer specs
   * @param {object} attributes
   * @param {object} options
   * @returns {object} - Granule layer
  */
  const createGranuleLayer = async (def, attributes, options) => {
    const { proj: { selected: { crs } } } = store.getState();
    const { id } = def;
    const { date, group } = attributes;
    const granuleAttributes = await getGranuleAttributes(def, options);
    const { filteredGranules } = granuleAttributes;

    const transformedGranules = transformGranulesForProj(filteredGranules, crs);
    const granules = datelineShiftGranules(transformedGranules, date, crs);
    const tileLayers = await createGranuleTileLayers(granules, def, attributes);
    const layer = new OlLayerGroup({ layers: tileLayers });

    layer.set('granuleGroup', true);
    layer.set('layerId', `${id}-${group}`);
    layer.wv = {
      ...attributes,
      ...granuleAttributes,
      filteredGranules: granules,
    };
    store.dispatch(updateGranuleLayerState(layer));

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
      const granuleState = getGranuleLayer(state, def.id);
      if (granuleState) {
        count = granuleState.count;
      }
    }

    // get granule dates waiting for CMR query and filtering (if necessary)
    const availableGranuleDates = await getQueriedGranuleDates(def, options.date, options.group);
    const filteredGranules = filterGranules(def.dateRanges, availableGranuleDates, count);
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
  const filterGranules = (dateRanges, granuleDates, granuleCount) => {
    const dates = [];
    for (let i = granuleDates.length - 1; i >= 0 && dates.length < granuleCount; i -= 1) {
      const item = granuleDates[i];
      const { dayNight, date } = item;
      const granuleDate = new Date(date);
      const hasImagery = dateRanges.some(
        ({ startDate, endDate }) => isWithinDateRange(granuleDate, startDate, endDate),
      );
      if (dayNight === dayNightFilter && hasImagery) {
        dates.unshift(item);
      }
    }
    return dates;
  };

  return {
    getGranuleLayer: createGranuleLayer,
  };
}
