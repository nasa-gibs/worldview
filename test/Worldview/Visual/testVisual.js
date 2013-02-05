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
TestCase("Visual", {

    ns: null,
    
    setUp: function() {
        ns = Worldview.Visual;
    },

    // Ensure the checkerboard got assigned to a value during initialization    
    testCheckerboard: function() {
        assertNotUndefined(ns.CHECKERBOARD);
        assertNotNull(ns.CHECKERBOARD);
    },
    
    // Check that a percentage of zero is at the beginning.
    testRgbInterpolateLeft: function() {
        var result = ns.rgbInterpolate(0.0, ns.ColorRGBA(0, 0, 0), 
                                            ns.ColorRGBA(0xff, 0xff, 0xff));
        assertEquals(0, result.r);
        assertEquals(0, result.g);
        assertEquals(0, result.b);
        assertEquals(0xff, result.a);
    },

    // Check that a percentage of one is at the end.
    testRgbInterpolateLeft: function() {
        var result = ns.rgbInterpolate(1.0, ns.ColorRGBA(0, 0, 0), 
                                            ns.ColorRGBA(0xff, 0xff, 0xff));
        assertEquals(0xff, result.r);
        assertEquals(0xff, result.g);
        assertEquals(0xff, result.b);
        assertEquals(0xff, result.a);
    },

    // Check that a percentage of 0.5 is in the middle
    testRgbInterpolateCenter: function() {
        var result = ns.rgbInterpolate(0.5, ns.ColorRGBA(0, 0, 0), 
                                            ns.ColorRGBA(0xff, 0xff, 0xff));
        assertEquals(0x80, result.r);
        assertEquals(0x80, result.g);
        assertEquals(0x80, result.b);
        assertEquals(0xff, result.a);
    },
        
    // Check that a percentage of zero is at the beginning.
    testHslInterpolateLeft: function() {
        var result = ns.hslInterpolate(0.0, ns.ColorRGBA(10, 20, 30), 
                                            ns.ColorRGBA(40, 50, 60));
        assertEquals(10, result.r);
        assertEquals(20, result.g);
        assertEquals(30, result.b);
        assertEquals(0xff, result.a);
    },

    // Check that a percentage of one is at the end.
    testHslInterpolateRight: function() {
        var result = ns.hslInterpolate(1.0, ns.ColorRGBA(10, 20, 30), 
                                            ns.ColorRGBA(40, 50, 60));
        assertEquals(40, result.r);
        assertEquals(50, result.g);
        assertEquals(60, result.b);
        assertEquals(0xff, result.a);
    },

    // Check that a percentage of 0.5 is in the middle.
    testHslInterpolateRight: function() {
        var result = ns.hslInterpolate(0.5, ns.ColorRGBA(10, 20, 30), 
                                            ns.ColorRGBA(40, 50, 60));
        // Known good values
        assertEquals(23, result.r);
        assertEquals(35, result.g);
        assertEquals(47, result.b);
        assertEquals(0xff, result.a);
    },
    
    // Check against a known good value
    testRgbToHsl: function() {
        var result = ns.rgb2hsl({r: 10, g: 20, b: 30})
        assertTrue(Math.abs(result.h - 0.5833333) < 0.000001);
        assertTrue(Math.abs(result.s - 0.5) < 0.00001);
        assertTrue(Math.abs(result.l - 0.0784313) < 0.000001);
    },
    
    // Check against a known good value
    testHsltoRgb: function() {
        var result = ns.hsl2rgb({h: 0.5833333, s: 0.5, l: 0.0784313});
        assertEquals(10, result.r);
        assertEquals(20, result.g);
        assertEquals(30, result.b);
    },
                    
});
