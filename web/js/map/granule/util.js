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

  const dayBeforeDate = util.dateAdd(zeroedDate, 'day', -6);
  const dayAfterDate = util.dateAdd(zeroedDate, 'day', 1);
  const twoDayAfterDate = util.dateAdd(zeroedDate, 'day', 2);

  const startQueryDate = dayBeforeDate;
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

/**
 * Get CMR query date update options to determine if selected date is within existing date range
 * and/or if that range can be extended vs updating
 *
 * @method getCMRQueryDateUpdateOptions
 * @static
 * @param {object} CMRDateStoreForLayer - cmr date store object with ranges
 * @param {object} date - date object
 * @param {object} startQueryDate - date object
 * @param {object} endQueryDate - date object
 * @returns {object}
    * @param {boolean} canExtendRange
    * @param {boolean} needRangeUpdate
    * @param {object} rangeStart - date object
    * @param {object} rangeEnd - date object
  */
export const getCMRQueryDateUpdateOptions = (CMRDateStoreForLayer, date, startQueryDate, endQueryDate) => {
  let canExtendRange = false;
  let needRangeUpdate = true;
  let rangeStart;
  let rangeEnd;

  if (!CMRDateStoreForLayer) {
    return {
      canExtendRange,
      needRangeUpdate,
    };
  }

  // need to determine start and end
  const dateTime = date.getTime();
  const newStartTime = startQueryDate.getTime();
  const newEndTime = endQueryDate.getTime();

  const currentStartTime = CMRDateStoreForLayer.startDate.getTime();
  const currentEndTime = CMRDateStoreForLayer.endDate.getTime();

  // boolean comparison checks for date relativity
  const newStartBeforeCurrentCMRStart = newStartTime < currentStartTime;
  const newStartSameOrBeforeCurrentCMREnd = newStartTime < currentEndTime;

  const newStartAfterCurrentCMRStart = newStartTime > currentStartTime;
  const newEndSameOrAfterCurentCMRStart = newEndTime >= currentStartTime;

  const newStartSameOrAfterCurrentStart = newStartTime >= currentStartTime;
  const newEndSameOrBeforeCurrentEnd = newEndTime <= currentEndTime;

  const newStartEqualsCurrentCMREnd = newStartTime === currentEndTime;
  const newEndEqualsCurrentCMRStart = newEndTime === currentStartTime;

  const newEndCanExtendCurrentCMREnd = newStartBeforeCurrentCMRStart && newEndSameOrAfterCurentCMRStart;
  const newStartCanExtendCurrentCMRStart = newStartAfterCurrentCMRStart && newStartSameOrBeforeCurrentCMREnd;

  if (newStartSameOrAfterCurrentStart && newEndSameOrBeforeCurrentEnd) {
    needRangeUpdate = false;
  }

  // add 1 day to start time to allow cushion for filtered out DAY/NIGHT flags on granules
  const currentStartTimePlusOne = util.dateAdd(new Date(currentStartTime), 'day', 1);
  const currentStartTimePlusOneTime = currentStartTimePlusOne.getTime();

  const dateSameOrAfterCurrentCMRStartPlusOne = dateTime >= currentStartTimePlusOneTime;
  const dateSameOrBeforeCurrentCMREnd = dateTime <= currentEndTime;

  if (dateSameOrAfterCurrentCMRStartPlusOne && dateSameOrBeforeCurrentCMREnd) {
    needRangeUpdate = false;
  } else {
    // ex: current      [4][5][6][7][8]
    //     new [1][2][3][4][5]
    // ex: current            [6][7][8][9][10]
    //     new [1][2][3][4][5]
    if (newEndEqualsCurrentCMRStart || newEndCanExtendCurrentCMREnd) {
      rangeStart = newStartTime;
      rangeEnd = currentEndTime;
      canExtendRange = true;
    }
    // ex: current [1][2][3][4][5]
    //     new              [4][5][6][7][8]
    // ex: current [1][2][3][4][5]
    //     new                    [6][7][8][9][10]
    if (newStartEqualsCurrentCMREnd || newStartCanExtendCurrentCMRStart) {
      rangeStart = currentStartTime;
      rangeEnd = newEndTime;
      canExtendRange = true;
    }
  }

  return {
    canExtendRange,
    needRangeUpdate,
    rangeStart,
    rangeEnd,
  };
};
