import util from '../../util/util';

/**
 * Helper to reduce granules object to array of date strings
 *
 * @method getDateArrayFromObject
 * @static
 * @param {object} granulesObject
 * @returns {array} array of granule date strings
 */
export const getDateArrayFromObject = (granulesObject) => granulesObject.reduce((dates, granuleObject) => {
  const { date } = granuleObject;
  dates.push(date);
  return dates;
}, []);

/**
 * Helper to find index for date string to add to sorted array of date strings
 *
 * @method getIndexForSortedInsert
 * @static
 * @param {object} array - array of dates (already sorted)
 * @param {string} date - date string ISO format
 * @returns {number} index
 */
export const getIndexForSortedInsert = (array, date) => {
  const newDate = new Date(date);
  const len = array.length;
  if (new Date(array[0]) > newDate) {
    return 0;
  }
  let i = 1;
  while (i < len && !(new Date(array[i]) > newDate && new Date(array[i - 1]) <= newDate)) {
    i += 1;
  }
  return i;
};

/**
 * Helper to check date is within known start/end range (if given, else false)
 *
 * @method isWithinDateRange
 * @static
 * @param {object} date - date object
 * @param {object} startDate - date object
 * @param {string} endDate - date object
 * @returns {boolean}
 */
export const isWithinDateRange = (date, startDate, endDate) => (startDate && endDate
  ? date.getTime() <= new Date(endDate).getTime() && date.getTime() >= new Date(startDate).getTime()
  : false);

/**
 * Get CMR query dates for building query string and child processes
 *
 * @method getCMRQueryDates
 * @static
 * @param {object} selectedDate - date object
 * @returns {object}
    * @param {object} startQueryDate - date object
    * @param {object} endQueryDate - date object
  */
export const getCMRQueryDates = (selectedDate) => {
  // check if selectedDate is before or after 12 to determine date request range
  const date = new Date(selectedDate);
  const isDateAfterNoon = date.getUTCHours() > 12;

  const zeroedDate = util.clearTimeUTC(date);

  const dayBeforeDate = util.dateAdd(zeroedDate, 'day', -1);
  const dayAfterDate = util.dateAdd(zeroedDate, 'day', 1);
  const twoDayAfterDate = util.dateAdd(zeroedDate, 'day', 2);

  const startQueryDate = isDateAfterNoon
    ? zeroedDate
    : dayBeforeDate;
  let endQueryDate = isDateAfterNoon
    ? twoDayAfterDate
    : dayAfterDate;

  // set current date if on leading edge of time coverage
  endQueryDate = endQueryDate > new Date()
    ? new Date()
    : endQueryDate;

  return {
    startQueryDate,
    endQueryDate,
  };
};
