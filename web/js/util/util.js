/* global ntptEventTag */

/* The ntptEventTag global variable is defined by
 * https://earthdata.nasa.gov/lib/ntpagetag.js
 * which is included via config.scripts in web/config/wv.json
*/

import $ from 'jquery';
import lodashEach from 'lodash/each';
import lodashIsNull from 'lodash/isNull';
import wvui from '../ui/ui';
import browser from './browser';
import { events } from './events';
import load from './load';
import Cache from 'cachai';
import closestTo from 'date-fns/closest_to';
import isBefore from 'date-fns/is_before';
import isEqual from 'date-fns/is_equal';
import isFirstDayOfMonth from 'date-fns/is_first_day_of_month';
import isLastDayOfMonth from 'date-fns/is_last_day_of_month';
import lastDayOfYear from 'date-fns/last_day_of_year';

export default (function (self) {
  var canvas = null;

  // Export other util methods
  self.browser = browser;
  self.events = events;
  self.load = load;

  // Needed anymore?
  self.LAYER_GROUPS = {
    baselayers: {
      id: 'baselayers',
      camel: 'BaseLayers',
      description: 'Base Layers'
    },
    overlays: {
      id: 'overlays',
      camel: 'Overlays',
      description: 'Overlays'
    }
  };

  self.repeat = function (value, length) {
    var result = '';
    for (var i = 0; i < length; i++) {
      result += value;
    }
    return result;
  };

  self.pad = function (value, width, padding) {
    value = '' + value;
    if (value.length < width) {
      var add = width - value.length;
      value = self.repeat(padding, add) + value;
    }
    return value;
  };

  /**
   * Creates an object representation of a query string.
   *
   * For example, for the given query string, ``"?foo=a&bar=b"``, the
   * following object is returned:
   *
   *     {
   *         foo: "a",
   *         bar: "b"
   *     }
   *
   * Escaped values in the query string are decoded. For example ``%2f``
   * becomes ``/``.
   *
   * @method fromQueryString
   * @static
   * @param {string} queryString the query string to convert to an
   * object.
   * @return {object} object representation of the query string.
   */
  self.fromQueryString = function (queryString) {
    if (!queryString) {
      return {};
    }
    if (queryString[0] === '?') {
      queryString = queryString.substring(1);
    }
    var parameters = queryString.split('&');
    var result = {};
    for (var i = 0; i < parameters.length; i++) {
      var index = parameters[i].indexOf('=');
      var key = parameters[i].substring(0, index);
      var value = parameters[i].substring(index + 1);
      result[key] = decodeURIComponent(value);
    }
    return result;
  };

  /**
   * Converts an object to a query string. For exaple, the following
   * object:
   *
   *     { foo: "a", format: "image/png" }
   *
   * converts to the following string:
   *
   *      ?foo=a&format=image%2Fpng
   *
   * @method toQueryString
   * @static
   * @param {Object} kvps object representing key/value paris to convert
   * to a query string. Values are encoded as needed.
   * @param {Array(String)} [exceptions] array of encoding exceptions.
   * Characters that would decode to these values are skipped. Example:
   *
   *     > wv.util.toQueryString({format: "image/png"}, ["%2F"]);
   *     "format=image/png"
   * @return {String} converted query string
   */
  self.toQueryString = function (kvps, exceptions) {
    exceptions = exceptions || {};
    var parts = [];
    lodashEach(kvps, function (value, key) {
      var part = key + '=' + encodeURIComponent(value);
      lodashEach(exceptions, function (exception) {
        var regexp = new RegExp(exception, 'ig');
        var decoded = decodeURIComponent(exception);
        part = part.replace(regexp, decoded);
      });
      parts.push(part);
    });
    if (parts.length === 0) {
      return '';
    }
    return '?' + parts.join('&');
  };

  /**
   * Parses a UTC ISO 8601 timestamp.
   *
   * @method parseTimestampUTC
   * @static
   * @param str {String} Date to parse in the form of
   * ``YYYY-MM-DDTHH:MM:SS.SSSZ``. Fractional seconds and the "Z"
   * time zone designator are optional.
   * @return {Date} converted string as a datetime object, throws an
   * exception if the string is invalid.
   */
  self.parseTimestampUTC = function (str) {
    return self.parseDateUTC(str);
  };
  /**
   * Gets a pixel RGBA value from Canvas
   *
   * @method getCanvasPixelData
   * @static
   * @param canvas {Object} DOM canvas Element
   * @param x {Number} X value on canvas
   * @return y {Number} Y value on canvas
   * @return {Object} Canvas image data.
   */
  self.getCanvasPixelData = function (canvas, x, y) {
    var context = canvas.getContext('2d');
    return context.getImageData(x, y, 1, 1)
      .data;
  };
  /**
   * Parses a UTC ISO 8601 date.
   *
   * @method parseDateUTC
   * @static
   * @param str {string} Date to parse in the form of YYYY-MM-DD HH:MM:SS`.
   * @return {Date} converted string as a date object, throws an exception if
   * the string is invalid
   */
  // NOTE: Older Safari doesn't like Date.parse
  self.parseDateUTC = function (dateAsString) {
    var dateTimeArr = dateAsString.split(/T/);

    var yyyymmdd = dateTimeArr[0].split(/[\s-]+/);

    // Parse elements of date and time
    var year = yyyymmdd[0];
    var month = yyyymmdd[1] - 1;
    var day = yyyymmdd[2];

    var hour = 0;
    var minute = 0;
    var second = 0;
    var millisecond = 0;

    // Use default of midnight if time is not specified
    if (dateTimeArr.length > 1) {
      var hhmmss = dateTimeArr[1].split(/[:.Z]/);
      hour = hhmmss[0] || 0;
      minute = hhmmss[1] || 0;
      second = hhmmss[2] || 0;
      millisecond = hhmmss[3] || 0;
    }

    var date = new Date(Date.UTC(year, month, day, hour, minute, second,
      millisecond));
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date: ' + dateAsString);
    }
    return date;
  };
  /**
   * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
   *
   * @param {String} text The text to be rendered.
   * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
   *
   * @see http://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
   */
  self.getTextWidth = function (text, font) {
    // re-use canvas object for better performance
    canvas = canvas || document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
  };

  /**
   * Julian date, padded with two zeros
   * (to ensure the julian date is always in DDD format).
   *
   * @param  {Date} date {Date} the date to convert
   * @return {string} Julian date string in the form of `YYYYDDD`
   */
  self.toJulianDate = function (date) {
    var jStart, jDate;
    jStart = self.parseDateUTC(date.getUTCFullYear() + '-01-01');
    jDate = '00' + (1 + Math.ceil((date.getTime() - jStart) / 86400000));
    return date.getUTCFullYear() + (jDate).substr((jDate.length) - 3);
  };

  /**
   * Converts a date into an ISO string with only the date portion.
   *
   * @method toISOStringDate
   * @static
   * @param date {Date} the date to convert
   * @return {string} ISO string in the form of ``YYYY-MM-DD``.
   */
  self.toISOStringDate = function (date) {
    return date.toISOString()
      .split('T')[0];
  };

  /**
   * Converts a time into an ISO string without miliseconds.
   *
   * @method toISOStringSeconds
   * @static
   * @param  {Date} date the date to convert
   * @return {string} ISO string in the form of `YYYY-MM-DDThh:mm:ssZ`.
   */
  self.toISOStringSeconds = function (date) {
    return date.toISOString().split('.')[0] + 'Z';
  };

  /**
   * Converts a time into a HH:MM string
   *
   * @method toHourMinutes
   * @static
   * @param date {Date} the date to convert
   * @return {string} ISO string in the form of HH:MM`.
   */
  self.toHourMinutes = function (date) {
    var time = date.toISOString()
      .split('T')[1];
    var parts = time.split('.')[0].split(':');
    return parts[0] + ':' + parts[1];
  };

  /**
   * Calculates percent of date between two other dates
   *
   * @method getDatePercent
   * @static
   * @param current {Date} current date
   * @param start {Date} start date
   * @param end {Date} end date
   * @return {number} decimal percent
   */
  self.getDatePercent = function (current, start, end) {
    return Math.round((current - start) / (end - start));
  };

  self.roundTimeOneMinute = function (time) {
    var timeToReturn = new Date(time);

    timeToReturn.setMilliseconds(Math.round(timeToReturn.getMilliseconds() / 1000) * 1000);
    timeToReturn.setSeconds(Math.round(timeToReturn.getSeconds() / 60) * 60);
    timeToReturn.setMinutes(Math.round(timeToReturn.getMinutes()));
    return timeToReturn;
  };

  self.roundTimeTenMinute = function (time) {
    var timeToReturn = new Date(time);

    timeToReturn.setMilliseconds(Math.round(timeToReturn.getMilliseconds() / 1000) * 1000);
    timeToReturn.setSeconds(Math.round(timeToReturn.getSeconds() / 60) * 60);
    timeToReturn.setMinutes(Math.round(timeToReturn.getMinutes() / 10) * 10);
    return timeToReturn;
  };

  /**
   * Sets a date to UTC midnight.
   *
   * @method clearTimeUTC
   * @static
   * @param date {Date} date to set the UTC hours, minutes, and seconds
   * to zero.
   * @return {Date} the date object
   */
  self.clearTimeUTC = function (date) {
    date.setUTCHours(0);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date;
  };

  self.dateAdd = function (date, interval, amount) {
    var month, maxDay, year;
    var newDate = new Date(date.getTime());
    switch (interval) {
      case 'minute':
        newDate.setUTCMinutes(newDate.getUTCMinutes() + amount);
        break;
      case 'hour':
        newDate.setUTCHours(newDate.getUTCHours() + amount);
        break;
      case 'day':
        newDate.setUTCDate(newDate.getUTCDate() + amount);
        break;
      case 'month':
        year = newDate.getUTCFullYear();
        month = newDate.getUTCMonth();
        maxDay = new Date(year, month + amount + 1, 0)
          .getUTCDate();
        if (maxDay <= date.getUTCDate()) {
          newDate.setUTCDate(maxDay);
        }
        newDate.setUTCMonth(month + amount);
        break;
      case 'year':
        newDate.setUTCFullYear(newDate.getUTCFullYear() + amount);
        break;
      default:
        throw new Error('[dateAdd] Invalid interval: ' + interval);
    }
    return newDate;
  };
  self.getNumberOfDays = function(start, end, interval) {
    var i = 1;
    var currentDate = start;
    while (currentDate < end) {
      i++;
      currentDate = self.dateAdd(currentDate, interval, 1);
    }
    return i;
  };
  self.daysInMonth = function (d) {
    var year;
    var month;
    if (d.getUTCFullYear) {
      year = d.getUTCFullYear();
      month = d.getUTCMonth();
    } else {
      year = d.year;
      month = d.month;
    }
    var lastDay = new Date(Date.UTC(year, month + 1, 0));
    return lastDay.getUTCDate();
  };

  self.daysInYear = function (time) {
    var start = new Date(time.getUTCFullYear(), 0, 0);
    var diff = (time - start) + ((start.getTimezoneOffset() - time.getTimezoneOffset()) * 60 * 1000);
    var oneDay = 1000 * 60 * 60 * 24;
    var day = Math.floor(diff / oneDay);
    return day;
  };

  self.objectLength = function (obj) {
    return Object.keys(obj)
      .length;
  };

  /**
   * Returns the day of week for the given date object
   *
   * @method giveWeekDay
   * @static
   * @param date {Date} date object of which to determine week day
   * @return {String} the full name of the day of the week
   */
  self.giveWeekDay = function (d) {
    var day = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];

    return day[d.getUTCDay()];
  };
  /**
   * Returns the month of the year for the given date object
   *
   * @method giveMonth
   * @static
   * @param date {Date} date object of which to determine the Month name
   * @return {String} the full name of the month
   */
  self.giveMonth = function (d) {
    var month = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    return month[d.getUTCMonth()];
  };

  self.clamp = function (val, min, max) {
    if (val < min) {
      return min;
    }
    if (val > max) {
      return max;
    }
    return val;
  };

  self.roll = function (val, min, max) {
    if (val < min) {
      return max - (min - val) + 1;
    }
    if (val > max) {
      return min + (val - max) - 1;
    }
    return val;
  };

  self.minDate = function () {
    return new Date(Date.UTC(1000, 0, 1, 0, 0));
  };

  self.maxDate = function () {
    return new Date(Date.UTC(3000, 11, 30, 23, 59));
  };

  self.rollRange = function (date, interval, minDate, maxDate) {
    var year = date.getUTCFullYear();
    var month = date.getUTCMonth();
    var first, last;
    switch (interval) {
      case 'minute':
        var firstMinute = new Date(Date.UTC(year, month, 1, 0, 0));
        var lastMinute = new Date(Date.UTC(year, month, self.daysInMonth(date), 23, 59));
        first = new Date(Math.max(firstMinute, minDate))
          .getUTCMinutes();
        last = new Date(Math.min(lastMinute, maxDate))
          .getUTCMinutes();
        break;
      case 'hour':
        var firstHour = new Date(Date.UTC(year, month, 1, 0));
        var lastHour = new Date(Date.UTC(year, month, self.daysInMonth(date), 23));
        first = new Date(Math.max(firstHour, minDate))
          .getUTCHours();
        last = new Date(Math.min(lastHour, maxDate))
          .getUTCHours();
        break;
      case 'day':
        var firstDay = new Date(Date.UTC(year, month, 1));
        var lastDay = new Date(Date.UTC(year, month, self.daysInMonth(date)));
        first = new Date(Math.max(firstDay, minDate))
          .getUTCDate();
        last = new Date(Math.min(lastDay, maxDate))
          .getUTCDate();
        break;
      case 'month':
        var firstMonth = new Date(Date.UTC(year, 0, 1));
        var lastMonth = new Date(Date.UTC(year, 11, 31));
        first = new Date(Math.max(firstMonth, minDate))
          .getUTCMonth();
        last = new Date(Math.min(lastMonth, maxDate))
          .getUTCMonth();
        break;
      case 'year':
        var firstYear = self.minDate();
        var lastYear = self.maxDate();
        first = new Date(Math.max(firstYear, minDate))
          .getUTCFullYear();
        last = new Date(Math.min(lastYear, maxDate))
          .getUTCFullYear();
        break;
    }
    return {
      first: first,
      last: last
    };
  };

  self.rollDate = function (date, interval, amount, minDate, maxDate) {
    minDate = minDate || self.minDate();
    maxDate = maxDate || self.maxDate();
    var range = self.rollRange(date, interval, minDate, maxDate);
    var min = range.first;
    var max = range.last;
    var minute = date.getUTCMinutes();
    var hour = date.getUTCHours();
    var day = date.getUTCDate();
    var month = date.getUTCMonth();
    var year = date.getUTCFullYear();
    switch (interval) {
      // TODO: change minute and hour hard-coded min & max to be dynamic
      case 'minute':
        minute = self.roll(minute + amount, 0, 59);
        break;
      case 'hour':
        hour = self.roll(hour + amount, 0, 23);
        break;
      case 'day':
        day = self.roll(day + amount, min, max);
        break;
      case 'month':
        month = self.roll(month + amount, min, max);
        break;
      case 'year':
        year = self.roll(year + amount, min, max);
        break;
      default:
        throw new Error('[rollDate] Invalid interval: ' + interval);
    }
    var daysInMonth = self.daysInMonth({
      year: year,
      month: month
    });
    if (day > daysInMonth) {
      day = daysInMonth;
    }
    var newDate = new Date(Date.UTC(year, month, day, hour, minute));
    newDate = new Date(self.clamp(newDate, minDate, maxDate));
    return newDate;
  };

  /**
   * Converts a date into a compact string representation.
   *
   * @method toCompactTimestamp
   * @static
   * @param date {Date} the date to convert
   * @return {String} string representation in the form of
   * ``YYYYMMDDHHMMSSsss``
   */
  self.toCompactTimestamp = function (date) {
    return date.toISOString()
      .replace(/[-:TZ.]/g, '');
  };

  /**
   * Converts a compact timestamp into a date.
   *
   * @method fromCompactTimestamp
   * @static
   * @param str {String} the string to convert in the form of
   * ``YYYYMMDDHHMMSSsss``.
   * @return {Date} the converted date object.
   */
  self.fromCompactTimestamp = function (str) {
    var v = str.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{3})/);
    if (lodashIsNull(v)) {
      throw new Error('Invalid timestamp:' + str);
    }
    return new Date(Date.UTC(
      parseInt(v[1], 10),
      parseInt(v[2] - 1, 10),
      parseInt(v[3], 10),
      parseInt(v[4], 10),
      parseInt(v[5], 10),
      parseInt(v[6], 10),
      parseInt(v[7], 10)));
  };

  /**
   * Gets the current time. Use this instead of the Date methods to allow
   * debugging alternate "now" times.
   *
   * @method now
   * @static
   * @return {Date} The current time or an overriden value.
   */
  var now = function () {
    return new Date();
  };
  self.now = now;
  self.resetNow = function () {
    self.now = now;
  };

  /**
   * Gets the current day. Use this instead of the Date methods to allow
   * debugging alternate "now" dates.
   *
   * @method today
   * @static
   * @return {Date} The current time with the UTC hours, minutes, and seconds
   * fields set to zero or an overriden value.
   */
  self.today = function () {
    return self.clearTimeUTC(self.now());
  };

  /**
   * General error handler.
   *
   * This function delegates to
   * {{#crossLink "wv.ui/error:method"}}wv.ui.error{{/crossLink}}.
   * For custom error handling, replace this function.
   *
   * @method error
   * @static
   * @param {string} message Message to display to the end user.
   * @param {Exception} cause The exception object that caused the error
   */
  self.error = function (message, cause) {
    wvui.error(message, cause);
  };

  /**
   * General warning handler.
   *
   * Prints the messages to the console.
   *
   * @method warn
   * @static
   * @param {object*} messages Messages to display to the end user.
   */
  self.warn = (console && console.warn && console.warn.bind)
    ? console.warn.bind(console) : function () {};

  self.hexToRGB = function (str) {
    return 'rgb(' +
      parseInt(str.substring(0, 2), 16) + ',' +
      parseInt(str.substring(2, 4), 16) + ',' +
      parseInt(str.substring(4, 6), 16) + ')';
  };

  self.hexToRGBA = function (str) {
    return 'rgba(' +
      parseInt(str.substring(0, 2), 16) + ',' +
      parseInt(str.substring(2, 4), 16) + ',' +
      parseInt(str.substring(4, 6), 16) + ',' +
      parseInt(str.substring(6, 8), 16) + ')';
  };

  self.rgbaToHex = function (r, g, b) {
    function hex (c) {
      var strHex = c.toString(16);
      return strHex.length === 1 ? '0' + strHex : strHex;
    }
    return hex(r) + hex(g) + hex(b) + 'ff';
  };

  self.hexColorDelta = function (hex1, hex2) {
    var r1 = parseInt(hex1.substring(0, 2), 16);
    var g1 = parseInt(hex1.substring(2, 4), 16);
    var b1 = parseInt(hex1.substring(4, 6), 16);
    var r2 = parseInt(hex2.substring(0, 2), 16);
    var g2 = parseInt(hex2.substring(2, 4), 16);
    var b2 = parseInt(hex2.substring(4, 6), 16);
    // calculate differences in 3D Space
    return Math.sqrt(Math.pow((r1 - r2), 2) + Math.pow((g1 - g2), 2) + Math.pow((b1 - b2), 2));
  };

  /**
   * Submits an AJAX request or retreives the result from the cache.
   *
   * @class wv.util.ajaxCache
   * @constructor
   * @param {Number} [spec.size] maximum number of items to store in the
   * cache.
   * @param {Object} [spec.options] options to pass to jscache on setItem.
   *
   */
  self.ajaxCache = function (spec) {
    spec = spec || {};
    var size = spec.size || null;
    var options = spec.options || {};
    var cache = new Cache(size);

    return {
      /**
       * Submits an AJAX request using jQuery.ajax or retrieves the
       * results from cache.
       *
       * @method submit
       * @param {Object} parameters Parameters to pass to the jQuery.ajax
       * call.
       * @return {jQuery.Deferred} a deferred object that will resolve
       * when the query returns, or resolves immedately if the results
       * are cached.
       */
      submit: function (parameters) {
        var key = 'url=' + parameters.url;
        if (parameters.data) {
          key += '&query=' + $.param(parameters.data, true);
        }
        var results = cache.getItem(key);

        if (results) {
          return $.Deferred()
            .resolve(results)
            .promise();
        } else {
          var promise = $.ajax(parameters);
          promise.done(function (results) {
            cache.setItem(key, results, options);
          });
          return promise;
        }
      }
    };
  };

  /**
   * Wraps a function in a try/catch block that invokes wv.util.error
   * if an exception is thrown.
   *
   * @param {function} func the function to wrap
   * @return the function wrapped in a try/catch block.
   */
  self.wrap = function (func) {
    return function () {
      try {
        return func.apply(func, arguments);
      } catch (error) {
        self.error(error);
      }
    };
  };

  /**
   * Http request using promises
   * http://www.html5rocks.com/en/tutorials/es6/promises/#toc-promisifying-xmlhttprequest
   *
   * @method get
   * @param {url} func the function to wrap
   * @return {object} Promise
   */
  self.get = function (url) {
    // Return a new promise.
    return new Promise(function (resolve, reject) {
      // Do the usual XHR stuff
      var req = new XMLHttpRequest();
      req.open('GET', url);

      req.onload = function () {
        // This is called even on 404 etc
        // so check the status
        if (req.status === 200) {
          // Resolve the promise with the response text
          resolve(req.response);
        } else {
          // Otherwise reject with the status text
          // which will hopefully be a meaningful error
          reject(Error(req.statusText));
        }
      };
      // Handle network errors
      req.onerror = function () {
        reject(Error('Network Error'));
      };
      // Make the request
      req.send();
    });
  };

  // FIXME: Should be replaced with $.when
  self.ajaxJoin = function (calls) {
    var completed = 0;
    var result = {};
    var deferred = $.Deferred();

    $.each(calls, function (index, call) {
      call.promise.done(function (data) {
        result[call.item] = data;
        completed += 1;
        if (completed === calls.length) {
          deferred.resolve(result);
        }
      })
        .fail(function (jqXHR, textStatus, errorThrown) {
          deferred.reject(jqXHR, textStatus, errorThrown);
        });
    });

    return deferred.promise();
  };

  // http://totaldev.com/content/escaping-characters-get-valid-jquery-id
  self.jqueryEscape = function (str) {
    return encodeURIComponent(str)
      .replace(/([;&,.+*~':"!^#$%@[]()=>|])/g, '\\$1');
  };

  self.metrics = function () {
    if (window.ntptEventTag) {
      ntptEventTag.apply(null, arguments);
    } else {
      console.log('no metrics');
    }
  };

  self.key = {
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    DOWN: 40
  };

  self.formatDMS = function (value, type) {
    var width, signs;
    if (type === 'longitude') {
      width = 3;
      signs = 'EW';
    } else {
      width = 2;
      signs = 'NS';
    }
    var sign = (value >= 0) ? signs[0] : signs[1];
    value = Math.abs(value);
    var degrees = Math.floor(value);
    var minutes = Math.floor((value * 60) - (degrees * 60));
    var seconds = Math.floor((value * 3600) - (degrees * 3600) - (minutes * 60));

    var sdegrees = self.pad(degrees, width, ' ');
    var sminutes = self.pad(minutes, 2, '0');
    var sseconds = self.pad(seconds, 2, '0');
    return sdegrees + '&deg;' + sminutes + '\'' + sseconds + '"' + sign;
  };

  self.setCoordinateFormat = function (type) {
    if (!browser.localStorage) return;
    if (type !== 'latlon-dd' && type !== 'latlon-dms') {
      throw new Error('Invalid coordinate format: ' + type);
    }
    localStorage.setItem('coordinateFormat', type);
  };

  self.getCoordinateFormat = function () {
    if (!browser.localStorage) return 'latlon-dd';
    return localStorage.getItem('coordinateFormat') || 'latlon-dd';
  };

  self.formatCoordinate = function (coord, format) {
    var type = format || self.getCoordinateFormat();
    if (type === 'latlon-dms') {
      return self.formatDMS(coord[1], 'latitude') + ', ' +
        self.formatDMS(coord[0], 'longitude');
    } else {
      return coord[1].toFixed(4) + '&deg;, ' +
        coord[0].toFixed(4) + '&deg;';
    }
  };
  // allows simple printf functionality with strings
  // arguments array contains all args passed. String must be formatted so that first replacement starts with "{1}"
  // usage example: wv.util.format("{1}{2}",'World','view')
  self.format = function () {
    var formatted = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
      var regexp = new RegExp('\\{' + i + '\\}', 'gi');
      formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
  };

  self.toArray = function (value) {
    if (!value) {
      return [];
    }
    if (value.constructor !== Array) {
      value = [value];
    }
    return value;
  };

  // Returns the number of months between two dates
  self.yearDiff = function(startDate, endDate) {
    var year1 = startDate.getFullYear();
    var year2 = endDate.getFullYear();
    return year2 - year1;
  };

  // Returns the number of months between two dates
  self.monthDiff = function(startDate, endDate) {
    var year1 = startDate.getFullYear();
    var year2 = endDate.getFullYear();
    var month1 = startDate.getMonth();
    var month2 = endDate.getMonth();
    if (month1 === 0) {
      month1++;
      month2++;
    }
    var numberOfMonths = (year2 - year1) * 12 + (month2 - month1);
    return numberOfMonths;
  };

  self.dayDiff = function (startDate, endDate) {
    var date1 = new Date(startDate);
    var date2 = new Date(endDate);
    var timeDiff = Math.abs(date2.getTime() - date1.getTime());
    var dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return dayDiff;
  };

  /**
   * Return an array of dates based on the dateRange the current date falls in.
   *
   * @method datesinDateRanges
   * @param  {object} def           A layer object
   * @param  {object} date          A date object
   * @param  {boolean} containRange If true, return dates from all ranges.
   *                                If false, only return the dates from the range the current date falls in.
   * @return {array}                An array of dates with normalized timezones
   */
  self.datesinDateRanges = function (def, date, containRange) {
    var dateArray = [];
    var currentDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));

    lodashEach(def.dateRanges, function (dateRange) {
      var yearDifference;
      var monthDifference;
      var dayDifference;
      var maxYearDate;
      var maxMonthDate;
      var maxDayDate;
      let dateInterval = dateRange.dateInterval;
      let minDate = new Date(dateRange.startDate);
      let maxDate = new Date(dateRange.endDate);

      // Offset timezone
      minDate = new Date(minDate.getTime() + (minDate.getTimezoneOffset() * 60000));
      maxDate = new Date(maxDate.getTime() + (maxDate.getTimezoneOffset() * 60000));
      maxYearDate = new Date(maxDate.getUTCFullYear() + 1, maxDate.getUTCMonth(), maxDate.getUTCDate());
      maxMonthDate = new Date(maxDate.getUTCFullYear(), maxDate.getUTCMonth() + 1, maxDate.getUTCDate());
      maxDayDate = new Date(maxDate.getUTCFullYear(), maxDate.getUTCMonth(), maxDate.getUTCDate() + 1);

      if (def.period === 'yearly') {
        // if containgeRange is true, check if date is between current dateRange.startDate && dateRange.endDate
        if (!containRange) {
          yearDifference = self.yearDiff(minDate, maxYearDate);
        } else if (currentDate >= minDate && currentDate <= maxYearDate) {
          // Find the yearDifference of the endDate vs startDate
          yearDifference = self.yearDiff(minDate, maxYearDate);
        }

        // Create array of all possible request dates by saying for interval++ <= yearDifference
        for (dateInterval = 0; dateInterval <= (yearDifference + 1); dateInterval++) {
          dateArray.push(new Date(minDate.getUTCFullYear() + dateInterval, minDate.getUTCMonth(), minDate.getUTCDate(), 0, 0, 0));
        }
      } else if (def.period === 'monthly') {
        // if containgeRange is true, check if date is between current dateRange.startDate && dateRange.endDate
        if (!containRange) {
          monthDifference = self.monthDiff(minDate, maxMonthDate);
        } else if (currentDate >= minDate && currentDate <= maxMonthDate) {
          // Find the monthDifference of the endDate vs startDate
          monthDifference = self.monthDiff(minDate, maxMonthDate);
        }

        // Create array of all possible request dates by saying for interval++ <= monthDifference
        for (dateInterval = 0; dateInterval <= (monthDifference + 1); dateInterval++) {
          dateArray.push(new Date(minDate.getUTCFullYear(), minDate.getUTCMonth() + dateInterval, minDate.getUTCDate(), 0, 0, 0));
        }
      } else if (def.period === 'daily') {
        // if containgeRange is true, check if date is between current dateRange.startDate && dateRange.endDate
        if (!containRange) {
          dayDifference = self.dayDiff(minDate, maxDayDate);
        } else if (currentDate >= minDate && currentDate <= maxDayDate) {
          // Find the dayDifference of the endDate vs startDate
          dayDifference = self.dayDiff(minDate, maxDayDate);
        }

        // Create array of all possible request dates by saying for interval++ <= dayDifference
        for (dateInterval = 0; dateInterval <= (dayDifference + 1); dateInterval++) {
          dateArray.push(new Date(minDate.getUTCFullYear(), minDate.getUTCMonth(), minDate.getUTCDate() + dateInterval, 0, 0, 0));
        }
      }
    });
    return dateArray;
  };

  /**
   * Find the closest previous date from an array of dates
   *
   * @param  {object} def       A layer definition
   * @param  {object} date      A date to compare against the array of dates
   * @param  {array} dateArray  An array of dates
   * @return {object}           The date object with normalized timeszone.
   */
  self.prevDateInDateRange = function (def, date, dateArray) {
    var currentDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    if (!dateArray) return date;
    if ((def.period === 'monthly' && (isFirstDayOfMonth(currentDate) || isLastDayOfMonth(currentDate))) ||
        (def.period === 'yearly' && ((currentDate.getDate() === 1 &&
          currentDate.getMonth() === 0) || (currentDate === lastDayOfYear(currentDate))))) return date;
    // Return an array of the closest available dates within the range
    var closestAvailableDates = [];
    lodashEach(dateArray, function(rangeDate) {
      if (isBefore(rangeDate, currentDate) || isEqual(rangeDate, currentDate)) {
        closestAvailableDates.push(rangeDate);
      }
    });

    // Find the closest dates within the current array
    var closestDate = closestTo(currentDate, closestAvailableDates);

    if (closestDate) {
      return closestDate;
    } else {
      return date;
    }
  };

  return self;
})({});
