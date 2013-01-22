TestCase("Test.OpenLayers.Tile.Canvas", {

    tile: null,
    
    setUp: function() {
        var mockLayer = mock(OpenLayers.Layer.WMS);
        var mockMap = mock(OpenLayers.Map);
        mockLayer.map = mockMap;
        
        tile = new OpenLayers.Tile.Canvas(
            mockLayer, 
            new OpenLayers.Pixel(0, 0), 
            new OpenLayers.Bounds(0, 0, 1, 1),
            "url", 
            new OpenLayers.Size(512, 512)
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
    
    testClearRemovesLoadError: function() {
        tile.canvas = {};
        tile.canvas.style = { visibility: "inherit" };
        OpenLayers.Element.addClass("olImageLoadError");
        tile.clear();
        assertFalse(OpenLayers.Element.hasClass("olImageLoadError"));
    }
    
});

