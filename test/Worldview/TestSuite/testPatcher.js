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
    
    setUp: function() {
        Worldview.foo = "FOO";
    },
    
    tearDown: function() {
        delete Worldview.foo;
    },
    
    // Check to see if a patch and undo are successful
    testPatch: function() {
        var patcher = TestSuite.Patcher();
        patcher.apply("Worldview.foo", "BAR");
        assertEquals("BAR", Worldview.foo);
        patcher.undo();
        assertEquals("FOO", Worldview.foo);
    },
    
    // Make sure when double patched, it returns to the original value
    testPatchMultiple: function() {
        var patcher = TestSuite.Patcher();
        patcher.apply("Worldview.foo", "one");
        patcher.apply("Worldview.foo", "two");
        assertEquals("two", Worldview.foo);
        patcher.undo();
        assertEquals("FOO", Worldview.foo);
    }
});

