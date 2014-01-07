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
 * @module Worldview.DataDownload
 */
Worldview.namespace("DataDownload");

Worldview.DataDownload.ECHO.MockClient = function(suffix) {

    var endpoint;
    var results;

    var self = {};

    var init = function() {
        if ( !suffix ) {
            throw new Error("No mock ECHO suffix specified");
        }
        endpoint = "mock/echo.cgi-" + suffix;
    };

    self.submit = function(parameters) {
        console.warn("Mocking ECHO query", endpoint);
        var deferred = $.Deferred();
        if ( !results ) {
            $.getJSON(endpoint, function(data) {
                try {
                    results = adjustResults(parameters, data);
                    deferred.resolve(results.feed.entry);
                } catch ( error ) {
                    Worldview.error("Internal error", error);
                }
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                deferred.reject(jqXHR, textStatus, errorThrown);
            });
        } else {
            deferred.resolve(results.feed.entry);
        }
        return deferred.promise();
    };

    var adjustResults = function(parameters, data) {
        var day = REGISTRY.getState().time;
        // Mock data was retrieved for Aug 6, 2013
        var resultsDay = new Date(Date.UTC(2013, 7, 6));
        var diffDays = (day - resultsDay) / (1000 * 60 * 60 * 24);

        $.each(data.feed.entry, function(index, entry) {
            var timeStart = wv.util.parseTimestampUTC(entry.time_start);
            timeStart.setUTCDate(timeStart.getUTCDate() + diffDays);
            entry.time_start = timeStart.toISOString();

            var timeEnd = wv.util.parseTimestampUTC(entry.time_end);
            timeEnd.setUTCDate(timeEnd.getUTCDate() + diffDays);
            entry.time_end = timeEnd.toISOString();
        });

        return data;
    };

    init();

    return self;
};

