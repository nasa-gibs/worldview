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
 */
wv.link.model = wv.link.model || function(config) {

    var self = {};
    var DEBUG_SHORTEN_LINK = "https://earthdata.nasa.gov/worldview?a=1&b=2";
    var shortenCache = new Cache(10);
    var mock = "";
    var components = [];

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
            mock = "-" + config.parameters.shorten;
        }
    };

    self.register = function(component) {
        components.push(component);
    };

    /**
     * Returns a query string that is the concatenated value of all components.
     *
     * @method queryString
     * @return {string} The query string to use as a permalink with special
     * characters escaped.
     */
    self.queryString = function() {
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
        return wv.util.toQueryString(parameters, ENCODING_EXCEPTIONS);
    };

    /**
     * Returns a permalink that is the concatenated value of all components.
     *
     * @method get
     * @return {string} The permalink with special characters escaped.
     */
    self.get = function() {
        var queryString = self.queryString();
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
        if ( shortenCache[link] ) {
            return $.Deferred().resolve(shortenCache[link]);
        }
        if ( /localhost/.test(link) ) {
            link = DEBUG_SHORTEN_LINK;
            console.warn("Cannot shorten localhost, using", link);
        }
        var promise = $.getJSON("service/wv.link/shorten.cgi" + mock +
                "?url=" +  encodeURIComponent(link));
        promise.done(function(result) {
            shortenCache[link] = result;
        });
        return promise;
    };

    init();

    return self;
};
