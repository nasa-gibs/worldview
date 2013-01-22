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

TestCase("Test.OpenLayers.Tile.Canvas", {

    tile: null,
    
    setUp: function() {
        var mockLayer = mock(OpenLayers.Layer.WMS);
        var mockMap = mock(OpenLayers.Map);
        mockLayer.map = mockMap;
        
        tile = new OpenLayers.Tile.Canvas(
            mockLayer, 
            new OpenLayers.Pixel(0, 0),         // screen location
            new OpenLayers.Bounds(0, 0, 1, 1),  // lat/lon bb
            "http://example.com/wms", 
            new OpenLayers.Size(512, 512)       // tile size
        );    
    },
    
    testDestroyRemovesCanvas: function() {
        tile.canvas = "canvas";
        tile.destroy();
        assertNull(tile.canvas);
    },
    
    testClearHidesCanvas: function() {
        tile.canvas = {};
        tile.canvas.style = { visibility: "inherit" };
        tile.clear();
        assertEquals("hidden", tile.canvas.style.visibility);
    },
    
    testClearRemovesLoadErrorClass: function() {
        tile.canvas = {};
        tile.canvas.style = { visibility: "inherit" };
        OpenLayers.Element.addClass("olImageLoadError");
        tile.clear();
        assertFalse(OpenLayers.Element.hasClass("olImageLoadError"));
    },
    
    testGetCanvasCreatesCanvas: function() {
        assertNull(tile.canvas);
        var canvas = tile.getCanvas();
        assertNotNull(tile.canvas);
    },
    
});

