import { each as lodashEach, get } from 'lodash';
import update from 'immutability-helper';
import util from '../../util/util';
import { layersParse12 } from '../layers/util';
import {
  dateRange as getDateRange,
  getFutureLayerEndDate,
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
 * Parse permalink date string and handle max dates if out of valid range or in future
 *
 * @method parsePermalinkDate
 * @param  {String} date string (now or nowMinusSevenDays if B side for compare mode)
 * @param  {String} date string in querystring
 * @param  {String} layerParameters (A or B depending if compare mode is active)
 * @param  {Object} config object
 * @returns {Object} date object
 */
export function parsePermalinkDate(defaultStr, str, layerParameters, config) {
  let time = tryCatchDate(str, defaultStr);
  if (time instanceof Date) {
    const startDate = new Date(config.startDate);
    if (time < startDate) {
      time = startDate;
    } else if (time > defaultStr) {
      // get permalink layers
      const layersParsed = layersParse12(layerParameters, config);
      // check for futureLayers layer option
      const layersDateRange = getDateRange({}, layersParsed);
      // determine max date "defaultStr" or use permalink layer futureTime
      if (layersDateRange && layersDateRange.end) {
        if (time > layersDateRange.end) {
          time = layersDateRange.end;
        }
      } else {
        time = defaultStr;
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
    date, layers, compare, proj,
  } = state;

  const { appNow } = date;
  const activeLayers = layers[compare.activeString];
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
 * Checks the date provided against the active layers.
 *
 * @method getLayersActiveAtDate
 * @param  {Array} layers
 * @param  {Object} appNow date object
 * @returns {Array} Array of max layer end dates
 */
export function getMaxLayerEndDates(layers, appNow) {
  return layers.reduce((layerEndDates, layer) => {
    let layerEndDate = layer.endDate;
    if (layer.futureTime) {
      layerEndDate = getFutureLayerEndDate(layer);
    } else {
      layerEndDate = new Date(appNow);
    }
    return layerEndDate ? layerEndDates.concat(layerEndDate) : layerEndDates;
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
