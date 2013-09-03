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

Worldview.DataDownload.Results.TagList = function(spec) {
    
    var self = {};
    
    self.name = "TagList";
    
    self.process = function(meta, granule) {
        return granule;
    };
    
    self.after = function(results) {
        results.meta.showList = true;
    };
    
    return self;

};
