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
 * Class: Worldview.Visual.ColorRGBA
 * Represents a color in the RGBA color space.
 *
 * Example: 
 * For a yellow color
 * 
 * (begin code)
 * var color = Worldview.Visual.ColorRGBA(0xff, 0xff, 0x00, 0xff);
 * (end code)
 * 
 * Constructor: ColorRGB
 * Creates a new instance.
 * 
 * Parameters:
 * r - The red color value in the range of [0, 0xff]. If not specified, 
 *     this value is zero.
 * g - The green color value in the range of [0, 0xff]. If not specified, 
 *     this value is zero.
 * b - The blue color value in the range of [0, 0xff]. If not specified, 
 *     this value is zero.
 * a - The alpha color value in the range of [0, 0xff]. Zero is 
 *     transparent, 0xff is opaque. If not specified, this value is 0xff.
 */ 
Worldview.Visual.ColorRGBA = function(r, g, b, a) {

    return {
        /**
         * Property: r
         * Red color value in the range of [0, 0xff].
         */ 
        r: r || 0,

        /**
         * Property: g
         * Green color value in the range of [0, 0xff].
         */ 
        g: g || 0,

        /**
         * Property: b
         * Blue color value in the range of [0, 0xff].
         */ 
        b: b || 0,
        
        /**
         * Property: a
         * Alpha color value int he range of [0,0xff]. Zero is transparent,
         * 0xff is opaque.
         */
        a: ( a === undefined ) ? 0xff : a
    };
};


