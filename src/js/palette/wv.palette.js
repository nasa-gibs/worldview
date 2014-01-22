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
        } else {
            drawCheckerboard();
        }
    };

    var drawCheckerboard = function() {
        var size = 2;
        var canvas = document.createElement("canvas");

        canvas.width = size * 2;
        canvas.height = size * 2;

        var g = canvas.getContext("2d");

        g.fillStyle = "rgb(102, 102, 102)";
        g.fillRect(0, 0, size, size);
        g.fillRect(size, size, size, size);

        g.fillStyle = "rgb(153, 153, 153)";
        g.fillRect(0, size, size, size);
        g.fillRect(size, 0, size, size);

        self.checkerboard = g.createPattern(canvas, "repeat");
    };

    init();
    return self;

})(wv.palette || {});
