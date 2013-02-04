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
    
    // This namespace
    var ns = SOTE.widget.palette;
    
    // Namespace aliases
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
        
        var min = palette.min || 0;
        var max = palette.max || 1;
        
        for ( var bin = 0; bin < bins; bin++ ) {
            var distance;
            if ( palette.type === "index" ) { 
                distance = bin;                
            } else { // palette.positions === "percentage" 
                distance = bin / (bins - 1); 
            }

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
            
            if ( distance < min || distance > max ) {
                lut.push({r: 0, g: 0, b: 0, a: 0});
            } else if ( palette.type === "solid" || palette.type === "index" ) {
                if ( segmentDistance < 1 ) {
                    lut.push({r: begin.r, g: begin.g, b: begin.b, a: 0xff});                        
                } else {
                    lut.push({r: end.r, g: end.g, b: end.b, a: 0xff});
                }
            } else if ( palette.interpolate === "rgb" ) {
                lut.push(ns.rgbInterpolate(segmentDistance, begin, end));
            } else { // interpolate === "hsl"
                lut.push(ns.hslInterpolate(segmentDistance, begin, end));
            }
        }        
        return lut;
    }
    

    ns.rgbInterpolate = function(percent, begin, end) {
        return {
            r: Math.round(begin.r + (percent * (end.r - begin.r))),
            g: Math.round(begin.g + (percent * (end.g - begin.g))),
            b: Math.round(begin.b + (percent * (end.b - begin.b))), 
            a: 0xff             
        }    
    }
    
    ns.hslInterpolate = function(percent, rgbBegin, rgbEnd) {
        var hslBegin = ns.rgb2hsl(rgbBegin.r, rgbBegin.g, rgbBegin.b);
        var hslEnd = ns.rgb2hsl(rgbEnd.r, rgbEnd.g, rgbEnd.b);
  
        // Hue is a circle. Traverse the shortest route. If the distance 
        // between the two endpoints is more than half the circle, add one
        // to the smallest value.
        var distance = Math.abs(hslBegin.h - hslEnd.h);      
        if ( distance > 0.5 ) {
            if ( hslBegin.h < hslEnd.h ) {
                hslBegin += 1.0;
            } else {
                hslEnd += 1.0;
            }
        }
        var h = hslBegin.h + (percent * (hslEnd.h - hslBegin.h));
        var s = hslBegin.s + (percent * (hslEnd.s - hslBegin.s));
        var l = hslBegin.l + (percent * (hslEnd.l - hslBegin.l));        
           
        // Normalize back to the range of 0 - 1
        if ( h > 1.0 ) {
            h -= 1.0;
        }
        var result = ns.hsl2rgb(h, s, l);
        result.a = 0xff;
        return result;
    }
    
    /**
     * Function: rgb2hsl
     * 
     * Converts an RGB color value to HSL. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes r, g, and b are contained in the set [0, 255] and
     * returns h, s, and l in the set [0, 1].
     *
     * See Also:
     * http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
     * 
     * Parameters:
     * r - The red color value
     * g - The green color value
     * b - The blue color value
     * 
     * Returns:
     * The HSL representation as an object with h, s, and l properties.
     * 
     * Example:
     * > >>> SOTE.widget.palette.rgb2hsl(10, 20, 30)
     * > Object { h=0.5833333333333334, s=0.5, l=0.0784313725490196}
     */
    ns.rgb2hsl = function(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
    
        if ( max == min ) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch ( max ) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
    
        return {h: h, s: s, l: l};
    }

    /**
     * Function: hsl2rgb
     * 
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes h, s, and l are contained in the set [0, 1] and
     * returns r, g, and b in the set [0, 255].
     *
     * See Also:
     * http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
     * 
     * Parameters:
     * h - The hue
     * s - The saturation
     * l - The lightness
     * 
     * Returns:
     * The RGB representation as an object with r, g, and b properties.
     * 
     * Example:
     * > >>> SOTE.widget.palette.hsl2rgb(0.5833, 0.5, 0.078)
     * > Object { r=10, g=20, b=30 }
     */
    ns.hsl2rgb = function(h, s, l) {
        var r, g, b;
    
        if ( s == 0 ) {
            r = g = b = l; // achromatic
        } else {
            function hue2rgb(p, q, t) {
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }
    
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
    
        return { 
            r: Math.round(r * 255), 
            g: Math.round(g * 255), 
            b: Math.round(b * 255)
        };
    }
   
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
        
        ns.CHECKERBOARD = g.createPattern(canvas, "repeat");
    }

    var init = function() {
        drawCheckerboard();
    }
    
    init();
    
});

