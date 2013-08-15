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

Worldview.DataDownload.Results.GeometryFromECHO = function GeometryFromECHO(projection) {

    var self = {};
    
    self.name = "GeometryFromECHO";
    
    self.process = function(meta, granule) {
        if ( !granule.geometry ) {
            granule.geometry = {};
        }
        if ( !granule.centroid ) {
            granule.centroid = {};    
        }
        
        if ( !granule.geometry[projection] ) {
            var echoGeom = Worldview.DataDownload.ECHO.Geometry(granule);
            var geom = echoGeom.toOpenLayers(Worldview.Map.CRS_WGS_84, 
                    projection);
            var centroid = geom.getCentroid();
            granule.geometry[projection] = geom;
            granule.centroid[projection] = centroid;   
        }        
        return result;    
    };
    
    return self;
};
