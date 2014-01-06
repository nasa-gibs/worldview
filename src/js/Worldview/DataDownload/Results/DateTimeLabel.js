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

Worldview.DataDownload.Results.DateTimeLabel = function(time) {

    var self = {};

    self.name = "DateTimeLabel";

    self.process = function(meta, granule) {
        var timeStart = wv.util.parseTimestampUTC(granule.time_start);

        // Some granules may not have an end time
        if ( granule.time_end ) {
            var timeEnd = wv.util.parseTimestampUTC(granule.time_end);
            granule.label = wv.util.toISOStringDate(timeStart) + ": " +
                wv.util.toISOStringTimeHM(timeStart) + "-" +
                wv.util.toISOStringTimeHM(timeEnd);
        } else {
            granule.label = wv.util.toISOStringDate(timeStart) + ": " +
                wv.util.toISOStringTimeHM(timeStart);
        }

        return granule;
    };

    return self;

};