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
    
    self.process = function(meta, granule) {
        // Exit now if this product doesn't have information about NRT
        if ( !spec ) {
            return granule;
        }
        var isNRT;
        if ( spec.by === "value" ) {
            isNRT = granule[spec.field] === spec.value;
        } else if ( spec.by === "regex" ) {
            var re = new RegExp(spec.value);
            isNRT = re.test(granule[spec.field]);
        } else {
            throw new Error("Unknown TagNRT method: " + spec.by);
        }
        if ( isNRT ) {
            granule.nrt = true;
            meta.nrt = true;
        }
        return granule;
    };
    
    return self;

};

