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
 * @module Worldview.DataDownload.Results
 */
Worldview.namespace("DataDownload.Results");

Worldview.DataDownload.Results.GeometryFromECHO = function GeometryFromECHO() {

    var self = {};
    
    self.name = "GeometryFromECHO";
    
    self.process = function(meta, granule) {
        if ( !granule.geometry ) {
            granule.geometry = {};
        }
        if ( !granule.centroid ) {
            granule.centroid = {};    
        }
        
        if ( !granule.geometry[Worldview.Map.CRS_WGS_84] ) {
            var echoGeom = Worldview.DataDownload.ECHO.Geometry(granule);
            var geom = echoGeom.toOpenLayers();
            var centroid = geom.getCentroid();
            granule.geometry[Worldview.Map.CRS_WGS_84] = geom;
            granule.centroid[Worldview.Map.CRS_WGS_84] = centroid;   
        }        
        return result;    
    };
    
    return self;
};
