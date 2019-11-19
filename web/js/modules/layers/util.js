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
  isArray
} from 'lodash';

import { addLayer, resetLayers } from './selectors';
import { getPaletteAttributeArray } from '../palettes/util';
import { getVectorStyleAttributeArray } from '../vector-styles/util';
import update from 'immutability-helper';
import util from '../../util/util';
import closestTo from 'date-fns/closest_to';
import isBefore from 'date-fns/is_before';
import isEqual from 'date-fns/is_equal';
import isFirstDayOfMonth from 'date-fns/is_first_day_of_month';
import isLastDayOfMonth from 'date-fns/is_last_day_of_month';
import lastDayOfYear from 'date-fns/last_day_of_year';

export function getOrbitTrackTitle(def) {
  if (def.daynight && def.track) {
    return lodashStartCase(def.track) + '/' + lodashStartCase(def.daynight);
  } else if (def.track) {
    return lodashStartCase(def.track);
  } else if (def.daynight) {
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
    newMinutes
  );
  return newDate;
};

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
  const currentDate = new Date(date.getTime());

  if (!dateArray ||
      (def.period === 'monthly' && (isFirstDayOfMonth(currentDate) || isLastDayOfMonth(currentDate))) ||
      (def.period === 'yearly' && ((currentDate.getDate() === 1 && currentDate.getMonth() === 0) || (currentDate === lastDayOfYear(currentDate))))) {
    return date;
  }

  lodashEach(dateArray, (rangeDate) => {
    if (isBefore(rangeDate, currentDate) || isEqual(rangeDate, currentDate)) {
      closestAvailableDates.push(rangeDate);
    }
  });

  const closestDate = closestTo(currentDate, closestAvailableDates);
  return closestDate ? new Date(closestDate.getTime()) : date;
};

/**
   * Return an array of dates based on the dateRange the current date falls in.
   *
   * @method datesinDateRanges
   * @param  {object} def           A layer object
   * @param  {object} date          A date object
   * @return {array}                An array of dates with normalized timezones
   */
export function datesinDateRanges(def, date) {
  const dateArray = [];
  let currentDate = new Date(date.getTime());

  lodashEach(def.dateRanges, (dateRange) => {
    const { dateInterval } = dateRange;
    let yearDifference;
    let monthDifference;
    let dayDifference;
    let minuteDifference;
    let minDate = new Date(dateRange.startDate);
    let maxDate = new Date(dateRange.endDate);
    // Offset timezone
    minDate = new Date(minDate.getTime() - (minDate.getTimezoneOffset() * 60000));
    maxDate = new Date(maxDate.getTime() - (maxDate.getTimezoneOffset() * 60000));

    const maxYear = maxDate.getUTCFullYear();
    const maxMonth = maxDate.getUTCMonth();
    const maxDay = maxDate.getUTCDate();
    const maxHours = maxDate.getUTCHours();
    const maxMinutes = maxDate.getUTCMinutes();
    const minYear = minDate.getUTCFullYear();
    const minMonth = minDate.getUTCMonth();
    const minDay = minDate.getUTCDate();
    const minMinutes = minDate.getUTCMinutes();

    const maxYearDate = new Date(maxYear + 1, maxMonth, maxDay);
    const maxMonthDate = new Date(maxYear, maxMonth + 1, maxDay);
    const maxDayDate = new Date(maxYear, maxMonth, maxDay + 1);
    let maxMinuteDate = new Date(maxYear, maxMonth, maxDay, maxHours, maxMinutes + dateInterval);

    let i;
    // Yearly layers
    if (def.period === 'yearly') {
      if (currentDate >= minDate && currentDate <= maxYearDate) {
        yearDifference = util.yearDiff(minDate, maxYearDate);
      }
      for (i = 0; i <= (yearDifference + 1); i++) {
        dateArray.push(new Date(minYear + dateInterval, minMonth, minDay));
      }
    // Monthly layers
    } else if (def.period === 'monthly') {
      if (currentDate >= minDate && currentDate <= maxMonthDate) {
        monthDifference = util.monthDiff(minDate, maxMonthDate);
      }
      for (i = 0; i <= (monthDifference + 1); i++) {
        dateArray.push(new Date(minYear, minMonth + i, minDay));
      }
    // Daily layers
    } else if (def.period === 'daily') {
      if (currentDate >= minDate && currentDate <= maxDayDate) {
        dayDifference = util.dayDiff(minDate, maxDayDate);
      }
      for (i = 0; i <= (dayDifference + 1); i++) {
        dateArray.push(new Date(minYear, minMonth, minDay + i));
      }
    // Subdaily layers
    } else if (def.period === 'subdaily') {
      const currentDateOffset = currentDate.getTimezoneOffset() * 60000;
      const hourBeforeCurrentDate = new Date(currentDate.setMinutes(minMinutes) - currentDateOffset - (60 * 60000));
      const hourAfterCurrentDate = new Date(currentDate.setMinutes(minMinutes) - currentDateOffset + (60 * 60000));

      minDate = hourBeforeCurrentDate < minDate ? minDate : hourBeforeCurrentDate;
      maxMinuteDate = hourAfterCurrentDate > maxMinuteDate ? maxMinuteDate : hourAfterCurrentDate;

      currentDate = new Date(currentDate.getTime() - currentDateOffset);
      if (currentDate >= minDate && currentDate <= maxMinuteDate) {
        minuteDifference = util.minuteDiff(minDate, maxMinuteDate);
      }
      for (i = 0; i <= (minuteDifference + 1); i += dateInterval) {
        dateArray.push(
          new Date(
            minDate.getUTCFullYear(),
            minDate.getUTCMonth(),
            minDate.getUTCDate(),
            minDate.getUTCHours(),
            minDate.getUTCMinutes() + i,
            0
          )
        );
      }
    }
  });
  return dateArray;
};

export function serializeLayers(currentLayers, state, groupName) {
  const layers = currentLayers;
  const palettes = state.palettes[groupName];

  return layers.map((def, i) => {
    var item = {};

    if (def.id) {
      item = {
        id: def.id
      };
    }
    if (!item.attributes) {
      item.attributes = [];
    }
    if (!def.visible) {
      item.attributes.push({
        id: 'hidden'
      });
    }
    if (def.opacity < 1) {
      item.attributes.push({
        id: 'opacity',
        value: def.opacity
      });
    }

    if (def.palette && (def.custom || def.min || def.max || def.squash)) {
      // If layer has palette and palette attributes
      const paletteAttributeArray = getPaletteAttributeArray(
        def.id,
        palettes,
        state
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
  var index = lodashFindIndex(layers, {
    id: id
  });
  if (index === -1) {
    throw new Error('Invalid layer ID: ' + id);
  }
  var visibility = !layers[index].visible;

  return update(layers, { [index]: { visible: { $set: visibility } } });
}
export function removeLayer(id, layers) {
  var index = lodashFindIndex(layers, {
    id: id
  });
  if (index === -1) {
    throw new Error('Invalid layer ID: ' + id);
  }
  return update(layers, { $splice: [[index, 1]] });
}
// this function takes an array of date ranges in this format:
// [{ layer.period, dateRanges.startDate: Date, dateRanges.endDate: Date, dateRanges.dateInterval: Number}]
// the array is first sorted, and then checked for any overlap
export function dateOverlap(period, dateRanges) {
  var sortedRanges = dateRanges.sort((previous, current) => {
    // get the start date from previous and current
    var previousTime = util.parseDate(previous.startDate);
    previousTime = previousTime.getTime();
    var currentTime = util.parseDate(current.startDate);
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

  var result = sortedRanges.reduce(
    (result, current, idx, arr) => {
      // get the previous range
      if (idx === 0) {
        return result;
      }
      var previous = arr[idx - 1];

      // check for any overlap
      var previousEnd = util.parseDate(previous.endDate);
      // Add dateInterval
      if (previous.dateInterval > 1 && period === 'daily') {
        previousEnd = new Date(
          previousEnd.setTime(
            previousEnd.getTime() +
              (previous.dateInterval * 86400000 - 86400000)
          )
        );
      }
      if (period === 'monthly') {
        previousEnd = new Date(
          previousEnd.setMonth(
            previousEnd.getMonth() + (previous.dateInterval - 1)
          )
        );
      } else if (period === 'yearly') {
        previousEnd = new Date(
          previousEnd.setFullYear(
            previousEnd.getFullYear() + (previous.dateInterval - 1)
          )
        );
      }
      previousEnd = previousEnd.getTime();

      var currentStart = util.parseDate(current.startDate);
      currentStart = currentStart.getTime();

      var overlap = previousEnd >= currentStart;
      // store the result
      if (overlap) {
        // yes, there is overlap
        result.overlap = true;
        // store the specific ranges that overlap
        result.ranges.push({
          previous: previous,
          current: current
        });
      }

      return result;
    },
    {
      overlap: false,
      ranges: []
    }
  );

  // return the final results
  return result;
}
// Takes a layer id and returns a true or false value
// if the layer exists in the active layer list
//
// LODASH Find() essentially does the same thing
export function exists(layer, activeLayers) {
  var found = false;
  lodashEach(activeLayers, function(current) {
    if (layer === current.id) {
      found = true;
    }
  });
  return found;
}
// Permalink versions 1.0 and 1.1
export function layersParse11(str, config) {
  var layers = [];
  var ids = str.split(/[~,.]/);
  lodashEach(ids, function(id) {
    if (id === 'baselayers' || id === 'overlays') {
      return;
    }
    var visible = true;
    if (id.startsWith('!')) {
      visible = false;
      id = id.substring(1);
    }
    if (config.redirects && config.redirects.layers) {
      id = config.redirects.layers[id] || id;
    }
    if (!config.layers[id]) {
      console.warn('No such layer: ' + id);
      return;
    }
    var lstate = {
      id: id,
      attributes: []
    };
    if (!visible) {
      lstate.attributes.push({
        id: 'hidden',
        value: true
      });
    }
    layers.push(lstate);
  });
  return createLayerArrayFromState(layers, config);
}

// Permalink version 1.2
export function layersParse12(stateObj, config) {
  try {
    var parts;
    var str = stateObj;
    // Split by layer definitions (commas not in parens)
    var layerDefs = str.match(/[^(,]+(\([^)]*\))?,?/g);
    var lstates = [];
    lodashEach(layerDefs, function(layerDef) {
      // Get the text before any paren or comma
      var layerId = layerDef.match(/[^(,]+/)[0];
      if (config.redirects && config.redirects.layers) {
        layerId = config.redirects.layers[layerId] || layerId;
      }
      var lstate = {
        id: layerId,
        attributes: []
      };
      // Everything inside parens
      var arrayAttr = layerDef.match(/\(.*\)/);
      if (arrayAttr) {
        // Get single match and remove parens
        var strAttr = arrayAttr[0].replace(/[()]/g, '');
        // Key value pairs
        var kvps = strAttr.split(',');
        lodashEach(kvps, function(kvp) {
          parts = kvp.split('=');
          if (parts.length === 1) {
            lstate.attributes.push({
              id: parts[0],
              value: true
            });
          } else {
            lstate.attributes.push({
              id: parts[0],
              value: parts[1]
            });
          }
        });
      }
      lstates.push(lstate);
    });
    return createLayerArrayFromState(lstates, config);
  } catch (e) {
    console.warn('Error Parsing layers: ' + e);
    console.log('reverting to default layers');
    return resetLayers(config.defaults.startingLayers, config.layers);
  }
}
const createLayerArrayFromState = function(state, config) {
  let layerArray = [];
  lodashEach(state, obj => {
    if (!lodashIsUndefined(state)) {
      lodashEachRight(state, function(layerDef) {
        let hidden = false;
        let opacity = 1.0;
        let max, min, squash, custom;
        if (!config.layers[layerDef.id]) {
          console.warn('No such layer: ' + layerDef.id);
          return;
        }
        lodashEach(layerDef.attributes, function(attr) {
          if (attr.id === 'hidden') {
            hidden = true;
          }
          if (attr.id === 'opacity') {
            opacity = util.clamp(parseFloat(attr.value), 0, 1);
            if (isNaN(opacity)) opacity = 0; // "opacity=0.0" is opacity in URL, resulting in NaN
          }
          if (attr.id === 'max' && typeof attr.value === 'string') {
            const maxArray = [];
            const values = util.toArray(attr.value.split(';'));
            lodashEach(values, function(value, index) {
              if (value === '') {
                maxArray.push(undefined);
                return;
              }
              const maxValue = parseFloat(value);
              if (lodashIsNaN(maxValue)) {
                console.warn('Invalid max value: ' + value);
              } else {
                maxArray.push(maxValue);
              }
            });
            max = maxArray.length ? maxArray : undefined;
          }
          if (attr.id === 'min' && typeof attr.value === 'string') {
            const minArray = [];
            const values = util.toArray(attr.value.split(';'));
            lodashEach(values, function(value, index) {
              if (value === '') {
                minArray.push(undefined);
                return;
              }
              const minValue = parseFloat(value);
              if (lodashIsNaN(minValue)) {
                console.warn('Invalid min value: ' + value);
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
              lodashEach(values, function(value) {
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
            ...(isArray(custom) && { custom }),
            ...(isArray(min) && { min }),
            ...(isArray(squash) && { squash }),
            ...(isArray(max) && { max })
          },
          layerArray,
          config.layers
        );
      });
    }
  });
  return layerArray;
};
export function validate(errors, config) {
  var error = function(layerId, cause) {
    errors.push({
      message: 'Invalid layer: ' + layerId,
      cause: cause,
      layerRemoved: true
    });
    delete config.layers[layerId];
    lodashRemove(config.layerOrder.baselayers, function(e) {
      return e === layerId;
    });
    lodashRemove(config.layerOrder.overlays, function(e) {
      return e === layerId;
    });
  };

  var layers = lodashCloneDeep(config.layers);
  lodashEach(layers, function(layer) {
    if (!layer.group) {
      error(layer.id, 'No group defined');
      return;
    }
    if (!layer.projections) {
      error(layer.id, 'No projections defined');
    }
  });

  var orders = lodashCloneDeep(config.layerOrder);
  lodashEach(orders, function(layerId) {
    if (!config.layers[layerId]) {
      error(layerId, 'No configuration');
    }
  });
}
export function mapLocationToLayerState(
  parameters,
  stateFromLocation,
  state,
  config
) {
  if (!parameters.l1 && parameters.ca !== undefined) {
    stateFromLocation = update(stateFromLocation, {
      layers: { activeB: { $set: stateFromLocation.layers.active } }
    });
  }
  // legacy layers permalink
  if (parameters.products && !parameters.l) {
    stateFromLocation = update(stateFromLocation, {
      layers: {
        active: {
          $set: layersParse11(parameters.products, config)
        }
      }
    });
  }
  return stateFromLocation;
}
