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

Worldview.DataDownload.Results.TagVersion = function() {
    
    var self = {};
    
    self.name = "TagVersion";
    
    self.process = function(meta, granule) {
        var match = granule.dataset_id.match("V(\\d{3})(\\d*)");
        if ( match ) {
            var major = match[1];
            var minor = match[2] || 0;
            granule.version = parseFloat(major + "." + minor);
            return granule;
        } 
        
        match = granule.dataset_id.match("V([\\d\\.]+)");
        if ( match ) {
            granule.version = parseFloat(match[1]);
            return granule;
        }
        
        return granule;
    };
    
    return self;

};