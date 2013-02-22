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
TestCase("Worldview.Palette.toLookup", {

    ns: null,
    
    setUp: function() {
        // This namespace
        ns = Worldview.Palette;
    },
    
    // Are the 2 bins the same as the begin and end stops?
    testGradientBins2: function() {
        palette = {
            stops: [
                { at: 0.0, r: 0x00, g: 0x00, b: 0x00 },
                { at: 1.0, r: 0xff, g: 0xff, b: 0xff }
            ]
        };
        lut = ns.toLookup(2, palette);
        assertEquals(0x00, lut[0].r);
        assertEquals(0xff, lut[1].r);    
    },

    // Is the center bin halfway between the begin and end stops?
    testGradientBins3: function() {
        palette = {
            stops: [
                { at: 0.0, r: 0x00, g: 0x00, b: 0x00 },
                { at: 1.0, r: 0xff, g: 0xff, b: 0xff }
            ]
        };
        lut = ns.toLookup(3, palette);
        assertEquals(0x00, lut[0].r);
        assertEquals(0x80, lut[1].r);
        assertEquals(0xff, lut[2].r);   
    },
    
    // Red to Green through RGB, is the middle color brownish? 
    testRGB: function() {
        palette = {
            interpolate: "rgb",
            stops: [
                { at: 0.0, r: 0xff, g: 0x00, b: 0x00 },
                { at: 1.0, r: 0x00, g: 0xff, b: 0x00 }
            ]
        };
        lut = ns.toLookup(3, palette);
        
        assertEquals(0x80, lut[1].r);
        assertEquals(0x80, lut[1].g);
        assertEquals(0x00, lut[1].b);
    },
    
    // Red to Green through HSV, is the middle color yellow?
    testHSL: function() {
        palette = {
            interpolate: "hsl",
            stops: [
                { at: 0.0, r: 0xff, g: 0x00, b: 0x00 },
                { at: 1.0, r: 0x00, g: 0xff, b: 0x00 }
            ]
        };
        lut = ns.toLookup(3, palette);
        
        assertEquals(0xff, lut[1].r);
        assertEquals(0xff, lut[1].g);
        assertEquals(0x00, lut[1].b);        
    },
    
    // Are bins at each stop and midway between each stop correct?
    testWeighted: function() {
        palette = {
            interpolate: "rgb",
            stops: [
                { at: 0.0, r: 0x00, g: 0x00, b: 0x00 },
                { at: 0.6, r: 0x00, g: 0xff, b: 0x00 },
                { at: 0.8, r: 0x00, g: 0x00, b: 0xff },
                { at: 1.0, r: 0xff, g: 0xff, b: 0xff }
            ]
        };
        lut = ns.toLookup(11, palette);
        
        // Bin 0: First stop
        assertEquals(0x00, lut[0].r);
        assertEquals(0x00, lut[0].g);
        assertEquals(0x00, lut[0].b);
        
        // Bin 3: Midway between first and second stop
        assertEquals(0x00, lut[3].r);
        assertEquals(0x80, lut[3].g);
        assertEquals(0x00, lut[3].b);
                
        // Bin 6: Second stop
        assertEquals(0x00, lut[6].r);
        assertEquals(0xff, lut[6].g);
        assertEquals(0x00, lut[6].b);        

        // Bin 7: Midway between second and third stop
        assertEquals(0x00, lut[7].r);
        assertEquals(0x80, lut[7].g);
        assertEquals(0x7f, lut[7].b); // rounding
        
        // Bin 8: Third stop
        assertEquals(0x00, lut[8].r);
        assertEquals(0x00, lut[8].g);
        assertEquals(0xff, lut[8].b);              
    },
    
    // Are solid colors placed in the correct bins?
    testSolid: function() {
        palette = {
            type: "solid", 
            interpolate: "rgb",
            stops: [
                { at: 0.0, r: 0x01, g: 0x00, b: 0x00 },
                { at: 0.7, r: 0x02, g: 0x00, b: 0x00 },
                { at: 1.0, r: 0x03, g: 0x00, b: 0x00 }
            ]
        };
        lut = ns.toLookup(11, palette);
        
        assertEquals(0x01, lut[0].r);
        assertEquals(0x01, lut[6].r);
        assertEquals(0x02, lut[7].r);
        assertEquals(0x02, lut[9].r);
        assertEquals(0x03, lut[10].r);
    },
    
    // Alpha applied outside of range?
    testAlpha: function() {
        palette = {
            min: 0.1,
            max: 0.9,
            stops: [
                { at: 0.0, r: 0xff, g: 0xff, b: 0xff }
            ]
        };
        lut = ns.toLookup(3, palette);
        
        assertEquals(0x00, lut[0].a);
        assertEquals(0xff, lut[1].a);
        assertEquals(0x00, lut[2].a);        
    },
    
});