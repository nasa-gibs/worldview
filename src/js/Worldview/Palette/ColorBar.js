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

Worldview.namespace("Palette");

/**
 * Class: Worldview.Palette.ColorBar
 * Renders a <Palette> in a canvas. Color transitions are placed along the
 * x axis.
 *
 * Example:
 * (begin code)
 * var colorBar = Worldview.Palette.ColorBar({
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
Worldview.Palette.ColorBar = function(spec) {

    // This namespace
    var ns = Worldview.Palette;

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
     * <checkerboard> is used.
     */
    self.background = spec.background || ns.checkerboard;

    /**
     * Property: bins
     *
     * Maximum number of discrete color values. For example, if this value
     * is ten, only ten color values will be shown, evenly spaced through
     * the canvas. If not specified, this value is 255.
     */
    self.bins = spec.bins || 255;

    self.stops = spec.stops || null;

    /**
     * Property: palette
     *
     * The <Palette> or <IndexedLookup> to render in the canvas. If not specified, this
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
        } else if ( spec.selector ) {
            $canvas = $(spec.selector);
            if ( $canvas.length === 0 ) {
                throw new Error("No such canvas element (" + spec.selector +
                      ") for the ColorBar");
            }
            canvas = $canvas.get(0);

            // The canavs dimensions does not equal the element dimensions! Make
            // them the same or scaling will occur.

            // tj, 5/16/13, edit: the element client width and height will be 0 in the new
            // product picker design because the bank is not visible when colorbars are rendered
            /*canvas.width = $canvas.width();
            canvas.height = $canvas.height();*/
        } else {
            canvas = docuemnt.createElement("canvas");
            canvas.width = spec.width;
            canvas.height = spec.height;
        }

        g = canvas.getContext("2d");
        self.redraw();
    };

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
            : ns.toIndexedLookup(self.bins, self.palette, self.stops);

        for ( var bin = 0; bin < self.bins; bin++ ) {
            var left;
            var width;

            // If the bins are and not evenly spaced out, use the provided
            // stops.
            if ( self.stops ) {
                var nextStop = ( bin < self.bins - 1 )
                        ? self.stops[bin + 1] : 1.0;
                left = Math.floor(self.stops[bin] * canvas.width);
                width = Math.ceil(canvas.width * (nextStop - self.stops[bin]));
            } else {
                left = Math.floor(bin * (canvas.width / self.bins));
                width = Math.ceil(canvas.width / self.bins);
            }
            if ( width < 1 ) {
                width = 1;
            }
            // Only draw if there is a lookup entry and it is not completely
            // transparent
            if ( lut[bin] && lut[bin].a !== 0 ) {
                // Always draw with no transparency
                g.fillStyle = "rgba(" +
                    [lut[bin].r, lut[bin].g, lut[bin].b, 0xff].join() + ")";
                g.fillRect(left, 0, width, canvas.height);
           }
        }
    };

    self.toImage = function() {
        return canvas.toDataURL("image/png");
    };

    //-------------------------------------------------------------------------
    // Private
    //-------------------------------------------------------------------------
    var drawBackground = function() {
        g.fillStyle = self.background;
        g.fillRect(0, 0, canvas.width, canvas.height);
    };

    // Call constructor
    init();

    // Return public variables
    return self;
};
