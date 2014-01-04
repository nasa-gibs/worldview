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
     * Parses a UTC ISO 8601 date.
     *
     * @method parseDateISO
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
        return self.clearTimeUTC(new Date());
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

    return self;

})(wv.util || {});
