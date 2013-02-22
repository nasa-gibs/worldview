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

TestCase("Map.ProductMap", TestSuite.TestCases({
    
    ns: null,
    patcher: null,
    mapConfig: null,
    
    setUp: function() {
        ns = Worldview.Map;
        patcher = TestSuite.Patcher();
        
        mapConfig = {
            projections: {
                geographic: {},
                arctic: {},
                antarctic: {}
            },
            products: {
                alpha: {
                    product: "daily",
                    type: "wmts",
                    projections: {
                        geographic: {},
                        arctic: {},
                        antarctic: {}
                    }
                },
                beta: {
                    product: "daily",
                    type: "wmts",
                    projections: {
                        geographic: {},
                        arctic: {},
                        antarctic: {}
                    }
                },
                gamma: {
                    product: "daily",
                    type: "wmts",
                    projections: {
                        arctic: {}
                    }
                },
                delta: {
                    product: "daily",
                    type: "wmts",
                    projections: {
                        antarctic: {}
                    }
                }                      
            }           
        };
        
        patcher.apply("Worldview.Map.DailyProduct",  function() {
            return { 
                setDay: mockFunction(),
                setZIndex: mockFunction(),
                dispose: mockFunction()
            };
        });
        patcher.apply("OpenLayers.Layer.WMTS", function() {});
        
        $("<div id='__TEST_PRODUCT_MAP'></div>").appendTo("body");
    },
    
    tearDown: function() {
        patcher.undo();
    },
    
    // Check that an error is thrown if the map container is not defined
    testNoContainer: function() {
        try {
            ns.ProductMap("__NO_MAP", mapConfig);
            fail("__NO_MAP should not be a valid container");
        } catch ( message ) {
            assertEquals("No container for ProductMap: __NO_MAP", message);
        }
    },

    // Check that all controls are created, once for each projection (3)
    testControls: function() {
        productMap = ns.ProductMap("__TEST_PRODUCT_MAP", mapConfig);    
        assertEquals(3, $(".olControlZoomInCustom").length);
        assertEquals(3, $(".olControlZoomOutCustom").length);
        assertEquals(3, $(".olControlZoomPanelCustom").length);
        assertEquals(3, $(".olControlScaleLineCustom").length);
    },
    
    // Check that a default projection is selected
    testDefaultProjection: function() {
        productMap = ns.ProductMap("__TEST_PRODUCT_MAP", mapConfig);    
        assertEquals("geographic", productMap.projection);
    },
    
    // Check that if a starting projection is defined, it is used
    testStartingProjection: function() {
        mapConfig.defaultProjection = "arctic";
        productMap = ns.ProductMap("__TEST_PRODUCT_MAP", mapConfig);    
        assertEquals("arctic", productMap.projection);
    },
    
    
    // Check that an error is thrown if the starting projection is invalid
    testInvalidStartingProjection: function() {
        mapConfig.defaultProjection = "foo";
        try {
            productMap = ns.ProductMap("__TEST_PRODUCT_MAP", mapConfig);   
            fail("foo should not be a valid projection");            
        } catch ( message ) {
            assertEquals("Unsupported projection: foo", message);
        }
    },
    
    // Check that the correct divs are visible on a projection switch
    testVisibleDivsProjectionSwitch: function() {
        productMap = ns.ProductMap("__TEST_PRODUCT_MAP", mapConfig);    
        productMap.setProjection("arctic");
        assertTrue($(".map-arctic :visible").length > 0);        
        assertTrue($(".map-geographic :visible").length === 0);        
    },
    
    // Check that a product is appended properly
    testAppend: function() {
        productMap = ns.ProductMap("__TEST_PRODUCT_MAP", mapConfig); 
        productMap.append("alpha");
        assertTrue($.inArray("alpha", productMap.products) >= 0);
    },
    
    // Check that an error is thrown on an undefined product
    testAppendNoProduct: function() {
        productMap = ns.ProductMap("__TEST_PRODUCT_MAP", mapConfig); 
        try {
            productMap.append("omega");
            fail("Product should not exist");
        } catch ( message ) {
            assertEquals("No such product: omega", message);
        }
    },

    // Check that only one layer exists after a duplicate add
    testAppendDuplicate: function() {        
        productMap = ns.ProductMap("__TEST_PRODUCT_MAP", mapConfig); 
        productMap.append("alpha");
        productMap.append("alpha");
        assertEquals(1, productMap.products.length);
    },
    
    // Check that product is not added if it is not supported by projection
    testAppendProjectionNotSupported: function() {
        productMap = ns.ProductMap("__TEST_PRODUCT_MAP", mapConfig); 
        productMap.append("gamma");
        assertEquals(0, productMap.products.length);
    },
    
    // Check that the set function adds all new layers
    testSet: function() {
        productMap = ns.ProductMap("__TEST_PRODUCT_MAP", mapConfig); 
        productMap.set(["alpha", "beta"]);
        assertEquals(2, productMap.products.length);
        assertEquals("alpha", productMap.products[0]);
        assertEquals("beta", productMap.products[1]);    
    },
    
    // Check that set reorders layers
    testSetReorder: function() {
        productMap = ns.ProductMap("__TEST_PRODUCT_MAP", mapConfig); 
        productMap.set(["alpha", "beta"]);
        productMap.set(["beta", "alpha"]);
        assertEquals(2, productMap.products.length);
        assertEquals("beta", productMap.products[0]);
        assertEquals("alpha", productMap.products[1]);                 
    },
    
    // Check that set removes layers
    testSetRemove: function() {
        productMap = ns.ProductMap("__TEST_PRODUCT_MAP", mapConfig);         
        productMap.set(["alpha", "beta"]);
        productMap.set(["beta"]);
        assertEquals(1, productMap.products.length);
        assertEquals("beta", productMap.products[0]);    
    }
            
}));


