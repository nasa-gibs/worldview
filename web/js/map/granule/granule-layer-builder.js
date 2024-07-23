import OlLayerGroup from 'ol/layer/Group';
import { throttle as lodashThrottle } from 'lodash';
import OlCollection from 'ol/Collection';
import { DEFAULT_NUM_GRANULES } from '../../modules/layers/constants';
import { updateGranuleLayerState, addGranuleLayerGranules } from '../../modules/layers/actions';
import { getGranuleLayer } from '../../modules/layers/selectors';
import {
  startLoading,
  stopLoading,
  LOADING_GRANULES,
} from '../../modules/loading/actions';
import { FULL_MAP_EXTENT, CRS } from '../../modules/map/constants';
import { openBasicContent } from '../../modules/modal/actions';
import { getCacheOptions } from '../../modules/layers/util';
import { getGranulesUrl as getGranulesUrlSelector } from '../../modules/smart-handoff/selectors';
import {
  getParamsForGranuleRequest,
  isWithinBounds,
  isWithinDateRange,
  transformGranuleData,
  datelineShiftGranules,
  transformGranulesForProj,
} from './util';
import util from '../../util/util';

const { toISOStringSeconds } = util;

export default function granuleLayerBuilder(cache, store, createLayerWMTS) {
  const getGranuleUrl = getGranulesUrlSelector(store.getState());
  const baseGranuleUrl = getGranuleUrl();
  const CMR_AJAX_OPTIONS = {
    url: baseGranuleUrl,
    cache: 'force-cache',
    headers: { 'Client-Id': 'Worldview' },
    traditional: true,
    dataType: 'json',
    timeout: 30 * 1000,
  };

  function dispathCMRErrorDialog (title) {
    const bodyText = `The Common Metadata Repository (CMR) service that
    provides metadata for this granule layer, ${title}, is currently unavailable.
    Please try again later.`;
    const modalHeader = 'Granules unavailable at this time.';
    store.dispatch(openBasicContent(modalHeader, bodyText));
  }

  const throttleDispathCMRErrorDialog = lodashThrottle(
    dispathCMRErrorDialog.bind(this),
    CMR_AJAX_OPTIONS.timeout,
    { leading: true, trailing: false },
  );

  const showLoading = () => {
    store.dispatch(startLoading(LOADING_GRANULES));
  };

  const hideLoading = () => {
    store.dispatch(stopLoading(LOADING_GRANULES));
  };

  /**
   * Query CMR to get dates
   * @param {object} def - Layer specs
   * @param {object} date - current selected date (Note: may not return this date, but this date will be the max returned)
  */
  const getQueriedGranuleDates = async (def, date) => {
    const {
      title,
    } = def;
    const state = store.getState();
    const { proj: { selected: { crs } } } = state;
    const getGranulesUrl = getGranulesUrlSelector(state);
    const params = getParamsForGranuleRequest(def, date, crs);
    const nrtParams = getParamsForGranuleRequest(def, date, crs, true);
    let data = [];
    let nrtData = [];
    try {
      showLoading();
      const requestUrl = getGranulesUrl(params);
      const nrtRequestUrl = getGranulesUrl(nrtParams);
      const requests = [fetch(requestUrl, CMR_AJAX_OPTIONS), fetch(nrtRequestUrl, CMR_AJAX_OPTIONS)];
      const responses = await Promise.allSettled(requests);
      const fulfilledResponses = responses.filter(({ status }) => status === 'fulfilled').map(({ value }) => value);
      const [response, nrtResponse] = fulfilledResponses;
      const jsonRequests = [response.json(), nrtResponse.json()];
      const jsonResponses = await Promise.allSettled(jsonRequests);
      const [responseJson, nrtResponseJson] = jsonResponses.filter(({ status }) => status === 'fulfilled').map(({ value }) => value);
      data = responseJson.feed.entry;
      nrtData = nrtResponseJson.feed.entry;
    } catch (e) {
      console.error(e);
      throttleDispathCMRErrorDialog(title);
    } finally {
      hideLoading();
    }

    const transformedData = [...data, ...nrtData].map((entry) => {
      const date = toISOStringSeconds(entry.time_start);

      return transformGranuleData(entry, date, crs);
    });
    return transformedData;
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
   * Check if date is within a range
   * @param {Date} date - date to check
   * @param {array} ranges - array of date ranges
   * @returns {boolean} - true if date is within a range
  */
  const isWithinRanges = (date, ranges) => ranges.some(([start, end]) => date >= new Date(start) && date <= new Date(end));

  /**
   * Get granuleCount number of granules that have visible imagery based on
   * predetermined longitude bounds.
   *
   * @param {Array} availableGranules - available granules to be filtered
   * @param {number} granuleCount - number of granules to filter down to
   * @param {Date} leadingEdgeDate - timeline date
   * @returns {array}
  */
  const getVisibleGranules = (availableGranules, granuleCount, leadingEdgeDate, granuleDateRanges) => {
    const { proj: { selected: { crs } } } = store.getState();
    const granules = [];
    const availableCount = availableGranules?.length;
    if (!availableCount) return granules;
    const count = granuleCount > availableCount ? availableCount : granuleCount;
    const sortedAvailableGranules = availableGranules.sort((a, b) => new Date(b.date) - new Date(a.date));
    for (let i = 0; granules.length < count; i += 1) {
      const item = sortedAvailableGranules[i];
      if (!item) break;
      const { date } = item;
      const dateDate = new Date(date);
      const leadingEdgeDateUTC = new Date(leadingEdgeDate.toUTCString());
      const isWithinRange = isWithinRanges(leadingEdgeDateUTC, granuleDateRanges);
      if (dateDate <= leadingEdgeDateUTC && isWithinRange && isWithinBounds(crs, item)) {
        granules.unshift(item);
      }
    }

    if (granules.length < granuleCount) {
      console.warn('Could not find enough matching granules', `${granules.length}/${granuleCount}`);
    }
    return granules;
  };

  /**
   * @method makeTime
   * @param {string} date
   * @returns {number} time
   * @description
   * Convert date to time
  */
  function makeTime(date) {
    return new Date(date).getTime();
  }

  /**
   * @method mergeSortedGranuleDateRanges
   * @param {array} granules
   * @returns {array} mergedGranuleDateRanges
   * @description
   * Merge overlapping granule date ranges
  */
  function mergeSortedGranuleDateRanges(granules) {
    return granules.reduce((acc, [start, end]) => {
      if (!acc.length) return [[start, end]];
      // round start time down and end time up by 1 minute to account for small range gaps
      const startTime = makeTime(start) - 60000;
      const endTime = makeTime(end) + 60000;
      const lastRangeEndTime = makeTime(acc.at(-1)[1]);
      const lastRangeStartTime = makeTime(acc.at(-1)[0]);
      if ((startTime >= lastRangeStartTime && startTime <= lastRangeEndTime) && (endTime >= lastRangeStartTime && endTime <= lastRangeEndTime)) { // within current range, ignore
        return acc;
      }
      if (startTime > lastRangeEndTime) { // discontinuous, add new range
        return [...acc, [start, end]];
      }
      if (startTime <= lastRangeEndTime && endTime > lastRangeEndTime) { // intersects current range, merge
        return acc.with(-1, [acc.at(-1)[0], end]);
      }
      return acc;
    }, []);
  }

  /**
   * @method requestGranules
   * @param {object} params
   * @returns {array} granules
   * @description
   * Request granules from CMR
  */
  async function requestGranules(params) {
    const {
      shortName,
      extent,
      startDate,
      endDate,
    } = params;
    const granules = [];
    let hits = Infinity;
    let searchAfter = false;
    const url = `https://cmr.earthdata.nasa.gov/search/granules.json?shortName=${shortName}&bounding_box=${extent.join(',')}&temporal=${startDate}/${endDate}&sort_key=start_date&pageSize=2000`;
    /* eslint-disable no-await-in-loop */
    do { // run the query at least once
      const headers = searchAfter ? { 'Cmr-Search-After': searchAfter, 'Client-Id': 'Worldview' } : { 'Client-Id': 'Worldview' };
      const res = await fetch(url, { headers, cache: 'force-cache' });
      searchAfter = res.headers.get('Cmr-Search-After');
      hits = parseInt(res.headers.get('Cmr-Hits'), 10);
      const data = await res.json();
      granules.push(...data.feed.entry);
    } while (searchAfter || hits > granules.length); // searchAfter will not be present if there are no more results https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html#search-after

    return granules;
  }
  /**
   * @method getLayerGranuleRanges
   * @param {object} layer
   * @returns {array} granuleDateRanges
   * @description
   * Get granule date ranges for a given layer
  */
  async function getLayerGranuleRanges(layer) {
    const extent = [-180, -90, 180, 90];
    const startDate = new Date(layer.startDate).toISOString();
    const endDate = layer.endDate ? new Date(layer.endDate).toISOString() : new Date().toISOString();
    const shortName = layer.conceptIds?.[0]?.shortName;
    const nrtParams = {
      shortName,
      extent,
      startDate,
      endDate,
    };
    const nrtGranules = await requestGranules(nrtParams);
    let nonNRTGranules = [];
    if (shortName.includes('_NRT')) { // if NRT, also get non-NRT granules
      const nonNRTShortName = shortName.replace('_NRT', '');
      const nonNRTParams = {
        shortName: nonNRTShortName,
        extent,
        startDate,
        endDate,
      };
      nonNRTGranules = await requestGranules(nonNRTParams);
    }
    const granules = [...nonNRTGranules, ...nrtGranules];
    const granuleDateRanges = granules.map(({ time_start: timeStart, time_end: timeEnd }) => [timeStart, timeEnd]);
    const mergedGranuleDateRanges = mergeSortedGranuleDateRanges(granuleDateRanges); // merge overlapping granule ranges to simplify rendering

    return mergedGranuleDateRanges;
  }

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
    const count = currentCount || granuleCount || def.count || DEFAULT_NUM_GRANULES;
    let granuleDateRanges = null;

    // get granule dates waiting for CMR query and filtering (if necessary)
    const availableGranules = await getQueriedGranuleDates(def, date, group);
    // if opted in to CMR availability, get granule date ranges if needed
    if (def.cmrAvailability) {
      if (!def.granuleDateRanges) {
        granuleDateRanges = await getLayerGranuleRanges(def);
        store.dispatch(addGranuleLayerGranules(def, granuleDateRanges));
      } else {
        granuleDateRanges = def.granuleDateRanges;
      }
    }
    const visibleGranules = getVisibleGranules(availableGranules, count, date, granuleDateRanges);
    const transformedGranules = transformGranulesForProj(visibleGranules, crs);

    return {
      count,
      granuleDates: transformedGranules.map((g) => g.date),
      visibleGranules: transformedGranules,
      granuleDateRanges,
    };
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

    const dateInRange = isWithinDateRange(date, startDate, endDate);
    if (!dateInRange) {
      return granuleLayer;
    }

    const granuleAttributes = await getGranuleAttributes(def, options);
    const { visibleGranules } = granuleAttributes;
    const granules = datelineShiftGranules(visibleGranules, date, crs);
    const tileLayers = new OlCollection(createGranuleTileLayers(granules, def, attributes));
    granuleLayer.setLayers(tileLayers);
    granuleLayer.setExtent(crs === CRS.GEOGRAPHIC ? FULL_MAP_EXTENT : maxExtent);
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

  return {
    getGranuleLayer: createGranuleLayer,
  };
}
