var canvas = null;
export default class Util {
  /*
   * @constructor
   */
  constructor() {
    this.monthStringArray = [
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
      'DEC'
    ];
  }

  /**
   * Gets the current day. Use this instead of the Date methods to allow
   * debugging alternate 'now' times.
   *
   * @method today
   * @static
   * @return {Date} The current time with the UTC hours, minutes, and seconds
   * fields set to zero or an overriden value.
   */
  today() {
    return this.clearTimeUTC(this.now());
  }
  hexToRGBA(str) {
    return (
      'rgba(' +
      parseInt(str.substring(0, 2), 16) +
      ',' +
      parseInt(str.substring(2, 4), 16) +
      ',' +
      parseInt(str.substring(4, 6), 16) +
      ',' +
      parseInt(str.substring(6, 8), 16) +
      ')'
    );
  }

  /**
   * Sets a date to UTC midnight.
   *
   * @method clearTimeUTC
   * @static
   * @param date {Date} date to set the UTC hours, minutes, and seconds
   * to zero.
   * @return {Date} the date object
   */
  clearTimeUTC(date) {
    date.setUTCHours(0);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date;
  }

  clamp(val, min, max) {
    if (val < min) {
      return min;
    }
    if (val > max) {
      return max;
    }
    return val;
  }

  daysInMonth(d) {
    var y;
    var m;
    if (d.getUTCFullYear) {
      y = d.getUTCFullYear();
      m = d.getUTCMonth();
    } else {
      y = d.year;
      m = d.month;
    }
    var lastDay = new Date(Date.UTC(y, m + 1, 0));
    return lastDay.getUTCDate();
  }

  /**
   * Gets the current time. Use this instead of the Date methods to allow
   * debugging alternate 'now' times.
   *
   * @method now
   * @static
   * @return {Date} The current time or an overriden value.
   */
  now() {
    return new Date();
  }

  stringInArray(arra, value) {
    for (var i = 0, len = arra.length; i < len; i++) {
      if (arra[i] === value) {
        return i;
      }
    }
    return false;
  }

  minDate() {
    return new Date(Date.UTC(1000, 0, 1));
  }

  maxDate() {
    return new Date(Date.UTC(3000, 11, 31));
  }

  /**
   * Parses a UTC ISO 8601 date.
   *
   * @method parseDateUTC
   * @static
   * @param str {string} Date to parse in the form of ``YYYY-MM-DD``.
   * @return {Date} converted string as a date object, throws an exception if
   * the string is invalid
   */
  // NOTE: Older Safari doesn't like Date.parse
  parseDateUTC(dateAsString) {
    var dateTimeArr = dateAsString.split(/T/);
    var yyyymmdd = dateTimeArr[0].split('-');

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
    var date = new Date(
      Date.UTC(year, month, day, hour, minute, second, millisecond)
    );
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date: ' + dateAsString);
    }
    return date;
  }

  /**
   * Parses a UTC ISO 8601 date to a non UTC date
   *
   * @method parseDate
   * @static
   * @param str {string} Date to parse in the form of YYYY-MM-DDTHH:MM:SSZ`.
   * @return {Date} converted string as a non UTC date object, throws an exception if
   * the string is invalid
   */
  parseDate(dateAsString) {
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
    var date = new Date(year, month, day, hour, minute, second, millisecond);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date: ' + dateAsString);
    }
    return date;
  }

  /**
   * Converts a date into an ISO string with only the date portion.
   *
   * @method toISOStringDate
   * @static
   * @param date {Date} the date to convert
   * @return {string} ISO string in the form of ``YYYY-MM-DD``.
   */
  toISOStringDate(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Converts a time into an ISO string without miliseconds.
   *
   * @method toISOStringSeconds
   * @static
   * @param  {Date} date the date to convert
   * @return {string} ISO string in the form of `YYYY-MM-DDThh:mm:ssZ`.
   */
  toISOStringSeconds(date) {
    return date.toISOString().split('.')[0] + 'Z';
  }

  /**
   * Returns the month of the year for the given date object
   *
   * @method giveMonth
   * @static
   * @param date {Date} date object of which to determine the Month name
   * @return {String} the full name of the month
   */
  giveMonth(d) {
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
  }

  repeat(value, length) {
    var result = '';
    for (var i = 0; i < length; i++) {
      result += value;
    }
    return result;
  }

  roll(val, min, max) {
    if (val < min) {
      return max - (min - val) + 1;
    }
    if (val > max) {
      return min + (val - max) - 1;
    }
    return val;
  }

  rollRange(date, interval, minDate, maxDate) {
    var y = date.getUTCFullYear();
    var m = date.getUTCMonth();
    var first, last;
    switch (interval) {
      case 'minute':
        var firstMinute = new Date(Date.UTC(y, m, 1, 0, 0));
        var lastMinute = new Date(
          Date.UTC(y, m, this.daysInMonth(date), 23, 59)
        );
        first = new Date(Math.max(firstMinute, minDate)).getUTCMinutes();
        last = new Date(Math.min(lastMinute, maxDate)).getUTCMinutes();
        break;
      case 'hour':
        var firstHour = new Date(Date.UTC(y, m, 1, 0));
        var lastHour = new Date(Date.UTC(y, m, this.daysInMonth(date), 23));
        first = new Date(Math.max(firstHour, minDate)).getUTCHours();
        last = new Date(Math.min(lastHour, maxDate)).getUTCHours();
        break;
      case 'day':
        var firstDay = new Date(Date.UTC(y, m, 1));
        var lastDay = new Date(Date.UTC(y, m, this.daysInMonth(date)));
        first = new Date(Math.max(firstDay, minDate)).getUTCDate();
        last = new Date(Math.min(lastDay, maxDate)).getUTCDate();
        break;
      case 'month':
        var firstMonth = new Date(Date.UTC(y, 0, 1));
        var lastMonth = new Date(Date.UTC(y, 11, 31));
        first = new Date(Math.max(firstMonth, minDate)).getUTCMonth();
        last = new Date(Math.min(lastMonth, maxDate)).getUTCMonth();
        break;
      case 'year':
        var firstYear = this.minDate();
        var lastYear = this.maxDate();
        first = new Date(Math.max(firstYear, minDate)).getUTCFullYear();
        last = new Date(Math.min(lastYear, maxDate)).getUTCFullYear();
        break;
    }
    return { first: first, last: last };
  }
  rgbaToHex(r, g, b) {
    function hex(c) {
      var strHex = c.toString(16);
      return strHex.length === 1 ? '0' + strHex : strHex;
    }
    return hex(r) + hex(g) + hex(b) + 'ff';
  }
  getTextWidth(text, font) {
    // re-use canvas object for better performance
    canvas = canvas || document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
  }
  hexColorDelta(hex1, hex2) {
    var r1 = parseInt(hex1.substring(0, 2), 16);
    var g1 = parseInt(hex1.substring(2, 4), 16);
    var b1 = parseInt(hex1.substring(4, 6), 16);
    var r2 = parseInt(hex2.substring(0, 2), 16);
    var g2 = parseInt(hex2.substring(2, 4), 16);
    var b2 = parseInt(hex2.substring(4, 6), 16);
    // calculate differences in 3D Space
    return Math.sqrt(
      Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
    );
  }
  rollDate(date, interval, amount, minDate, maxDate) {
    minDate = minDate || this.minDate();
    maxDate = maxDate || this.maxDate();
    var range = this.rollRange(date, interval, minDate, maxDate);
    var min = range.first;
    var max = range.last;
    var minute = date.getUTCMinutes();
    var hour = date.getUTCHours();
    var day = date.getUTCDate();
    var month = date.getUTCMonth();
    var year = date.getUTCFullYear();
    switch (interval) {
      case 'minute':
        minute = this.roll(minute + amount, 0, 59);
        break;
      case 'hour':
        hour = this.roll(hour + amount, 0, 23);
        break;
      case 'day':
        day = this.roll(day + amount, min, max);
        break;
      case 'month':
        month = this.roll(month + amount, min, max);
        break;
      case 'year':
        year = this.roll(year + amount, min, max);
        break;
      default:
        throw new Error('[rollDate] Invalid interval: ' + interval);
    }
    var daysInMonth = this.daysInMonth({ year: year, month: month });
    if (day > daysInMonth) {
      day = daysInMonth;
    }
    var newDate = new Date(Date.UTC(year, month, day, hour, minute));
    newDate = new Date(this.clamp(newDate, minDate, maxDate));
    return newDate;
  }
  /**
   * Returns the day of week for the given date object
   *
   * @method giveWeekDay
   * @static
   * @param date {Date} date object of which to determine week day
   * @return {String} the full name of the day of the week
   */
  giveWeekDay(d) {
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
  }

  pad(value, width, padding) {
    value = '' + value;
    if (value.length < width) {
      var add = width - value.length;
      value = this.repeat(padding, add) + value;
    }
    return value;
  }
}
