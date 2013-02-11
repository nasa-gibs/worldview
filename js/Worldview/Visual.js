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
 * Namespace: Worldview.Visual
 * Visualization of science data.
 */
Worldview.namespace("Visual");

$(function() {
    
    // This namespace
    var ns = Worldview.Visual;
    
    // Namespace aliases
    var util = SOTE.util;
    
    //-------------------------------------------------------------------------
    // Public
    //-------------------------------------------------------------------------
    
    /**
     * Property: checkerboard
     * A canvas pattern of a gray checkerboard used to denote transparency.
     */
    ns.checkerboard = null;
    
    /**
     * Property: STOCK_PALETTE_ENDPOINT
     * The relative URL to use when loading stock palette information.
     */
    ns.stockPaletteEndpoint = "data/palettes";
    
    /**
     * Property: stockPalettes
     * An array of stock <Palettes> the user can choose from. This value is
     * initially set to null. Call <loadStockPalettes> to set this value.
     */
    ns.stockPalettes = null;
        
    /**
     * Function: toLookup
     * Converts a <Palette> to a <Lookup>. The lookup table is generated
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
     * A <Lookup>.
     */
    ns.toLookup = function(bins, palette) {        
        var stops = palette.stops;
        var lut = [];
        
        // Each bin in the sequence must be at the current stop or later.
        // Save the current index and not iterate through each time.
        var currentStop = 0;
        
        var min = palette.min || 0;
        var max = ( palette.max === undefined ) ? 1 : palette.max;
        
        for ( var bin = 0; bin < bins; bin++ ) {
            // Percentange this bin is located at along the range.
            var distance = bin / (bins - 1); 

            // If the current distance is greater than the current stop,
            // keep advancing until that is not true.
            for ( var i = currentStop; i < stops.length; i++ ) {
                if ( distance <= stops[i].at ) {
                    break;
                }
            }
            currentStop = i;
            
            // The bin is between these two stops         
            var end = stops[util.clampIndex(stops, i)];
            var begin = stops[util.clampIndex(stops, i-1)];
            
            // Find out how far this bin in between the stops
            var segmentLength = end.at - begin.at;
            var segmentDistance = (segmentLength !== 0) ? 
                    (distance - begin.at) / segmentLength : 0;
            
            // Within the cutoffs? 
            if ( distance < min || distance > max ) {
                lut.push(ns.ColorRGBA(0, 0, 0, 0));
            } else if ( palette.type === "solid" ) {
                // For solid colors, always pick the color of the beginning
                // stop unless we are at the very end.
                if ( segmentDistance < 1 ) {
                    lut.push(ns.ColorRGBA(begin.r, begin.g, begin.b));                        
                } else {
                    lut.push(ns.ColorRGBA(end.r, end.g, end.b));
                }
            } else if ( palette.interpolate === "rgb" ) {
                lut.push(ns.rgbInterpolate(segmentDistance, begin, end));
            } else { // interpolate === "hsl"
                lut.push(ns.hslInterpolate(segmentDistance, begin, end));
            }
        }        
        return lut;
    }
    
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
        return ns.hsl2rgb(ns.ColorHSL(h, s, l));
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
     * >>> Worldview.Visual.rgb2hsl({r: 10, g: 20, b: 30})
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
    
        return ns.ColorHSL(h, s, l);
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
     * >>> Worldview.Visual.hsl2rgb({h: 0.5833, s: 0.5, l: 0.078})
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
    
        return ns.ColorRGBA(
            Math.round(r * 255), 
            Math.round(g * 255), 
            Math.round(b * 255));
    }
    
    /**
     * Function: loadStockPalettes
     * Loads the stock <Palette> definitions from the web server. Palettes
     * are loaded from the relative URL defined in <stockPaletteEndpoint> and
     * are placed in <stockPalettes>. If palettes have already been loaded,
     * this method only invokes the success callback.
     * 
     * Parameters:
     * - success: Callback executed after the palettes have been loaded. The
     *            callback should have no parameters. Obtain loaded palettes
     *            from <stockPalettes>.
     * - error:   Callback executed if there is an error loading the palettes.
     *            The callback should have two paraemters, the error message
     *            and the error status.
     */    
    ns.loadStockPalettes = function(success, error) {
                        
        if ( ns.stockPalettes ) { 
            success();
            return;
        }
        
        var palettesLoaded = function(palettes) {            
            // Generate images for the combo box selector.
            var canvas = document.createElement("canvas");
            canvas.width = 100;
            canvas.height = 14;
            
            for ( var i = 0; i < palettes.length; i ++ ) {
                var palette = palettes[i];
                
                ns.ColorBar({
                    canvas: canvas,
                    palette: palette
                });
                palette.image = canvas.toDataURL("image/png");
            }
            ns.stockPalettes = palettes;                
            success(palettes);    
        }
        
        $.ajax({
            url: ns.stockPaletteEndpoint,
            dataType: "json",
            success: palettesLoaded,
            error: function(jqXHR, textStatus, errorThrown) { 
                error(errorThrown, textStatus);
            }
        });
        
    }
    
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

