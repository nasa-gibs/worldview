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

Worldview.DataDownload.Results.CollectPreferred = function(prefer) {
    
    var self = {};
    
    self.name = "CollectPreferred";
    
    self.process = function(meta, granule) {
        if ( !meta.preferred ) {
            meta.preferred = {};
        }
        var preferred = 
                (prefer === "nrt" && granule.nrt) ||
                (prefer === "science" && !granule.nrt);
        if ( preferred ) {
            meta.preferred[granule.time_start] = granule;
        }
        return granule;
    };

    return self;
};
