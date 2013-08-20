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

Worldview.DataDownload.Results.AntiMeridianMulti = function(maxDistance) {
    
    var self = {};
    
    self.name = "AntiMeridianMulti";
    
    self.process = function(meta, granule) {
        var geom = granule.geometry[Worldview.Map.CRS_WGS_84];
        if ( !Worldview.Map.isPolygonValid(geom, maxDistance) ) {
            var geomEast = Worldview.Map.adjustAntiMeridian(geom, 1);
            var geomWest = Worldview.Map.adjustAntiMeridian(geom, -1);
            var centroidEast = geomEast.getCentroid();
            var centroidWest = geomWest.getCentroid();
            var newGeom = 
                new OpenLayers.Geometry.MultiPolygon([geomEast, geomWest]);
            var newCentroid =
                new OpenLayers.Geometry.MultiPoint([centroidEast, centroidWest]);
            granule.geometry[Worldview.Map.CRS_WGS_84] = newGeom;
            granule.centroid[Worldview.Map.CRS_WGS_84] = newCentroid; 
        }
        return granule;
    };

    return self;
};