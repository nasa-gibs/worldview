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

TestCase("Event", TestSuite.Tests({
    
    // Check that a registered listener is called on a fire
    testFire: function() {
        var events = Worldview.Events();
        var eventFired = false;
        events.on("test", function() {
            eventFired = true;    
        });
        events.fire("test");
        assertTrue(eventFired);
    },
    
    // Check that the listener receives arguments when fired.
    testFire_withArguments: function() {
        var events = Worldview.Events();
        var results;
        events.on("test", function(e) {
            results = e;
        });
        events.fire("test", {value: "foo"});
        assertEquals("foo", results.value);    
    },
    
    // Check that each listener is called on when fired.
    testFire_multiple: function() {
        var events = Worldview.Events();
        var alpha = false;
        events.on("test", function() {
            alpha = true;
        });
        var bravo = false;
        events.on("test", function() {
            bravo = true;
        });
        events.fire("test");
        assertTrue(alpha);
        assertTrue(bravo);
    },
    
    // Check that there is no error when an event with no listeners is fired.
    testFire_noListeners: function() {
        var events = Worldview.Events();
        events.fire("test");
    },
    
    // Check that a listener can be unregistered
    testOff: function() {
        var events = Worldview.Events();
        var eventFired = false;
        var callback = function() {
            eventFired = true;    
        }
        events.on("test", callback);
        events.off("test", callback);
        events.fire("test");
        assertFalse(eventFired);         
    },
    
    // Check that there is no error when a listener is unregistered when
    // it was not previously registered.
    testOff_noListener: function() {
        var events = Worldview.Events();
        events.off("test", function() {});
    }

}));

