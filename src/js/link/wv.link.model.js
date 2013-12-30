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
 * @module wv.link
 */
var wv = wv || {};
wv.link = wv.link || {};

/**
 * Permalink support.
 *
 * Note: Most of this will change in version 0.7.0.
 *
 * @class wv.link.model
 * @static
 */
wv.link.model = wv.link.model || function(config) {

    var self = {};
    var shortenCache = new Cache(10);
    var mock = "";

    /**
     * URLs for localhost cannot be shorted via bit.ly. If localhost is
     * being used, use the following URL instead of the actual permalink.
     */
    var DEBUG_SHORTEN_URL = "https://earthdata.nasa.gov/labs/worldview";

    /**
     * The "permalink" from the registry returns values from components
     * that should not actually be in the permalink. Only accept the
     * following parameters.
     */
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
     * Characters that should not be encoded with encodeURI component. An
     * array of strings where each string is an encoded value to ignore.
     */
    var ENCODING_EXCEPTIONS = ["%2C"];

    var init = function() {
        if ( config && config.parameters && config.parameters.shorten ) {
            mock = config.parameters.shorten + "-";
        }
    };

    /**
     * Returns a query string that is the concatenated value of all components.
     *
     * @method get
     * @static
     * @return {string} The query string to use as a permalink with special
     * characters escaped.
     */
    self.get = function() {
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
        var queryString = wv.util.toQueryString(parameters,
                ENCODING_EXCEPTIONS);
        var url = window.location.href;
        var prefix = url.split("?")[0];
        prefix = (prefix !== null && prefix !== undefined) ? prefix: url;
        return prefix + queryString;
    };

    /**
     * Shortens the permalink using bit.ly.
     *
     * @method shorten
     * @param {String} [link] The link to shorten. If not specified, the
     * standard permalink for Worldview is used.
     * @return {JQuery.promise} a jQuery promise that will be notified
     * when the request is complete.
     */
    self.shorten = function(link) {
        if ( !link ) {
            link = self.get();
        }
        if ( shortenCache.link ) {
            return $.Deferred().resolve(shortenCache.link);
        }
        if ( /localhost/.test(link) ) {
            console.warn("Cannot shorten localhost. Using " +
                    DEBUG_SHORTEN_URL);
            link = DEBUG_SHORTEN_URL;
        }
        var promise = $.getJSON("service/wv.link/" + mock + "shorten.cgi" +
                "?url=" + link);
        promise.done(function(result) {
            shortenCache.link = result;
        });
        return promise;
    };

    init();

    return self;
};
