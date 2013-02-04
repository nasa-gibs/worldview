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
 * Class: SOTE.widget.palette.ColorBar
 * 
 * ColorBar class.
 */
SOTE.widget.palette.ColorBar = function(spec) {
   
    var self = {};
    var ns = SOTE.widget.palette;
    var $canvas;
    var canvas; 
    var g;

    self.checkerboard = ns.CHECKERBOARD;
    self.bins = 255;
    self.palette = null;
    
    /**
     * Constructor: ColorBar
     */
    var init = function() {
        $canvas = $(spec.selector);
        if ( $canvas.length === 0 ) {
            throw "No such element: " + spec.selector;
        }
        canvas = $canvas.get(0);
        canvas.width = $canvas.width();
        canvas.height = $canvas.height();
        
        g = canvas.getContext("2d");
        
        self.count = spec.count || 255;        
        self.checkerboard = spec.checkerboard || self.checkerboard;
        self.palette = spec.palette || self.palette;
        self.bins = spec.bins || self.bins;
        $canvas.css("background", "#ff0000");
        self.redraw();
    }
    
    /**
     * Method: redraw
     */
    self.redraw = function() {
        drawBackground();
        if ( !self.palette ) {
            return;
        }
        var lut = ns.toLookup(self.bins, self.palette);
        var binWidth = canvas.width / self.bins;
        var stripeWidth = ( binWidth < 1 ) ? 1 : binWidth;
        for ( var bin = 0; bin < self.bins; bin++ ) {
            g.fillStyle = "rgba(" + 
                [lut[bin].r, lut[bin].g, lut[bin].b, lut[bin].a].join() + ")";
            g.fillRect(Math.floor(bin * binWidth), 0, 
                       stripeWidth, canvas.height);
        }
    }
    
    var drawBackground = function() {
        g.fillStyle = self.checkerboard;
        g.fillRect(0, 0, canvas.width, canvas.height);
    }
        
    init();
    return self;
}
