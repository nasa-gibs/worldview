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
  const CMRDataStore = {
    [CRS.WEB_MERCATOR]: {},
    [CRS.GEOGRAPHIC]: {},
    [CRS.ANTARCTIC]: {},
    [CRS.ARCTIC]: {},
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
   * Collect granule metadata objects from a CMR response that have GIBS imagery
   *
   * @param {data} CMR data
   * @param {id} layer id
  */
  const addGranuleCMRDateData = (def, data, shortName, dateRanges) => {
    const { proj: { selected: { crs } } } = store.getState();
    CMRDataStore[crs][shortName] = CMRDataStore[crs][shortName] || [];
    const granuleData = CMRDataStore[crs][shortName];

    // Any granule metadata object that gets added here is assumed to have corresponding
    // imagery in GIBS at the same time stamp.  Therefore when determining whether or not
    // to include a granule from CMR we see if either is true:
    // - (imageryInDateRange) the date for the granule falls within a date range defined by GIBS for this layer
    // - (imageryInTrailingRange) the date falls after the end date of the last date range AND before the layer's end date,
    //   or in the case of an ongoing layer with no endDate, now

    const lastDateRange = dateRanges[dateRanges.length - 1];
    const finalEndDate = def.endDate || new Date();
    data.forEach((entry) => {
      const date = toISOStringSeconds(entry.time_start);
      const imageryInDateRange = find(dateRanges, (r) => isWithinDateRange(date, r.startDate, r.endDate));
      const imageryInTrailingRange = isWithinDateRange(date, lastDateRange.endDate, finalEndDate);
      const existsForTime = find(granuleData, (g) => g.date === date);
      if (!(imageryInDateRange || imageryInTrailingRange) || existsForTime) {
        return;
      }
      const transformedGranule = transformGranuleData(entry, date, crs);
      granuleData.push(transformedGranule);
    });
    granuleData.sort((a, b) => {
      const dateA = new Date(a.date).valueOf();
      const dateB = new Date(b.date).valueOf();
      return dateB - dateA;
    });
  };

  const datesHaveBeenQueried = (start, end, existingGranules) => {
    if (!existingGranules.length) return;
    const latestDate = new Date(existingGranules[0].date);
    const earliestDate = new Date(existingGranules[existingGranules.length - 1].date);
    const startIsCovered = isWithinDateRange(start, earliestDate, latestDate);
    const endIsCovered = isWithinDateRange(end, earliestDate, latestDate);
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
    const state = store.getState();
    const { proj: { selected: { crs } } } = state;
    const getGranulesUrl = getGranulesUrlSelector(state);
    const params = getParamsForGranuleRequest(def, date, crs);
    const nrtParams = getParamsForGranuleRequest(def, date, crs, true);
    const { shortName } = params;
    const { shortName: nrtShortName } = nrtParams;
    let data = [];
    let nrtData = [];
    const existingGranules = CMRDataStore[crs][shortName] || [];
    const existingNRTGranules = CMRDataStore[crs][nrtShortName] || [];
    const mergedExistingGranules = existingGranules.concat(existingNRTGranules);
    const datesQueried = datesHaveBeenQueried(params.startDate, date, mergedExistingGranules);

    if (mergedExistingGranules.length && datesQueried) {
      return mergedExistingGranules;
    }
    try {
      showLoading();
      const requestUrl = getGranulesUrl(params);
      console.log('requestUrl', requestUrl);
      const nrtRequestUrl = getGranulesUrl(nrtParams);
      const response = await fetch(requestUrl, CMR_AJAX_OPTIONS);
      const nrtResponse = await fetch(nrtRequestUrl, CMR_AJAX_OPTIONS);
      data = await response.json();
      nrtData = await nrtResponse.json();
      data = data.feed.entry;
      nrtData = nrtData.feed.entry;
      if (data.length || nrtData.length) {
        addGranuleCMRDateData(def, data, shortName, dateRanges);
        addGranuleCMRDateData(def, nrtData, nrtShortName, dateRanges);
      } else {
        const dateWithinRange = isWithinDateRange(date, startDate, endDate);
        // only show modal error if layer not set to hidden and outside of selected date range
        if (visible && dateWithinRange) throttleDispathCMRErrorDialog(title);
      }
    } catch (e) {
      console.error(e);
      throttleDispathCMRErrorDialog(title);
      return CMRDataStore[crs][shortName];
    } finally {
      hideLoading();
    }

    return [...existingGranules, ...existingNRTGranules];
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
   * Get granuleCount number of granules that have visible imagery based on
   * predetermined longitude bounds.
   *
   * @param {Array} availableGranules - available granules to be filtered
   * @param {number} granuleCount - number of granules to filter down to
   * @param {Date} leadingEdgeDate - timeline date
   * @returns {array}
  */
  const getVisibleGranules = (availableGranules, granuleCount, leadingEdgeDate) => {
    const { proj: { selected: { crs } } } = store.getState();
    const granules = [];
    const availableCount = availableGranules?.length;
    if (!availableCount) return granules;
    const count = granuleCount > availableCount ? availableCount : granuleCount;

    for (let i = 0; granules.length < count; i += 1) {
      const item = availableGranules[i];
      if (!item) break;
      const { date } = item;
      if (new Date(date) <= leadingEdgeDate && isWithinBounds(crs, item)) {
        granules.unshift(item);
      }
    }

    if (granules.length < granuleCount) {
      console.warn('Could not find enough matching granules', `${granules.length}/${granuleCount}`);
    }
    return granules;
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
    const visibleGranules = getVisibleGranules(availableGranules, count, date);
    const transformedGranules = transformGranulesForProj(visibleGranules, crs);

    return {
      count,
      granuleDates: transformedGranules.map((g) => g.date),
      visibleGranules: transformedGranules,
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
