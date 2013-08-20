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

Worldview.DataDownload.Results.ExtentFilter = function(projection, extent) {
    
    var self = {};
    
    self.name = "ExtentFilter";
    
    self.process = function(meta, granule) {
        var geom = granule.geometry[projection];
        if ( !geom ) {
            return result;
        }
        var mbr = geom.getBounds();
        if ( extent.intersectsBounds(mbr) ) {
            return granule;
        }
    };
    
    return self;
};

