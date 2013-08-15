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

Worldview.DataDownload.Results.TagNRT = function(spec) {
    
    var self = {};
    
    self.name = "TagNRT";
    
    self.process = function(meta, result) {
        var isNRT;
        if ( spec.by === "value" ) {
            isNRT = result[spec.field] === spec.value;
        } else {
            throw new Error("Unknown TagNRT method: " + spec.by);
        }
        if ( isNRT ) {
            result.nrt = true;
            meta.nrt = true;
        }
        return result;
    };
    
    return self;

}

