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
            var fields = parameters[i].split("=");
            result[fields[0]] = decodeURIComponent(fields[1]);
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
     * time zone desginator are optional.
     * @return {Date} converted string as a datetime object, throws an
     * exception if the string is invalid.
     */
    self.parseTimestampUTC = function(str) {
        str = ( str.endsWith("Z") ) ? str : str + "Z";
        var d = new Date(Date.parse(str));
        if ( _.isNaN(d.getTime()) ) {
            throw new Error("Invalid timestamp: " + str);
        }
        return d;
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
    self.parseDateUTC = function(str) {
        var d = new Date(Date.parse(str + "T00:00Z"));
        if ( _.isNaN(d.getTime()) ) {
            throw new Error("Invalid date: " + str);
        }
        return d;
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
    self.now = function() {
        return new Date();
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

    return self;

})(wv.util || {});
