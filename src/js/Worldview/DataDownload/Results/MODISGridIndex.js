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

Worldview.DataDownload.Results.MODISGridIndex = function() {
    
    var self = {};
    
    self.name = "MODISGridIndex";
    
    self.process = function(meta, granule) {
        var id = granule.producer_granule_id;
        var matches = id.match(/\.h(\d+)v(\d+)\./);
        granule.h = parseInt(matches[1], 10);
        granule.v = parseInt(matches[2], 10);
        granule.hv = "h" + granule.h + "v" + granule.v;
        return granule;
    };
    
    self.after = function(results) {
        results.meta.grid = {};
        $.each(results.meta.gridFetched.features, function(index, feature) {
            var key = "h" + feature.properties.H + "v" + feature.properties.V;
            results.meta.grid[key] = feature.geometry;   
        });
    };
    
    return self;
};
    