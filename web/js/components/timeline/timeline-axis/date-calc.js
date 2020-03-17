
import moment from 'moment';
import { timeScaleOptions } from '../../../modules/date/constants';
import { getIsBetween, getISODateFormatted } from '../date-util';

// cache repeated startDateLimit/endDateLimit moment object construction
const limitCache = {};

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
  const timeRange = [];
  const { format } = timeScaleOptions[timeScale].timeAxis;

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

  // build date/time array based on given start/end range
  while (startDate <= endDate) {
    const date = startDate.format(format);
    const rawDate = getISODateFormatted(startDate);
    const nextDate = startDate.clone().add(1, timeScale);
    const rawNextDate = getISODateFormatted(nextDate);
    const withinRange = getIsBetween(startDate, startLimit, endLimit);

    const timeObject = {
      dateObject: startDate.toObject(),
      date: date.toUpperCase(),
      dayOfWeek: startDate.day(),
      rawDate,
      rawNextDate,
      timeScale,
      withinRange,
    };
    timeRange.push(timeObject);
    startDate = nextDate;
  }

  return timeRange;
}
