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

TestCase("TestSuite.Patcher", {
    
    patcher: null,
    
    setUp: function() {
        patcher = TestSuite.Patcher();
        window.__TEST_PATCHER = {}
        window.__TEST_PATCHER.foo = "FOO";
    },
    
    tearDown: function() {
        patcher.undo();
        delete window.__TEST_PATCHER;
    },
    
    // Check to see if a patch and undo are successful
    testPatch: function() {
        patcher.apply("__TEST_PATCHER.foo", "BAR");
        assertEquals("BAR", __TEST_PATCHER.foo);
        patcher.undo();
        assertEquals("FOO", __TEST_PATCHER.foo);
    },
    
    // Make sure when double patched, it returns to the original value
    testPatchMultiple: function() {
        patcher.apply("__TEST_PATCHER.foo", "one");
        patcher.apply("__TEST_PATCHER.foo", "two");
        assertEquals("two", __TEST_PATCHER.foo);
        patcher.undo();
        assertEquals("FOO", __TEST_PATCHER.foo);
    },
    
    // Check patching an undefined value
    testPatchUndefined: function() {
        patcher.apply("__TEST_PATCHER.foo", undefined);
        assertUndefined(__TEST_PATCHER.foo);
    },
    
    // Check there is a good error message when a parent in the object 
    // path is undefined
    testInvalidParent: function() {
        try {
            patcher.apply("__TEST_PATCHER.bar");   
            fail();
        } catch ( message ) {
            assertEquals("In __TEST_PATCHER.bar, bar is undefined", message);
        }
    }
    
});

