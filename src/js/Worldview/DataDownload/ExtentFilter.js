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

Worldview.DataDownload.ExtentFilter = function(config, options, model) {
    
    var self = {};
    var extents = {};
    var maxExtents = {};
    
    var init = function() {
        $.each(options, function(epsg, extentArray) {
            extents[epsg] = new OpenLayers.Bounds(extentArray);
        });
        $.each(config.projections, function(projectionName, projection) {
            maxExtents[projectionName] = projection.maxExtent;
        });
    };
    
    self.prepare = function(result) {
    };
    
    self.filter = function(result) {
        var geom = result.geometry[model.epsg];
        if ( !geom ) {
            return result;
        }
        
        var extent = extents[model.epsg] || maxExtents[model.projection];
        var mbr = geom.getBounds();
        if ( extent.intersectsBounds(mbr) ) {
            result.geometry[model.epsg] = geom;
            result.centroid[model.epsg] = geom.getCentroid();
            return result;
        }
        return null;            
    };
    
    init();
    return self;
};

