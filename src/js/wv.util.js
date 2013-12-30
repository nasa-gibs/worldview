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
 * @module wv
 */
var wv = wv || {};

/**
 * General utilities.
 *
 * @class wv.util
 * @static
 */
wv.util = wv.util || (function() {

    var self = {};

    /**
     * Converts a query string into an object representation. For example,
     * the following query string:
     *
     *     foo=a&format=image%2Fpng
     *
     * converts to the following object:
     *
     *     { foo: "a", format: "image/png" }
     *
     * @method fromQueryString
     * @static
     * @param {String} queryString the string to convert to an object
     * @return {Object} keys and values from the query string. Values are
     * decoded as needed. If the query string is falsy, an empty object
     * is returned.
     */
    self.fromQueryString = function(queryString) {
        if ( !queryString ) {
            return {};
        }
        if ( queryString.substring(0, 1) === "?" ) {
            queryString = queryString.substring(1);
        }
        var result = {};
        var kvps = queryString.split("&");
        _.each(kvps, function(kvp) {
            kv = kvp.split("=");
            result[kv[0]] = decodeURIComponent(kv[1]);
        });
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

    return self;

})();
