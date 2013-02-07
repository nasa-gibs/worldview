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

Worldview.namespace("Visual");

/**
 * Class: Worldview.Visual.ColorBar
 * Renders a <Palette> in a canvas. Color transitions are placed along the
 * x axis. 
 *
 * Example:
 * (begin code)
 * var colorBar = Worldview.Visual.ColorBar({
 *     selector: "#colorBarCanvas", 
 *     bins: 10,
 *     palette: { 
 *         stops: [
 *             { at: 0.0, r: 0x00, g: 0x00, b: 0x00 },
 *             { at: 1.0, r: 0x00, g: 0x00, b: 0x00 }
 *         ] 
 *     }
 * });
 * (end code)
 * 
 * will render in the canvas as shown in the following image
 * (see black_to_white_color_bar.png)
 *
 */
Worldview.Visual.ColorBar = function(spec) {
       
    // This namespace
    var ns = Worldview.Visual;
    
    // The canvas to render in as a jQuery object
    var $canvas = null;
    
    // The canvas to render in as a canvas object
    var canvas = null;
    
    // Graphics drawing context for the canvas
    var g = null;
    
    //-------------------------------------------------------------------------
    // Public
    //-------------------------------------------------------------------------
    var self = {};
    
    /**
     * Property: background
     * 
     * Canvas pattern to use as the background. If not specified, 
     * <CHECKERBOARD> is used.
     */
    self.background = spec.background || ns.CHECKERBOARD;
    
    /**
     * Property: bins
     * 
     * Maximum number of discrete color values. For example, if this value
     * is ten, only ten color values will be shown, evenly spaced through
     * the canvas. If not specified, this value is 255. 
     */
    self.bins = spec.bins || 255;
    
    /**
     * Property: palette
     * 
     * The <Palette> or <Lookup> to render in the canvas. If not specified, this 
     * value is null and no palette will be rendered.
     */
    self.palette = spec.palette || null;
    
    /**
     * Constructor: ColorBar
     * Creates a new instance.
     * 
     * Parameters:
     * spec - Accepts all properties as an associative array.
     * spec.selector - jQuery selector for the canvas to render in.  
     * 
     * Throws:
     * An error if the canvas element could not be found.  
     */
    var init = function() {
        if ( spec.canvas ) {
            canvas = spec.canvas;
        } else {
            $canvas = $(spec.selector);
            if ( $canvas.length === 0 ) {
                throw "No such canavs element (" + spec.selector + 
                      ") for the ColorBar";
            }
            canvas = $canvas.get(0);

            // The canavs dimensions does not equal the element dimensions! Make
            // them the same or scaling will occur.
            canvas.width = $canvas.width();
            canvas.height = $canvas.height();
        }
         
        g = canvas.getContext("2d");
        self.redraw();
    }
        
    /**
     * Method: redraw
     * Redraws the palette in the canvas. If palette is set to null, this
     * method only draws the background.
     */
    self.redraw = function() {
        drawBackground();
        if ( !self.palette ) {
            return;
        }
        
        // If a lookup is provided, just use that. Otherwise, convert the
        // palette definition to a lookup table.
        var lut = ( self.palette.table ) 
            ? self.palette.table 
            : ns.toLookup(self.bins, self.palette);

        var binWidth = canvas.width / self.bins;
        
        // Each drawn stripe for the bin must be at least one pixel wide or
        // the background will leak through due to rounding errors.
        var stripeWidth = ( binWidth < 1 ) ? 1 : binWidth;
        
        for ( var bin = 0; bin < self.bins; bin++ ) {
            // Only draw if there is a lookup entry and it is not completely
            // transparent
            if ( lut[bin] && lut[bin].a !== 0 ) {
                // Always draw with no transparency
                g.fillStyle = "rgba(" + 
                    [lut[bin].r, lut[bin].g, lut[bin].b, 0xff].join() + ")";
                g.fillRect(Math.floor(bin * binWidth), 0, 
                           stripeWidth, canvas.height);
           }
        }
    }
    
    //-------------------------------------------------------------------------
    // Private
    //-------------------------------------------------------------------------    
    var drawBackground = function() {
        g.fillStyle = self.background;
        g.fillRect(0, 0, canvas.width, canvas.height);
    }
        
    // Call constructor    
    init();
    
    // Return public variables
    return self;
}
