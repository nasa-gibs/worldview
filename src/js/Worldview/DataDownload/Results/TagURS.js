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

// FIXME: Code copy and pasted from TagNRT, maybe consoldate this?
Worldview.DataDownload.Results.TagURS = function(spec) {

    var self = {};

    self.name = "TagURS";

    self.process = function(meta, granule) {
        // Exit now if this product doesn't have information about NRT
        if ( !spec ) {
            return granule;
        }
        var isURS;
        if ( spec.by === "value" ) {
            isURS = granule[spec.field] === spec.value;
        } else if ( spec.by === "regex" ) {
            var re = new RegExp(spec.value);
            isURS = re.test(granule[spec.field]);
        } else {
            throw new Error("Unknown TagURS method: " + spec.by);
        }
        granule.urs = isURS;
        if ( isURS ) {
            meta.urs = ( meta.urs ) ? meta.urs += 1 : 1;
        }
        return granule;
    };

    return self;

};