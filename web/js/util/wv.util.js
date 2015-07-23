/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * @module wv.util
 */
var wv = wv || {};

/**
 * General utilities
 *
 * @class wv.util
 * @static
 */
wv.util = (function(self) {

    // Needed anymore?
    self.LAYER_GROUPS = {
        baselayers: {
            id: "baselayers",
            camel: "BaseLayers",
            description: "Base Layers"
        },
        overlays: {
            id: "overlays",
            camel: "Overlays",
            description: "Overlays"
        }
    };

    self.repeat = function(value, length) {
        result = "";
        for ( var i = 0; i < length; i++ ) {
            result += value;
        }
        return result;
    };

    self.pad = function(value, width, padding) {
        value = "" + value;
        if ( value.length < width ) {
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
    self.fromQueryString = function(queryString) {
        if ( !queryString ) {
            return {};
        }
        if ( queryString[0] === "?" ) {
            queryString = queryString.substring(1);
        }
        var parameters = queryString.split("&");
        result = {};
        for ( var i = 0; i < parameters.length; i++ ) {
            var index = parameters[i].indexOf("=");
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
    self.toQueryString = function(kvps, exceptions) {
        exceptions = exceptions || {};
        var parts = [];
        _.each(kvps, function(value, key) {
            var part = key + "=" + encodeURIComponent(value);
            _.each(exceptions, function(exception) {
                var regexp = new RegExp(exception, "ig");
                var decoded = decodeURIComponent(exception);
                part = part.replace(regexp, decoded);
            });
            parts.push(part);
        });
        if ( parts.length === 0 ) {
            return "";
        }
        return "?" + parts.join("&");
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
     * @param str {string} Date to parse in the form of ``YYYY-MM-DD``.
     * @return {Date} converted string as a date object, throws an exception if
     * the string is invalid
     */
    // NOTE: Older Safari doesn't like Date.parse
    self.parseDateUTC = function(dateAsString) {
        var dateTimeArr = dateAsString.split(/T/);

        var yyyymmdd = dateTimeArr[0].split("-");

        // Parse elements of date and time
        var year = yyyymmdd[0];
        var month = yyyymmdd[1] - 1;
        var day = yyyymmdd[2];

        var hour = 0;
        var minute = 0;
        var second = 0;
        var millisecond = 0;

        // Use default of midnight if time is not specified
        if ( dateTimeArr.length > 1 ) {
            var hhmmss = dateTimeArr[1].split(/[:\.Z]/);
            hour = hhmmss[0] || 0;
            minute = hhmmss[1] || 0;
            second = hhmmss[2] || 0;
            millisecond = hhmmss[3] || 0;
        }
        var date = new Date(Date.UTC(year, month, day, hour, minute, second,
                millisecond));
        if ( isNaN(date.getTime()) ) {
            throw new Error("Invalid date: " + dateAsString);
        }
        return date;
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
        return date.toISOString().split("T")[0];
    };

    /**
     * Converts a time into an ISO string without seconds.
     *
     * @method toISOStringTimeHM
     * @static
     * @param date {Date} the date to convert
     * @return {string} ISO string in the form of ``HH:MM``.
     */
    self.toISOStringTimeHM = function(date) {
        var time = date.toISOString().split("T")[1];
        var parts = time.split(".")[0].split(":");
        return parts[0] + ":" + parts[1];
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
    self.clearTimeUTC = function(date) {
        date.setUTCHours(0);
        date.setUTCMinutes(0);
        date.setUTCSeconds(0);
        date.setUTCMilliseconds(0);
        return date;
    };

    self.dateAdd = function(date, interval, amount) {
        var newDate = new Date(date.getTime());
        switch ( interval ) {
            case "day":
                newDate.setUTCDate(newDate.getUTCDate() + amount);
                break;
            case "month":
                newDate.setUTCMonth(newDate.getUTCMonth() + amount);
                break;
            case "year":
                newDate.setUTCFullYear(newDate.getUTCFullYear() + amount);
                break;
            default:
                throw new Error("[dateAdd] Invalid interval: " + interval);
        }
        return newDate;
    };

    self.daysInMonth = function(d) {
        var y;
        var m;
        if ( d.getUTCFullYear ) {
            y = d.getUTCFullYear();
            m = d.getUTCMonth();
        } else {
            y = d.year;
            m = d.month;
        }
        var lastDay = new Date(Date.UTC(y, m + 1, 0));
        return lastDay.getUTCDate();
    };

    self.clamp = function(val, min, max) {
        if ( val < min ) { return min; }
        if ( val > max ) { return max; }
        return val;
    };

    self.roll = function(val, min, max) {
        if ( val < min ) { return max - (min - val) + 1; }
        if ( val > max ) { return min + (val - max) - 1; }
        return val;
    };

    self.minDate = function() {
        return new Date(Date.UTC(1000, 0, 1));
    };

    self.maxDate = function() {
        return new Date(Date.UTC(3000, 11, 31));
    };

    self.rollRange = function(date, interval, minDate, maxDate) {
        var y = date.getUTCFullYear();
        var m = date.getUTCMonth();
        var d = date.getUTCDate();
        var first, last;
        switch ( interval ) {
            case "day":
                var firstDay = new Date(Date.UTC(y, m, 1));
                var lastDay = new Date(Date.UTC(y, m, self.daysInMonth(date)));
                first = new Date(Math.max(firstDay, minDate)).getUTCDate();
                last = new Date(Math.min(lastDay, maxDate)).getUTCDate();
                break;
            case "month":
                var firstMonth = new Date(Date.UTC(y, 0, 1));
                var lastMonth = new Date(Date.UTC(y, 11, 31));
                first = new Date(Math.max(firstMonth, minDate)).getUTCMonth();
                last = new Date(Math.min(lastMonth, maxDate)).getUTCMonth();
                break;
            case "year":
                var firstYear = self.minDate();
                var lastYear = self.maxDate();
                first = new Date(Math.max(firstYear, minDate)).getUTCFullYear();
                last = new Date(Math.min(lastYear, maxDate)).getUTCFullYear();
                break;
        }
        return { first: first, last: last };
    };

    self.rollDate = function(date, interval, amount, minDate, maxDate) {
        minDate = minDate || self.minDate();
        maxDate = maxDate || self.maxDate();
        var range = self.rollRange(date, interval, minDate, maxDate);
        var min = range.first;
        var max = range.last;
        var day = date.getUTCDate();
        var month = date.getUTCMonth();
        var year = date.getUTCFullYear();
        switch ( interval ) {
            case "day":
                day = self.roll(day + amount, min, max);
                break;
            case "month":
                month = self.roll(month + amount, min, max);
                break;
            case "year":
                year = self.roll(year + amount, min, max);
                break;
            default:
                throw new Error("[rollDate] Invalid interval: " + interval);
        }
        var daysInMonth = self.daysInMonth({year: year, month: month});
        if ( day > daysInMonth ) {
            day = daysInMonth;
        }
        var newDate = new Date(Date.UTC(year, month, day));
        newDate = new Date(wv.util.clamp(newDate, minDate, maxDate));
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
    self.toCompactTimestamp = function(date) {
        return date.toISOString().replace(/[-:TZ\.]/g, "");
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
    self.fromCompactTimestamp = function(str) {
        var v = str.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{3})/);
        if ( _.isNull(v) ) {
            throw new Error("Invalid timestamp:" + str);
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
    var now = function() {
        return new Date();
    };
    self.now = now;
    self.resetNow = function() {
        self.now = now;
    };

    /**
     * Gets the current day. Use this instead of the Date methods to allow
     * debugging alternate "now" times.
     *
     * @method today
     * @static
     * @return {Date} The current time with the UTC hours, minutes, and seconds
     * fields set to zero or an overriden value.
     */
    self.today = function() {
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
     * @param {exception} cause The exception object that caused the error
     */
    self.error = function(message, cause) {
        wv.ui.error(message, cause);
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
    self.warn = ( console && console.warn && console.warn.bind ) ?
        console.warn.bind(console) : function () {};


    self.hexToRGB = function(str) {
        return "rgb(" +
            parseInt(str.substring(0, 2), 16) + "," +
            parseInt(str.substring(2, 4), 16) + "," +
            parseInt(str.substring(4, 6), 16) + ")";
    };

    self.hexToRGBA = function(str) {
        return "rgba(" +
            parseInt(str.substring(0, 2), 16) + "," +
            parseInt(str.substring(2, 4), 16) + "," +
            parseInt(str.substring(4, 6), 16) + "," +
            parseInt(str.substring(6, 8), 16) + ")";
    };

    /**
     * Submits an AJAX request or retreives the result from the cache.
     *
     * @class wv.util.ajaxCache
     * @constructor
     * @param {Integer} [spec.size] maximum number of items to store in the
     * cache.
     * @param {Object} [spec.options] options to pass to jscache on setItem.
     *
     */
    self.ajaxCache = function(spec) {
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
            submit: function(parameters) {
                var key = "url=" + parameters.url;
                if ( parameters.data ) {
                    key += "&query=" + $.param(parameters.data, true);
                }
                var results = cache.getItem(key);

                if ( results ) {
                    return $.Deferred().resolve(results).promise();
                } else {
                    var promise = $.ajax(parameters);
                    promise.done(function(results) {
                        cache.setItem(key, results, options);
                    });
                    return promise;
                }
            }
        };
    };

    self.localStorage = function(property, value) {
        if ( _.isUndefined(value) ) {
            return localStorage.getItem(property);
        } else {
            localStorage.setItem(property, value);
        }
    };

    /**
     * Wraps a function in a try/catch block that invokes wv.util.error
     * if an exception is thrown.
     *
     * @param {function} func the function to wrap
     * @return the function wrapped in a try/catch block.
     */
    self.wrap = function(func) {
        return function() {
            try {
                return func.apply(func, arguments);
            } catch ( error ) {
                wv.util.error(error);
            }
        };
    };

    // FIXME: Should be replaced with $.when
    self.ajaxJoin = function(calls) {

        var completed = 0;
        var result = {};
        var deferred = $.Deferred();

        $.each(calls, function(index, call) {
            call.promise.done(function(data) {
                result[call.item] = data;
                completed += 1;
                if ( completed == calls.length ) {
                    deferred.resolve(result);
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                deferred.reject(jqXHR, textStatus, errorThrown);
            });
        });

        return deferred.promise();
    };

    // http://totaldev.com/content/escaping-characters-get-valid-jquery-id
    self.jqueryEscape = function(str) {
        return encodeURIComponent(str)
            .replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
    };

    self.metrics = function() {
        if ( window.ntptEventTag ) {
            ntptEventTag.apply(null, arguments);
        } else {
            console.log("no metrics");
        }
    };

    self.key = {
        LEFT: 37,
        RIGHT: 39,
        UP: 38,
        DOWN: 40
    };

    self.formatDMS = function(value, type) {
        var width, signs;
        if ( type === "longitude" ) {
            width = 3;
            signs = "EW";
        } else {
            width = 2;
            signs = "NS";
        }
        var sign = ( value >= 0 ) ? signs[0] : signs[1];
        value = Math.abs(value);
        var degrees = Math.floor(value);
        var minutes = Math.floor((value * 60) - (degrees * 60));
        var seconds = Math.floor((value * 3600) - (degrees * 3600) - (minutes * 60));

        var sdegrees = self.pad(degrees, width, " ");
        var sminutes = self.pad(minutes, 2, "0");
        var sseconds = self.pad(seconds, 2, "0");
        return sdegrees + "&deg;" + sminutes + "'" + sseconds + '"' + sign;
    };

    self.setCoordinateFormat = function(type) {
        if ( type !== "latlon-dd" && type !== "latlon-dms" ) {
            throw new Error("Invalid coordinate format: " + type);
        }
        self.localStorage("coordinateFormat", type);
    };

    self.getCoordinateFormat = function() {
        return self.localStorage("coordinateFormat") || "latlon-dd";
    };

    self.formatCoordinate = function(coord, format) {
        var type = format || self.getCoordinateFormat();
        if ( type === "latlon-dms" ) {
            return self.formatDMS(coord[1], "latitude") + ", " +
                   self.formatDMS(coord[0], "longitude");
        } else {
            return coord[1].toFixed(4) + "&deg;, " +
                coord[0].toFixed(4) + "&deg;";
        }
    };

    return self;

})(wv.util || {});
