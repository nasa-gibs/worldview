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
TestCase("Worldview.Palette", {

    ns: null,
    
    setUp: function() {
        ns = Worldview.Palette;
    },

    // Ensure the checkerboard got assigned to a value during initialization    
    testCheckerboard: function() {
        assertNotUndefined(ns.checkerboard);
        assertNotNull(ns.checkerboard);
    },
    
    // Check that a percentage of zero is at the beginning.
    testRgbInterpolateLeft: function() {
        var result = ns.rgbInterpolate(0.0, 
            {r: 0,    g: 0,    b: 0,    a: 0xff}, 
            {r: 0xff, g: 0xff, b: 0xff, a: 0xff});
        assertEquals(0, result.r);
        assertEquals(0, result.g);
        assertEquals(0, result.b);
        assertEquals(0xff, result.a);
    },

    // Check that a percentage of one is at the end.
    testRgbInterpolateLeft: function() {
        var result = ns.rgbInterpolate(1.0, 
            {r: 0,    g: 0,    b: 0,    a: 0xff}, 
            {r: 0xff, g: 0xff, b: 0xff, a: 0xff});
        assertEquals(0xff, result.r);
        assertEquals(0xff, result.g);
        assertEquals(0xff, result.b);
        assertEquals(0xff, result.a);
    },

    // Check that a percentage of 0.5 is in the middle
    testRgbInterpolateCenter: function() {
        var result = ns.rgbInterpolate(0.5, 
            {r: 0,    g: 0,    b: 0,    a: 0xff}, 
            {r: 0xff, g: 0xff, b: 0xff, a: 0xff});
        assertEquals(0x80, result.r);
        assertEquals(0x80, result.g);
        assertEquals(0x80, result.b);
        assertEquals(0xff, result.a);
    },
        
    // Check that a percentage of zero is at the beginning.
    testHslInterpolateLeft: function() {
        var result = ns.hslInterpolate(0.0, 
            {r: 10, g: 20, b: 30, a: 0xff}, 
            {r: 40, g: 50, b: 60, a: 0xff});            
        assertEquals(10, result.r);
        assertEquals(20, result.g);
        assertEquals(30, result.b);
        assertEquals(0xff, result.a);
    },

    // Check that a percentage of one is at the end.
    testHslInterpolateRight: function() {
        var result = ns.hslInterpolate(1.0, 
            {r: 10, g: 20, b: 30, a: 0xff}, 
            {r: 40, g: 50, b: 60, a: 0xff});   
        assertEquals(40, result.r);
        assertEquals(50, result.g);
        assertEquals(60, result.b);
        assertEquals(0xff, result.a);
    },

    // Check that a percentage of 0.5 is in the middle.
    testHslInterpolateRight: function() {
        var result = ns.hslInterpolate(0.5, 
            {r: 10, g: 20, b: 30, a: 0xff}, 
            {r: 40, g: 50, b: 60, a: 0xff});   
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
