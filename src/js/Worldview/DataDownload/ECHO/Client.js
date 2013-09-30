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
 * @module Worldview.DataDownload.ECHO
 */
Worldview.namespace("DataDownload.ECHO");

Worldview.DataDownload.ECHO.Client = function(spec) {

    // Hold a maximum of ten results
    var CACHE_SIZE = 10;

    // Hold results for a maximum of ten minutes
    var CACHE_TIME = 10 * 60;

    // Abort query after 45 seconds
    var QUERY_TIMEOUT = spec.timeout || 45 * 1000;

    var ns = Worldview.DataDownload.ECHO.Client;

    var ajaxOptions = {
        url: "service/echo.cgi",
        traditional: true,
        dataType: "json",
        timeout: QUERY_TIMEOUT
    };

    var self = {};

    var init = function() {
        ns.ajax = Worldview.AjaxCache(CACHE_SIZE, {
            expirationAbsolute: CACHE_TIME
        });
    };

    self.submit = function(parameters) {
        var queryParameters = $.extend(true, {}, ajaxOptions, parameters);
        var startTimeDelta = parameters.startTimeDelta || 0;
        var endTimeDelta = parameters.endTimeDelta || 0;

        var t = parameters.time;
        if ( t ) {
            var startTime = new Date(Date.UTC(
                t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(),
                0, 0 + startTimeDelta, 0
            ));
            var endTime = new Date(Date.UTC(
                t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(),
                23, 59 + endTimeDelta, 59
            ));

            queryParameters.data.startTime = startTime.toTimestampUTC();
            queryParameters.data.endTime = endTime.toTimestampUTC();
        }

        var deferred = $.Deferred();
        ns.ajax.submit(queryParameters).done(function(data) {
            deferred.resolve(data.feed.entry);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            deferred.reject(jqXHR, textStatus, errorThrown);
        });
        return deferred.promise();
    };

    init();
    return self;
};
