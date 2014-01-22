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
 * @module wv.palette
 */
var wv = wv || {};
wv.palette = wv.palette || {};

wv.palette.legend = wv.palette.legend || function(selector) {

    var $legend;
    var canvas;
    var g;
    var palette = null;
    var self = {};

    var init = function() {
        $legend = $(selector);
        canvas = $legend.get(0);
        g = canvas.getContext("2d");
        self.redraw();
    };

    self.set = function(p) {
        palette = p;
        self.redraw();
    };

    self.redraw = function() {
        drawCheckerboard();
        if ( !palette ) {
            return;
        }
        var colors = palette.colors;
        var bins = colors.length;
        var binWidth = canvas.width / bins;
        var drawWidth = Math.ceil(binWidth);
        _.each(colors, function(color, i) {
            g.fillStyle = "#" + color;
            g.fillRect(Math.floor(binWidth * i), 0, drawWidth, canvas.height);
        });
    };

    var drawCheckerboard = function() {
        g.fillStyle = wv.palette.checkerboard;
        g.fillRect(0, 0, canvas.width, canvas.height);
    };

    init();
    return self;
};
