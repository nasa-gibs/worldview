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

Worldview.DataDownload.TimeFilter = function(config, options, model) {
    
    var self = {};
    var westZone = null;
    var eastZone = null;
    var maxDistance = null;
    
    var init = function() {
        var t = model.time;
        westZone = model.time.clone().setUTCMinutes(options.westZone);
        eastZone = model.time.clone().setUTCMinutes(options.eastZone);
        maxDistance = options.maxDistance;
    };
    
    self.filter = function(result) {
        var geom = result.geometry["4326"];
        var resultTime = Date.parseISOString(result.time_start);
        if ( !Worldview.Map.isPolygonValid(geom, maxDistance) ) {
            var adjustSign = ( resultTime < eastZone ) ? 1 : -1;
            geom = 
                Worldview.Map.adjustAntiMeridian(geom, adjustSign);
            result.geometry["4326"] = geom;
            result.centroid["4326"] = geom.getCentroid();
        }
        
        var centroidX = result.centroid["4326"].x;     
        if ( resultTime < eastZone && centroidX < 0 ) {
            return;
        }
        if ( resultTime > westZone && centroidX > 0 ) {
            return;
        }
        return result;
    }
    
    init();
    return self;
}