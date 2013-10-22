/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * Namespace: Worldview.Permalink
 * Handles permalinks
 */
Worldview.namespace("Permalink");

$(function() {

    // This namespace
    var ns = Worldview.Permalink;
    var log = Logging.getLogger("Worldview.Permalink");
    var DEBUG_SHORTEN_URL = "https://earthdata.nasa.gov/labs/worldview";

    var ALLOWED_PARAMETERS = {
        map: true,
        products: true,
        time: true,
        "switch": true,
        palettes: true,
        opacity: true,
        dataDownload: true
    };

    /**
     * Constant: ENCODING_EXCEPTIONS
     * Characters that should not be encoded with encodeURI component. An
     * array of objects where each object contains "match" which is the
     * regular expression to match after encoding, and "replace" which is the
     * string to replace the match after encoding.
     */
    ns.ENCODING_EXCEPTIONS = [
        { match: new RegExp("%2C", "g"), replace: "," }
    ];

    /**
     * Function: fromObject
     * Returns a query string using the properties and values of an object.
     *
     * Parameters:
     * values - The object to convert to a query string
     *
     * Returns:
     * The query string with special characters escaped.
     *
     * Example:
     * (begin code)
     * > Worldview.Permalink.fromObject({
     *     alpha: "one",
     *     bravo: "two two"
     * });
     * "?alpha=one&bravo=two%20two"
     * (end code)
     */
    ns.fromObject = function(values) {
        var qs = "";
        for ( var key in values ) {
            if ( qs.length > 0 ) {
                qs += "&";
            }
            qs += ns.encode(key) + "=" + ns.encode(values[key]);
        }
        return "?" + qs;
    };

    /**
     * Function: get
     * Returns a query string that is the concatenated value of all components.
     *
     * Returns:
     * The query string to use as a permalink with special characters escaped.
     */
    ns.get = function() {
        var comps = REGISTRY.getComponents();
        var parameters = {};
        for ( var i = 0; i < comps.length; i++ ) {
            if ( typeof comps[i].obj.getValue === 'function' ) {
                var qs = comps[i].obj.getValue();
                if ( qs !== undefined ) {
                    var fields = comps[i].obj.getValue().split("=");
                    var key = fields[0];
                    var value = fields[1];
                    if ( ALLOWED_PARAMETERS[key] ) {
                        parameters[key] = value;
                    }
                }
            }
        }
        var qs = ns.fromObject(parameters);
        var url = window.location.href;
        var prefix = url.split("?")[0];
        prefix = (prefix !== null && prefix !== undefined) ? prefix: url;
        return prefix + qs;
    };

    ns.shorten = function() {
        var link = ns.get();
        if ( /localhost/.test(link) ) {
            log.warn("Cannot shorten localhost. Using " + DEBUG_SHORTEN_URL);
            link = DEBUG_SHORTEN_URL;
        };
        return $.getJSON("service/shorten.cgi?url=" + link);
    };

    /**
     * Function: decode
     * Converts all escaped characters in the query string to actual
     * characters.
     *
     * Parameters:
     * queryString - The query string to decode
     *
     * Returns:
     * The query string with all escaped characters converted to the actual
     * characters.
     *
     * Example:
     * (begin code)
     * > Worldview.Permalink.decode("?foo=%20bar")
     * "?foo= bar"
     * (end code)
     */
    ns.decode = function(queryString) {
        if ( queryString.length === 0 ) {
            return "";
        }
        // Remove the question mark from the query string if it exists,
        // add it back later if needed
        var questionMark = "";
        if ( queryString.substring(0, 1) === "?" ) {
            queryString = queryString.substring(1);
            questionMark = "?";
        }
        var parts = queryString.split("&");
        var decoded = [];
        $.each(parts, function(index, part) {
            decoded.push(decodeURIComponent(part));
        });
        return questionMark + decoded.join("&");
    };

    /*
     * Encode the URI component but convert exceptions back to their original
     * values.
     */
    ns.encode = function(value) {
        var encoded = encodeURIComponent(value);
        $.each(ns.ENCODING_EXCEPTIONS, function(index, exception) {
            encoded = encoded.replace(exception.match, exception.replace);
        });
        return encoded;
    };

});
