/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

var wv = wv || {};

wv.data = (function(self) {

    self.parse = function(state, errors, config) {
        if ( state.dataDownload ) {
            state.download = state.dataDownload;
            delete state.dataDownload;
        }
        var productId = state.download;
        if ( productId ) {
            if ( !config.products[productId] ) {
                delete state.download;
                errors.push({ message: "No such product: " + productId });
            }
        }
    };

    return self;

})(wv.data || {});
