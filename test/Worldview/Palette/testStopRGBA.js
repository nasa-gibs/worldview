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
TestCase("Worldview.Palette.StopRGBA", {
    
    ns: null,
    
    setUp: function() {
        ns = Worldview.Palette;
    },
    
    // Check that the default values are correct.
    testEmpty: function() {
        var stop = ns.StopRGBA();
        assertEquals(0, stop.at);
        assertEquals(0, stop.r);
        assertEquals(0, stop.g);
        assertEquals(0, stop.b);
        assertEquals(0xff, stop.a);
    },

    // Check that the specified values are correct.
    testAll: function() {
        var stop = ns.StopRGBA(1, 2, 3, 4, 5);
        assertEquals(1, stop.at);
        assertEquals(2, stop.r);
        assertEquals(3, stop.g);
        assertEquals(4, stop.b);
        assertEquals(5, stop.a);
    },
    
});