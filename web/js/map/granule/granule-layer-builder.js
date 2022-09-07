import OlLayerGroup from 'ol/layer/Group';
import { throttle as lodashThrottle, find } from 'lodash';
import { DEFAULT_NUM_GRANULES } from '../../modules/layers/constants';
import { updateGranuleLayerState } from '../../modules/layers/actions';
import { getGranuleLayer } from '../../modules/layers/selectors';
import {
  startLoading,
  stopLoading,
  LOADING_GRANULES,
} from '../../modules/loading/actions';
import { FULL_MAP_EXTENT } from '../../modules/map/constants';
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
  const addGranuleCMRDateData = (data, id, dateRanges) => {
    const { proj: { selected: { crs } } } = store.getState();
    if (!CMRDataStore[id]) {
      CMRDataStore[id] = {};
    }
    Object.values(data).forEach((entry) => {
      const date = toISOStringSeconds(entry.time_start);
      const hasImagery = find(dateRanges, ({ startDate, endDate }) => isWithinDateRange(new Date(date), startDate, endDate));
      if (hasImagery && entry.day_night_flag === dayNightFilter) {
        CMRDataStore[id][date] = transformGranuleData(entry, date, crs);
      }
    });
  };

  /**
   * Query CMR to get dates
   * @param {object} def - Layer specs
   * @param {object} date - current selected date (Note: may not return this date, but this date will be the max returned)
  */
  const getQueriedGranuleDates = async (def, date, activeString) => {
    const {
      endDate, startDate, id, title, visible, dateRanges,
    } = def;
    const { startQueryDate, endQueryDate } = getCMRQueryDates(date);
    const getGranulesUrl = getGranulesUrlSelector(store.getState());

    const shortName = 'VJ102MOD'; // TODO: USE GRANULE LAYER ID
    const params = {
      shortName,
      startDate: startQueryDate.toISOString(),
      endDate: endQueryDate.toISOString(),
      day_night_flag: dayNightFilter,
      pageSize: 1000,
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

      addGranuleCMRDateData(data, shortName, dateRanges);
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
  const getGranules = (layerId, selectedDate, startQueryDate, dateRanges) => {
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
  const createGranuleTileLayers = (granules, def, attributes) => {
    const { period, id } = def;
    const { group, proj } = attributes;

    return granules.map((granule) => {
      const { date, polygon, shifted } = granule;
      const granuleISOKey = `${id}:${proj}:${date}::${group}:${shifted ? 'shifted' : ''}`;
      let tileLayer = cache.getItem(granuleISOKey);
      if (tileLayer) {
        return tileLayer;
      }
      const granuleISODate = new Date(date);
      const options = {
        date: granuleISODate,
        polygon,
        shifted,
      };
      tileLayer = createLayerWMTS(def, options, null, store.getState());

      attributes.key = granuleISOKey;
      attributes.date = granuleISODate;
      tileLayer.wv = attributes;
      cache.setItem(granuleISOKey, tileLayer, getCacheOptions(period, granuleISODate));
      tileLayer.setVisible(false);
      return tileLayer;
    });
  };

  /**
   * @method createGranuleLayer
   * @param {object} def - Layer specs
   * @param {object} attributes
   * @param {object} options
   * @returns {object} - Granule layer
  */
  const createGranuleLayer = async (def, attributes, options) => {
    const {
      animation: { isPlaying },
      proj: { selected: { crs, maxExtent } },
    } = store.getState();
    const { id } = def;
    const { date, group } = attributes;
    const granuleAttributes = await getGranuleAttributes(def, options);
    const { filteredGranules } = granuleAttributes;
    const granules = datelineShiftGranules(filteredGranules, date, crs);
    const tileLayers = createGranuleTileLayers(granules, def, attributes);
    const layer = new OlLayerGroup({
      layers: tileLayers,
      extent: crs === 'EPSG:4326' ? FULL_MAP_EXTENT : maxExtent,
    });

    layer.set('granuleGroup', true);
    layer.set('layerId', `${id}-${group}`);
    layer.wv = {
      ...attributes,
      ...granuleAttributes,
      filteredGranules: granules,
    };

    // Don't update during animation due to the performance hit
    if (!isPlaying) {
      store.dispatch(updateGranuleLayerState(layer));
    }

    return layer;
  };

  /**
   * @method getGranuleAttributes
   * @param {object} def
   * @param {object} options
   * @returns {object} granuleAttributes
   */
  const getGranuleAttributes = async (def, options) => {
    const state = store.getState();
    const { proj: { selected: { crs } } } = state;
    const { granuleCount, date, group } = options;
    const { count: currentCount } = getGranuleLayer(state, def.id) || {};
    const count = currentCount || granuleCount || DEFAULT_NUM_GRANULES;

    // get granule dates waiting for CMR query and filtering (if necessary)
    const availableGranules = await getQueriedGranuleDates(def, date, group);
    const filteredGranules = filterGranules(availableGranules, count, date);
    const transformedGranules = transformGranulesForProj(filteredGranules, crs);

    return {
      count,
      granuleDates: transformedGranules.map((g) => g.date),
      filteredGranules: transformedGranules,
    };
  };

  /**
   * Get the last n granule dates
   * @param {Array} granuleDates - granule date/polygon metadata
   * @param {number} granuleCount - number of granules to add to collection
   * @returns {array} collection of granule objects with filtered granuleDates
  */
  const filterGranules = (availableGranules, granuleCount, nextDate) => {
    const granules = [];
    if (!availableGranules.length) return granules;

    for (let i = availableGranules.length - 1; i >= 0 && granules.length < granuleCount; i -= 1) {
      const item = availableGranules[i];
      const { date } = item;
      const granuleDate = new Date(date);
      if (granuleDate <= nextDate) {
        granules.unshift(item);
      }
    }
    return granules;
  };

  return {
    getGranuleLayer: createGranuleLayer,
  };
}
