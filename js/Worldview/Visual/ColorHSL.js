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
 * Class: Worldview.Visual.ColorHSL
 * Represents a color in the HSL color space.
 *
 * Example: 
 * For a red color
 * 
 * (begin code)
 * var color = Worldview.Visual.ColorHSL(0x00, 0xff, 0xff);
 * (end code)
 * 
 * Constructor: ColorHSL
 * Creates a new instance.
 * 
 * Parameters:
 * h - The hue value in the range of [0.0, 1.0]. If not specified, this
 *     value is zero.
 * s - The saturation value in the range of [0.0, 1.0]. If not speecified, this
 *     value is zero.
 * l - The lightness value in the range of [0.0, 1.0]. If not specified, this
 *     value is zero.
 */
Worldview.Visual.ColorHSL = function(h, s, l) {

    return {
        /**
         * Property: h
         * The hue value in the range of [0.0, 1.0].
         */ 
        h: h || 0,

        /**
         * Property: s
         * The saturation value in the range of [0.0, 1.0].
         */ 
        s: s || 0,

        /**
         * Property: l
         * The lightness value in the range of [0.0, 1.0].
         */ 
        l: l || 0,        
    }
    
};

