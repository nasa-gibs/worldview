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
 * Namespace: SOTE.widget.palette
 * 
 * Client side adjusting of data display palettes.
 */
SOTE.namespace("SOTE.widget.palette");

$(function() {
    var ns = SOTE.widget.palette;
    var util = SOTE.util;
    
    /**
     * Constant: CHECKERBOARD
     * 
     * A canvas pattern of a gray based checkerboard used to denote 
     * transparency.
     */
    ns.CHECKERBOARD = null;

    /**
     * Function: toLookup
     */
    ns.toLookup = function(bins, palette) {
        var stops = palette.stops;
        var lut = [];
        var currentStop = 0;
        for ( var bin = 0; bin < bins; bin++ ) {
            var distance = bin / (bins - 1);
            for ( var i = currentStop; i < stops.length; i++ ) {
                if ( distance <= stops[i].at ) {
                    break;
                }
            }
            currentStop = i;         
            var end = stops[util.clampIndex(stops, i)];
            var begin = stops[util.clampIndex(stops, i-1)];
            
            var segmentLength = end.at - begin.at;
            var segmentDistance = (segmentLength !== 0) ? 
                    (distance - begin.at) / segmentLength : 0;
              
            var hsvEnd = util.rgbToHsv(end.r, end.g, end.b);
            var hsvBegin = util.rgbToHsv(begin.r, begin.g, begin.b);
            
            var h = hsvBegin.h + (segmentDistance * (hsvEnd.h - hsvBegin.h));
            var s = hsvBegin.s + (segmentDistance * (hsvEnd.s - hsvBegin.s));
            var v = hsvBegin.v + (segmentDistance * (hsvEnd.v - hsvBegin.v));
                  
            var rgb = util.hsvToRgb(h, s, v);
            
            lut.push(rgb);
            
            /*
            lut.push({
                r: Math.floor(begin.r + (segmentDistance * (end.r - begin.r))),
                g: Math.floor(begin.g + (segmentDistance * (end.g - begin.g))),
                b: Math.floor(begin.b + (segmentDistance * (end.b - begin.b))),                
            });
            */
        }        
        return lut;
    }
    
    var init = function() {
        drawCheckerboard();
    }
    
    var drawCheckerboard = function() {
        var size = 7;
        
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
        
        ns.CHECKERBOARD = g.createPattern(canvas, "repeat");
    }

    init();
    
});

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
            g.fillStyle = "rgb(" + 
                [lut[bin].r, lut[bin].g, lut[bin].b].join() + ")";
            g.fillRect(bin * binWidth, 0, stripeWidth, canvas.height);
        }
    }
    
    var drawBackground = function() {
        g.fillStyle = self.checkerboard;
        g.fillRect(0, 0, canvas.width, canvas.height);
    }
        
    init();
    return self;
}
