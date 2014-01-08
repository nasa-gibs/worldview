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

    var init = function() {
        if ( config && config.parameters && config.parameters.shorten ) {
            mock = "-" + config.parameters.shorten;
        }
    };

    self.register = function(component) {
        components.push(component);
        return self;
    };

    /**
     * Returns a query string that is the concatenated value of all components.
     *
     * @method toPermalink
     * @return {string} The query string to use as a permalink with special
     * characters escaped.
     */
    self.toQueryString = function() {
        var parts = [];
        _.each(components, function(component) {
            var value = component.toPermalink();
            if ( value && value.length > 0 ) {
                parts.push(component.toPermalink());
            }
        });
        return parts.join("&");
    };

    /**
     * Returns a permalink that is the concatenated value of all components.
     *
     * @method get
     * @return {string} The permalink with special characters escaped.
     */
    self.get = function() {
        var queryString = self.toQueryString();
        var url = window.location.href;
        var prefix = url.split("?")[0];
        prefix = (prefix !== null && prefix !== undefined) ? prefix: url;
        return prefix + "?" + queryString;
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

    /**
     * Sets the state of all registered models from a query string.
     *
     * @method load
     * @param {Object} [queryString] the query string to use, if not specified
     * ``window.location.search`` is used.
     */
    self.load = function(queryString) {
        queryString = queryString || window.location.search;
        _.each(components, function(component) {
            component.fromPermalink(queryString);
        });
    };

    init();

    return self;
};
