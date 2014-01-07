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
Worldview.namespace("DataDownload.Results");

Worldview.DataDownload.Results.ConnectSwaths = function(projection) {

    var MAX_DISTANCE_GEO = 270;
    var startTimes = {};
    var endTimes = {};

    var self = {};
    self.name = "ConnectSwaths";

    self.process = function(meta, granule) {
        if ( !granule.centroid[projection] ) {
            return;
        }
        var timeStart = roundTime(granule.time_start);
        var timeEnd = roundTime(granule.time_end);

        if ( startTimes[timeStart] ) {
            console.warn("Discarding duplicate start time", timeStart,
                    granule, startTimes[timeStart]);
            return;
        }
        if ( endTimes[timeEnd] ) {
            console.warn("Discarding duplicate end time", timeEnd,
                    granule, endTimes[timeEnd]);
            return;
        }
        var swath = [granule];
        startTimes[timeStart] = swath;
        endTimes[timeEnd] = swath;

        combineSwath(swath);
        return granule;
    };

    self.after = function(results) {
        results.meta.swaths = [];
        $.each(startTimes, function(index, swath) {
            if ( swath.length > 1 ) {
                results.meta.swaths.push(swath);
            }
        });
    };

    var combineSwath = function(swath) {
        var combined = false;

        var maxDistance = ( projection === Worldview.Map.CRS_WGS_84 )
                ? MAX_DISTANCE_GEO : Number.POSITIVE_INFINITY;
        var thisTimeStart = roundTime(swath[0].time_start);
        var thisTimeEnd = roundTime(swath[swath.length - 1].time_end);
        var otherSwath = endTimes[thisTimeStart];

        // Can this swath be added to the end of other swath?
        if ( otherSwath ) {
            var otherGranule = otherSwath[otherSwath.length - 1];
            var otherTimeStart = roundTime(otherSwath[0].time_start);
            var otherTimeEnd =
                    roundTime(otherSwath[otherSwath.length - 1].time_end);

            if ( connectionAllowed(swath[0], otherGranule, maxDistance) ) {
                // Remove entries for this swath
                delete startTimes[thisTimeStart];
                delete endTimes[thisTimeEnd];

                // Remove entries for other swath
                delete startTimes[otherTimeStart];
                delete endTimes[otherTimeEnd];

                // Combine swaths
                var newSwath = otherSwath.concat(swath);

                var newTimeStart = roundTime(newSwath[0].time_start);
                var newTimeEnd =
                    roundTime(newSwath[newSwath.length - 1].time_end);

                startTimes[newTimeStart] = newSwath;
                endTimes[newTimeEnd] = newSwath;
                combined = true;
                swath = newSwath;
            }
        }

        if ( combined ) {
            combineSwath(swath);
        }
    };

    // Connection is allowed as long as there is at least one path between
    // centroids that is less than the max distance
    var connectionAllowed = function(g1, g2, maxDistance) {
        var polys1 = Worldview.Map.toPolys(g1.geometry[projection]);
        var polys2 = Worldview.Map.toPolys(g2.geometry[projection]);
        var allowed = false;

        $.each(polys1, function(index, poly1) {
            $.each(polys2, function(index, poly2) {
                var x1 = poly1.getCentroid().x;
                var x2 = poly2.getCentroid().x;
                if ( Math.abs(x2 - x1) < maxDistance ) {
                    allowed = true;
                    return false;
                }
            });
        });
        return allowed;
    };


    var roundTime = function(timeString) {
        return Worldview.DataDownload.ECHO.roundTime(timeString);
    };

    return self;

};

