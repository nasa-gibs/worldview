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

Worldview.DataDownload.Results.MODISGridLabel = function() {

    var self = {};
    
    self.name = "MODISGridLabel";
    
    self.process = function(meta, granule) {
        granule.label = "h" + granule.h + " - " + "v" + granule.v;
        return granule;
    };
    
    return self;
    
};

