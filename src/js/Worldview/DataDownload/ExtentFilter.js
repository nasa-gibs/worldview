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
    
    var init = function() {
        $.each(options, function(epsg, extentArray) {
            var extent = new OpenLayers.Bounds(extentArray);
            extents[epsg] = extent;    
        });
    };
    
    self.filter = function(result) {
        var geom = result.geometry[model.epsg];
        if ( !geom ) {
            return result;
        }
        
        var extent = 
                extents[model.epsg] || config.projections[model.projection];
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

