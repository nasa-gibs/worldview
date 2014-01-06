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

/**
 * @module wv.palette
 */
var wv = wv || {};

wv.palette = (function(self) {

    self.supported = true;

    var init = function() {
        var browser = wv.util.browser;
        if ( browser.ie || !browser.webWorkers || !browser.cors ) {
            self.supported = false;
        }
    };

    init();
    return self;

})(wv.palette || {});
