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

Worldview.DataDownload.NRTFilter = function(config, options, model) {
    
    var self = {};
    var scienceData = {};
    
    var init = function() {
    };
    
    self.prepare = function(result) {
        if ( !isNRT(result) ) {
            scienceData[result.time_start] = result;
        }
    };
    
    self.filter = function(result) {
        if ( isNRT(result) && scienceData[result.time_start] ) {
            return null;
        }
        return result;
    };
    
    var isNRT = function(result) {
        if ( options.method === "dataCenter" ) {
            return result.data_center === options.value;
        }
        throw new Error("Unknown NRT method: " + options.method);
    };
    
    init();
    return self;
};
