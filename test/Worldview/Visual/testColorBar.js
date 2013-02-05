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
TestCase("Visual.ColorBar", {
    
    ns: null,
    
    width: null,
    height: null,
        
    canvas: null,
    
    g: null,
    pattern: null,
    
    setUp: function() {
        ns = Worldview.Visual;
        width = 10;
        height = 1;
        
        $(document.body).append("<canvas id='test-colorBar'></canvas>");
        $("#test-colorBar")
            .width(width)
            .height(height);
        
        canvas = $("#test-colorBar").get(0);
        canvas.width = width;
        canvas.height = height;
        
        g = canvas.getContext("2d");
        
        // Create a background pattern that is solid red
        $(document.body).append("<canvas id='test-background'></canvas");
        $("#test-background")
            .width(width)
            .height(height)
            
        var background = $("#test-background").get(0);
        background.width = width;
        background.height = height;
        
        bg = background.getContext("2d");
        bg.fillStyle = "rgb(255, 0, 0)";
        bg.fillRect(0, 0, width, height);
        
        pattern = g.createPattern(background, "repeat");
    },
    
    testEmpty: function() {
        var colorBar = ns.ColorBar({
            selector: "#test-colorBar",
            bins: 10,
            background: pattern
        });
        
        // Select a pixel in the middle and check that it is red
        var red = g.getImageData(width/2, height/2, 1, 1).data;
        assertEquals(0xff, red[0]);
        assertEquals(0x00, red[1]);
        assertEquals(0x00, red[2]);
        assertEquals(0xff, red[3]); 
    },
    
    // Check to see that image data did get written
    testBlackToWhite: function() {
        var colorBar = ns.ColorBar({
            selector: "#test-colorBar", 
            bins: 10, 
            background: pattern,
            palette: {
                stops: [
                    { at: 0.0, r: 0x00, g: 0x00, b: 0x00 },
                    { at: 1.0, r: 0xff, g: 0xff, b: 0xff }
                ]
            }});
            
        var black = g.getImageData(0, 0, 1, 1).data;
        assertEquals(0x00, black[0]);
        assertEquals(0x00, black[1]);
        assertEquals(0x00, black[2]);
        assertEquals(0xff, black[3]);
        
        var white = g.getImageData(width - 1, 0, 1, 1).data;
        assertEquals(0xff, white[0]);
        assertEquals(0xff, white[1]);
        assertEquals(0xff, white[2]);
        assertEquals(0xff, white[3]);        
    },
    
    // See if the background leaks through anywhere
    testLeakage: function() {
        var colorBar = ns.ColorBar({
            selector: "#test-colorBar", 
            bins: 10, 
            background: pattern,
            palette: {
                stops: [
                    { at: 0.0, r: 0x00, g: 0x00, b: 0x00 },
                    { at: 1.0, r: 0xff, g: 0xff, b: 0xff }
                ]
            }});        
            
        var pixels = g.getImageData(0, 0, width, height).data;
        for ( var i = 0; i < pixels.length; i += 4 ) {
            assertNotEquals(0xff, pixels[0]);
        }
    },

});
