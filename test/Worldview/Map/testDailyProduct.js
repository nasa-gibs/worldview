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

TestCase("Map.DailyProduct", TestSuite.TestCases({
    
    ns: null,
    patcher: null,
    mockMap: null,
    mockLayers: null,
    product: null,
    
    setUp: function() {
        ns = Worldview.Map;
        patcher = TestSuite.Patcher();
        
        mockMap = mock({
            addLayer: function() {},
            events: {},
            getLayerIndex: function() {},
            removeLayer: function() {}
        });
        
        mockMap.events.register = function(event, object, callback) {
            if ( event === "movestart" ) {
                mockMap.moveStart = callback;
            } else if ( event === "zoomend" ) {
                mockMap.zoomEnd = callback;
            }
        };
        
        mockConfig = {
            product: "daily",
            type: "wmts"
        };
        mockLayers = [];
        
        patcher.apply("OpenLayers.Layer.WMTS", function() {
            var self = {};
            self.mergeNewParams = function() {};
            self.opacity =  0;
            self.zindex = 0;
            self.visibility = false;
            self.setOpacity = function(v) { self.opacity = v; };
            self.setZIndex = function(v) { self.zindex = v; };
            self.setVisibility = function(v) { self.visibility = v; };            
            self.getVisibility = function() { return self.visibility; };
            mockLayers.push(self);
            return self;
        });
        product = ns.DailyProduct(mockMap, mockConfig);
    },
    
    tearDown: function() {
        patcher.undo();
    },
        
    // Check that an exception is thrown if the product type does not exist
    testInvalidLayerClass: function() {
        try {
            ns.DailyProduct(mockMap, { type: "foo" });
            fail("foo should not be a valid layerClass");
        } catch ( message ) {
            assertEquals("Unsupported layer type: foo",
                    message);
        }
    },
    
    // Check that when the day is set, another layer is created and the
    // opacity for the original layer is set to zero. Also check that the
    // visible layer is on top
    testChangeDay: function() {
        product.setDay(new Date(2013, 02, 15));
        assertEquals(2, mockLayers.length);
        assertEquals(0, mockLayers[0].opacity);
        assertEquals(0, mockLayers[0].zindex); 
        assertEquals(1, mockLayers[1].opacity);
        assertEquals(1, mockLayers[1].zindex);
    },
    
    // Check that when the map is moved, layers are invalidated properly
    testMoveMap: function() {
        product.setDay(new Date(2013, 02, 15));
        mockMap.moveStart();
        assertEquals(2, mockLayers.length);
        assertFalse(mockLayers[0].visibility);
        assertTrue(mockLayers[1].visibility);
    },
    
    // Check that when the map requires a redraw, layers are removed
    testRedrawMap: function() {
        when(mockMap).getLayerIndex(anything()).thenReturn(1);
        product.setDay(new Date(2013, 02, 15));
        mockMap.moveStart();
        mockMap.zoomEnd();
        verify(mockMap, times(2)).addLayer(anything());
        verify(mockMap).removeLayer(anything());
    }
    
}));
