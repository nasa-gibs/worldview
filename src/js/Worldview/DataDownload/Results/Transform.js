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

Worldview.DataDownload.Results.Transform = function(projection) {
        
    var self = {};
    
    self.name = "Transform";
    
    self.process = function(meta, granule) {
        if ( granule.geometry[projection] ) {
            return granule;
        }
        var geom = granule.geometry[Worldview.Map.CRS_WGS_84];
        var projGeom = geom.clone()
                .transform(Worldview.Map.CRS_WGS_84, projection);
        granule.geometry[projection] = projGeom;
        granule.centroid[projection] = projGeom.getCentroid();
        return granule;
    };
    
    return self;
};


