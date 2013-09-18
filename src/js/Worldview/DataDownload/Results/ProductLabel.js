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

Worldview.DataDownload.Results.ProductLabel = function(name) {

    var self = {};
    
    self.name = "ProductLabel";
    
    self.process = function(meta, granule) {        
        granule.label = name;
        return granule;  
    };

    return self;
    
};