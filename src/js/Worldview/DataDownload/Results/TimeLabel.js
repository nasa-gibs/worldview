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

Worldview.DataDownload.Results.TimeLabel = function(time) {

    var self = {};

    self.name = "TimeLabel";

    self.process = function(meta, granule) {
        var timeStart = wv.util.parseTimestampUTC(granule.time_start);

        // Sometimes an end time is not provided by ECHO
        var timeEnd;
        if ( granule.time_end ) {
            timeEnd = wv.util.parseTimestampUTC(granule.time_end);
        }

        var diff = Math.floor(
            (timeStart.getTime() - time.getTime()) / (1000 * 60 * 60 * 24)
        );

        var suffix = "";
        if ( diff !== 0 ) {
            if ( diff < 0 ) {
                suffix = " (" + diff + " day)";
            } else {
                suffix = " (+" + diff + " day)";
            }
        }
        var displayStart = wv.util.toISOStringTimeHM(timeStart);
        var displayEnd = null;
        if ( timeEnd ) {
            displayEnd = wv.util.toISOStringTimeHM(timeEnd);
        } else {
            displayEnd = "?";
        }
        granule.label = displayStart + " - " + displayEnd + suffix;

        granule.downloadLabel = wv.util.toISOStringDate(timeStart) + ": " +
            displayStart + "-" + displayEnd;

        return granule;
    };

    return self;

};