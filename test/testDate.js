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
TestCase("Date.parseISOString", TestSuite.Tests({

    // Check that a valid string returns the correct date
    testValid: function() {
        var d = Date.parseISOString("2013-03-15T12:34:45Z");
        assertEquals(2013, d.getUTCFullYear());
        assertEquals(2, d.getUTCMonth());
        assertEquals(15, d.getUTCDate());
        assertEquals(12, d.getUTCHours());
        assertEquals(34, d.getUTCMinutes());
        assertEquals(45, d.getUTCSeconds());
    },

    // Check that a valid string without Z returns the correct date
    testValidWithoutZ: function() {
        var d = Date.parseISOString("2013-03-15T12:34:45");
        assertEquals(2013, d.getUTCFullYear());
        assertEquals(2, d.getUTCMonth());
        assertEquals(15, d.getUTCDate());
        assertEquals(12, d.getUTCHours());
        assertEquals(34, d.getUTCMinutes());
        assertEquals(45, d.getUTCSeconds());
    },
        
    // Check that a valid string without time returns the correct date
    testValidWithoutTime: function() {
        var d = Date.parseISOString("2013-03-15");
        assertEquals(2013, d.getUTCFullYear());
        assertEquals(2, d.getUTCMonth());
        assertEquals(15, d.getUTCDate());
        assertEquals(0, d.getUTCHours());
        assertEquals(0, d.getUTCMinutes());
        assertEquals(0, d.getUTCSeconds());
    },
    
    // Check that an empty string throws an error
    testEmptyString: function() {
        pass = false;
        try {
            Date.parseISOString("");
        } catch ( error ) {
            pass = true;
        }
        assertTrue(pass);
    },
                                
}));