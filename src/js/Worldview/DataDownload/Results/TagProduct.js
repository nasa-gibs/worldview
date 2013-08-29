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

Worldview.DataDownload.Results.TagProduct = function(product) {
    
    var self = {};
    
    self.name = "TagProduct";
    
    self.process = function(meta, granule) {
        granule.product = product;
        return granule;
    };
    
    return self;

};