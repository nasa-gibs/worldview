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
import moment from 'moment';
import * as OlExtent from 'ol/extent';
import googleTagManager from 'googleTagManager';
import update from 'immutability-helper';
import { addLayer, resetLayers } from './selectors';
import { getPaletteAttributeArray } from '../palettes/util';
import { getVectorStyleAttributeArray } from '../vector-styles/util';
import util from '../../util/util';

export function getOrbitTrackTitle(def) {
  const { track } = def;
  const daynightValue = lodashGet(def, 'daynight[0]');
  if (track && daynightValue) {
    return `${lodashStartCase(track)}/${lodashStartCase(daynightValue)}`;
  } if (track) {
    return lodashStartCase(track);
  } if (daynightValue) {
    return lodashStartCase(daynightValue);
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
  const currentDateOffsetCheck = util.getTimezoneOffsetDate(date);

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
 * @param  {Object} minDate        A date object
 * @param  {Object} maxEndDate     A date object
 * @param  {Object} startDateLimit   A date object used as start date of timeline range for available data
 * @param  {Object} endDateLimit   A date object used as end date of timeline range for available data
 * @return {Object}                A date object
 */
const getRevisedMaxEndDate = (minDate, maxEndDate, startDateLimit, endDateLimit) => {
  const minDateTime = minDate.getTime();
  const maxEndDateTime = maxEndDate.getTime();
  const startDateLimitTime = startDateLimit.getTime();
  const endDateLimitTime = endDateLimit.getTime();
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
  const timeUnitTime = timeUnit.getTime();
  if (timeUnit < newDateArray[arrLastIndex]) {
    let endDateFound = false;
    for (let j = arrLastIndex; j >= 0; j -= 1) {
      if (!endDateFound) {
        const dateCheck = newDateArray[j];
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
 * @param  {Number} interval
 * @param  {Object} startDateLimit A date object
 * @param  {Number} minYear
 * @param  {Number} minMonth
 * @param  {Number} minDay
 * @return {Object} minStartDate A date object
 */
const getMinStartDate = (timeDiff, period, interval, startDateLimit, minYear, minMonth, minDay) => {
  const startDateLimitTime = startDateLimit.getTime();
  let minStartDate;
  let prevDate;
  for (let i = 0; i <= (timeDiff + 1); i += 1) {
    if (!minStartDate) {
      let timeUnit;
      if (period === 'monthly') {
        timeUnit = new Date(minYear, minMonth + i * interval, minDay);
      } else if (period === 'daily') {
        timeUnit = new Date(minYear, minMonth, minDay + i * interval);
      }
      timeUnit = util.getTimezoneOffsetDate(timeUnit);
      const timeUnitTime = timeUnit.getTime();

      if (timeUnitTime > startDateLimitTime) {
        minStartDate = prevDate;
      } else {
        prevDate = timeUnit;
      }
    }
  }
  return minStartDate;
};

/**
   * Return an object of dates add/subtracted based on period
   *
   * @method addSubDatesBasedOnPeriod
   * @param  {Object}  A calculated time object based on period, current date, and date range
   * @return {Object}
   * @return    {Object}  dayBeforeCurrent    A date object
   * @return    {Object}  currentDateZeroed   A date object
   * @return    {Object}  dayAfterCurrent     A date object
   */
const addSubDatesBasedOnPeriod = ({
  period, minCurrentYear, minCurrentMonth, minCurrentDay, minStartMonth, minStartDay,
}) => {
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

  return {
    dayBeforeCurrent,
    currentDateZeroed,
    dayAfterCurrent,
  };
};

/**
   * Return an array of limited dates of previous, current, and next dates (if available)
   *
   * @method getPrevCurrentNextDates
   * @param  {Object}  A calculated time object based on period, current date, and date range
   * @return {Array}   An array of dates - previous, current, and next dates (if available)
   */
const getPrevCurrentNextDates = ({
  currentDateZeroed, dayBeforeCurrent, dayAfterCurrent, breakMinDateTime, breakMaxDateTime,
}) => {
  const limitedDateRange = [];
  // handle adding previous date to range
  const dayBeforeCurrentTime = dayBeforeCurrent.getTime();
  if (dayBeforeCurrentTime >= breakMinDateTime) {
    const dayBeforeDate = util.getTimezoneOffsetDate(dayBeforeCurrent);
    limitedDateRange.push(dayBeforeDate);
  }

  // handle adding current date to range
  const currentDateDate = util.getTimezoneOffsetDate(currentDateZeroed);
  limitedDateRange.push(currentDateDate);

  // handle adding next date to range
  const dayAfterCurrentTime = dayAfterCurrent.getTime();
  if (dayAfterCurrentTime <= breakMaxDateTime) {
    const dayAfterDate = util.getTimezoneOffsetDate(dayAfterCurrent);
    limitedDateRange.push(dayAfterDate);
  }

  return limitedDateRange;
};

/**
   * Build max date to determine if date is within max date range
   *
   * @method getBreakMaxDate
   * @param  {String} period
   * @param  {Object} rangeEndDate  A date object
   * @return {Object} breakMaxDate  A date object
   */
const getBreakMaxDate = (period, rangeEndDate) => {
  const {
    breakMaxYear,
    breakMaxMonth,
    breakMaxDay,
  } = util.getUTCNumbers(rangeEndDate, 'breakMax');
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
  return breakMaxDate;
};

/**
   * Return an array of limited dates of previous, current, and next dates (if available)
   * Used on layers with a single date range and a date interval of 1
   *
   * @method getLimitedDateRange
   * @param  {Object} def           A layer object
   * @param  {Object} currentDate   A date object
   * @return {Array}                An array of dates - previous, current, and next dates (if available)
   */
const getLimitedDateRange = (def, currentDate) => {
  const { period, dateRanges } = def;
  const dateRange = dateRanges[0];
  const { startDate, endDate } = dateRange;

  const rangeStartDate = new Date(startDate);
  const rangeEndDate = new Date(endDate);
  const currentDateTime = currentDate.getTime();
  const breakMinDateTime = rangeStartDate.getTime();

  // build test max date to determine if date is within max date range
  const breakMaxDate = getBreakMaxDate(period, rangeEndDate);
  const breakMaxDateTime = breakMaxDate.getTime();

  // get limitedDateRange of previous, current, and next dates (if available)
  let limitedDateRange = [];
  if (currentDateTime >= breakMinDateTime && currentDateTime <= breakMaxDateTime) {
    // get date building components
    const {
      minCurrentYear,
      minCurrentMonth,
      minCurrentDay,
    } = util.getUTCNumbers(currentDate, 'minCurrent');
    const {
      minStartMonth,
      minStartDay,
    } = util.getUTCNumbers(rangeStartDate, 'minStart');

    // calculated options used with addSubDatesBasedOnPeriod
    const addSubtractOptions = {
      period,
      minCurrentYear,
      minCurrentMonth,
      minCurrentDay,
      minStartMonth,
      minStartDay,
    };

    // period specific date addition/subtraction building
    const {
      dayBeforeCurrent,
      currentDateZeroed,
      dayAfterCurrent,
    } = addSubDatesBasedOnPeriod(addSubtractOptions);

    // calculated options used to determine prev/current/next dates
    const limitedDateRangeOptions = {
      currentDateZeroed,
      dayBeforeCurrent,
      dayAfterCurrent,
      breakMinDateTime,
      breakMaxDateTime,
    };

    // add previous/current/next dates in limitedDateRange
    limitedDateRange = getPrevCurrentNextDates(limitedDateRangeOptions);
  }
  return limitedDateRange;
};

/**
   * Return an array of dates from a yearly period layer based on the dateRange the current date falls in.
   *
   * @method getYearDateRange
   * @param  {Number} currentDateTime  Current date milliseconds
   * @param  {Object} minDate          A date object used as min date
   * @param  {Object} maxDate          A date object used as max date
   * @param  {Number} interval         Temporal interval
   * @param  {Array} dateArray         An array of dates
   * @return {Array}                   An array of dates with normalized timezones
   */
const getYearDateRange = (currentDateTime, minDate, maxDate, interval, dateArray) => {
  const newDateArray = [...dateArray];
  const { maxYear, maxMonth, maxDay } = util.getUTCNumbers(maxDate, 'max');
  const { minYear, minMonth, minDay } = util.getUTCNumbers(minDate, 'min');

  const minDateTime = minDate.getTime();
  const maxYearDate = new Date(maxYear + interval, maxMonth, maxDay);
  const maxYearDateTime = maxYearDate.getTime();

  let yearDifference;
  if (currentDateTime >= minDateTime && currentDateTime <= maxYearDateTime) {
    yearDifference = util.yearDiff(minDate, maxYearDate);
  }

  for (let i = 0; i <= (yearDifference + 1); i += 1) {
    let year = new Date(minYear + i * interval, minMonth, minDay);
    if (year.getTime() < maxYearDateTime) {
      year = util.getTimezoneOffsetDate(year);
      newDateArray.push(year);
    }
  }
  return newDateArray;
};

/**
   * Return an array of dates from a monthly period layer based on the dateRange the current date falls in.
   *
   * @method getMonthDateRange
   * @param  {Object}  A calculated time object based on period, current date, and date range
   * @return {Array}   An array of dates with normalized timezones
   */
const getMonthDateRange = ({
  rangeLimitsProvided, currentDateTime, startDateLimit, endDateLimit, minDate, maxDate, dateIntervalNum, dateArray,
}) => {
  let newDateArray = [...dateArray];
  const { maxYear, maxMonth, maxDay } = util.getUTCNumbers(maxDate, 'max');
  const { minYear, minMonth, minDay } = util.getUTCNumbers(minDate, 'min');

  // conditional revision of maxEndDate for data availability partial coverage
  const minDateTime = minDate.getTime();
  let maxMonthDate = new Date(maxYear, maxMonth + dateIntervalNum, maxDay);
  maxMonthDate = util.getTimezoneOffsetDate(maxMonthDate);

  let maxEndDate;
  let maxEndDateTime;
  if (rangeLimitsProvided) {
    maxEndDate = getRevisedMaxEndDate(minDate, maxMonthDate, startDateLimit, endDateLimit);
    maxEndDateTime = maxEndDate.getTime();
  } else {
    maxEndDateTime = maxMonthDate.getTime();
  }

  let monthDifference;
  if (currentDateTime >= minDateTime && currentDateTime <= maxEndDateTime) {
    monthDifference = util.monthDiff(minDate, maxMonthDate);
    // handle non-1 month dateIntervalNums to prevent over pushing unused dates to dateArray
    monthDifference = Math.ceil(monthDifference / dateIntervalNum);
  }

  let minStartMonthDate;
  if (rangeLimitsProvided) {
    // get minStartDate for partial range coverage starting date
    minStartMonthDate = monthDifference
      && getMinStartDate(monthDifference, 'monthly', dateIntervalNum, startDateLimit, minYear, minMonth, minDay);
  }

  for (let i = 0; i <= (monthDifference + 1); i += 1) {
    let month = new Date(minYear, minMonth + i * dateIntervalNum, minDay);
    month = util.getTimezoneOffsetDate(month);
    const monthTime = month.getTime();
    if (monthTime < maxEndDateTime) {
      if (rangeLimitsProvided) {
        if (newDateArray.length > 0) {
          newDateArray = getDateArrayLastDateInOrder(month, newDateArray);
        }
        if (minStartMonthDate) {
          const minStartMonthDateTime = minStartMonthDate.getTime();
          const monthWithinRange = month > minStartMonthDate && month < maxMonthDate;
          if (monthTime === minStartMonthDateTime || monthWithinRange) {
            newDateArray.push(month);
          }
        } else {
          newDateArray.push(month);
        }
      } else {
        newDateArray.push(month);
      }
    }
  }
  return newDateArray;
};

/**
   * Return an array of dates from a daily period layer based on the dateRange the current date falls in.
   *
   * @method getDayDateRange
   * @param  {Object}  A calculated time object based on period, current date, and date range
   * @return {Array}   An array of dates with normalized timezones
   */
const getDayDateRange = ({
  rangeLimitsProvided, currentDateTime, startDateLimit, endDateLimit, minDate, maxDate, dateIntervalNum, dateArray,
}) => {
  let newDateArray = [...dateArray];
  const { maxYear, maxMonth, maxDay } = util.getUTCNumbers(maxDate, 'max');
  const { minYear, minMonth, minDay } = util.getUTCNumbers(minDate, 'min');

  // conditional revision of maxEndDate for data availability partial coverage
  const minDateTime = minDate.getTime();
  const maxDayDate = new Date(maxYear, maxMonth, maxDay + dateIntervalNum);
  let maxEndDateTime;
  let maxEndDate;
  if (rangeLimitsProvided) {
    maxEndDate = getRevisedMaxEndDate(minDate, maxDayDate, startDateLimit, endDateLimit);
    maxEndDateTime = maxEndDate.getTime();
  } else {
    maxEndDate = maxDayDate;
    maxEndDateTime = maxDayDate.getTime();
  }

  let dayDifference;
  if (currentDateTime >= minDateTime && currentDateTime <= maxEndDateTime) {
    dayDifference = util.dayDiff(minDate, maxEndDate);
    // handle non-1 day dateIntervalNums to prevent over pushing unused dates to dateArray
    dayDifference = Math.ceil(dayDifference / dateIntervalNum);
  }

  let minStartDayDate;
  if (rangeLimitsProvided) {
    // get minStartDate for partial range coverage starting date
    minStartDayDate = dayDifference
    && getMinStartDate(dayDifference, 'daily', dateIntervalNum, startDateLimit, minYear, minMonth, minDay);
  }

  for (let i = 0; i <= (dayDifference + 1); i += 1) {
    let day = new Date(minYear, minMonth, minDay + i * dateIntervalNum);
    day = util.getTimezoneOffsetDate(day);
    const dayTime = day.getTime();
    if (dayTime < maxEndDateTime) {
      if (rangeLimitsProvided) {
        if (newDateArray.length > 0) {
          newDateArray = getDateArrayLastDateInOrder(day, newDateArray);
        }
        if (minStartDayDate) {
          const minStartDayDateTime = minStartDayDate.getTime();
          const dayWithinRange = day > minStartDayDate && day < maxDayDate;
          if (dayTime === minStartDayDateTime || dayWithinRange) {
            newDateArray.push(day);
          }
        } else {
          newDateArray.push(day);
        }
      } else {
        newDateArray.push(day);
      }
    }
  }
  return newDateArray;
};

/**
   * Return an array of dates from a subdaily period layer based on the dateRange the current date falls in.
   *
   * @method getSubdailyDateRange
   * @param  {Object}  A calculated time object based on period, current date, and date range
   * @return {Array}   An array of dates with normalized timezones
   */
const getSubdailyDateRange = ({
  rangeLimitsProvided, currentDateTime, startDateLimit, endDateLimit, minDate, maxDate, dateIntervalNum, dateArray,
}) => {
  const newDateArray = [...dateArray];
  const {
    maxYear,
    maxMonth,
    maxDay,
    maxHour,
    maxMinute,
  } = util.getUTCNumbers(maxDate, 'max');
  const {
    minYear,
    minMonth,
    minDay,
    minHour,
    minMinute,
  } = util.getUTCNumbers(minDate, 'min');

  let maxMinuteDate = new Date(maxYear, maxMonth, maxDay, maxHour, maxMinute + dateIntervalNum);
  let minMinuteDateMinusInterval;
  let minMinuteDateMinusIntervalOffset;
  let hourBeforeStartDateLimit;
  let hourAfterEndDateLimit;
  if (rangeLimitsProvided) {
    minMinuteDateMinusInterval = new Date(minYear, minMonth, minDay, minHour, minMinute - dateIntervalNum);
    minMinuteDateMinusIntervalOffset = util.getTimezoneOffsetDate(minMinuteDateMinusInterval);

    const startDateLimitOffset = startDateLimit.getTimezoneOffset() * 60000;
    const endDateLimitOffset = endDateLimit.getTimezoneOffset() * 60000;
    const startDateLimitSetMinutes = new Date(startDateLimit).setMinutes(minMinute);
    const endDateLimitSetMinutes = new Date(endDateLimit).setMinutes(minMinute);

    hourBeforeStartDateLimit = new Date(startDateLimitSetMinutes - startDateLimitOffset - (60 * 60000));
    hourAfterEndDateLimit = new Date(endDateLimitSetMinutes - endDateLimitOffset + (60 * 60000));
  } else {
    // limit date range request to +/- one hour from current date
    const currentSetMinutes = new Date(currentDateTime).setMinutes(minMinute);
    hourBeforeStartDateLimit = new Date(currentSetMinutes - (60 * 60000));
    hourAfterEndDateLimit = new Date(currentSetMinutes + (60 * 60000));
  }
  let minMinuteDate;
  if (rangeLimitsProvided) {
  // eslint-disable-next-line no-nested-ternary
    minMinuteDate = hourBeforeStartDateLimit < minDate
      ? hourBeforeStartDateLimit
      : hourBeforeStartDateLimit > minMinuteDateMinusIntervalOffset
        ? hourBeforeStartDateLimit
        : minDate;
  } else {
    minMinuteDate = hourBeforeStartDateLimit < minDate
      ? minDate
      : hourBeforeStartDateLimit;
  }
  maxMinuteDate = hourAfterEndDateLimit > maxMinuteDate
    ? maxMinuteDate
    : hourAfterEndDateLimit;

  const minMinuteDateTime = minMinuteDate.getTime();
  const maxMinuteDateTime = maxMinuteDate.getTime();
  let currentDateTimeCheck;
  if (rangeLimitsProvided) {
    const minCurrentDate = util.getTimezoneOffsetDate(new Date(currentDateTime));
    const minCurrentDateTime = minCurrentDate.getTime();
    currentDateTimeCheck = minCurrentDateTime;
  } else {
    currentDateTimeCheck = currentDateTime;
  }

  let minuteDifference;
  if (currentDateTimeCheck >= minMinuteDateTime && currentDateTimeCheck <= maxMinuteDateTime) {
    minuteDifference = util.minuteDiff(minMinuteDate, maxMinuteDate);
  }

  for (let i = 0; i <= (minuteDifference + 1); i += dateIntervalNum) {
    let subdailyTime = new Date(
      minMinuteDate.getUTCFullYear(),
      minMinuteDate.getUTCMonth(),
      minMinuteDate.getUTCDate(),
      minMinuteDate.getUTCHours(),
      minMinuteDate.getUTCMinutes() + i,
      0,
    );
    if (!rangeLimitsProvided) {
      subdailyTime = util.getTimezoneOffsetDate(subdailyTime);
    }
    const lessThanLastDateInCollection = newDateArray.length > 0
      ? subdailyTime.getTime() > newDateArray[newDateArray.length - 1].getTime()
      : true;
    if (subdailyTime.getTime() >= minMinuteDateTime && lessThanLastDateInCollection) {
      newDateArray.push(subdailyTime);
    }
  }
  return newDateArray;
};

/**
   * Return an array of dates based on the dateRange the current date falls in.
   *
   * @method datesinDateRangesDataPanel
   * @param  {Object} def            A layer object
   * @param  {Object} date           A date object for currently selected date
   * @param  {Object} startDateLimit A date object used as start date of timeline range for available data
   * @param  {Object} endDateLimit   A date object used as end date of timeline range for available data
   * @param  {Object} appNow         A date object of appNow (current date or set explicitly)
   * @return {Array}                 An array of dates with normalized timezones
   */
export function datesinDateRanges(def, date, startDateLimit, endDateLimit, appNow) {
  const {
    dateRanges,
    period,
    inactive,
  } = def;
  const rangeLimitsProvided = !!(startDateLimit && endDateLimit);
  let dateArray = [];
  let currentDate = new Date(date);

  let inputStartDate;
  let inputEndDate;
  let inputStartDateTime;
  let inputEndDateTime;
  let singleDateRangeAndInterval;
  if (rangeLimitsProvided) {
    inputStartDate = new Date(startDateLimit);
    inputEndDate = new Date(endDateLimit);
    inputStartDateTime = inputStartDate.getTime();
    inputEndDateTime = inputEndDate.getTime();
  } else {
    singleDateRangeAndInterval = dateRanges
    && dateRanges.length === 1
    && dateRanges[0].dateInterval === '1';
  }

  // at end of range, used to add "next" date
  let hitMaxLimitOfRange = false;
  // runningMinDate used for overlapping ranges
  let runningMinDate;
  lodashEach(dateRanges, (dateRange, index) => {
    const {
      startDate,
      endDate,
      dateInterval,
    } = dateRange;
    const dateIntervalNum = Number(dateInterval);
    let currentDateTime = currentDate.getTime();
    const lastDateInDateArray = dateArray[dateArray.length - 1];
    const minDate = new Date(startDate);
    let maxDate = new Date(endDate);

    const minDateTime = minDate.getTime();
    const maxDateTime = maxDate.getTime();

    const currentDateLessThanMinDate = currentDateTime < minDateTime;
    const currentDateGreaterThanMaxDate = currentDateTime > maxDateTime;

    // LAYER DATE RANGE SPECIFIC
    if (!rangeLimitsProvided) {
      // break out if currentDate is not within range by skipping current date range
      if (currentDateLessThanMinDate || currentDateGreaterThanMaxDate) {
        // handle adding next date (if available/not at end of range) as final date
        if (!hitMaxLimitOfRange && currentDateLessThanMinDate) {
          if (lastDateInDateArray) {
            // reorder last dates from overlapping end/start dateRanges
            if (lastDateInDateArray > minDate) {
              dateArray.pop();
              dateArray.push(minDate);
              dateArray.push(lastDateInDateArray);
            }
          } else {
            dateArray.push(minDate);
          }
          hitMaxLimitOfRange = true;
          return;
        }
      }
    }

    // DATA PANEL SPECIFIC
    if (rangeLimitsProvided) {
      // handle single date coverage by adding date to date array
      if (startDate === endDate) {
        if (minDateTime >= inputStartDateTime && maxDate <= inputEndDateTime) {
          dateArray.push(minDate);
        }
        return;
      }

      // revise currentDate to minDate to reduce earlier minDate than needed
      const minDateWithinRangeLimits = minDateTime > inputStartDateTime && minDateTime < inputEndDateTime;
      const runningMinDateAndLastDateEarlier = runningMinDate && lastDateInDateArray > minDate;
      if (currentDateLessThanMinDate && (minDateWithinRangeLimits || runningMinDateAndLastDateEarlier)) {
        currentDate = minDate;
        currentDateTime = currentDate.getTime();
      }
      // set maxDate to current date if layer coverage is ongoing
      if (index === dateRanges.length - 1 && !inactive) {
        maxDate = new Date(appNow);
      }
    }

    // single date range and interval allows only returning prev, current, and next dates
    // (if available) instead of full range traversal
    if (singleDateRangeAndInterval) {
      const limitedDateRange = getLimitedDateRange(def, currentDate);
      dateArray = [...limitedDateRange];
      return;
    }

    // Yearly layers
    if (period === 'yearly') {
      const yearArray = getYearDateRange(currentDateTime, minDate, maxDate, dateIntervalNum, dateArray);
      dateArray = [...yearArray];
      // Monthly layers
    }

    const dateRangeBuildOptions = {
      rangeLimitsProvided,
      currentDateTime,
      startDateLimit,
      endDateLimit,
      minDate,
      maxDate,
      dateIntervalNum,
      dateArray,
    };
    if (period === 'monthly') {
      const monthArray = getMonthDateRange(dateRangeBuildOptions);
      dateArray = [...monthArray];
      // Daily layers
    } else if (period === 'daily') {
      const dayArray = getDayDateRange(dateRangeBuildOptions);
      dateArray = [...dayArray];
      // Subdaily layers
    } else if (period === 'subdaily') {
      const subdailyArray = getSubdailyDateRange(dateRangeBuildOptions);
      dateArray = [...subdailyArray];
    }
    runningMinDate = minDate;
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
    googleTagManager.pushEvent({
      event: 'layer_included_in_url',
      layers: {
        id,
      },
    });
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
      googleTagManager.pushEvent({
        event: 'layer_included_in_url',
        layers: {
          id: layerId,
        },
      });
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
/**
 * Determine if active layers have a visible
 * vector layer
 *
 * @param {Array} activeLayers
 *
 * @return {Boolean}
 */
export const hasVectorLayers = (activeLayers) => {
  const len = activeLayers.length;
  // Used for loop
  // so break could be used
  let hasVectorTypeLayer = false;
  for (let i = 0; i < len; i += 1) {
    const def = activeLayers[i];
    if (def.type === 'vector' && def.visible) {
      hasVectorTypeLayer = true;
      break;
    }
  }
  return hasVectorTypeLayer;
};

/**
 * Determine if active layers have a vector layer that is
 * clickable at this zoom
 *
 * @param {Object} layersState
 * @param {Number} mapRes
 *
 * @return {Boolean}
 */
export const isVectorLayerClickable = (layer, mapRes, projId) => {
  if (!mapRes) return false;
  const resolutionBreakPoint = lodashGet(layer, `breakPointLayer.projections.${projId}.resolutionBreakPoint`);

  if (resolutionBreakPoint) {
    return mapRes < resolutionBreakPoint;
  }
  return true;
};

/**
 * Determine if active layers have a vector layer
 * That is currently not clickable
 *
 * @param {Object} layersState
 * @param {Number} mapRes
 *
 * @return {Boolean}
 */
export const hasNonClickableVectorLayer = (activeLayers, mapRes, projId) => {
  if (!mapRes) return false;
  let isNonClickableVectorLayer = false;
  const len = activeLayers.length;
  for (let i = 0; i < len; i += 1) {
    const def = activeLayers[i];
    if (def.type === 'vector' && def.visible) {
      isNonClickableVectorLayer = !isVectorLayerClickable(def, mapRes, projId);
      if (isNonClickableVectorLayer) break;
    }
  }
  return isNonClickableVectorLayer;
};

/**
 * For geostationary layers that have 'availability' properties defined
 * adjust the start date and date ranges as necessary
 *
 * Applies to layer.startDate and layer.dateRanges[0].startDate
 * @param {*} layers
 */
export function adjustStartDates(layers) {
  const adjustDate = (days) => moment.utc()
    .subtract(days, 'days')
    .startOf('day')
    .format('YYYY-MM-DD');

  const applyDateAdjustment = (layer) => {
    const { availability, dateRanges } = layer;
    if (!availability) {
      return;
    }
    const { rollingWindow, historicalRanges } = availability;

    if (dateRanges.length) {
      const [firstDateRange] = dateRanges;
      firstDateRange.startDate = adjustDate(rollingWindow);
    }

    if (historicalRanges && historicalRanges.length) {
      layer.startDate = historicalRanges[0].startDate;
      historicalRanges.reverse().forEach((range) => {
        layer.dateRanges.unshift(range);
      });
    } else {
      layer.startDate = adjustDate(rollingWindow);
    }
  };

  return Object.values(layers).forEach(applyDateAdjustment);
}

/**
 * Check if coordinates and polygon extent are within and not exceeding max extent
 *
 * @param {Object} polygon
 * @param {Array} coords
 * @param {Array} maxExtent
 *
 * @return {Boolean}
 */
export const areCoordinatesAndPolygonExtentValid = (polygon, coords, maxExtent) => {
  // check if cursor coordinates within granule footprint
  const areCoordsWithinPolygon = polygon.intersectsCoordinate(coords);
  // check is polygon footprint is within max extent, will allow partial corners within max extent
  const doesPolygonIntersectMaxExtent = polygon.intersectsExtent(maxExtent);
  // check if polygon is larger than maxExtent - helpful to catch most large polar granules
  const polygonExtent = polygon.getExtent();
  const isPolygonLargerThanMaxExtent = OlExtent.containsExtent(polygonExtent, maxExtent);

  return areCoordsWithinPolygon
    && doesPolygonIntersectMaxExtent
    && !isPolygonLargerThanMaxExtent;
};
