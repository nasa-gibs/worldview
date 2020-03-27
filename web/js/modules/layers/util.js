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
  const availableDates = datesinDateRanges(def, date);
  // Some vector layers
  if (!def.startDate && !def.dateRanges) {
    return true;
  }
  if (def.endDate && def.inactive) {
    return date < new Date(def.endDate) && date > new Date(def.startDate);
  }
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
   * @param  {object} maxEndDate     A date object
   * @param  {object} startDateLimit A date object (optional) used as start date of timeline range for available data
   * @param  {object} endDateLimit   A date object (optional) used as end date of timeline range for available data
   * @param  {object} minDate        A date object
   * @return {object}                A date object
   */
const getRevisedMaxEndDate = (maxEndDate, startDateLimit, endDateLimit, minDate) => {
  const startDateLimitTime = startDateLimit.getTime();
  const minDateTime = minDate.getTime();
  const maxEndDateTime = maxEndDate.getTime();
  const endDateLimitTime = endDateLimit.getTime();
  const frontDateWithinRange = startDateLimitTime >= minDateTime && startDateLimitTime <= maxEndDateTime;
  const backDateWithinRange = endDateLimitTime <= maxEndDateTime && endDateLimitTime >= minDateTime;
  if (frontDateWithinRange || backDateWithinRange) {
    return endDateLimit;
  }
  return maxEndDate;
};

/**
   * Return an array of dates based on the dateRange the current date falls in.
   *
   * @method datesinDateRanges
   * @param  {object} def            A layer object
   * @param  {object} date           A date object
   * @param  {object} startDateLimit A date object (optional) used as start date of timeline range for available data
   * @param  {object} endDateLimit   A date object (optional) used as end date of timeline range for available data
   * @return {array}                An array of dates with normalized timezones
   */
export function datesinDateRanges(def, date, startDateLimit, endDateLimit) {
  const inactiveLayer = def.inactive;
  const rangeLimitsProvided = startDateLimit && endDateLimit;
  const dateArray = [];
  let currentDate = new Date(date.getTime());
  // runningMinDate used for overlapping ranges
  let runningMinDate;
  lodashEach(def.dateRanges, (dateRange, index) => {
    const { period } = def;
    const dateInterval = Number(dateRange.dateInterval);
    let yearDifference;
    let monthDifference;
    let dayDifference;
    let minuteDifference;
    let minDate = new Date(dateRange.startDate);
    let maxDate = new Date(dateRange.endDate);

    // explicit min/max ranges provided
    if (rangeLimitsProvided) {
      // handle single date coverage
      if (dateRange.startDate === dateRange.endDate) {
        const dateTime = new Date(minDate.getTime());
        dateArray.push(dateTime);
        return;
      }
      const startDateLimitTime = startDateLimit.getTime();
      const endDateLimitTime = endDateLimit.getTime();
      const minDateTime = minDate.getTime();
      const minDateWithinRangeLimits = minDateTime > startDateLimitTime && minDateTime < endDateLimitTime;
      if (currentDate.getTime() < minDateTime && minDateWithinRangeLimits) {
        currentDate = minDate;
      }
    }

    // set maxDate to current date if layer coverage is ongoing
    if (index === def.dateRanges.length - 1 && !inactiveLayer) {
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
      const maxYearDate = new Date(maxYear + dateInterval, maxMonth, maxDay);
      if (currentDate >= minDate && currentDate <= maxYearDate) {
        yearDifference = util.yearDiff(minDate, maxYearDate);
      }
      for (i = 0; i <= (yearDifference + 1); i += 1) {
        let year = new Date(minYear + i * dateInterval, minMonth, minDay);
        year = new Date(year.getTime() - (year.getTimezoneOffset() * 60000));
        dateArray.push(year);
      }
      // Monthly layers
    } else if (period === 'monthly') {
      let maxMonthDate = new Date(maxYear, maxMonth + dateInterval, maxDay);
      maxMonthDate = new Date(maxMonthDate.getTime() - (maxMonthDate.getTimezoneOffset() * 60000));

      if (runningMinDate && dateArray[dateArray.length - 1] > minDate) {
        currentDate = minDate;
      }

      // conditional revision of maxEndDate for data availability partial coverage
      let maxEndDate = maxMonthDate;
      if (rangeLimitsProvided) {
        maxEndDate = getRevisedMaxEndDate(new Date(maxEndDate), startDateLimit, endDateLimit, minDate);
      }

      if (currentDate <= maxMonthDate) {
        monthDifference = util.monthDiff(minDate, maxMonthDate);
        // handle non-1 month intervals to prevent over pushing unused dates to dateArray
        monthDifference = Math.ceil(monthDifference / dateInterval);
      }

      // get minStartDate for partial range coverage starting date
      let minStartMonthDate;
      if (rangeLimitsProvided) {
        let prevDate = '';
        for (i = 0; i <= (monthDifference + 1); i += 1) {
          if (!minStartMonthDate) {
            let month = new Date(minYear, minMonth + i * dateInterval, minDay);
            month = new Date(month.getTime() - (month.getTimezoneOffset() * 60000));

            if (month > startDateLimit || month.getTime() === startDateLimit.getTime()) {
              minStartMonthDate = prevDate;
            } else {
              prevDate = month;
            }
          }
        }
      }

      for (i = 0; i <= (monthDifference + 1); i += 1) {
        let month = new Date(minYear, minMonth + i * dateInterval, minDay);
        month = new Date(month.getTime() - (month.getTimezoneOffset() * 60000));
        if (month.getTime() >= maxEndDate.getTime()) {
          // eslint-disable-next-line no-continue
          continue;
        }

        if (dateArray.length > 0) {
          // prevent earlier dates from being added after later dates while building dateArray
          if (month < dateArray[dateArray.length - 1]) {
            let endDateFound = false;
            for (let j = dateArray.length - 1; j >= 0; j -= 1) {
              if (!endDateFound) {
                const dateCheck = dateArray[j];
                const monthTime = month.getTime();
                const dateCheckTime = dateCheck.getTime();

                if (monthTime <= dateCheckTime) {
                  dateArray.pop();
                } else {
                  dateArray.push(month);
                  endDateFound = true;
                  // eslint-disable-next-line no-continue
                  continue;
                }
              }
            }
            // eslint-disable-next-line no-continue
            continue;
          }
        }

        if (minStartMonthDate) {
          const monthTime = month.getTime();
          const minStartMonthDateTime = minStartMonthDate.getTime();
          const monthWithinRange = month > minStartMonthDate && month < maxMonthDate;
          if (monthTime === minStartMonthDateTime || monthWithinRange) {
            dateArray.push(month);
          }
        } else {
          dateArray.push(month);
        }
      }
      // Daily layers
    } else if (period === 'daily') {
      const maxDayDate = new Date(maxYear, maxMonth, maxDay + dateInterval);
      if (runningMinDate && dateArray[dateArray.length - 1] > minDate) {
        currentDate = minDate;
      }

      // conditional revision of maxEndDate for data availability partial coverage
      let maxEndDate = maxDayDate;
      if (rangeLimitsProvided) {
        maxEndDate = getRevisedMaxEndDate(new Date(maxEndDate), startDateLimit, endDateLimit, minDate);
      }

      if (currentDate >= minDate && currentDate <= maxEndDate) {
        dayDifference = util.dayDiff(minDate, maxEndDate);
        // handle non-1 day intervals to prevent over pushing unused dates to dateArray
        dayDifference = Math.ceil(dayDifference / dateInterval);
      }

      // get minStartDate for partial range coverage starting date
      let minStartDayDate;
      if (rangeLimitsProvided) {
        let prevDate = '';
        for (i = 0; i <= (dayDifference + 1); i += 1) {
          if (!minStartDayDate) {
            let day = new Date(minYear, minMonth, minDay + i * dateInterval);
            day = new Date(day.getTime() - (day.getTimezoneOffset() * 60000));

            if (day > startDateLimit || day.getTime() === startDateLimit.getTime()) {
              minStartDayDate = prevDate;
            } else {
              prevDate = day;
            }
          }
        }
      }

      for (i = 0; i <= (dayDifference + 1); i += 1) {
        let day = new Date(minYear, minMonth, minDay + i * dateInterval);
        day = new Date(day.getTime() - (day.getTimezoneOffset() * 60000));
        if (day.getTime() > maxEndDate.getTime()) {
          // eslint-disable-next-line no-continue
          continue;
        }

        if (dateArray.length > 0) {
          // prevent earlier dates from being added after later dates while building dateArray
          if (day < dateArray[dateArray.length - 1]) {
            let endDateFound = false;
            for (let j = dateArray.length - 1; j >= 0; j -= 1) {
              if (!endDateFound) {
                const dateCheck = dateArray[j];
                const dayTime = day.getTime();
                const dateCheckTime = dateCheck.getTime();

                if (dayTime <= dateCheckTime) {
                  dateArray.pop();
                } else {
                  dateArray.push(day);
                  endDateFound = true;
                  // eslint-disable-next-line no-continue
                  continue;
                }
              }
            }
            // eslint-disable-next-line no-continue
            continue;
          }
        }

        if (minStartDayDate) {
          const dayTime = day.getTime();
          const minStartDayDateTime = minStartDayDate.getTime();

          if (dayTime === minStartDayDateTime || (day > minStartDayDate && day < maxDayDate)) {
            dateArray.push(day);
          }
        } else {
          dateArray.push(day);
        }
      }
      // Subdaily layers
    } else if (period === 'subdaily') {
      const maxHours = maxDate.getUTCHours();
      const minHours = minDate.getUTCHours();
      const maxMinutes = maxDate.getUTCMinutes();
      const minMinutes = minDate.getUTCMinutes();
      const minMinuteDate = new Date(minDate);
      const minMinuteDateTime = minMinuteDate.getTime();
      let maxMinuteDate = new Date(maxYear, maxMonth, maxDay, maxHours, maxMinutes + dateInterval);
      const minMinuteDateMinusInterval = new Date(minYear, minMonth, minDay, minHours, minMinutes - dateInterval);

      let currentDateOffset;
      let hourBeforeCurrentDate;
      let hourAfterCurrentDate;
      if (rangeLimitsProvided) {
        currentDateOffset = startDateLimit.getTimezoneOffset() * 60000;
        hourBeforeCurrentDate = new Date(startDateLimit.setMinutes(minMinutes) - currentDateOffset - (60 * 60000));
        hourAfterCurrentDate = new Date(endDateLimit.setMinutes(minMinutes) - currentDateOffset + (60 * 60000));

        const minMinuteDateMinusIntervalOffset = new Date(minMinuteDateMinusInterval.getTime() - (minMinuteDateMinusInterval.getTimezoneOffset() * 60000));

        // eslint-disable-next-line no-nested-ternary
        minDate = hourBeforeCurrentDate < minDate
          ? hourBeforeCurrentDate
          : hourBeforeCurrentDate > minMinuteDateMinusIntervalOffset
            ? hourBeforeCurrentDate
            : minDate;

        maxMinuteDate = hourAfterCurrentDate > maxMinuteDate ? maxMinuteDate : hourAfterCurrentDate;
      } else {
        currentDateOffset = currentDate.getTimezoneOffset() * 60000;
        hourBeforeCurrentDate = new Date(currentDate.setMinutes(minMinutes) - currentDateOffset - (60 * 60000));
        hourAfterCurrentDate = new Date(currentDate.setMinutes(minMinutes) - currentDateOffset + (60 * 60000));
        minDate = hourBeforeCurrentDate < minDate
          ? minDate
          : hourBeforeCurrentDate;
        maxMinuteDate = hourAfterCurrentDate > maxMinuteDate
          ? maxMinuteDate
          : hourAfterCurrentDate;
      }

      currentDate = new Date(currentDate.getTime() - currentDateOffset);
      if (currentDate >= minDate && currentDate <= maxMinuteDate) {
        minuteDifference = util.minuteDiff(minDate, maxMinuteDate);
      }
      for (i = 0; i <= (minuteDifference + 1); i += dateInterval) {
        const time = new Date(
          minDate.getUTCFullYear(),
          minDate.getUTCMonth(),
          minDate.getUTCDate(),
          minDate.getUTCHours(),
          minDate.getUTCMinutes() + i,
          0,
        );

        if (time.getTime() < minMinuteDateTime) {
          // eslint-disable-next-line no-continue
          continue;
        }
        dateArray.push(time);
      }
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
// Takes a layer id and returns a true or false value
// if the layer exists in the active layer list
//
// LODASH Find() essentially does the same thing
export function exists(layer, activeLayers) {
  let found = false;
  lodashEach(activeLayers, (current) => {
    if (layer === current.id) {
      found = true;
    }
  });
  return found;
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
