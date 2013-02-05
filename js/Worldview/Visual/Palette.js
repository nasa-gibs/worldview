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
 * Class: Worldview.Visual.Palette
 * Color palette defined by color stops. Each stop is located along the 
 * available range as a percentage between zero and one. 
 * 
 * A gradient is applied between each stop. To use solid colors instead, set 
 * the type property to solid. Gradients usually traverse through the HSL color 
 * space. Set the interpolate property to rgb to go through the RGB color space 
 * instead. 
 * 
 * Example:
 * To define a palette that is a gradient from black to white:
 * (begin code)
 * var palette = Worldview.Visual.Palette({
 *     stops: [
 *         { at: 0.0, r: 0x00, g: 0x00, b: 0x00 },
 *         { at: 1.0, r: 0xff, g: 0xff, b: 0xff },
 *     ]
 * });
 * (end code)
 * 
 * To define a palette that is a gradient from red to green but passing 
 * through blue half way through: 
 * (begin code)
 * var palette = Worldview.Visual.Palette({
 *     stops: [
 *         { at: 0.0, r: 0xff, g: 0x00, b: 0x00 },
 *         { at: 0.5, r: 0x00, g: 0xff, b: 0xff },
 *         { at: 1.0, r: 0x00, g: 0xff, b: 0x00 },
 *     ]
 * });
 * (end code)
 * 
 */

Worldview.Visual.Palette = function(spec) { 
    
    /**
     * Constructor: Worldview.Visual.Palette
     * Creates a new instance.
     * 
     * Parameters:
     * spec - Accepts all properties as an associative array.
     */
    return { 
        /**
         * Property: id
         * Identifier for this palette.
         */
        id: spec.id || undefined, 
        
        /**
         * Property: name
         * Name for this palette.
         */
        name: spec.name || undefined,
        
        /**
         * Property: min
         * Minimum display value. Values below this percentage will be
         * transparent. Valid range is [0.0, 1.0].
         */
        min: spec.min || undefined,
        
        /**
         * Property: max
         * Maximum display value. Values above this percentage will be 
         * transparent. Valid range is [0.0, 1.0].
         */
        max: spec.max || 1.0,
        
        /**
         * Property: type
         * Method used to compute colors between stops. Either "gradient" or 
         * "solid". If set to "gradient", colors between each stop will 
         * gradually shift color. If set to "solid", color changes 
         * are absolute at each stop. If not specified, this value is set to 
         * "gradient".
         */
        type: spec.type || "gradient",
        
        /**
         * Property: interpolate
         * Interpolation used for gradients. If set to "hsl", interpolation is 
         * done in the HSL color space. If set to "rbg", interpolation is done 
         * in the RGB color space. If not specified, this valueis set to "hsl". 
         * This property has no effect if the type is not set to "gradient".
         */
        interpolate: spec.interpolate || "hsl",
        
        /**
         * Property: stops
         * Array of color stops of type <Worldview.Visual.StopRGB>. If not
         * specified, this value is set to an emtpy array.
         */
        stops: spec.stops || [],
    };
    
}

