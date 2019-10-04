import util from '../../util/util';
import { each as lodashEach, get } from 'lodash';
import update from 'immutability-helper';
import { timeScaleFromNumberKey, timeScaleToNumberKey } from './constants';

export function serializeDate(date) {
  return (
    date.toISOString().split('T')[0] +
    '-' +
    'T' +
    date
      .toISOString()
      .split('T')[1]
      .slice(0, -5) +
    'Z'
  );
}

export function getActiveTime(state) {
  const { compare, date } = state;
  const activeStr = compare.isCompareA ? 'selected' : 'selectedB';
  return date[activeStr];
}

export function tryCatchDate(str, initialState) {
  try {
    return util.parseDateUTC(str);
  } catch (error) {
    console.warn('Invalid date: ' + str);
    return initialState;
  }
}

/**
 * Checks the date provided against the active layers.
 *
 * @method getLayersActiveAtDate
 * @param  {Array} layers
 * @param  {object} date Date of data to be displayed on the map.
 * @return {array}       An array of visible layers within the date.
 */
export function getLayersActiveAtDate(layers, date) {
  var arra = [];
  lodashEach(layers, function(layer) {
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
  config
) {
  const appNow = get(state, 'date.appNow');
  const interval = get(stateFromLocation, 'date.interval') || get(state, 'date.interval');
  const selectedZoom = get(stateFromLocation, 'date.selectedZoom') || get(state, 'date.selectedZoom');
  const isCustom = get(stateFromLocation, 'date.customSelected') || get(state, 'date.customSelected');
  const timeScaleChangeUnit = timeScaleFromNumberKey[interval];
  const timeScale = timeScaleFromNumberKey[selectedZoom.toString()];
  // legacy time permalink

  if (parameters.time && !parameters.t && appNow) {
    const date = tryCatchDate(parameters.time, appNow);
    if (date && date !== appNow) {
      stateFromLocation = update(stateFromLocation, {
        date: {
          selected: { $set: date }
        }
      });
    }
  }
  // update interval selectedzoom level as default interval
  if (timeScale !== timeScaleChangeUnit && !isCustom) {
    const defaultValues = {
      interval,
      delta: 1,
      customSelected: false
    };
    stateFromLocation = update(stateFromLocation, {
      date: {
        $merge: defaultValues
      }
    });
  }
  return stateFromLocation;
}
