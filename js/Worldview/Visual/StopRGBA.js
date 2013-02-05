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
 * Class: Worldview.Visual.StopRGBA
 * Defines a color value at a percentage along a color range.
 * 
 * Example:
 * For a red color stop at 40% along the range
 * 
 * (begin code)
 * var stop = StopRGB(0.4, 0xff, 0x00, 0x00 });
 * (end code)
 * 
 * Delegates to: 
 * <ColorRGBA>
 * 
 * Constructor: StopRGB
 * Creates a new instance.
 * 
 * Parameters:
 * at - The percentage along the color range where this stop is located.
 *      In the range of [0.0, 1.0].
 * r  - The red color value in the range of [0, 0xff]. If not specified, 
 *      this value is zero.
 * g  - The green color value in the range of [0, 0xff]. If not specified, 
 *      this value is zero.
 * b  - The blue color value in the range of [0, 0xff]. If not specified, 
 *      this value is zero.
 * a  - The alpha color value in the range of [0, 0xff]. Zero is 
 *      transparent, 0xff is opaque. If not specified, this value is 0xff.
 */
 Worldview.Visual.StopRGBA = function(at, r, g, b, a) {

    var self = ns.ColorRGBA(r, g, b, a);
    
    /**
     * Property: at
     * Percentage in the range of [0.0, 1.0]. If not defined, this value is
     * zero. 
     */
    self.at = at || 0.0;
    
    return self;
}