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

TestCase("OpenLayers.DailyProduct", TestSuite.TestCases({
    
    ns: null,
    mockMap: null,
    mockLayers: null,
    product: null,
    
    setUp: function() {
        ns = Worldview.OpenLayers;
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
            layerClass: "__TEST_LAYER_CLASS"
        };
        mockLayers = [];
        window.__TEST_LAYER_CLASS = function() { 
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
        };
        product = ns.DailyProduct(mockMap, mockConfig);
    },
    
    tearDown: function() {
        delete window.__TEST_LAYER_CLASS;
    },
        
    // Check that an exception is thrown if the layerClass does not exist
    testInvalidLayerClass: function() {
        try {
            ns.DailyProduct(mockMap, { layerClass: "foo" });
            fail("foo should not be a valid layerClass");
        } catch ( message ) {
            assertEquals("No such layerClass: foo; In foo, foo is undefined",
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
