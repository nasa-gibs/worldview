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

Worldview.DataDownload.Results.PreferredFilter = function(prefer) {
    
    var self = {};
    var ns = Worldview.DataDownload;
    
    self.name = "PreferredFilter";
    
    self.process = function(meta, granule) {
        var timeStart = ns.ECHO.roundTime(granule.time_start);
        if ( meta.preferred[timeStart] ) {
            if ( prefer === "nrt" && !granule.nrt ) {
                return;
            }
            if ( prefer === "science" && granule.nrt ) {
                return;
            }
        }
        return granule;
    };

    return self;
};
