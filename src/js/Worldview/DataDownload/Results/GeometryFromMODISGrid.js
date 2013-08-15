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

Worldview.DataDownload.Results.GeometryFromMODISGrid = function(projection) {
    
    var parser = new OpenLayers.Format.GeoJSON();
    
    var self = {};
    
    self.name = "GeoemtryFromMODISGrid";
    
    self.process = function(meta, granule) {
        if ( !granule.geometry ) {
            granule.geometry = {};
            granule.centroid = {};
        }
        
        if ( !granule.geometry[projection] ) {
            var json = meta.grid[granule.hv];
            if ( !json ) {
                return;
            }
            var geom = parser.read(meta.grid[granule.hv], "Geometry");
            var centroid = geom.getCentroid();
        
            granule.geometry[projection] = geom;
            granule.centroid[projection] = centroid;
        }
        return granule;        
    };
    
    return self;
    
};
