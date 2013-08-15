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

Worldview.DataDownload.Results.TimeFilter = function(spec) {

    var westZone = null;
    var eastZone = null;
    var maxDistance = null;
        
    var self = {};

    self.name = "TimeFilter";
    
    var init = function() {
        westZone = spec.time.clone().setUTCMinutes(spec.westZone);
        eastZone = spec.time.clone().setUTCMinutes(spec.eastZone);
        maxDistance = spec.maxDistance;
    };
    
    self.process = function(meta, granule) {
        var geom = granule.geometry[Worldview.Map.CRS_WGS_84];
        var time = Date.parseISOString(granule.time_start);
        if ( !Worldview.Map.isPolygonValid(geom, maxDistance) ) {
            var adjustSign = ( time < eastZone ) ? 1 : -1;
            geom = 
                Worldview.Map.adjustAntiMeridian(geom, adjustSign);
            granule.geometry[Worldview.Map.CRS_WGS_84] = geom;
            granule.centroid[Worldview.Map.CRS_WGS_84] = geom.getCentroid();
        }
        
        var x = granule.centroid[Worldview.Map.CRS_WGS_84].x;     
        if ( time < eastZone && x < 0 ) {
            return;
        }
        if ( time > westZone && x > 0 ) {
            return;
        }
        return result;
    };
    
    init();
    return self;
}