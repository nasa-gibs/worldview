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
        var timeStart = Date.parseISOString(granule.time_start);
        var timeEnd = Date.parseISOString(granule.time_end);
        
        granule.label = timeStart.toISOStringDate() + ": " + 
            timeStart.toISOStringTimeHM() + "-" + timeEnd.toISOStringTimeHM();
            
        return granule;  
    };

    return self;
    
};