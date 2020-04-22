import {
  get as lodashGet,
  cloneDeep as lodashCloneDeep,
  eachRight as lodashEachRight,
  isUndefined as lodashIsUndefined,
  remove as lodashRemove,
  findIndex as lodashFindIndex,
  each as lodashEach,
  isNaN as lodashIsNaN,
  startCase as lodashStartCase,
  isArray,
} from 'lodash';

import update from 'immutability-helper';
import { addLayer, resetLayers } from './selectors';
import { getPaletteAttributeArray } from '../palettes/util';
import { getVectorStyleAttributeArray } from '../vector-styles/util';
import util from '../../util/util';

/**
  *
  * @param {*} def - layer definition
  * @param {*} date - current selected app date
  * @returns {Boolean} - True if layer is available at date, otherwise false
  */
export function availableAtDate(def, date) {
  // Some vector layers
  if (!def.startDate && !def.dateRanges) {
    return true;
  }
  // set inactive in config
  if (def.endDate && def.inactive) {
    return date < new Date(def.endDate) && date > new Date(def.startDate);
  }
  // no endDate may indicate ongoing
  if (def.startDate && !def.endDate) {
    if (!def.dateRanges) {
      return date > new Date(def.startDate);
    }
    // if only one date range, substitute def.endDate with def.dateRanges[0].endDate
    if (def.dateRanges.length === 1) {
      const rangeEndDate = def.dateRanges[0].endDate;
      return date > new Date(def.startDate) && rangeEndDate && date < new Date(rangeEndDate);
    }
  }
  // need to traverse available layer date range
  const availableDates = datesinDateRanges(def, date);
  if (!availableDates.length && !def.endDate && !def.inactive) {
    return date > new Date(def.startDate);
  }
  return availableDates.length > 0;
}

export function getOrbitTrackTitle(def) {
  if (def.daynight && def.track) {
    return `${lodashStartCase(def.track)}/${lodashStartCase(def.daynight)}`;
  } if (def.track) {
    return lodashStartCase(def.track);
  } if (def.daynight) {
    return lodashStartCase(def.daynight);
  }
}

/**
   * For subdaily layers, round the time down to nearest interval.
   * NOTE: Assumes intervals are the same for all ranges!
   * @param {object} def
   * @param {date} date
   * @return {date}
   */
export function nearestInterval(def, date) {
  const dateInterval = lodashGet(def, 'dateRanges[0].dateInterval');
  const interval = Number(dateInterval);
  const remainder = date.getMinutes() % interval;
  const newMinutes = date.getMinutes() - remainder;
  const newDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    newMinutes,
  );
  return newDate;
}

/**
   * Find the closest previous date from an array of dates
   *
   * @param  {object} def       A layer definition
   * @param  {object} date      A date to compare against the array of dates
   * @param  {array} dateArray  An array of dates
   * @return {object}           The date object with normalized timeszone.
   */
export function prevDateInDateRange(def, date, dateArray) {
  const closestAvailableDates = [];
  const currentDateValue = date.getTime();
  const currentDate = new Date(currentDateValue);
  const currentDateOffsetCheck = new Date(currentDateValue + (currentDate.getTimezoneOffset() * 60000));

  const isFirstDayOfMonth = currentDateOffsetCheck.getDate() === 1;
  const isFirstDayOfYear = currentDateOffsetCheck.getMonth() === 0;

  const isMonthPeriod = def.period === 'monthly';
  const isYearPeriod = def.period === 'yearly';

  if (!dateArray
    || (isMonthPeriod && isFirstDayOfMonth)
    || (isYearPeriod && isFirstDayOfMonth && isFirstDayOfYear)) {
    return date;
  }

  // populate closestAvailableDates if rangeDate is before or equal to input date
  lodashEach(dateArray, (rangeDate) => {
    const rangeDateValue = rangeDate.getTime();
    const isRangeDateBefore = rangeDateValue < currentDateValue;
    const isRangeDateEqual = rangeDateValue === currentDateValue;

    if (isRangeDateBefore || isRangeDateEqual) {
      closestAvailableDates.push(rangeDate);
    }
  });

  // use closest date index to find closest date in filtered closestAvailableDates
  const closestDateIndex = util.closestToIndex(closestAvailableDates, currentDateValue);
  const closestDate = closestAvailableDates[closestDateIndex];

  // check for potential next date in function passed dateArray
  const next = dateArray[closestDateIndex + 1] || null;
  const previous = closestDate ? new Date(closestDate.getTime()) : date;
  return { previous, next };
}

/**
 * Return revised maxEndDate based on given start/end date limits
 *
 * @method getRevisedMaxEndDate
 * @param  {Object} maxEndDate     A date object
 * @param  {Number} startDateLimitTime Time value start date of timeline range for available data
 * @param  {Number} endDateLimitTime   Time value end date of timeline range for available data
 * @param  {Object} endDateLimit   A date object used as end date of timeline range for available data
 * @param  {Object} minDate        A date object
 * @return {Object}                A date object
 */
const getRevisedMaxEndDate = (maxEndDate, startDateLimitTime, endDateLimitTime, endDateLimit, minDate) => {
  const minDateTime = minDate.getTime();
  const maxEndDateTime = maxEndDate.getTime();
  const frontDateWithinRange = startDateLimitTime >= minDateTime && startDateLimitTime <= maxEndDateTime;
  const backDateWithinRange = endDateLimitTime <= maxEndDateTime && endDateLimitTime >= minDateTime;
  if (frontDateWithinRange || backDateWithinRange) {
    return endDateLimit;
  }
  return maxEndDate;
};

/**
 * Prevent earlier dates from being added after later dates while building dateArray
 *
 * @method getDateArrayLastDateInOrder
 * @param  {Object} timeUnit  A date object
 * @param  {Array} dateArray  An array of date objects
 * @return {Array} newDateArray  An array of date objects
 */
const getDateArrayLastDateInOrder = (timeUnit, dateArray) => {
  const newDateArray = [...dateArray];
  const arrLastIndex = newDateArray.length - 1;
  if (timeUnit < newDateArray[arrLastIndex]) {
    let endDateFound = false;
    for (let j = arrLastIndex; j >= 0; j -= 1) {
      if (!endDateFound) {
        const dateCheck = newDateArray[j];
        const timeUnitTime = timeUnit.getTime();
        const dateCheckTime = dateCheck.getTime();

        if (timeUnitTime <= dateCheckTime) {
          newDateArray.pop();
        } else {
          newDateArray.push(timeUnit);
          endDateFound = true;
        }
      }
    }
  }
  return newDateArray;
};

/**
 * Get min start date for partial date range coverage
 *
 * @method getMinStartDate
 * @param  {Number} timeDiff time difference based on intervals and unit
 * @param  {String} period
 * @param  {Number} dateInterval
 * @param  {Object} startDateLimit A date object
 * @param  {Number} minYear
 * @param  {Number} minMonth
 * @param  {Number} minDay
 * @return {Object} minStartDate A date object
 */
const getMinStartDate = (timeDiff, period, dateInterval, startDateLimit, minYear, minMonth, minDay) => {
  let minStartDate;
  let prevDate = '';
  for (let i = 0; i <= (timeDiff + 1); i += 1) {
    if (!minStartDate) {
      let timeUnit;
      if (period === 'monthly') {
        timeUnit = new Date(minYear, minMonth + i * dateInterval, minDay);
      } else if (period === 'daily') {
        timeUnit = new Date(minYear, minMonth, minDay + i * dateInterval);
      }
      timeUnit = new Date(timeUnit.getTime() - (timeUnit.getTimezoneOffset() * 60000));

      if (timeUnit > startDateLimit || timeUnit.getTime() === startDateLimit.getTime()) {
        minStartDate = prevDate;
      } else {
        prevDate = timeUnit;
      }
    }
  }
  return minStartDate;
};

/**
   * Return an array of limited dates of previous, current, and next dates (if available)
   * Used on layers with a single date range and a date interval of 1
   *
   * @method getLimitedPreviousCurrentNextDateRange
   * @param  {Object} def            A layer object
   * @param  {Object} currentDate    A date object
   * @return {Array}                An array of dates - previous, current, and next dates (if available)
   */
const getLimitedPreviousCurrentNextDateRange = (def, currentDate) => {
  const { period, dateRanges } = def;
  const dateRange = dateRanges[0];
  const { startDate, endDate } = dateRange;

  const rangeStartDate = new Date(startDate);
  const rangeEndDate = new Date(endDate);
  const currentDateTime = currentDate.getTime();
  const breakMinDateTime = rangeStartDate.getTime();

  // build test max date to determine if date is within max date range
  const breakMaxYear = rangeEndDate.getUTCFullYear();
  const breakMaxMonth = rangeEndDate.getUTCMonth();
  const breakMaxDay = rangeEndDate.getUTCDate();
  let breakMaxDate;
  if (period === 'yearly') {
    breakMaxDate = new Date(breakMaxYear + 1, breakMaxMonth, breakMaxDay);
  }
  if (period === 'monthly') {
    breakMaxDate = new Date(breakMaxYear, breakMaxMonth + 1, breakMaxDay);
  }
  if (period === 'daily') {
    breakMaxDate = new Date(breakMaxYear, breakMaxMonth, breakMaxDay + 1);
  }
  const breakMaxDateTime = breakMaxDate.getTime();

  // get limitedDateRange of previous, current, and next dates (if available)
  const limitedDateRange = [];
  if (currentDateTime >= breakMinDateTime && currentDateTime <= breakMaxDateTime) {
    // get date building components
    const minCurrentYear = currentDate.getUTCFullYear();
    const minCurrentMonth = currentDate.getUTCMonth();
    const minCurrentDay = currentDate.getUTCDate();
    const minStartMonth = rangeStartDate.getUTCMonth();
    const minStartDay = rangeStartDate.getUTCDate();

    // period specific date addition/subtraction building
    let dayBeforeCurrent;
    let currentDateZeroed;
    let dayAfterCurrent;
    if (period === 'yearly') {
      dayBeforeCurrent = new Date(minCurrentYear - 1, minStartMonth, minStartDay);
      currentDateZeroed = new Date(minCurrentYear, minStartMonth, minStartDay);
      dayAfterCurrent = new Date(minCurrentYear + 1, minStartMonth, minStartDay);
    }
    if (period === 'monthly') {
      dayBeforeCurrent = new Date(minCurrentYear, minCurrentMonth - 1, minStartDay);
      currentDateZeroed = new Date(minCurrentYear, minCurrentMonth, minStartDay);
      dayAfterCurrent = new Date(minCurrentYear, minCurrentMonth + 1, minStartDay);
    }
    if (period === 'daily') {
      dayBeforeCurrent = new Date(minCurrentYear, minCurrentMonth, minCurrentDay - 1);
      currentDateZeroed = new Date(minCurrentYear, minCurrentMonth, minCurrentDay);
      dayAfterCurrent = new Date(minCurrentYear, minCurrentMonth, minCurrentDay + 1);
    }

    // handle previous date
    const dayBeforeCurrentTime = dayBeforeCurrent.getTime();
    if (dayBeforeCurrentTime >= breakMinDateTime) {
      const dayBeforeDate = new Date(dayBeforeCurrent.getTime() - (dayBeforeCurrent.getTimezoneOffset() * 60000));
      limitedDateRange.push(dayBeforeDate);
    }

    // handle current date
    const currentDateDate = new Date(currentDateZeroed.getTime() - (currentDateZeroed.getTimezoneOffset() * 60000));
    limitedDateRange.push(currentDateDate);

    // handle next date
    const dayAfterCurrentTime = dayAfterCurrent.getTime();
    if (dayAfterCurrentTime <= breakMaxDateTime) {
      const dayAfterDate = new Date(dayAfterCurrent.getTime() - (dayAfterCurrent.getTimezoneOffset() * 60000));
      limitedDateRange.push(dayAfterDate);
    }
  }
  return limitedDateRange;
};


/**
   * Return an array of dates based on the dateRange the current date falls in.
   *
   * @method datesinDateRangesDataPanel
   * @param  {Object} def            A layer object
   * @param  {Object} date           A date object
   * @param  {Object} startDateLimit A date object (optional) used as start date of timeline range for available data
   * @param  {Object} endDateLimit   A date object (optional) used as end date of timeline range for available data
   * @return {Array}                An array of dates with normalized timezones
   */
export function datesinDateRangesDataPanel(def, date, startDateLimit, endDateLimit) {
  const { dateRanges, period, inactive } = def;
  let dateArray = [];
  let currentDate = new Date(date);

  // runningMinDate used for overlapping ranges
  let runningMinDate;
  lodashEach(dateRanges, (dateRange, index) => {
    const { startDate, endDate, dateInterval } = dateRange;
    const dateIntervalNum = Number(dateInterval);
    let currentDateTime = currentDate.getTime();
    let yearDifference;
    let monthDifference;
    let dayDifference;
    let minuteDifference;
    const minDate = new Date(startDate);
    let maxDate = new Date(endDate);

    const minDateTime = minDate.getTime();
    const maxDateTime = maxDate.getTime();

    // handle single date coverage
    if (startDate === endDate) {
      const dateTime = new Date(minDateTime);
      dateArray.push(dateTime);
      return;
    }
    // revise currentDate to minDate to reduce earlier minDate than needed
    const startDateLimitTime = startDateLimit.getTime();
    const endDateLimitTime = endDateLimit.getTime();
    const minDateWithinRangeLimits = minDateTime > startDateLimitTime && minDateTime < endDateLimitTime;
    const runningMinDateAndLastDateEarlier = runningMinDate && dateArray[dateArray.length - 1] > minDate;
    if (currentDateTime < minDateTime && (minDateWithinRangeLimits || runningMinDateAndLastDateEarlier)) {
      currentDate = minDate;
      currentDateTime = currentDate.getTime();
    }

    // TODO : VERIFY runningMinDateAndLastDateEarlier
    // if (runningMinDate && dateArray[dateArray.length - 1] > minDate) {
    //   currentDate = minDate;
    // }

    // set maxDate to current date if layer coverage is ongoing
    if (index === dateRanges.length - 1 && !inactive) {
      maxDate = new Date();
    }

    const maxYear = maxDate.getUTCFullYear();
    const maxMonth = maxDate.getUTCMonth();
    const maxDay = maxDate.getUTCDate();
    const minYear = minDate.getUTCFullYear();
    const minMonth = minDate.getUTCMonth();
    const minDay = minDate.getUTCDate();

    let i;

    // Yearly layers
    if (period === 'yearly') {
      const maxYearDate = new Date(maxYear + dateIntervalNum, maxMonth, maxDay);
      const maxYearDateTime = maxYearDate.getTime();
      if (currentDateTime >= minDateTime && currentDateTime <= maxYearDateTime) {
        yearDifference = util.yearDiff(minDate, maxYearDate);
      }
      for (i = 0; i <= (yearDifference + 1); i += 1) {
        let year = new Date(minYear + i * dateIntervalNum, minMonth, minDay);
        if (year.getTime() < maxYearDateTime) {
          year = new Date(year.getTime() - (year.getTimezoneOffset() * 60000));
          dateArray.push(year);
        }
      }
      // Monthly layers
    } else if (period === 'monthly') {
      let maxMonthDate = new Date(maxYear, maxMonth + dateIntervalNum, maxDay);
      maxMonthDate = new Date(maxMonthDate.getTime() - (maxMonthDate.getTimezoneOffset() * 60000));

      // conditional revision of maxEndDate for data availability partial coverage
      const maxEndDate = getRevisedMaxEndDate(new Date(maxMonthDate), startDateLimitTime, endDateLimitTime, endDateLimit, minDate);
      const maxEndDateTime = maxEndDate.getTime();

      if (currentDateTime >= minDateTime && currentDateTime <= maxMonthDate) {
        monthDifference = util.monthDiff(minDate, maxMonthDate);
        // handle non-1 month intervals to prevent over pushing unused dates to dateArray
        monthDifference = Math.ceil(monthDifference / dateIntervalNum);
      }

      // get minStartDate for partial range coverage starting date
      const minStartMonthDate = monthDifference
        && getMinStartDate(monthDifference, period, dateIntervalNum, startDateLimit, minYear, minMonth, minDay);

      for (i = 0; i <= (monthDifference + 1); i += 1) {
        let month = new Date(minYear, minMonth + i * dateIntervalNum, minDay);
        month = new Date(month.getTime() - (month.getTimezoneOffset() * 60000));
        const monthTime = month.getTime();
        if (monthTime < maxEndDateTime) {
          if (dateArray.length > 0) {
            dateArray = getDateArrayLastDateInOrder(month, dateArray);
          }

          if (minStartMonthDate) {
            const minStartMonthDateTime = minStartMonthDate.getTime();
            const monthWithinRange = month > minStartMonthDate && month < maxMonthDate;
            if (monthTime === minStartMonthDateTime || monthWithinRange) {
              dateArray.push(month);
            }
          } else {
            dateArray.push(month);
          }
        }
      }
      // Daily layers
    } else if (period === 'daily') {
      const maxDayDate = new Date(maxYear, maxMonth, maxDay + dateIntervalNum);

      // conditional revision of maxEndDate for data availability partial coverage
      const maxEndDate = getRevisedMaxEndDate(new Date(maxDayDate), startDateLimitTime, endDateLimitTime, endDateLimit, minDate);
      const maxEndDateTime = maxEndDate.getTime();

      if (currentDateTime >= minDateTime && currentDateTime <= maxEndDateTime) {
        dayDifference = util.dayDiff(minDate, maxEndDate);
        // handle non-1 day intervals to prevent over pushing unused dates to dateArray
        dayDifference = Math.ceil(dayDifference / dateIntervalNum);
      }

      // get minStartDate for partial range coverage starting date
      const minStartDayDate = dayDifference
        && getMinStartDate(dayDifference, period, dateIntervalNum, startDateLimit, minYear, minMonth, minDay);

      for (i = 0; i <= (dayDifference + 1); i += 1) {
        let day = new Date(minYear, minMonth, minDay + i * dateIntervalNum);
        day = new Date(day.getTime() - (day.getTimezoneOffset() * 60000));
        const dayTime = day.getTime();
        if (dayTime < maxEndDateTime) {
          if (dateArray.length > 0) {
            dateArray = getDateArrayLastDateInOrder(day, dateArray);
          }

          if (minStartDayDate) {
            const minStartDayDateTime = minStartDayDate.getTime();
            const dayWithinRange = day > minStartDayDate && day < maxDayDate;
            if (dayTime === minStartDayDateTime || dayWithinRange) {
              dateArray.push(day);
            }
          } else {
            dateArray.push(day);
          }
        }
      }
      // Subdaily layers
    } else if (period === 'subdaily') {
      const maxHours = maxDate.getUTCHours();
      const maxMinutes = maxDate.getUTCMinutes();
      const minHours = minDate.getUTCHours();
      const minMinutes = minDate.getUTCMinutes();
      let maxMinuteDate = new Date(maxYear, maxMonth, maxDay, maxHours, maxMinutes + dateIntervalNum);
      const minMinuteDateMinusInterval = new Date(minYear, minMonth, minDay, minHours, minMinutes - dateIntervalNum);
      const minMinuteDateMinusIntervalOffset = new Date(minMinuteDateMinusInterval.getTime() - (minMinuteDateMinusInterval.getTimezoneOffset() * 60000));

      const startDateLimitOffset = startDateLimit.getTimezoneOffset() * 60000;
      const endDateLimitOffset = endDateLimit.getTimezoneOffset() * 60000;
      const startDateLimitSetMinutes = new Date(startDateLimit).setMinutes(minMinutes);
      const endDateLimitSetMinutes = new Date(endDateLimit).setMinutes(minMinutes);

      const hourBeforeStartDateLimit = new Date(startDateLimitSetMinutes - startDateLimitOffset - (60 * 60000));
      const hourAfterEndDateLimit = new Date(endDateLimitSetMinutes - endDateLimitOffset + (60 * 60000));

      // eslint-disable-next-line no-nested-ternary
      const minMinuteDate = hourBeforeStartDateLimit < minDate
        ? hourBeforeStartDateLimit
        : hourBeforeStartDateLimit > minMinuteDateMinusIntervalOffset
          ? hourBeforeStartDateLimit
          : minDate;
      maxMinuteDate = hourAfterEndDateLimit > maxMinuteDate
        ? maxMinuteDate
        : hourAfterEndDateLimit;

      const minMinuteDateTime = minMinuteDate.getTime();
      const maxMinuteDateTime = maxMinuteDate.getTime();
      const minCurrentDate = new Date(currentDateTime - currentDate.getTimezoneOffset() * 60000);
      const minCurrentDateTime = minCurrentDate.getTime();
      if (minCurrentDateTime >= minMinuteDateTime && minCurrentDateTime <= maxMinuteDateTime) {
        minuteDifference = util.minuteDiff(minMinuteDate, maxMinuteDate);
      }

      for (i = 0; i <= (minuteDifference + 1); i += dateIntervalNum) {
        const subdailyTime = new Date(
          minMinuteDate.getUTCFullYear(),
          minMinuteDate.getUTCMonth(),
          minMinuteDate.getUTCDate(),
          minMinuteDate.getUTCHours(),
          minMinuteDate.getUTCMinutes() + i,
          0,
        );

        if (subdailyTime.getTime() >= minMinuteDateTime) {
          dateArray.push(subdailyTime);
        }
      }
    }
    runningMinDate = minDate;
  });
  return dateArray;
}

/**
   * Return an array of dates based on the dateRange the current date falls in.
   *
   * @method datesinDateRanges
   * @param  {Object} def            A layer object
   * @param  {Object} date           A date object
   * @return {Array}                An array of dates with normalized timezones
   */
export function datesinDateRanges(def, date) {
  const { dateRanges, period } = def;
  const dateArray = [];
  const currentDate = new Date(date);
  const currentDateTime = currentDate.getTime();
  const singleDateRangeAndInterval = dateRanges
    && dateRanges.length === 1
    && dateRanges[0].dateInterval === '1';
  let hitMaxLimitOfRange = false;

  lodashEach(dateRanges, (dateRange) => {
    const { startDate, endDate, dateInterval } = dateRange;
    const dateIntervalNum = Number(dateInterval);
    let yearDifference;
    let monthDifference;
    let dayDifference;
    let minuteDifference;
    const minDate = new Date(startDate);
    const maxDate = new Date(endDate);

    const minDateTime = minDate.getTime();
    const maxDateTime = maxDate.getTime();

    // break out if currentDate is not within range by skipping current date range
    if (currentDateTime < minDateTime || currentDateTime > maxDateTime) {
      // handle adding next date (if available/not at end of range) as final date
      if (!hitMaxLimitOfRange && currentDateTime < minDateTime) {
        const lastDateInDateArray = dateArray[dateArray.length - 1];
        if (lastDateInDateArray) {
          // reorder last dates from overlapping end/start dateRanges
          if (lastDateInDateArray > minDate) {
            dateArray.pop();
            dateArray.push(minDate);
            dateArray.push(lastDateInDateArray);
          } else {
            dateArray.push(minDate);
          }
        } else {
          dateArray.push(minDate);
        }
        hitMaxLimitOfRange = true;
      }
      return;
    }

    // handle single date coverage by adding date to date array
    if (startDate === endDate) {
      dateArray.push(minDate);
      return;
    }

    const maxYear = maxDate.getUTCFullYear();
    const maxMonth = maxDate.getUTCMonth();
    const maxDay = maxDate.getUTCDate();
    const minYear = minDate.getUTCFullYear();
    const minMonth = minDate.getUTCMonth();
    const minDay = minDate.getUTCDate();

    let i;

    // Yearly layers
    if (period === 'yearly') {
      // single date range and interval allows only returning prev, current, and next dates
      // (if available) instead of full range traversal
      if (singleDateRangeAndInterval) {
        const limitedRange = getLimitedPreviousCurrentNextDateRange(def, currentDate);
        return limitedRange;
      }
      const maxYearDate = new Date(maxYear + dateIntervalNum, maxMonth, maxDay);
      const maxYearDateTime = maxYearDate.getTime();
      if (currentDateTime >= minDateTime && currentDateTime <= maxYearDate) {
        yearDifference = util.yearDiff(minDate, maxYearDate);
      }
      for (i = 0; i <= (yearDifference + 1); i += 1) {
        let year = new Date(minYear + i * dateIntervalNum, minMonth, minDay);
        if (year.getTime() < maxYearDateTime) {
          year = new Date(year.getTime() - (year.getTimezoneOffset() * 60000));
          dateArray.push(year);
        }
      }
      // Monthly layers
    } else if (period === 'monthly') {
      // single date range and interval allows only returning prev, current, and next dates
      // (if available) instead of full range traversal
      if (singleDateRangeAndInterval) {
        const limitedRange = getLimitedPreviousCurrentNextDateRange(def, currentDate);
        return limitedRange;
      }
      let maxMonthDate = new Date(maxYear, maxMonth + dateIntervalNum, maxDay);
      maxMonthDate = new Date(maxMonthDate.getTime() - (maxMonthDate.getTimezoneOffset() * 60000));
      const maxMonthDateTime = maxMonthDate.getTime();

      if (currentDateTime >= minDateTime && currentDateTime <= maxMonthDate) {
        monthDifference = util.monthDiff(minDate, maxMonthDate);
        // handle non-1 month intervals to prevent over pushing unused dates to dateArray
        monthDifference = Math.ceil(monthDifference / dateIntervalNum);
      }

      for (i = 0; i <= (monthDifference + 1); i += 1) {
        let month = new Date(minYear, minMonth + i * dateIntervalNum, minDay);
        month = new Date(month.getTime() - (month.getTimezoneOffset() * 60000));
        const monthTime = month.getTime();
        if (monthTime < maxMonthDateTime) {
          dateArray.push(month);
        }
      }
      // Daily layers
    } else if (period === 'daily') {
      // single date range and interval allows only returning prev, current, and next dates
      // (if available) instead of full range traversal
      if (singleDateRangeAndInterval) {
        const limitedRange = getLimitedPreviousCurrentNextDateRange(def, currentDate);
        return limitedRange;
      }

      const maxDayDate = new Date(maxYear, maxMonth, maxDay + dateIntervalNum);
      const maxDayDateTime = maxDayDate.getTime();
      if (currentDateTime >= minDateTime && currentDateTime <= maxDayDate) {
        dayDifference = util.dayDiff(minDate, maxDayDate);
        // handle non-1 day intervals to prevent over pushing unused dates to dateArray
        dayDifference = Math.ceil(dayDifference / dateIntervalNum);
      }

      for (i = 0; i <= (dayDifference + 1); i += 1) {
        let day = new Date(minYear, minMonth, minDay + i * dateIntervalNum);
        day = new Date(day.getTime() - (day.getTimezoneOffset() * 60000));
        const dayTime = day.getTime();
        if (dayTime < maxDayDateTime) {
          dateArray.push(day);
        }
      }
      // Subdaily layers
    } else if (period === 'subdaily') {
      const maxHours = maxDate.getUTCHours();
      const maxMinutes = maxDate.getUTCMinutes();
      const minMinutes = minDate.getUTCMinutes();
      let maxMinuteDate = new Date(maxYear, maxMonth, maxDay, maxHours, maxMinutes + dateIntervalNum);

      // limit date range request to +/- one hour from current date
      const currentSetMinutes = new Date(currentDate).setMinutes(minMinutes);
      const hourBeforeCurrentDate = new Date(currentSetMinutes - (60 * 60000));
      const hourAfterCurrentDate = new Date(currentSetMinutes + (60 * 60000));

      const minMinuteDate = hourBeforeCurrentDate < minDate
        ? minDate
        : hourBeforeCurrentDate;
      maxMinuteDate = hourAfterCurrentDate > maxMinuteDate
        ? maxMinuteDate
        : hourAfterCurrentDate;

      const minMinuteDateTime = minMinuteDate.getTime();
      const maxMinuteDateTime = maxMinuteDate.getTime();
      if (currentDateTime >= minMinuteDateTime && currentDateTime <= maxMinuteDateTime) {
        minuteDifference = util.minuteDiff(minMinuteDate, maxMinuteDate);
      }

      for (i = 0; i <= (minuteDifference + 1); i += dateIntervalNum) {
        let subdailyTime = new Date(
          minMinuteDate.getUTCFullYear(),
          minMinuteDate.getUTCMonth(),
          minMinuteDate.getUTCDate(),
          minMinuteDate.getUTCHours(),
          minMinuteDate.getUTCMinutes() + i,
          0,
        );
        subdailyTime = new Date(subdailyTime.getTime() - (subdailyTime.getTimezoneOffset() * 60000));
        if (subdailyTime.getTime() >= minMinuteDateTime) {
          dateArray.push(subdailyTime);
        }
      }
    }
  });
  return dateArray;
}

export function serializeLayers(currentLayers, state, groupName) {
  const layers = currentLayers;
  const palettes = state.palettes[groupName];

  return layers.map((def, i) => {
    let item = {};

    if (def.id) {
      item = {
        id: def.id,
      };
    }
    if (!item.attributes) {
      item.attributes = [];
    }
    if (!def.visible) {
      item.attributes.push({
        id: 'hidden',
      });
    }
    if (def.opacity < 1) {
      item.attributes.push({
        id: 'opacity',
        value: def.opacity,
      });
    }
    if (def.palette && (def.custom || def.min || def.max || def.squash || def.disabled)) {
      // If layer has palette and palette attributes
      const paletteAttributeArray = getPaletteAttributeArray(
        def.id,
        palettes,
        state,
      );
      item.attributes = paletteAttributeArray.length
        ? item.attributes.concat(paletteAttributeArray)
        : item.attributes;
    } else if (def.vectorStyle && (def.custom || def.min || def.max)) {
      // If layer has vectorStyle and vectorStyle attributes
      const vectorStyleAttributeArray = getVectorStyleAttributeArray(def);

      item.attributes = vectorStyleAttributeArray.length
        ? item.attributes.concat(vectorStyleAttributeArray)
        : item.attributes;
    }

    return util.appendAttributesForURL(item);
  });
}

export function toggleVisibility(id, layers) {
  const index = lodashFindIndex(layers, {
    id,
  });
  if (index === -1) {
    throw new Error(`Invalid layer ID: ${id}`);
  }
  const visibility = !layers[index].visible;

  return update(layers, { [index]: { visible: { $set: visibility } } });
}

export function removeLayer(id, layers) {
  const index = lodashFindIndex(layers, {
    id,
  });
  if (index === -1) {
    throw new Error(`Invalid layer ID: ${id}`);
  }
  return update(layers, { $splice: [[index, 1]] });
}

// this function takes an array of date ranges in this format:
// [{ layer.period, dateRanges.startDate: Date, dateRanges.endDate: Date, dateRanges.dateInterval: Number}]
// the array is first sorted, and then checked for any overlap
export function dateOverlap(period, dateRanges) {
  const sortedRanges = dateRanges.sort((previous, current) => {
    // get the start date from previous and current
    let previousTime = util.parseDate(previous.startDate);
    previousTime = previousTime.getTime();
    let currentTime = util.parseDate(current.startDate);
    currentTime = currentTime.getTime();

    // if the previous is earlier than the current
    if (previousTime < currentTime) {
      return -1;
    }

    // if the previous time is the same as the current time
    if (previousTime === currentTime) {
      return 0;
    }

    // if the previous time is later than the current time
    return 1;
  });

  const result = sortedRanges.reduce(
    (result, current, idx, arr) => {
      // get the previous range
      if (idx === 0) {
        return result;
      }
      const previous = arr[idx - 1];

      // check for any overlap
      let previousEnd = util.parseDate(previous.endDate);
      // Add dateInterval
      if (previous.dateInterval > 1 && period === 'daily') {
        previousEnd = new Date(
          previousEnd.setTime(
            previousEnd.getTime()
            + (previous.dateInterval * 86400000 - 86400000),
          ),
        );
      }
      if (period === 'monthly') {
        previousEnd = new Date(
          previousEnd.setMonth(
            previousEnd.getMonth() + (previous.dateInterval - 1),
          ),
        );
      } else if (period === 'yearly') {
        previousEnd = new Date(
          previousEnd.setFullYear(
            previousEnd.getFullYear() + (previous.dateInterval - 1),
          ),
        );
      }
      previousEnd = previousEnd.getTime();

      let currentStart = util.parseDate(current.startDate);
      currentStart = currentStart.getTime();

      const overlap = previousEnd >= currentStart;
      // store the result
      if (overlap) {
        // yes, there is overlap
        result.overlap = true;
        // store the specific ranges that overlap
        result.ranges.push({
          previous,
          current,
        });
      }

      return result;
    },
    {
      overlap: false,
      ranges: [],
    },
  );

  // return the final results
  return result;
}
// Permalink versions 1.0 and 1.1
export function layersParse11(str, config) {
  const layers = [];
  const ids = str.split(/[~,.]/);
  lodashEach(ids, (id) => {
    if (id === 'baselayers' || id === 'overlays') {
      return;
    }
    let visible = true;
    if (id.startsWith('!')) {
      visible = false;
      id = id.substring(1);
    }
    if (config.redirects && config.redirects.layers) {
      id = config.redirects.layers[id] || id;
    }
    if (!config.layers[id]) {
      // eslint-disable-next-line no-console
      console.warn(`No such layer: ${id}`);
      return;
    }
    const lstate = {
      id,
      attributes: [],
    };
    if (!visible) {
      lstate.attributes.push({
        id: 'hidden',
        value: true,
      });
    }
    layers.push(lstate);
  });
  return createLayerArrayFromState(layers, config);
}

// Permalink version 1.2
export function layersParse12(stateObj, config) {
  try {
    let parts;
    const str = stateObj;
    // Split by layer definitions (commas not in parens)
    const layerDefs = str.match(/[^(,]+(\([^)]*\))?,?/g);
    const lstates = [];
    lodashEach(layerDefs, (layerDef) => {
      // Get the text before any paren or comma
      let layerId = layerDef.match(/[^(,]+/)[0];
      if (config.redirects && config.redirects.layers) {
        layerId = config.redirects.layers[layerId] || layerId;
      }
      const lstate = {
        id: layerId,
        attributes: [],
      };
      // Everything inside parens
      const arrayAttr = layerDef.match(/\(.*\)/);
      if (arrayAttr) {
        // Get single match and remove parens
        const strAttr = arrayAttr[0].replace(/[()]/g, '');
        // Key value pairs
        const kvps = strAttr.split(',');
        lodashEach(kvps, (kvp) => {
          parts = kvp.split('=');
          if (parts.length === 1) {
            lstate.attributes.push({
              id: parts[0],
              value: true,
            });
          } else {
            lstate.attributes.push({
              id: parts[0],
              value: parts[1],
            });
          }
        });
      }
      lstates.push(lstate);
    });
    return createLayerArrayFromState(lstates, config);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`Error Parsing layers: ${e}`);
    // eslint-disable-next-line no-console
    console.log('reverting to default layers');
    return resetLayers(config.defaults.startingLayers, config.layers);
  }
}
const createLayerArrayFromState = function(state, config) {
  let layerArray = [];
  lodashEach(state, (obj) => {
    if (!lodashIsUndefined(state)) {
      lodashEachRight(state, (layerDef) => {
        let hidden = false;
        let opacity = 1.0;
        let max; let min; let squash; let custom; let
          disabled;
        if (!config.layers[layerDef.id]) {
          // eslint-disable-next-line no-console
          console.warn(`No such layer: ${layerDef.id}`);
          return;
        }
        lodashEach(layerDef.attributes, (attr) => {
          if (attr.id === 'hidden') {
            hidden = true;
          }
          if (attr.id === 'opacity') {
            opacity = util.clamp(parseFloat(attr.value), 0, 1);
            // eslint-disable-next-line no-restricted-globals
            if (isNaN(opacity)) opacity = 0; // "opacity=0.0" is opacity in URL, resulting in NaN
          }
          if (attr.id === 'disabled') {
            const values = util.toArray(attr.value.split(';'));
            disabled = values;
          }
          if (attr.id === 'max' && typeof attr.value === 'string') {
            const maxArray = [];
            const values = util.toArray(attr.value.split(';'));
            lodashEach(values, (value, index) => {
              if (value === '') {
                maxArray.push(undefined);
                return;
              }
              const maxValue = parseFloat(value);
              if (lodashIsNaN(maxValue)) {
                // eslint-disable-next-line no-console
                console.warn(`Invalid max value: ${value}`);
              } else {
                maxArray.push(maxValue);
              }
            });
            max = maxArray.length ? maxArray : undefined;
          }
          if (attr.id === 'min' && typeof attr.value === 'string') {
            const minArray = [];
            const values = util.toArray(attr.value.split(';'));
            lodashEach(values, (value, index) => {
              if (value === '') {
                minArray.push(undefined);
                return;
              }
              const minValue = parseFloat(value);
              if (lodashIsNaN(minValue)) {
                // eslint-disable-next-line no-console
                console.warn(`Invalid min value: ${value}`);
              } else {
                minArray.push(minValue);
              }
            });
            min = minArray.length ? minArray : undefined;
          }
          if (attr.id === 'squash') {
            if (attr.value === true) {
              squash = [true];
            } else if (typeof attr.value === 'string') {
              const squashArray = [];
              const values = util.toArray(attr.value.split(';'));
              lodashEach(values, (value) => {
                squashArray.push(value === 'true');
              });
              squash = squashArray.length ? squashArray : undefined;
            }
          }
          if (attr.id === 'palette') {
            const values = util.toArray(attr.value.split(';'));
            custom = values;
          }
          if (attr.id === 'style') {
            const values = util.toArray(attr.value.split(';'));
            custom = values;
          }
        });
        layerArray = addLayer(
          layerDef.id,
          {
            hidden,
            opacity,
            // only include palette attributes if Array.length condition
            // is true: https://stackoverflow.com/a/40560953/4589331
            ...isArray(custom) && { custom },
            ...isArray(min) && { min },
            ...isArray(squash) && { squash },
            ...isArray(max) && { max },
            ...isArray(disabled) && { disabled },
          },
          layerArray,
          config.layers,
        );
      });
    }
  });
  return layerArray;
};
export function validate(errors, config) {
  const error = function(layerId, cause) {
    errors.push({
      message: `Invalid layer: ${layerId}`,
      cause,
      layerRemoved: true,
    });
    delete config.layers[layerId];
    lodashRemove(config.layerOrder.baselayers, (e) => e === layerId);
    lodashRemove(config.layerOrder.overlays, (e) => e === layerId);
  };

  const layers = lodashCloneDeep(config.layers);
  lodashEach(layers, (layer) => {
    if (!layer.group) {
      error(layer.id, 'No group defined');
      return;
    }
    if (!layer.projections) {
      error(layer.id, 'No projections defined');
    }
  });

  const orders = lodashCloneDeep(config.layerOrder);
  lodashEach(orders, (layerId) => {
    if (!config.layers[layerId]) {
      error(layerId, 'No configuration');
    }
  });
}
export function mapLocationToLayerState(
  parameters,
  stateFromLocation,
  state,
  config,
) {
  let newStateFromLocation = stateFromLocation;
  if (!parameters.l1 && parameters.ca !== undefined) {
    newStateFromLocation = update(stateFromLocation, {
      layers: { activeB: { $set: stateFromLocation.layers.active } },
    });
  }
  // legacy layers permalink
  if (parameters.products && !parameters.l) {
    newStateFromLocation = update(stateFromLocation, {
      layers: {
        active: {
          $set: layersParse11(parameters.products, config),
        },
      },
    });
  }
  return newStateFromLocation;
}
