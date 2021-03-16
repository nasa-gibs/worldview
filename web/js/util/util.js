import {
  isObject as lodashIsObject,
  each as lodashEach,
} from 'lodash';
import moment from 'moment';
import browser from './browser';
import events from './events';
import load from './load';
import safeLocalStorage from './local-storage';

const { COORDINATE_FORMAT } = safeLocalStorage.keys;

export default (function(self) {
  let canvas = null;

  // Export other util methods
  self.browser = browser;
  self.events = events;
  self.load = load;
  self.monthStringArray = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];

  self.repeat = function(value, length) {
    let result = '';
    for (let i = 0; i < length; i += 1) {
      result += value;
    }
    return result;
  };

  self.pad = function(value, width, padding) {
    value = `${value}`;
    if (value.length < width) {
      const add = width - value.length;
      value = self.repeat(padding, add) + value;
    }
    return value;
  };
  self.preventPinch = function(e) {
    if (e.deltaY && !Number.isInteger(e.deltaY)) {
      e.stopPropagation();
      e.preventDefault();
    }
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
  self.fromQueryString = function(queryString) {
    if (!queryString) {
      return {};
    }
    if (queryString[0] === '?') {
      queryString = queryString.substring(1);
    }
    const parameters = queryString.split('&');
    const result = {};
    for (let i = 0; i < parameters.length; i += 1) {
      const index = parameters[i].indexOf('=');
      const key = parameters[i].substring(0, index);
      const value = parameters[i].substring(index + 1);
      result[key] = decodeURIComponent(value);
    }
    return result;
  };
  self.elapsed = function(message, startTime, parameters) {
    if (parameters && !parameters.elapsed) return;
    const t = Date.now() - startTime;
    console.log(t, message);
    return t;
  };

  /**
   * Converts an object to a query string. For example, the following
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
  self.toQueryString = function(kvps, exceptions = {}) {
    const parts = [];
    lodashEach(kvps, (value, key) => {
      if (!value) return;
      let part = `${key}=${encodeURIComponent(value)}`;
      lodashEach(exceptions, (exception) => {
        const regexp = new RegExp(exception, 'ig');
        const decoded = decodeURIComponent(exception);
        part = part.replace(regexp, decoded);
      });
      parts.push(part);
    });
    if (parts.length === 0) {
      return '';
    }
    return `?${parts.join('&')}`;
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
  self.parseTimestampUTC = function(str) {
    return self.parseDateUTC(str);
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
  self.parseDateUTC = function(dateAsString) {
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
    const date = new Date(Date.UTC(year, month, day, hour, minute, second,
      millisecond));
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateAsString}`);
    }
    return date;
  };
  self.appendAttributesForURL = function(item) {
    if (lodashIsObject(item)) {
      let part = item.id || '';
      const attributes = [];
      if (item.attributes && item.attributes.length > 0) {
        lodashEach(item.attributes, (attribute) => {
          if (attribute.value) {
            attributes.push(`${attribute.id}=${attribute.value}`);
          } else {
            attributes.push(attribute.id);
          }
        });
        part += `(${attributes.join(',')})`;
      }
      return part;
    }
    self.warn(`Is not an object: ${item}`);
    return '';
  };
  /**
   * Parses a UTC ISO 8601 date to a non UTC date
   *
   * @method parseDate
   * @static
   * @param str {string} Date to parse in the form of YYYY-MM-DDTHH:MM:SSZ`.
   * @return {Date} converted string as a non UTC date object, throws an exception if
   * the string is invalid
   */
  self.parseDate = function(dateAsString) {
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
    const date = new Date(year, month, day, hour, minute, second,
      millisecond);
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateAsString}`);
    }
    return date;
  };

  self.coverageDateFormatter = function(dateType, date, period) {
    let dateString;
    date = this.parseDate(date);

    switch (period) {
      case 'subdaily':
        dateString = `${moment(date).format('DD MMMM YYYY HH:mm')}Z`;
        break;

      case 'yearly':
        if (dateType === 'END-DATE') date.setFullYear(date.getFullYear() - 1);
        dateString = moment(date).format('YYYY');
        break;

      case 'monthly':
        if (dateType === 'END-DATE') date.setMonth(date.getMonth() - 1);
        dateString = moment(date).format('MMMM YYYY');
        break;

      default:
        dateString = moment(date).format('DD MMMM YYYY');
        break;
    }

    return dateString;
  };

  /**
   * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
   *
   * @param {String} text The text to be rendered.
   * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
   *
   * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
   */
  self.getTextWidth = function(text, font) {
    // re-use canvas object for better performance
    canvas = canvas || document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  };

  /**
   * Converts a date into an ISO string with only the date portion.
   *
   * @method toISOStringDate
   * @static
   * @param date {Date} the date to convert
   * @return {string} ISO string in the form of ``YYYY-MM-DD``.
   */
  self.toISOStringDate = function(date) {
    return date.toISOString()
      .split('T')[0];
  };

  /**
   * Converts a time into an ISO string without milliseconds.
   *
   * @method toISOStringSeconds
   * @static
   * @param  {Date} date the date to convert
   * @return {string} ISO string in the form of `YYYY-MM-DDThh:mm:ssZ`.
   */
  self.toISOStringSeconds = function(date) {
    return `${date.toISOString().split('.')[0]}Z`;
  };

  /**
   * Converts a time into an ISO string without seconds.
   *
   * @method toISOStringMinutes
   * @static
   * @param  {Date} date the date to convert
   * @return {string} ISO string in the form of `YYYY-MM-DDThh:mmZ`.
   */
  self.toISOStringMinutes = function(date) {
    const parts = date.toISOString().split(':');
    return `${parts[0]}:${parts[1]}Z`;
  };

  /**
   * Converts a time into a HH:MM string
   *
   * @method toHourMinutes
   * @static
   * @param date {Date} the date to convert
   * @return {string} ISO string in the form of HH:MM`.
   */
  self.toHourMinutes = function(date) {
    const time = date.toISOString()
      .split('T')[1];
    const parts = time.split('.')[0].split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  /**
   * Round input time to one minute
   *
   * @method roundTimeOneMinute
   * @static
   * @param time {Date} date
   * @return {number} rounded date
   */
  self.roundTimeOneMinute = function(time) {
    const timeToReturn = new Date(time);

    timeToReturn.setMilliseconds(Math.round(timeToReturn.getMilliseconds() / 1000) * 1000);
    timeToReturn.setSeconds(Math.round(timeToReturn.getSeconds() / 60) * 60);
    timeToReturn.setMinutes(Math.round(timeToReturn.getMinutes()));
    return timeToReturn;
  };

  /**
   * Round input time to quarter hour
   *
   * @method roundTimeQuarterHour
   * @static
   * @param time {Date} date
   * @return {number} rounded date
   */
  self.roundTimeQuarterHour = function(time) {
    const timeToReturn = new Date(time);

    timeToReturn.setMilliseconds(Math.round(timeToReturn.getMilliseconds() / 1000) * 1000);
    timeToReturn.setSeconds(Math.round(timeToReturn.getSeconds() / 60) * 60);
    timeToReturn.setMinutes(Math.round(timeToReturn.getMinutes() / 15) * 15);
    return timeToReturn;
  };

  /**
   * Remove spaces and combine value
   *
   * @method cleanId
   * @static
   * @param str {String} String
   * @return {string} cleaned str
   */
  self.cleanId = function(str) {
    return str.replace(/\W/g, '_');
  };
  /**
   * Returns a new date from input date set to UTC midnight.
   *
   * @method clearTimeUTC
   * @static
   * @param date {Date} date to set the UTC hours, minutes, and seconds
   * to zero.
   * @return {Date} new date object
   */
  self.clearTimeUTC = function(date) {
    const newDate = new Date(date);
    newDate.setUTCHours(0, 0, 0, 0);
    return newDate;
  };

  self.dateAdd = function(date, interval, amount) {
    let month; let maxDay; let
      year;
    const newDate = new Date(date);
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
        throw new Error(`[dateAdd] Invalid interval: ${interval}`);
    }
    return newDate;
  };

  self.getNumberOfDays = function(start, end, interval, increment, maxToCheck) {
    increment = increment || 1;
    let i = 1;
    let currentDate = start;
    while (currentDate < end) {
      i += 1;
      currentDate = self.dateAdd(currentDate, interval, increment);
      // if checking for a max number limit, break out after reaching it
      if (maxToCheck && i >= maxToCheck) {
        return i;
      }
    }
    return i;
  };

  self.daysInMonth = function(d) {
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

  self.daysInYear = function(date) {
    const jStart = self.parseDateUTC(`${date.getUTCFullYear()}-01-01`);
    const jDate = `00${Math.ceil((date.getTime() - jStart) / 86400000) + 1}`;
    return jDate.substr(jDate.length - 3);
  };

  self.objectLength = function(obj) {
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
  self.giveWeekDay = function(d) {
    const day = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
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
  self.giveMonth = function(d) {
    const month = [
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
      'December',
    ];

    return month[d.getUTCMonth()];
  };

  self.clamp = function(val, min, max) {
    if (val < min) {
      return min;
    }
    if (val > max) {
      return max;
    }
    return val;
  };

  self.roll = function(val, min, max) {
    if (val < min) {
      return max - (min - val) + 1;
    }
    if (val > max) {
      return min + (val - max) - 1;
    }
    return val;
  };

  self.minDate = function() {
    return new Date(Date.UTC(1000, 0, 1, 0, 0));
  };

  self.maxDate = function() {
    return new Date(Date.UTC(3000, 11, 30, 23, 59));
  };

  self.rollRange = function(date, interval, minDate, maxDate) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    let first;
    let last;
    switch (interval) {
      case 'minute': {
        const firstMinute = new Date(Date.UTC(year, month, 1, 0, 0));
        const lastMinute = new Date(Date.UTC(year, month, self.daysInMonth(date), 23, 59));
        first = new Date(Math.max(firstMinute, minDate))
          .getUTCMinutes();
        last = new Date(Math.min(lastMinute, maxDate))
          .getUTCMinutes();
        break;
      }
      case 'hour': {
        const firstHour = new Date(Date.UTC(year, month, 1, 0));
        const lastHour = new Date(Date.UTC(year, month, self.daysInMonth(date), 23));
        first = new Date(Math.max(firstHour, minDate))
          .getUTCHours();
        last = new Date(Math.min(lastHour, maxDate))
          .getUTCHours();
        break;
      }
      case 'day': {
        const firstDay = new Date(Date.UTC(year, month, 1));
        const lastDay = new Date(Date.UTC(year, month, self.daysInMonth(date)));
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
        const firstYear = self.minDate();
        const lastYear = self.maxDate();
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

  self.rollDate = function(date, interval, amount, minDate, maxDate) {
    minDate = minDate || self.minDate();
    maxDate = maxDate || self.maxDate();
    const range = self.rollRange(date, interval, minDate, maxDate);
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
        throw new Error(`[rollDate] Invalid interval: ${interval}`);
    }
    const daysInMonth = self.daysInMonth({
      year,
      month,
    });
    if (day > daysInMonth) {
      day = daysInMonth;
    }
    let newDate = new Date(Date.UTC(year, month, day, hour, minute, second));
    newDate = new Date(self.clamp(newDate, minDate, maxDate));
    return newDate;
  };

  /**
   * Gets the current time. Use this instead of the Date methods to allow
   * debugging alternate "now" times.
   *
   * @method now
   * @static
   * @return {Date} The current time or an overridden value.
   */
  const now = function() {
    return new Date();
  };

  self.now = now;

  /**
   * Gets the current day. Use this instead of the Date methods to allow
   * debugging alternate "now" dates.
   *
   * @method today
   * @static
   * @return {Date} The current time with the UTC hours, minutes, and seconds
   * fields set to zero or an overridden value.
   */
  self.today = function() {
    return self.now();
  };

  self.yesterday = function() {
    const now = new Date();
    return new Date(now.setDate(now.getDate() - 1));
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
  self.warn = console && console.warn && console.warn.bind
    ? console.warn.bind(console) : function() { };

  self.hexToRGB = function(str) {
    return `rgb(${
      parseInt(str.substring(0, 2), 16)},${
      parseInt(str.substring(2, 4), 16)},${
      parseInt(str.substring(4, 6), 16)})`;
  };

  self.hexToRGBA = function(str) {
    return `rgba(${
      parseInt(str.substring(0, 2), 16)},${
      parseInt(str.substring(2, 4), 16)},${
      parseInt(str.substring(4, 6), 16)},${
      parseInt(str.substring(6, 8), 16)})`;
  };

  self.rgbaToHex = function(r, g, b) {
    function hex(c) {
      const strHex = c.toString(16);
      return strHex.length === 1 ? `0${strHex}` : strHex;
    }
    return `${hex(r) + hex(g) + hex(b)}ff`;
  };

  self.hexColorDelta = function(hex1, hex2) {
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    // calculate differences in 3D Space
    // eslint-disable-next-line no-restricted-properties
    return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
  };

  self.fetch = function(url, mimeType) {
    return new Promise(
      (resolve, reject) => fetch(url)
        .then((response) => (mimeType === 'application/json'
          ? response.json()
          : response.text()))
        .then(resolve)
        .catch(reject),
    );
  };

  self.errorReport = function(errors) {
    // eslint-disable-next-line no-unused-vars
    let layersRemoved = 0;
    lodashEach(errors, (error) => {
      const cause = error.cause ? `: ${error.cause}` : '';
      self.warn(error.message + cause);
      if (error.layerRemoved) {
        layersRemoved += 1;
      }
    });
  };

  /**
   * Wraps a function in a try/catch block that logs error if thrown
   *
   * @param {function} func the function to wrap
   * @return the function wrapped in a try/catch block.
   */
  self.wrap = function(func) {
    return function(...args) {
      try {
        return func.apply(func, args);
      } catch (error) {
        console.error(error);
      }
    };
  };

  /**
   * Http request using promises
   * https://www.html5rocks.com/en/tutorials/es6/promises/#toc-promisifying-xmlhttprequest
   *
   * @method get
   * @param {url} func the function to wrap
   * @return {object} Promise
   */
  self.get = function(url) {
    // Return a new promise.
    return new Promise((resolve, reject) => {
      // Do the usual XHR stuff
      const req = new XMLHttpRequest();
      req.open('GET', url);

      req.onload = function() {
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
      req.onerror = function() {
        reject(Error('Network Error'));
      };
      // Make the request
      req.send();
    });
  };

  // Converts a string to a form that can be safely used as an identifier.
  //
  // Currently only converts '.' and ':' and ',' to __xx__ where xx is the hex
  // value of that character. Add more here as needed.
  //
  // When GIBS added the 'Particulate_Matter_Below_2.5micrometers_2001-2010'
  // layer, the period in the identifier caused problems when using a selector
  // as that is a special character used to select a CSS class.
  //
  // encodeURIComponent does not work. An identifier with a '%' character
  // is considered invalid by the Sizzle library.
  //
  // The original plan was to escape the special characters but that
  // became confusing as element attributes would need one escape character
  // but the selector would need two (\. vs \\.)
  self.encodeId = function(str) {
    return str.replace(/[.:,]/g, (match) => `__${match.charCodeAt(0).toString(16).toUpperCase()}__`);
  };

  // Converts an encoded identifier back to its original value.
  self.decodeId = function(str) {
    return str.replace(/__[0-9A-Fa-f]{2}__/g, (match) => {
      const charCode = Number.parseInt(match.substring(2, 4), 16);
      return String.fromCharCode(charCode);
    });
  };

  self.key = {
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    DOWN: 40,
  };

  function formatDegrees(value, type, withSeconds) {
    let width; let
      signs;
    if (type === 'longitude') {
      width = 3;
      signs = 'EW';
    } else {
      width = 2;
      signs = 'NS';
    }
    const sign = value >= 0 ? signs[0] : signs[1];
    value = Math.abs(value);

    const degrees = Math.floor(value);
    const minutes = Math.floor((value * 60) - (degrees * 60));
    const fminutes = (value * 60) - (degrees * 60);
    const seconds = Math.floor((value * 3600) - (degrees * 3600) - (minutes * 60));

    if (withSeconds) {
      const sdegrees = self.pad(degrees, width, ' ');
      const sminutes = self.pad(minutes, 2, '0');
      const sseconds = self.pad(seconds, 2, '0');
      return `${sdegrees}°${sminutes}'${sseconds}"${sign}`;
    }
    const sdegrees = self.pad(degrees, width, ' ');
    // toFixed rounds and to prevent seeing 60.000, get it out to
    // four digits and then chop off the last one
    let sminutes = self.pad(fminutes.toFixed(4), 7, '0');
    sminutes = sminutes.substring(0, sminutes.length - 1);
    return `${sdegrees}°${sminutes}'${sign}`;
  }

  self.formatDMS = (value, type) => formatDegrees(value, type, true);
  self.formatDM = (value, type) => formatDegrees(value, type, false);

  self.setCoordinateFormat = function(type) {
    if (type !== 'latlon-dd' && type !== 'latlon-dms' && type !== 'latlon-dm') {
      throw new Error(`Invalid coordinate format: ${type}`);
    }
    safeLocalStorage.setItem(COORDINATE_FORMAT, type);
  };

  self.getCoordinateFormat = function() {
    return safeLocalStorage.getItem(COORDINATE_FORMAT) || 'latlon-dd';
  };

  self.formatCoordinate = function(coord, format) {
    const type = format || self.getCoordinateFormat();
    if (type === 'latlon-dms') {
      return `${self.formatDMS(coord[1], 'latitude')}, ${
        self.formatDMS(coord[0], 'longitude')}`;
    } if (type === 'latlon-dm') {
      return `${self.formatDM(coord[1], 'latitude')}, ${
        self.formatDM(coord[0], 'longitude')}`;
    }
    return `${coord[1].toFixed(4)}°, ${
      coord[0].toFixed(4)}°`;
  };
  /**
   * map openlayers provided longitude value to be between -180 && 180
   *
   * @param {longitude} number map longitude value
   * @return normalized longitude value
   */
  self.normalizeWrappedLongitude = function(longitude) {
    const isNegative = longitude < 0;
    const remainder = longitude % 360;
    return isNegative && remainder < -180 ? remainder + 360 : !isNegative && remainder > 180 ? remainder - 360 : remainder;
  };
  // Allows simple printf functionality with strings
  // arguments array contains all args passed. String must be formatted
  // so that first replacement starts with "{1}"
  // usage example: wv.util.format("{1}{2}",'World','view')
  self.format = function(...args) {
    let [formatted] = args;
    for (let i = 1; i < args.length; i += 1) {
      const regexp = new RegExp(`\\{${i}\\}`, 'gi');
      formatted = formatted.replace(regexp, args[i]);
    }
    return formatted;
  };

  self.toArray = function(value) {
    if (!value) {
      return [];
    }
    if (value.constructor !== Array) {
      value = [value];
    }
    return value;
  };

  /**
   * Returns offset date object
   *
   * @method getTimezoneOffsetDate
   * @param  {Object} date        A date object
   * @return {Object} offsetDate  An offset date object
   */
  self.getTimezoneOffsetDate = (date) => {
    const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return offsetDate;
  };

  /**
   * Returns absolute UTC date timeunit numbers object
   *
   * @method getUTCNumbers
   * @param  {Object} date    A date object
   * @param  {String} prefix  Prefix min/max for timeunits in object
   * @return {Object}         An object of UTC date timeunit numbers
   */
  self.getUTCNumbers = (date, prefix) => ({
    [`${prefix}Year`]: date.getUTCFullYear(),
    [`${prefix}Month`]: date.getUTCMonth(),
    [`${prefix}Day`]: date.getUTCDate(),
    [`${prefix}Hour`]: date.getUTCHours(),
    [`${prefix}Minute`]: date.getUTCMinutes(),
  });

  // Returns the number of months between two dates
  self.yearDiff = function(startDate, endDate) {
    const year1 = startDate.getFullYear();
    const year2 = endDate.getFullYear();
    return year2 - year1;
  };

  // Returns the number of months between two dates
  self.monthDiff = function(startDate, endDate) {
    const year1 = startDate.getFullYear();
    const year2 = endDate.getFullYear();
    let month1 = startDate.getMonth();
    let month2 = endDate.getMonth();
    if (month1 === 0) {
      month1 += 1;
      month2 += 1;
    }
    const numberOfMonths = (year2 - year1) * 12 + (month2 - month1);
    return numberOfMonths;
  };

  self.dayDiff = function(startDate, endDate) {
    const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return dayDiff;
  };

  self.minuteDiff = function(startDate, endDate) {
    const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
    const minuteDiff = Math.ceil(timeDiff / 60000);
    return minuteDiff;
  };

  /**
   * Find closest index for currentDateValue from array of dates
   * @param {Array} dateArray | Array of date objects
   * @param {Number} currentDateValue | Number of milliseconds from date object
   * @return {Number}
   */
  self.closestToIndex = (dateArray, currentDateValue) => {
    let closestDateIndex;
    let minDistance;
    dateArray.forEach((date, index) => {
      const dateValue = date.getTime();
      const distance = Math.abs(currentDateValue - dateValue);
      if (closestDateIndex === undefined || distance < minDistance) {
        closestDateIndex = index;
        minDistance = distance;
      }
    });

    return closestDateIndex;
  };

  /**
   * Find index value of string in array
   * @param {Array} arra | Array of strings
   * @param {String} value | String to return index of
   * @return {Number}
   */
  self.stringInArray = function(arra, value) {
    for (let i = 0, len = arra.length; i < len; i += 1) {
      if (arra[i] === value) {
        return i;
      }
    }
    return false;
  };

  self.decodeHTML = (html) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  /**
   * Load additional scripts sequentially
   * @param {*} scripts
   * @param {*} fn
   */
  self.loadScipts = (scripts = [], fn) => {
    const head = document.head || document.getElementsByTagName('head')[0];
    const loadFile = (index) => {
      if (scripts.length > index) {
        const fileref = document.createElement('script');
        fileref.setAttribute('type', 'text/javascript');
        fileref.setAttribute('src', scripts[index]);
        head.appendChild(fileref);
        // Load next script
        fileref.onload = () => { loadFile(index + 1); };
      } else if (fn) {
        fn();
      }
    };
    loadFile(0);
  };

  return self;
}({}));
