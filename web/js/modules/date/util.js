import { each as lodashEach, get } from 'lodash';
import update from 'immutability-helper';
import util from '../../util/util';
import { layersParse12 } from '../layers/util';
import {
  dateRange as getDateRange, getActiveLayers,
} from '../layers/selectors';

export const filterProjLayersWithStartDate = (layers, projId) => layers.filter((layer) => layer.startDate && layer.projections[projId]);

export function serializeDate(date) {
  return (
    `${date.toISOString().split('T')[0]
    }-`
    + `T${
      date
        .toISOString()
        .split('T')[1]
        .slice(0, -5)
    }Z`
  );
}

export function tryCatchDate(str, initialState) {
  try {
    return util.parseDateUTC(str);
  } catch (error) {
    console.warn(`Invalid date: ${str}`);
    return initialState;
  }
}

/**
 * Serialize date A for location
 *
 * @method serializeDateWrapper
 * @param  {Object} currentItemState
 * @param  {Object} state
 * @param  {Object} prev
 * @returns {String | undefined} serialized time string OR undefined
 */
export function serializeDateWrapper(currentItemState, state, prev) {
  const prevParams = Object.keys(prev).length > 0;
  const initialDate = get(state, 'config.initialDate');
  const initialDateString = util.toISOStringSeconds(initialDate);
  const compareIsActive = get(state, 'compare.active');
  const isCompareA = get(state, 'compare.isCompareA');

  // exit compare mode with dateB selected, dateB now primary date 't='
  const dateBSelected = !compareIsActive && !isCompareA;
  if (dateBSelected) {
    const dateB = get(state, 'date.selectedB');
    const defaultDateB = util.toISOStringSeconds(dateB) === initialDateString;
    return !prevParams && defaultDateB
      ? undefined
      : serializeDate(dateB);
  }
  // dateA 't=' serialization
  const defaultDate = util.toISOStringSeconds(currentItemState) === initialDateString;
  return !prevParams && defaultDate
    ? undefined
    : serializeDate(currentItemState);
}

/**
 * Serialize date B for location
 *
 * @method serializeDateBWrapper
 * @param  {Object} currentItemState
 * @param  {Object} state
 * @param  {Object} prev
 * @returns {String | undefined} serialized time string OR undefined
 */
export function serializeDateBWrapper(currentItemState, state, prev) {
  const prevParams = Object.keys(prev).length > 0;
  const initialDate = get(state, 'config.initialDate');
  const compareIsActive = get(state, 'compare.active');
  if (!compareIsActive) return undefined;

  const initialDateString = util.toISOStringSeconds(initialDate);
  const appNowMinusSevenDays = util.dateAdd(initialDateString, 'day', -7);
  const appNowMinusSevenDaysString = util.toISOStringSeconds(appNowMinusSevenDays);
  // dateB 't1=' serialization
  const defaultDate = util.toISOStringSeconds(currentItemState) === appNowMinusSevenDaysString;
  return !prevParams && defaultDate
    ? undefined
    : serializeDate(currentItemState);
}

/**
 * Parse permalink date string and handle max dates if out of valid range or in future
 *
 * @method parsePermalinkDate
 * @param  {Object} date object (now or nowMinusSevenDays if B side for compare mode)
 * @param  {String} date string in querystring
 * @param  {String} layerParameters (A or B depending if compare mode is active)
 * @param  {Object} config object
 * @returns {Object} date object
 */
export function parsePermalinkDate(defaultDate, str, layerParameters, config) {
  let time = tryCatchDate(str, defaultDate);
  if (time instanceof Date) {
    const startDate = new Date(config.startDate);
    if (time < startDate) {
      time = startDate;
    } else if (time > defaultDate) {
      // get permalink layers
      const layersParsed = layersParse12(layerParameters, config);
      const layersDateRange = getDateRange({}, layersParsed);
      // determine max date "defaultDate" or use permalink layer futureTime
      if (layersDateRange && layersDateRange.end) {
        if (time > layersDateRange.end) {
          time = layersDateRange.end;
        }
      } else {
        time = defaultDate;
      }
    }
  }
  return time;
}

/**
 * Checks the date provided against the active layers.
 *
 * @method getMaxActiveLayersDate
 * @param  {Object} state
 * @returns {Object} date object
 */
export function getMaxActiveLayersDate(state) {
  const {
    date, proj,
  } = state;

  const { appNow } = date;
  const activeLayers = getActiveLayers(state);
  const projection = proj.id;
  const activeLayersFiltered = filterProjLayersWithStartDate(activeLayers, projection);
  const layersDateRange = getDateRange({}, activeLayersFiltered);

  let maxDate;
  if (layersDateRange && layersDateRange.end > appNow) {
    maxDate = layersDateRange.end;
  } else {
    maxDate = appNow;
  }

  return maxDate;
}

/**
 * Checks if future time layer is within included layers
 *
 * @method checkHasFutureLayers
 * @param  {Object} state
 * @returns {Boolean} hasFutureLayers
 */
export function checkHasFutureLayers(state) {
  const { compare, proj, layers } = state;
  let hasFutureLayers;
  if (compare.active) {
    const compareALayersFiltered = filterProjLayersWithStartDate(layers.active.layers, proj.id);
    const compareBLayersFiltered = filterProjLayersWithStartDate(layers.activeB.layers, proj.id);
    hasFutureLayers = [...compareALayersFiltered, ...compareBLayersFiltered].filter((layer) => layer.futureTime).length > 0;
  } else {
    const activeLayers = getActiveLayers(state);
    const activeLayersFiltered = filterProjLayersWithStartDate(activeLayers, proj.id);
    hasFutureLayers = activeLayersFiltered.filter((layer) => layer.futureTime).length > 0;
  }
  return hasFutureLayers;
}

/**
 * Checks the date provided against the active layers.
 *
 * @method getLayersActiveAtDate
 * @param  {Array} layers
 * @param  {Object} appNow date object
 * @returns {Array} Array of max layer end dates
 */
export function getMaxLayerEndDates(layers, appNow) {
  return layers.reduce((layerEndDates, { endDate }) => {
    const layerEndDate = new Date(endDate || appNow);
    return layerEndDates.concat(layerEndDate);
  }, []);
}

/**
 * Checks the date provided against the active layers.
 *
 * @method getLayersActiveAtDate
 * @param  {Array} layers
 * @param  {object} date Date of data to be displayed on the map.
 * @returns {array} Array of visible layers within the date.
 */
export function getLayersActiveAtDate(layers, date) {
  const arra = [];
  lodashEach(layers, (layer) => {
    if (layer.visible && layer.startDate && new Date(layer.startDate > date)) {
      arra.push(layer);
    }
  });
  return arra;
}

/**
 *
 * @param {*} parameters
 * @param {*} stateFromLocation
 * @param {*} state
 * @param {*} config
 */
export function mapLocationToDateState(
  parameters,
  stateFromLocation,
  state,
  config,
) {
  const appNow = get(state, 'date.appNow');
  // legacy time permalink

  if (parameters.time && !parameters.t && appNow) {
    const date = tryCatchDate(parameters.time, appNow);
    if (date && date !== appNow) {
      stateFromLocation = update(stateFromLocation, {
        date: {
          selected: { $set: date },
        },
      });
    }
  }
  return stateFromLocation;
}
