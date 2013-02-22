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
TestCase("Worldview.Palette.ColorHSL", {
    
    ns: null,
    
    setUp: function() {
        ns = Worldview.Palette;
    },
    
    // Check that the default values are correct.
    testEmpty: function() {
        var color = ns.ColorHSL();
        assertEquals(0, color.h);
        assertEquals(0, color.s);
        assertEquals(0, color.l);
    },
    
    // Check that the color is correct with all values.
    testAll: function() {
        var color = ns.ColorHSL(1, 2, 3);
        assertEquals(1, color.h);
        assertEquals(2, color.s);
        assertEquals(3, color.l);
    }
    
});