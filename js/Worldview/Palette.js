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
 * Namespace: Worldview.Palette
 * Visualization of science data.
 */
Worldview.namespace("Palette");

$(function() {
    
    // This namespace
    var ns = Worldview.Palette;
    
    //-------------------------------------------------------------------------
    // Public
    //-------------------------------------------------------------------------
    
    /**
     * Property: checkerboard
     * A canvas pattern of a gray checkerboard used to denote transparency.
     */
    ns.checkerboard = null;
            
    /**
     * Function: toIndexedLookup
     * Converts a <Palette> to a <IndexedLookup>. The lookup table is generated
     * for a certain number of equally spaced bins. Each bin is assigned
     * a distance along the range and its color is determined by the stop
     * locations in the palette. The first bin is always at 0% and the last
     * bin is always at 100%. 
     * 
     * If the type is gradient, the color value will be interpolated from the
     * stops that it fits within. If it is before the first stop, it will be
     * the color of the first stop. If it is after the last stop, it will be
     * the color of the last stop. Colors can be interpolated in the HSL 
     * color space (by default or if type is "hsl") or in the RGB color space
     * (if the type is "rgb"). If the type is "solid", the color will be equal
     * to the stop it rounds down to.   
     * 
     * Alpha values in the stop definitions are ignored. If the bin is not 
     * within the min and max values, the alpha is set to zero, otherwise the
     * alpha is set to 0xff.
     * 
     * Parameters:
     * bins - Number of entries that the output lookup table should contain
     * palette - The <Palette> to convert
     * 
     * Returns:
     * A <IndexedLookup>.
     */
    ns.toIndexedLookup = function(bins, palette, binStops) {        
        var stops = palette.stops;
        var lut = [];
        
        // Each bin in the sequence must be at the current stop or later.
        // Save the current index and not iterate through each time.
        var currentStop = 0;
        
        var min = palette.min || 0;
        var max = ( palette.max === undefined ) ? 1 : palette.max;
        
        for ( var bin = 0; bin < bins; bin++ ) {
            // Percentange this bin is located at along the range.
            var distance;
            if ( binStops ) {
                // Select the middle of the bin when trying to fit this in
                var nextStop = ( bin < bins - 1 ) ? binStops[bin + 1] : 1.0;
                distance = binStops[bin] + ((nextStop - binStops[bin]) / 2.0);
            } else { 
                distance = bin / (bins - 1); 
            }
            
            // If the current distance is greater than the current stop,
            // keep advancing until that is not true.
            for ( var i = currentStop; i < stops.length; i++ ) {
                if ( distance <= stops[i].at ) {
                    break;
                }
            }
            currentStop = i;
            
            // The bin is between these two stops         
            var end = stops[Worldview.clampIndex(stops, i)];
            var begin = stops[Worldview.clampIndex(stops, i-1)];
            
            // Find out how far this bin in between the stops
            var segmentLength = end.at - begin.at;
            var segmentDistance = (segmentLength !== 0) ? 
                    (distance - begin.at) / segmentLength : 0;
            
            // Within the cutoffs? 
            if ( distance < min || distance > max ) {
                lut.push({r: 0, b: 0, g: 0, a: 0});
            } else if ( palette.type === "solid" ) {
                // For solid colors, always pick the color of the beginning
                // stop unless we are at the very end.
                if ( segmentDistance < 1 ) {
                    lut.push({
                        r: begin.r, 
                        g: begin.g, 
                        b: begin.b, 
                        a: 0xff
                    });                        
                } else {
                    lut.push({
                        r: end.r, 
                        g: end.g, 
                        b: end.b,
                        a: 0xff
                    });
                }
            } else if ( palette.interpolate === "rgb" ) {
                lut.push(ns.rgbInterpolate(segmentDistance, begin, end));
            } else { // interpolate === "hsl"
                lut.push(ns.hslInterpolate(segmentDistance, begin, end));
            }
        }        
        return lut;
    };
    
    /**
     * Function: toColorLookup
     * Maps an indexed lookup to a color-to-color lookup. This is used to take
     * the palette definition of a rendered product to create a lookup table
     * to map the original colors to a new set of colors. 
     * 
     * Parameters:
     * indexed - An <IndexedLookup>
     * stops - The original color values as an array of <StopRBGA>
     * 
     * Returns:
     * A <ColorLookup> 
     */
    ns.toColorLookup = function(indexed, stops) {
        map = {};
        $.each(stops, function(index, stop) {
            var key = stop.r + "," + stop.g + "," + stop.b + "," + stop.a;
            map[key] = indexed[index]; 
        });
        return map;
    };
    
    /**
     * Function: rgbInterpolate
     * Interpolates a color value between two other colors via the RGB color
     * space. Alpha values are ignored and are always set to 0xff. 
     * 
     * Parameters:
     * percent - The distance between the two colors as a percentage in the
     *           range of [0.0, 1.0].
     * begin   - The beginning <ColorRGBA>
     * end     - The ending <ColorRGBA>
     * 
     * Returns:
     * The interpolated color as a <ColorRGBA>.
     */
    ns.rgbInterpolate = function(percent, begin, end) {
        return {
            r: Math.round(begin.r + (percent * (end.r - begin.r))),
            g: Math.round(begin.g + (percent * (end.g - begin.g))),
            b: Math.round(begin.b + (percent * (end.b - begin.b))), 
            a: 0xff             
        }    
    }
    
    /**
     * Function: hslInterpolate
     * Interpolates a color value between two other colors via the HSL
     * color space. Alpha values are ignored and are always set to 0xff.
     * 
     * Parameters:
     * percent  - The distance between the two colors as a percentage in the
     *            range of [0.0, 1.0].
     * rgbBegin - The beginning <ColorRGBA>
     * rgbEnd   - The ending <ColorRGBA>
     * 
     * Returns:
     * The interpoalted color as a <ColorRGBA>.
     */
     ns.hslInterpolate = function(percent, rgbBegin, rgbEnd) {
        var hslBegin = ns.rgb2hsl(rgbBegin);
        var hslEnd = ns.rgb2hsl(rgbEnd);
  
        // Hue is a circle. Traverse the shortest route. If the distance 
        // between the two endpoints is more than half the circle, add one
        // to the smallest value.
        var distance = Math.abs(hslBegin.h - hslEnd.h);      
        if ( distance > 0.5 ) {
            if ( hslBegin.h < hslEnd.h ) {
                hslBegin.h += 1.0;
            } else {
                hslEnd.h += 1.0;
            }
        }
        var h = hslBegin.h + (percent * (hslEnd.h - hslBegin.h));
        var s = hslBegin.s + (percent * (hslEnd.s - hslBegin.s));
        var l = hslBegin.l + (percent * (hslEnd.l - hslBegin.l));        
           
        // Normalize back to the range of 0 - 1
        if ( h > 1.0 ) {
            h -= 1.0;
        }
        return ns.hsl2rgb({h: h, s: s, l: l});
    }
    
    /**
     * Function: rgb2hsl
     * Converts an RGB color value to HSL. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     *
     * See Also:
     * http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
     * 
     * Parameters:
     * color - The <ColorRGBA> value to convert.
     * 
     * Returns:
     * The converted <ColorHSL> value.
     * 
     * Example:
     * (begin code)
     * >>> Worldview.Palette.rgb2hsl({r: 10, g: 20, b: 30})
     * Object { h=0.5833333333333334, s=0.5, l=0.0784313725490196}
     * (end code)
     */
    ns.rgb2hsl = function(color) {
        var r = color.r;
        var g = color.g
        var b = color.b;
        
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
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     *
     * See Also:
     * http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
     * 
     * Parameters:
     * color - The <ColorHSL> to convert.
     * 
     * Returns:
     * The converted <ColorRGBA> value.
     * 
     * Example:
     * (begin code)
     * >>> Worldview.Palette.hsl2rgb({h: 0.5833, s: 0.5, l: 0.078})
     * Object { r=10, g=20, b=30 }
     * (end code)
     */
    ns.hsl2rgb = function(color) {
        var h = color.h;
        var s = color.s;
        var l = color.l;
        
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
            b: Math.round(b * 255),
            a: 0xff
        };
    };
    
    
    //-------------------------------------------------------------------------
    // Private
    //-------------------------------------------------------------------------
        
    // Draws the default checkboard pattern   
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
        
        ns.checkerboard = g.createPattern(canvas, "repeat");
    }

    // Static initialization
    var init = function() {
        drawCheckerboard();
    }
    
    init();
});

/**
 * Class: Worldview.Palette.ColorRGBA
 * 
 * Represents a color in the RGBA color space.
 *
 * Example: 
 * For a yellow color
 * 
 * (begin code)
 * var color = { r: 0xff, g: 0xff, b: 0x00, a: 0xff }
 * (end code)
 *   
 * Property: r
 * The red color value in the range of [0, 0xff]. 
 * 
 * Property: g
 * The green color value in the range of [0, 0xff].
 * 
 * Property: b
 * The blue color value in the range of [0, 0xff]. 
 * 
 * Property: a
 * The alpha color value in the range of [0, 0xff]. Zero is transparent, 0xff 
 * is opaque. 
 */ 

/**
 * Class: Worldview.Palette.ColorHSL
 * 
 * Represents a color in the HSL color space.
 *
 * Example: 
 * For a red color
 * 
 * (begin code)
 * var color = { h: 0x00, s: 0xff, l: 0xff }
 * (end code)
 * 
 * Property: h
 * The hue value in the range of [0.0, 1.0].
 * 
 * Property: s 
 * The saturation value in the range of [0.0, 1.0]. 
 * 
 * Property: l
 * The lightness value in the range of [0.0, 1.0].
 */

/**
 * Class: Worldview.Palette.IndexedLookup
 * 
 * Indexed based color lookup table.
 * 
 * Example:
 * (begin code)
 * var lookup = {
 *     id: "my_lookup",
 *     name: "My Lookup",
 *     table: [
 *         { r: 0x01, g: 0x02, b: 0x03, a: 0x04 },
 *         { r: 0x05, g: 0x06, b: 0x07, a: 0x08 }
 *     ]
 * };
 * (end code)
 * 
 * Property: id
 * Identifier for this lookup (optional).
 *
 * Property: name
 * Descriptive name for this lookup (optional).
 * 
 * Property: table
 * Array that maps index values to <ColorRGBA> objects. For example, a value of 
 * 2 should use the color found at table[2]. 
 */

/**
 * Class: Worldview.Palette.ColorLookup
 * 
 * Lookup from one color value to another color value.
 * 
 * Example:
 * (begin code) 
 * var lookup = {
 *     "0,0,255,255": { r: 0xff, g: 0x00, b: 0x00, a: 0xff }
 *
 * (end code)
 * 
 * Each property in the object is a string containing integer red, green,
 * blue, and alpha values separated by commas. Each property contains contains
 * a <ColorRGBA> value to map. 
 */

/**
 * Class: Worldview.Palette.StopRGBA
 * 
 * Defines a color value at a percentage along a color range.
 * 
 * Example:
 * For a red color stop at 40% along the range
 * 
 * (begin code)
 * var stop = { at: 0.4, r: 0xff, g: 0x00, b: 0x00, a:0x00 };
 * (end code)
 * 
 * Property: at
 * The percentage along the color range where this stop is located in the range 
 * of [0.0, 1.0].
 * 
 * Property: r
 * The red color value in the range of [0, 0xff]. 
 * 
 * Property: g
 * The green color value in the range of [0, 0xff].
 * 
 * Property: b 
 * The blue color value in the range of [0, 0xff].
 * 
 * Property: a 
 * a  - The alpha color value in the range of [0, 0xff]. Zero is transparent, 
 * 0xff is opaque. 
 */
