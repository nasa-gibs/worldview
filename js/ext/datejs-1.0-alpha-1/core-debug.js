/**
 * Version: 1.0 Alpha-1 
 * Build Date: 12-Nov-2007
 * Copyright (c) 2006-2007, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * License: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/. 
 * Website: http://www.datejs.com/ or http://www.coolite.com/datejs/
 */

/**
 * Gets the month number (0-11) if given a Culture Info specific string which is a valid monthName or abbreviatedMonthName.
 * @param {String}   The name of the month (eg. "February, "Feb", "october", "oct").
 * @return {Number}  The day number
 */
Date.getMonthNumberFromName = function (name) {
    var n = Date.CultureInfo.monthNames, m = Date.CultureInfo.abbreviatedMonthNames, s = name.toLowerCase();
    for (var i = 0; i < n.length; i++) {
        if (n[i].toLowerCase() == s || m[i].toLowerCase() == s) { 
            return i; 
        }
    }
    return -1;
};

/**
 * Gets the day number (0-6) if given a CultureInfo specific string which is a valid dayName, abbreviatedDayName or shortestDayName (two char).
 * @param {String}   The name of the day (eg. "Monday, "Mon", "tuesday", "tue", "We", "we").
 * @return {Number}  The day number
 */
Date.getDayNumberFromName = function (name) {
    var n = Date.CultureInfo.dayNames, m = Date.CultureInfo.abbreviatedDayNames, o = Date.CultureInfo.shortestDayNames, s = name.toLowerCase();
    for (var i = 0; i < n.length; i++) { 
        if (n[i].toLowerCase() == s || m[i].toLowerCase() == s) { 
            return i; 
        }
    }
    return -1;  
};

/**
 * Determines if the current date instance is within a LeapYear.
 * @param {Number}   The year (0-9999).
 * @return {Boolean} true if date is within a LeapYear, otherwise false.
 */
Date.isLeapYear = function (year) { 
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)); 
};

/**
 * Gets the number of days in the month, given a year and month value. Automatically corrects for LeapYear.
 * @param {Number}   The year (0-9999).
 * @param {Number}   The month (0-11).
 * @return {Number}  The number of days in the month.
 */
Date.getDaysInMonth = function (year, month) {
    return [31, (Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};

Date.getTimezoneOffset = function (s, dst) {
    return (dst || false) ? Date.CultureInfo.abbreviatedTimeZoneDST[s.toUpperCase()] :
        Date.CultureInfo.abbreviatedTimeZoneStandard[s.toUpperCase()];
};

Date.getTimezoneAbbreviation = function (offset, dst) {
    var n = (dst || false) ? Date.CultureInfo.abbreviatedTimeZoneDST : Date.CultureInfo.abbreviatedTimeZoneStandard, p;
    for (p in n) { 
        if (n[p] === offset) { 
            return p; 
        }
    }
    return null;
};

/**
 * Returns a new Date object that is an exact date and time copy of the original instance.
 * @return {Date}    A new Date instance
 */
Date.prototype.clone = function () {
    return new Date(this.getTime()); 
};

/**
 * Compares this instance to a Date object and return an number indication of their relative values.  
 * @param {Date}     Date object to compare [Required]
 * @return {Number}  1 = this is greaterthan date. -1 = this is lessthan date. 0 = values are equal
 */
Date.prototype.compareTo = function (date) {
    if (isNaN(this)) { 
        throw new Error(this); 
    }
    if (date instanceof Date && !isNaN(date)) {
        return (this > date) ? 1 : (this < date) ? -1 : 0;
    } else { 
        throw new TypeError(date); 
    }
};

/**
 * Compares this instance to another Date object and returns true if they are equal.  
 * @param {Date}     Date object to compare [Required]
 * @return {Boolean} true if dates are equal. false if they are not equal.
 */
Date.prototype.equals = function (date) { 
    return (this.compareTo(date) === 0); 
};

/**
 * Determines is this instance is between a range of two dates or equal to either the start or end dates.
 * @param {Date}     Start of range [Required]
 * @param {Date}     End of range [Required]
 * @return {Boolean} true is this is between or equal to the start and end dates, else false
 */
Date.prototype.between = function (start, end) {
    var t = this.getTime();
    return t >= start.getTime() && t <= end.getTime();
};

/**
 * Adds the specified number of milliseconds to this instance. 
 * @param {Number}   The number of milliseconds to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addMilliseconds = function (value) {
    this.setMilliseconds(this.getMilliseconds() + value);
    return this;
};

/**
 * Adds the specified number of seconds to this instance. 
 * @param {Number}   The number of seconds to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addSeconds = function (value) { 
    return this.addMilliseconds(value * 1000); 
};

/**
 * Adds the specified number of seconds to this instance. 
 * @param {Number}   The number of seconds to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addMinutes = function (value) { 
    return this.addMilliseconds(value * 60000); /* 60*1000 */
};

/**
 * Adds the specified number of hours to this instance. 
 * @param {Number}   The number of hours to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addHours = function (value) { 
    return this.addMilliseconds(value * 3600000); /* 60*60*1000 */
};

/**
 * Adds the specified number of days to this instance. 
 * @param {Number}   The number of days to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addDays = function (value) { 
    return this.addMilliseconds(value * 86400000); /* 60*60*24*1000 */
};

/**
 * Adds the specified number of weeks to this instance. 
 * @param {Number}   The number of weeks to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addWeeks = function (value) { 
    return this.addMilliseconds(value * 604800000); /* 60*60*24*7*1000 */
};

/**
 * Adds the specified number of months to this instance. 
 * @param {Number}   The number of months to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addMonths = function (value) {
    var n = this.getDate();
    this.setDate(1);
    this.setMonth(this.getMonth() + value);
    this.setDate(Math.min(n, this.getDaysInMonth()));
    return this;
};

/**
 * Adds the specified number of years to this instance. 
 * @param {Number}   The number of years to add. The number can be positive or negative [Required]
 * @return {Date}    this
 */
Date.prototype.addYears = function (value) {
    return this.addMonths(value * 12);
};

/**
 * Adds (or subtracts) to the value of the year, month, day, hour, minute, second, millisecond of the date instance using given configuration object. Positive and Negative values allowed.
 * Example
<pre><code>
Date.today().add( { day: 1, month: 1 } )
 
new Date().add( { year: -1 } )
</code></pre> 
 * @param {Object}   Configuration object containing attributes (month, day, etc.)
 * @return {Date}    this
 */
Date.prototype.add = function (config) {
    if (typeof config == "number") {
        this._orient = config;
        return this;    
    }
    var x = config;
    if (x.millisecond || x.milliseconds) { 
        this.addMilliseconds(x.millisecond || x.milliseconds); 
    }
    if (x.second || x.seconds) { 
        this.addSeconds(x.second || x.seconds); 
    }
    if (x.minute || x.minutes) { 
        this.addMinutes(x.minute || x.minutes); 
    }
    if (x.hour || x.hours) { 
        this.addHours(x.hour || x.hours); 
    }
    if (x.month || x.months) { 
        this.addMonths(x.month || x.months); 
    }
    if (x.year || x.years) { 
        this.addYears(x.year || x.years); 
    }
    if (x.day || x.days) {
        this.addDays(x.day || x.days); 
    }
    return this;
};

// private
Date._validate = function (value, min, max, name) {
    if (typeof value != "number") {
        throw new TypeError(value + " is not a Number."); 
    } else if (value < min || value > max) {
        throw new RangeError(value + " is not a valid value for " + name + "."); 
    }
    return true;
};

/**
 * Validates the number is within an acceptable range for milliseconds [0-999].
 * @param {Number}   The number to check if within range.
 * @return {Boolean} true if within range, otherwise false.
 */
Date.validateMillisecond = function (n) {
    return Date._validate(n, 0, 999, "milliseconds");
};

/**
 * Validates the number is within an acceptable range for seconds [0-59].
 * @param {Number}   The number to check if within range.
 * @return {Boolean} true if within range, otherwise false.
 */
Date.validateSecond = function (n) {
    return Date._validate(n, 0, 59, "seconds");
};

/**
 * Validates the number is within an acceptable range for minutes [0-59].
 * @param {Number}   The number to check if within range.
 * @return {Boolean} true if within range, otherwise false.
 */
Date.validateMinute = function (n) {
    return Date._validate(n, 0, 59, "minutes");
};

/**
 * Validates the number is within an acceptable range for hours [0-23].
 * @param {Number}   The number to check if within range.
 * @return {Boolean} true if within range, otherwise false.
 */
Date.validateHour = function (n) {
    return Date._validate(n, 0, 23, "hours");
};

/**
 * Validates the number is within an acceptable range for the days in a month [0-MaxDaysInMonth].
 * @param {Number}   The number to check if within range.
 * @return {Boolean} true if within range, otherwise false.
 */
Date.validateDay = function (n, year, month) {
    return Date._validate(n, 1, Date.getDaysInMonth(year, month), "days");
};

/**
 * Validates the number is within an acceptable range for months [0-11].
 * @param {Number}   The number to check if within range.
 * @return {Boolean} true if within range, otherwise false.
 */
Date.validateMonth = function (n) {
    return Date._validate(n, 0, 11, "months");
};

/**
 * Validates the number is within an acceptable range for years [0-9999].
 * @param {Number}   The number to check if within range.
 * @return {Boolean} true if within range, otherwise false.
 */
Date.validateYear = function (n) {
    return Date._validate(n, 1, 9999, "seconds");
};

/**
 * Set the value of year, month, day, hour, minute, second, millisecond of date instance using given configuration object.
 * Example
<pre><code>
Date.today().set( { day: 20, month: 1 } )

new Date().set( { millisecond: 0 } )
</code></pre>
 * 
 * @param {Object}   Configuration object containing attributes (month, day, etc.)
 * @return {Date}    this
 */
Date.prototype.set = function (config) {
    var x = config;

    if (!x.millisecond && x.millisecond !== 0) { 
        x.millisecond = -1; 
    }
    if (!x.second && x.second !== 0) { 
        x.second = -1; 
    }
    if (!x.minute && x.minute !== 0) { 
        x.minute = -1; 
    }
    if (!x.hour && x.hour !== 0) { 
        x.hour = -1; 
    }
    if (!x.day && x.day !== 0) { 
        x.day = -1; 
    }
    if (!x.month && x.month !== 0) { 
        x.month = -1; 
    }
    if (!x.year && x.year !== 0) { 
        x.year = -1; 
    }

    if (x.millisecond != -1 && Date.validateMillisecond(x.millisecond)) {
        this.addMilliseconds(x.millisecond - this.getMilliseconds()); 
    }
    if (x.second != -1 && Date.validateSecond(x.second)) {
        this.addSeconds(x.second - this.getSeconds()); 
    }
    if (x.minute != -1 && Date.validateMinute(x.minute)) {
        this.addMinutes(x.minute - this.getMinutes()); 
    }
    if (x.hour != -1 && Date.validateHour(x.hour)) {
        this.addHours(x.hour - this.getHours()); 
    }
    if (x.month !== -1 && Date.validateMonth(x.month)) {
        this.addMonths(x.month - this.getMonth()); 
    }
    if (x.year != -1 && Date.validateYear(x.year)) {
        this.addYears(x.year - this.getFullYear()); 
    }
    
	/* day has to go last because you can't validate the day without first knowing the month */
    if (x.day != -1 && Date.validateDay(x.day, this.getFullYear(), this.getMonth())) {
        this.addDays(x.day - this.getDate()); 
    }
    if (x.timezone) { 
        this.setTimezone(x.timezone); 
    }
    if (x.timezoneOffset) { 
        this.setTimezoneOffset(x.timezoneOffset); 
    }
    
    return this;   
};

/**
 * Resets the time of this Date object to 12:00 AM (00:00), which is the start of the day.
 * @return {Date}    this
 */
Date.prototype.clearTime = function () {
    this.setHours(0); 
    this.setMinutes(0); 
    this.setSeconds(0);
    this.setMilliseconds(0); 
    return this;
};

/**
 * Determines whether or not this instance is in a leap year.
 * @return {Boolean} true if this instance is in a leap year, else false
 */
Date.prototype.isLeapYear = function () { 
    var y = this.getFullYear(); 
    return (((y % 4 === 0) && (y % 100 !== 0)) || (y % 400 === 0)); 
};

/**
 * Determines whether or not this instance is a weekday.
 * @return {Boolean} true if this instance is a weekday
 */
Date.prototype.isWeekday = function () { 
    return !(this.is().sat() || this.is().sun());
};

/**
 * Get the number of days in the current month, adjusted for leap year.
 * @return {Number}  The number of days in the month
 */
Date.prototype.getDaysInMonth = function () { 
    return Date.getDaysInMonth(this.getFullYear(), this.getMonth());
};

/**
 * Moves the date to the first day of the month.
 * @return {Date}    this
 */
Date.prototype.moveToFirstDayOfMonth = function () {
    return this.set({ day: 1 });
};

/**
 * Moves the date to the last day of the month.
 * @return {Date}    this
 */
Date.prototype.moveToLastDayOfMonth = function () { 
    return this.set({ day: this.getDaysInMonth()});
};

/**
 * Move to the next or last dayOfWeek based on the orient value.
 * @param {Number}   The dayOfWeek to move to.
 * @param {Number}   Forward (+1) or Back (-1). Defaults to +1. [Optional]
 * @return {Date}    this
 */
Date.prototype.moveToDayOfWeek = function (day, orient) {
    var diff = (day - this.getDay() + 7 * (orient || +1)) % 7;
    return this.addDays((diff === 0) ? diff += 7 * (orient || +1) : diff);
};

/**
 * Move to the next or last month based on the orient value.
 * @param {Number}   The month to move to. 0 = January, 11 = December.
 * @param {Number}   Forward (+1) or Back (-1). Defaults to +1. [Optional]
 * @return {Date}    this
 */
Date.prototype.moveToMonth = function (month, orient) {
    var diff = (month - this.getMonth() + 12 * (orient || +1)) % 12;
    return this.addMonths((diff === 0) ? diff += 12 * (orient || +1) : diff);
};

/**
 * Get the numeric day number of the year, adjusted for leap year.
 * @return {Number} 0 through 364 (365 in leap years)
 */
Date.prototype.getDayOfYear = function () {
    return Math.floor((this - new Date(this.getFullYear(), 0, 1)) / 86400000);
};

/**
 * Get the week of the year for the current date instance.
 * @param {Number}   A Number that represents the first day of the week (0-6) [Optional]
 * @return {Number}  0 through 53
 */
Date.prototype.getWeekOfYear = function (firstDayOfWeek) {
    var y = this.getFullYear(), m = this.getMonth(), d = this.getDate();
    
    var dow = firstDayOfWeek || Date.CultureInfo.firstDayOfWeek;
	
    var offset = 7 + 1 - new Date(y, 0, 1).getDay();
    if (offset == 8) {
        offset = 1;
    }
    var daynum = ((Date.UTC(y, m, d, 0, 0, 0) - Date.UTC(y, 0, 1, 0, 0, 0)) / 86400000) + 1;
    var w = Math.floor((daynum - offset + 7) / 7);
    if (w === dow) {
        y--;
        var prevOffset = 7 + 1 - new Date(y, 0, 1).getDay();
        if (prevOffset == 2 || prevOffset == 8) { 
            w = 53; 
        } else { 
            w = 52; 
        }
    }
    return w;
};

/**
 * Determine whether Daylight Saving Time (DST) is in effect
 * @return {Boolean} True if DST is in effect.
 */
Date.prototype.isDST = function () {
    console.log('isDST');
    /* TODO: not sure if this is portable ... get from Date.CultureInfo? */
    return this.toString().match(/(E|C|M|P)(S|D)T/)[2] == "D";
};

/**
 * Get the timezone abbreviation of the current date.
 * @return {String} The abbreviated timezone name (e.g. "EST")
 */
Date.prototype.getTimezone = function () {
    return Date.getTimezoneAbbreviation(this.getUTCOffset, this.isDST());
};

Date.prototype.setTimezoneOffset = function (s) {
    var here = this.getTimezoneOffset(), there = Number(s) * -6 / 10;
    this.addMinutes(there - here); 
    return this;
};

Date.prototype.setTimezone = function (s) { 
    return this.setTimezoneOffset(Date.getTimezoneOffset(s)); 
};

/**
 * Get the offset from UTC of the current date.
 * @return {String} The 4-character offset string prefixed with + or - (e.g. "-0500")
 */
Date.prototype.getUTCOffset = function () {
    var n = this.getTimezoneOffset() * -10 / 6, r;
    if (n < 0) { 
        r = (n - 10000).toString(); 
        return r[0] + r.substr(2); 
    } else { 
        r = (n + 10000).toString();  
        return "+" + r.substr(1); 
    }
};

/**
 * Gets the name of the day of the week.
 * @param {Boolean}  true to return the abbreviated name of the day of the week
 * @return {String}  The name of the day
 */
Date.prototype.getDayName = function (abbrev) {
    return abbrev ? Date.CultureInfo.abbreviatedDayNames[this.getDay()] : 
        Date.CultureInfo.dayNames[this.getDay()];
};

/**
 * Gets the month name.
 * @param {Boolean}  true to return the abbreviated name of the month
 * @return {String}  The name of the month
 */
Date.prototype.getMonthName = function (abbrev) {
    return abbrev ? Date.CultureInfo.abbreviatedMonthNames[this.getMonth()] : 
        Date.CultureInfo.monthNames[this.getMonth()];
};

// private
Date.prototype._toString = Date.prototype.toString;

/**
 * Converts the value of the current Date object to its equivalent string representation.
 * Format Specifiers
<pre>
Format  Description                                                                  Example
------  ---------------------------------------------------------------------------  -----------------------
 s      The seconds of the minute between 1-59.                                      "1" to "59"
 ss     The seconds of the minute with leading zero if required.                     "01" to "59"
 
 m      The minute of the hour between 0-59.                                         "1"  or "59"
 mm     The minute of the hour with leading zero if required.                        "01" or "59"
 
 h      The hour of the day between 1-12.                                            "1"  to "12"
 hh     The hour of the day with leading zero if required.                           "01" to "12"
 
 H      The hour of the day between 1-23.                                            "1"  to "23"
 HH     The hour of the day with leading zero if required.                           "01" to "23"
 
 d      The day of the month between 1 and 31.                                       "1"  to "31"
 dd     The day of the month with leading zero if required.                          "01" to "31"
 ddd    Abbreviated day name. Date.CultureInfo.abbreviatedDayNames.                  "Mon" to "Sun" 
 dddd   The full day name. Date.CultureInfo.dayNames.                                "Monday" to "Sunday"
 
 M      The month of the year between 1-12.                                          "1" to "12"
 MM     The month of the year with leading zero if required.                         "01" to "12"
 MMM    Abbreviated month name. Date.CultureInfo.abbreviatedMonthNames.              "Jan" to "Dec"
 MMMM   The full month name. Date.CultureInfo.monthNames.                            "January" to "December"

 yy     Displays the year as a maximum two-digit number.                             "99" or "07"
 yyyy   Displays the full four digit year.                                           "1999" or "2007"
 
 t      Displays the first character of the A.M./P.M. designator.                    "A" or "P"
        Date.CultureInfo.amDesignator or Date.CultureInfo.pmDesignator
 tt     Displays the A.M./P.M. designator.                                           "AM" or "PM"
        Date.CultureInfo.amDesignator or Date.CultureInfo.pmDesignator
</pre>
 * @param {String}   A format string consisting of one or more format spcifiers [Optional].
 * @return {String}  A string representation of the current Date object.
 */
Date.prototype.toString = function (format) {
    var self = this;

    var p = function p(s) {
        return (s.toString().length == 1) ? "0" + s : s;
    };

    return format ? format.replace(/dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?/g, 
    function (format) {
        switch (format) {
        case "hh":
            return p(self.getHours() < 13 ? self.getHours() : (self.getHours() - 12));
        case "h":
            return self.getHours() < 13 ? self.getHours() : (self.getHours() - 12);
        case "HH":
            return p(self.getHours());
        case "H":
            return self.getHours();
        case "mm":
            return p(self.getMinutes());
        case "m":
            return self.getMinutes();
        case "ss":
            return p(self.getSeconds());
        case "s":
            return self.getSeconds();
        case "yyyy":
            return self.getFullYear();
        case "yy":
            return self.getFullYear().toString().substring(2, 4);
        case "dddd":
            return self.getDayName();
        case "ddd":
            return self.getDayName(true);
        case "dd":
            return p(self.getDate());
        case "d":
            return self.getDate().toString();
        case "MMMM":
            return self.getMonthName();
        case "MMM":
            return self.getMonthName(true);
        case "MM":
            return p((self.getMonth() + 1));
        case "M":
            return self.getMonth() + 1;
        case "t":
            return self.getHours() < 12 ? Date.CultureInfo.amDesignator.substring(0, 1) : Date.CultureInfo.pmDesignator.substring(0, 1);
        case "tt":
            return self.getHours() < 12 ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator;
        case "zzz":
        case "zz":
        case "z":
            return "";
        }
    }
    ) : this._toString();
};