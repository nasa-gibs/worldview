
import moment from 'moment';
import { timeScaleOptions } from '../../../modules/date/constants';
import { getIsBetween, getISODateFormatted } from '../date-util';

// cache repeated startDateLimit/endDateLimit moment object construction
let limitCache = {};

/**
 * get range of consecutive time units based on start/end dates and timescale
 *
 * @param {Object} startDate - moment date object - start of requested time range
 * @param {Object} endDate - moment date object - end of requested time range
 * @param {String} timeScale - timescale of time units (ex: 'day', 'month', etc.)
 * @param {startDateLimit} startDateLimit - min date within timeline range
 * @param {endDateLimit} endDateLimit - max date within timeline range
 * @returns {Array} timeRange - consecutive time units based on range
 */
export function getTimeRange(startDate, endDate, timeScale, startDateLimit, endDateLimit) {
  let timeRange = [];
  let { format } = timeScaleOptions[timeScale].timeAxis;

  // min/max start/end limits
  let startLimit;
  let endLimit;
  if (!limitCache[startDateLimit]) {
    startLimit = moment.utc(startDateLimit);
    limitCache[startDateLimit] = startLimit;
  } else {
    startLimit = limitCache[startDateLimit];
  }
  if (!limitCache[endDateLimit]) {
    endLimit = moment.utc(endDateLimit);
    limitCache[endDateLimit] = endLimit;
  } else {
    endLimit = limitCache[endDateLimit];
  }

  while (startDate <= endDate) {
    let date = startDate.format(format);
    let rawDate = getISODateFormatted(startDate);
    let nextDate = startDate.clone().add(1, timeScale);
    let rawNextDate = getISODateFormatted(nextDate);
    let withinRange = getIsBetween(startDate, startLimit, endLimit);

    let timeObject = {
      dateObject: startDate.toObject(),
      date: date.toUpperCase(),
      dayOfWeek: startDate.day(),
      rawDate: rawDate,
      rawNextDate: rawNextDate,
      timeScale: timeScale,
      withinRange: withinRange
    };
    timeRange.push(timeObject);
    startDate = nextDate;
  }

  return timeRange;
};
