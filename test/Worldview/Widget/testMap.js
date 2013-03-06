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

TestCase("Widget.Map", TestSuite.TestCases({
    
    ns: null,
    
    setUp: function() {
        ns = Worldview.Widget.Map;
    },
    
    // Check that an extent is encoded properly
    testValueFromExtent: function() {
        extent = new OpenLayers.Bounds(-2, -1, 1, 2);
        assertEquals("-2_-1_1_2", ns.valueFromExtent(extent));
    },
    
    // Check that the extent is correct when decoded
    testExtentFromValue: function() {
        value = ns.extentFromValue("-2_-1_1_2");
        assertEquals(-2, value.toArray()[0]);
        assertEquals(-1, value.toArray()[1]);
        assertEquals(1, value.toArray()[2]);
        assertEquals(2, value.toArray()[3]);
    },

    // Check that the extent is correct when decoded even if using commas
    testExtentFromValueCommas: function() {
        value = ns.extentFromValue("-2,-1,1,2");
        assertEquals(-2, value.toArray()[0]);
        assertEquals(-1, value.toArray()[1]);
        assertEquals(1, value.toArray()[2]);
        assertEquals(2, value.toArray()[3]);
    }

}));
