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
TestCase("Worldview.Palette.ColorRGBA", {
    
    ns: null,
    
    setUp: function() {
        ns = Worldview.Palette;
    },
    
    // Check that the default values are correct.
    testEmpty: function() {
        var color = ns.ColorRGBA();
        assertEquals(0, color.r);
        assertEquals(0, color.g);
        assertEquals(0, color.b);
        assertEquals(0xff, color.a);
    },
    
    // Check that the color is correct with no alpha value.
    testNoAlpha: function() {
        var color = ns.ColorRGBA(1, 2, 3);
        assertEquals(1, color.r);
        assertEquals(2, color.g);
        assertEquals(3, color.b);
        assertEquals(0xff, color.a);
    },
    
    // Check that the color is correct with all values.
    testAll: function() {
        var color = ns.ColorRGBA(1, 2, 3, 4);
        assertEquals(1, color.r);
        assertEquals(2, color.g);
        assertEquals(3, color.b);
        assertEquals(4, color.a);
    }
    
});
