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
TestCase("util.clamp", {
    
    array: null,
    
    setUp: function() {
        array = [1, 2, 3, 4, 5];
    },
    
    testClamp: function() {
        assertEquals(5, SOTE.util.clamp(0, 10, 5));
    },
    
    testClampOver: function() {
        assertEquals(10, SOTE.util.clamp(0, 10, 11));
    },
    
    testClampUnder: function() {
        assertEquals(0, SOTE.util.clamp(0, 10, -1));
    },
    
    testClampInvalidRange: function() {
        assertException(function() {
            SOTE.util.clamp(10, 0, 10);
        })
    },
    
    testClampIndex: function() {
        assertEquals(3, SOTE.util.clampIndex(array, 3));
    },
    
    testClampIndexOver: function() {
        assertEquals(4, SOTE.util.clampIndex(array, 5));
    },
    
    testClampIndexUnder: function() {
        assertEquals(0, SOTE.util.clampIndex(array, -1));
    }
    
});

