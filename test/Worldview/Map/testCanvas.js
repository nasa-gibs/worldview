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

TestCase("CanvasTile", {

    tile: null,
    mockImageData: null,
    mockGraphics: null,
    mockCanvas: null,

    setUp: function() {
        var mockLayer = mock(OpenLayers.Layer.WMS);
        var mockMap = mock(OpenLayers.Map);
        mockLayer.map = mockMap;
        
        tile = new Worldview.Map.CanvasTile(
            mockLayer, 
            new OpenLayers.Pixel(0, 0),         // screen location
            new OpenLayers.Bounds(0, 0, 1, 1),  // lat/lon bb
            "http://example.com/wms", 
            new OpenLayers.Size(512, 512)       // tile size
        );   
        
        // Image of one pixel
        mockImageData = new Uint8ClampedArray([1, 2, 3, 4]);
        
        // Canvas graphics context of the mock image
        mockGraphics = {
            drawImage: function() {
            },
            
            getImageData: function() {
                return {
                    length: 4,
                    data: mockImageData
                }
            }
        };
        
        // Canvas that holds the mock image
        mockCanvas = {
            width: 1,
            height: 1,
            style: {},
            
            getContext: function() {
                return mockGraphics;
            }
        };
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
    
    testOnImageLoadUsesLookupTable: function() {
        tile.canvas = mockCanvas;
        
        // Make the image dimenesions the same as the mock canvas
        tile.imgDiv = {
            width: 1,
            height: 1
        };
        
        tile.layer.lookupTable = { 
            0x01020304: 0x05060708
        };
        
        tile.onImageLoad(); 
        assertEquals(0x05, mockImageData[0]);
        assertEquals(0x06, mockImageData[1]);
        assertEquals(0x07, mockImageData[2]);
        assertEquals(0x08, mockImageData[3]);
    },
});

