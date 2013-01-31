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
TestCase("palette.toLookup", {

    ns: null,
    
    setUp: function() {
        ns = SOTE.widget.palette;
    },
    
    testGradientBins2: function() {
        palette = {
            stops: [
                { at: 0.0, r: 0,   g: 0,   b: 0 },
                { at: 1.0, r: 100, g: 100, b: 100 }
            ]
        };
        lut = ns.toLookup(2, palette);
        assertEquals(0, lut[0].r);
        assertEquals(100, lut[1].r);    
    },

    testGradientBins3: function() {
        palette = {
            stops: [
                { at: 0.0, r: 0,   g: 0,   b: 0 },
                { at: 1.0, r: 100, g: 100, b: 100 }
            ]
        };
        lut = ns.toLookup(3, palette);
        assertEquals(0,   lut[0].r);
        assertEquals(50,  lut[1].r);
        assertEquals(100, lut[2].r);   
    }
});