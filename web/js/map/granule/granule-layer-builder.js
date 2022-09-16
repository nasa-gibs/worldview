import OlLayerGroup from 'ol/layer/Group';
import { throttle as lodashThrottle, find } from 'lodash';
import OlCollection from 'ol/Collection';
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
  const addGranuleCMRDateData = (data, conceptId, dateRanges) => {
    const { proj: { selected: { crs } } } = store.getState();
    CMRDataStore[conceptId] = CMRDataStore[conceptId] || [];
    data.forEach((entry) => {
      const date = toISOStringSeconds(entry.time_start);
      const hasImagery = find(dateRanges, ({ startDate, endDate }) => isWithinDateRange(new Date(date), startDate, endDate));
      const existsForTime = find(CMRDataStore[conceptId], (g) => g.date === date);
      if (!hasImagery || existsForTime) {
        return;
      }
      const transformedGranule = transformGranuleData(entry, date, crs);
      CMRDataStore[conceptId].push(transformedGranule);
    });
    return CMRDataStore[conceptId].sort((a, b) => {
      const dateA = new Date(a.date).valueOf();
      const dateB = new Date(b.date).valueOf();
      return dateB - dateA;
    });
  };

  const datesHaveBeenQueried = (startQueryDate, endQueryDate, existingGranules) => {
    const latestDate = new Date(existingGranules[0].date);
    const earliestDate = new Date(existingGranules[existingGranules.length - 1].date);
    const startIsCovered = isWithinDateRange(startQueryDate, earliestDate, latestDate);
    const endIsCovered = isWithinDateRange(endQueryDate, earliestDate, latestDate);
    return startIsCovered && endIsCovered;
  };

  /**
   * Query CMR to get dates
   * @param {object} def - Layer specs
   * @param {object} date - current selected date (Note: may not return this date, but this date will be the max returned)
  */
  const getQueriedGranuleDates = async (def, date) => {
    const {
      endDate, startDate, title, visible, dateRanges,
    } = def;
    const { startQueryDate, endQueryDate } = getCMRQueryDates(date);
    const getGranulesUrl = getGranulesUrlSelector(store.getState());

    // TODO: USE GRANULE LAYER conceptId
    const shortName = 'VJ102MOD';
    const conceptId = shortName;
    let data = [];

    const existingGranules = CMRDataStore[conceptId] || [];

    if (existingGranules.length && datesHaveBeenQueried(startQueryDate, endQueryDate, existingGranules)) {
      return existingGranules;
    }

    showLoading();
    try {
      const params = {
        // conceptId,
        shortName,
        startDate: startQueryDate.toISOString(),
        endDate: endQueryDate.toISOString(),
        dayNight: dayNightFilter,
        pageSize: 1000,
      };
      const response = await fetch(getGranulesUrl(params), CMR_AJAX_OPTIONS);
      data = await response.json();
      data = data.feed.entry;

      if (data.length === 0) {
        const dateWithinRange = isWithinDateRange(date, startDate, endDate);
        // only show modal error if layer not set to hidden and outside of selected date range
        if (visible && dateWithinRange) {
          throttleDispathCMRErrorDialog(title);
        }
        return data;
      }
    } catch (e) {
      console.error(e);
      throttleDispathCMRErrorDialog(title);
      return data;
    } finally {
      hideLoading();
    }
    return addGranuleCMRDateData(data, conceptId, dateRanges);
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
    const { id, startDate, endDate } = def;
    const { date, group } = attributes;
    const granuleLayer = new OlLayerGroup();
    granuleLayer.wv = { ...attributes };

    const dateInRange = isWithinDateRange(date, new Date(startDate), new Date(endDate));
    if (!dateInRange) {
      return granuleLayer;
    }

    const granuleAttributes = await getGranuleAttributes(def, options);
    const { visibleGranules } = granuleAttributes;
    const granules = datelineShiftGranules(visibleGranules, date, crs);
    const tileLayers = new OlCollection(createGranuleTileLayers(granules, def, attributes));
    granuleLayer.setLayers(tileLayers);
    granuleLayer.setExtent(crs === 'EPSG:4326' ? FULL_MAP_EXTENT : maxExtent);
    granuleLayer.set('granuleGroup', true);
    granuleLayer.set('layerId', `${id}-${group}`);
    granuleLayer.wv = {
      ...attributes,
      ...granuleAttributes,
      visibleGranules: granules,
    };

    // Don't update during animation due to the performance hit
    if (!isPlaying) {
      store.dispatch(updateGranuleLayerState(granuleLayer));
    }

    return granuleLayer;
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
    const visibleGranules = filterGranules(availableGranules, count, date);
    const transformedGranules = transformGranulesForProj(visibleGranules, crs);

    return {
      count,
      granuleDates: transformedGranules.map((g) => g.date),
      visibleGranules: transformedGranules,
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

    for (let i = 0; granules.length < granuleCount; i += 1) {
      const item = availableGranules[i];
      const { date } = item;
      const granuleDate = new Date(date);
      if (granuleDate <= nextDate) {
        granules.unshift(item);
      }
    }
    return granules.reverse();
  };

  return {
    getGranuleLayer: createGranuleLayer,
  };
}
