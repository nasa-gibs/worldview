import React from 'react';
import { each as lodashEach, get } from 'lodash';
import update from 'immutability-helper';
import moment from 'moment';
import util from '../../util/util';
import { layersParse12 } from '../layers/util';
import {
  dateRange as getDateRange, getActiveLayers,
} from '../layers/selectors';
import { getSelectedDate, getDeltaIntervalUnit } from './selectors';
import MonospaceDate from '../../components/util/monospace-date';

export const filterProjLayersWithStartDate = (layers, projId) => layers.filter((layer) => layer.startDate && layer.projections[projId]);

/**
   * Parses a UTC ISO 8601 date to a non UTC date
   *
   * @method parseDate
   * @static
   * @param str {string} Date to parse in the form of YYYY-MM-DDTHH:MM:SSZ`.
   * @return {Date} converted string as a non UTC date object, throws an exception if
   * the string is invalid
   */
export const parseDate = (dateAsString) => {
  const dateTimeArr = dateAsString.split(/T/);

  const yyyymmdd = dateTimeArr[0].split(/[\s-]+/);

  // Parse elements of date and time
  const year = yyyymmdd[0];
  const month = yyyymmdd[1] - 1;
  const day = yyyymmdd[2];

  let hour = 0;
  let minute = 0;
  let second = 0;
  let millisecond = 0;

  // Use default of midnight if time is not specified
  if (dateTimeArr.length > 1) {
    const hhmmss = dateTimeArr[1].split(/[:.Z]/);
    hour = hhmmss[0] || 0;
    minute = hhmmss[1] || 0;
    second = hhmmss[2] || 0;
    millisecond = hhmmss[3] || 0;
  }
  const date = new Date(year, month, day, hour, minute, second, millisecond);
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateAsString}`);
  }
  return date;
};

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

/**
 * @param  {Number} delta Date and direction to change
 * @param  {Number} increment Zoom level of change
 *                  e.g. months, minutes, years, days
 * @param  {Object} prevDate JS Date Object
 * @param  {Object} minDate timelineStartDateLimit JS Date Object
 * @param  {Object} maxDate timelineEndDateLimit JS Date Object
 * @return {Object} JS Date Object
 */
export const getNextTimeSelection = (delta, increment, prevDate, minDate, maxDate) => {
  let date;
  // eslint-disable-next-line default-case
  switch (increment) {
    case 'year':
      date = new Date(
        new Date(prevDate).setUTCFullYear(prevDate.getUTCFullYear() + delta),
      );
      break;
    case 'month':
      date = new Date(
        new Date(prevDate).setUTCMonth(prevDate.getUTCMonth() + delta),
      );
      break;
    case 'day':
      date = new Date(
        new Date(prevDate).setUTCDate(prevDate.getUTCDate() + delta),
      );
      break;
    case 'hour':
      date = new Date(
        new Date(prevDate).setUTCHours(prevDate.getUTCHours() + delta),
      );
      break;
    case 'minute':
      date = new Date(
        new Date(prevDate).setUTCMinutes(prevDate.getUTCMinutes() + delta),
      );
      break;
  }
  if (date < minDate) {
    return minDate;
  } if (date > maxDate) {
    return maxDate;
  }
  return date;
};

export function getNumberStepsBetween(state, start, end) {
  const { delta, unit } = getDeltaIntervalUnit(state);
  const a = moment(start);
  const b = moment(end);
  const diff = a.diff(b, unit);
  return diff / delta;
}

/**
 * Get the next date when using left/right arrows based on
 * current interval and delta
 */
export const getNextDateTime = (state, direction, date) => {
  const { delta, unit } = getDeltaIntervalUnit(state);
  const useDate = date || getSelectedDate(state);
  return getNextTimeSelection(delta * direction, unit, useDate);
};

/**
 * Determine if the date change was not in sync with the current
 * interval/delta step (e.g. a time unit was manually changed: 2003 -> 2004)
 */
export const outOfStepChange = (state, newDate) => {
  const date = newDate.toISOString();
  const previousSelectedDate = getSelectedDate(state);
  const nextStepDate = getNextDateTime(state, 1, previousSelectedDate).toISOString();
  const prevStepDate = getNextDateTime(state, -1, previousSelectedDate).toISOString();
  return date !== nextStepDate && date !== prevStepDate;
};

export const coverageDateFormatter = (dateType, date, period) => {
  if (!date) return;
  let dateString;
  const parsedDate = new Date(date);
  switch (period) {
    case 'subdaily':
      dateString = formatDisplayDate(parsedDate, true);
      break;

    case 'yearly':
      if (dateType === 'END-DATE') parsedDate.setFullYear(parsedDate.getFullYear());
      dateString = moment.utc(parsedDate).format('YYYY');
      break;

    case 'monthly':
      if (dateType === 'END-DATE') parsedDate.setMonth(parsedDate.getMonth());
      dateString = moment.utc(parsedDate).format('YYYY MMM').toUpperCase();
      break;

    default:
      dateString = formatDisplayDate(parsedDate);
      break;
  }
  return (<MonospaceDate date={dateString} />);
};

export const formatDisplayDate = (date, subdaily) => {
  if (!date) return;
  const format = subdaily ? 'YYYY MMM DD HH:mm' : 'YYYY MMM DD';
  const dateString = moment.utc(date).format(format);
  return `${dateString.toUpperCase()}${subdaily ? 'Z' : ''}`;
};

export const formatISODate = (date) => moment(date).format('YYYY-MM-DD');

const getMinDate = function() {
  return new Date(Date.UTC(1000, 0, 1, 0, 0));
};

const getMaxDate = function() {
  return new Date(Date.UTC(3000, 11, 30, 23, 59));
};

export const roll = function(val, min, max) {
  if (val < min) {
    return max - (min - val) + 1;
  }
  if (val > max) {
    return min + (val - max) - 1;
  }
  return val;
};

export const getDaysInMonth = function(d) {
  let year;
  let month;
  if (d.getUTCFullYear) {
    year = d.getUTCFullYear();
    month = d.getUTCMonth();
  } else {
    year = d.year;
    month = d.month;
  }
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  return lastDay.getUTCDate();
};

const rollRange = function(date, interval, minDate, maxDate) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  let first;
  let last;
  switch (interval) {
    case 'minute': {
      const firstMinute = new Date(Date.UTC(year, month, 1, 0, 0));
      const lastMinute = new Date(Date.UTC(year, month, getDaysInMonth(date), 23, 59));
      first = new Date(Math.max(firstMinute, minDate))
        .getUTCMinutes();
      last = new Date(Math.min(lastMinute, maxDate))
        .getUTCMinutes();
      break;
    }
    case 'hour': {
      const firstHour = new Date(Date.UTC(year, month, 1, 0));
      const lastHour = new Date(Date.UTC(year, month, getDaysInMonth(date), 23));
      first = new Date(Math.max(firstHour, minDate))
        .getUTCHours();
      last = new Date(Math.min(lastHour, maxDate))
        .getUTCHours();
      break;
    }
    case 'day': {
      const firstDay = new Date(Date.UTC(year, month, 1));
      const lastDay = new Date(Date.UTC(year, month, getDaysInMonth(date)));
      first = new Date(Math.max(firstDay, minDate))
        .getUTCDate();
      last = new Date(Math.min(lastDay, maxDate))
        .getUTCDate();
      break;
    }
    case 'month': {
      const firstMonth = new Date(Date.UTC(year, 0, 1));
      const lastMonth = new Date(Date.UTC(year, 11, 31));
      first = new Date(Math.max(firstMonth, minDate))
        .getUTCMonth();
      last = new Date(Math.min(lastMonth, maxDate))
        .getUTCMonth();
      break;
    }
    case 'year': {
      const firstYear = getMinDate();
      const lastYear = getMaxDate();
      first = new Date(Math.max(firstYear, minDate))
        .getUTCFullYear();
      last = new Date(Math.min(lastYear, maxDate))
        .getUTCFullYear();
      break;
    }
    default:
      break;
  }
  return {
    first,
    last,
  };
};

export const rollDate = function(date, interval, amount, minDate, maxDate) {
  const newMinDate = minDate || getMinDate();
  const newMaxDate = maxDate || getMaxDate();
  const range = rollRange(date, interval, newMinDate, newMaxDate);
  const min = range.first;
  const max = range.last;
  const second = date.getUTCSeconds();
  let minute = date.getUTCMinutes();
  let hour = date.getUTCHours();
  let day = date.getUTCDate();
  let month = date.getUTCMonth();
  let year = date.getUTCFullYear();
  switch (interval) {
    // TODO: change minute and hour hard-coded min & max to be dynamic
    case 'minute':
      minute = roll(minute + amount, 0, 59);
      break;
    case 'hour':
      hour = roll(hour + amount, 0, 23);
      break;
    case 'day':
      day = roll(day + amount, min, max);
      break;
    case 'month':
      month = roll(month + amount, min, max);
      break;
    case 'year':
      year = roll(year + amount, min, max);
      break;
    default:
      throw new Error(`[rollDate] Invalid interval: ${interval}`);
  }
  const daysInMonth = getDaysInMonth({
    year,
    month,
  });
  if (day > daysInMonth) {
    day = daysInMonth;
  }
  let newDate = new Date(Date.UTC(year, month, day, hour, minute, second));
  newDate = new Date(util.clamp(newDate, newMinDate, newMaxDate));
  return newDate;
};
