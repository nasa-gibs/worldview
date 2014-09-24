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
 * @module wv.data
 */
var wv = wv || {};
wv.data = wv.data || {};
wv.data.echo = wv.data.echo || {};

wv.data.echo.client = wv.data.echo.client || function(spec) {

    // Abort query after 45 seconds
    var QUERY_TIMEOUT = spec.timeout || 45 * 1000;

    var ns = wv.data.echo.client;

    var ajaxOptions = {
        url: wv.brand.url("service/data/echo.cgi"),
        traditional: true,
        dataType: "json",
        timeout: QUERY_TIMEOUT
    };

    var self = {};

    var init = function() {
        ns.ajax = wv.util.ajaxCache();
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

            queryParameters.data.startTime =
                    wv.util.toCompactTimestamp(startTime);
            queryParameters.data.endTime = wv.util.toCompactTimestamp(endTime);
        }

        var deferred = $.Deferred();
        var metrics = "ev=data-download&" + $.param(queryParameters.data, true);
        wv.util.metrics(metrics);
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


wv.data.echo.geometry = function(result) {

    var self = {};
    self.polygons = [];

    var init = function() {
        if ( result.polygons ) {
            initFromPolygons(result.polygons);
        } else if ( result.boxes ) {
            initFromBoxes(result.boxes);
        } else {
            throw new Error("Unable to find spatial field");
        }
    };

    self.toOpenLayers = function() {
        olPolygons = [];
        $.each(self.polygons, function(index, polygon) {
            var olRings = [];
            $.each(polygon, function(index, ring) {
                var olPoints = [];
                $.each(ring, function(index, point) {
                    var p = new OpenLayers.Geometry.Point(point.x, point.y);
                    olPoints.push(p);
                });
                olRings.push(new OpenLayers.Geometry.LinearRing(olPoints));
            });
            olPolygons.push(new OpenLayers.Geometry.Polygon(olRings));
        });
        return olPolygons[0];
    };

    var initFromPolygons = function(echoPolygons) {
        $.each(echoPolygons, function(index, echoPolygon) {
            var rings = [];
            $.each(echoPolygon, function(index, echoRing) {
                var ring = [];
                var parts = echoRing.split(" ");
                for ( var i = 0; i < parts.length; i+= 2 ) {
                    var y = parseFloat(parts[i]);
                    var x = parseFloat(parts[i + 1]);
                    ring.push({x: x, y: y});
                }
                rings.push(ring);
            });
            self.polygons.push(rings);
        });
    };

    var initFromBoxes = function(echoBoxes) {
        $.each(echoBoxes, function(index, echoBox) {
            var ring = [];
            var fields = echoBox.split(" ");
            var ymin = parseFloat(fields[0]);
            var xmin = parseFloat(fields[1]);
            var ymax = parseFloat(fields[2]);
            var xmax = parseFloat(fields[3]);
            ring.push({x: xmin, y: ymin});
            ring.push({x: xmax, y: ymin});
            ring.push({x: xmax, y: ymax});
            ring.push({x: xmin, y: ymax});
            ring.push({x: xmin, y: ymin});

            self.polygons.push([ring]);
        });
    };

    init();
    return self;
};


wv.data.echo.mockClient = function(suffix) {

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
                    wv.util.error(error);
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
        var day = wvx.models.date.selected;
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

wv.data.echo.REL_DATA = "http://esipfed.org/ns/fedsearch/1.1/data#";
wv.data.echo.REL_BROWSE = "http://esipfed.org/ns/fedsearch/1.1/browse#";

wv.data.echo.roundTime = function(timeString) {
    var time = wv.util.parseTimestampUTC(timeString);
    if ( time.getUTCMilliseconds() >= 500 ) {
        time.setUTCSeconds(time.getUTCSeconds() + 1);
    }
    time.setUTCMilliseconds(0);
    return time.toISOString();
};
