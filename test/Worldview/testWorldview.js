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

TestCase("Worldview.namespace", {

    tearDown: function() {
        if ( Worldview.test) {
            delete Worldview.test;
        }
    },
       
    // Check that the namespace object gets created
    testNamespace: function() {
        assertUndefined(Worldview.test);
        Worldview.namespace("test");
        assertNotUndefined(Worldview.test);   
    },
    
    // Check that all namespace objects get created
    testNamespaceNesting: function() {
        Worldview.namespace("test.one.two");
        assertNotUndefined(Worldview.test);
        assertNotUndefined(Worldview.test.one);
        assertNotUndefined(Worldview.test.one.two);
    },
    
    // Check that a namespace object does not get clobbered when called agian.
    testNamespaceNoClobber: function() {
        Worldview.namespace("test");
        Worldview.test.foo = "foo";
        Worldview.namespace("test.baz");
        assertEquals("foo", Worldview.test.foo);
    }
   
});

TestCase("Worldview.error", {
    
    patcher: null,
    mockPanel: null,
    
    setUp: function() {
        // Mock out the panel that is displayed on an error
        var mockPanelConstructor = mockFunction();
        mockPanel = mock(YAHOO.widget.Panel);
        mockPanel.hideEvent = {
            subscribe: function() {}
        };
        when(mockPanelConstructor)(anything())
            .thenReturn(mockPanel);
        
        patcher = TestSuite.Patcher();
        patcher.apply("Worldview.log", mockFunction());
        patcher.apply("YAHOO.widget.Panel", mockPanelConstructor);
    },
    
    tearDown: function() {
        patcher.undo();
    },
    
    // Check that error gets written to console
    testErrorConsole: function() {
        Worldview.error("This is an error");
        verify(Worldview.log)("ERROR: This is an error");
    },

    // Check that error text gets placed in the dialog    
    testErrorPanel: function() {
        Worldview.error("This is an error");
        verify(mockPanel).setBody("This is an error");        
    },
    
    // Check that error with cause is written to console
    testErrorWithCause: function() {
        Worldview.error("This is an error", "with a cause");
        verify(Worldview.log)("ERROR: This is an error");
        verify(Worldview.log)("Cause: with a cause");
    },
    
    // Check that the cause is not placed in the dialog
    testErrorDialogNoCause: function() {
        Worldview.error("This is an error", "with a cause");
        verify(mockPanel).setBody("This is an error");       
    }
    
});

TestCase("Worldview.error.withoutYahoo", {
    
    setUp: function() {
        patcher.apply("Worldview.log", mockFunction());
        patcher.apply("YAHOO", {});        
    },
    
    // Make sure function still works without Yahoo.
    testErrorConsole: function() {
        Worldview.error("This is an error");
        verify(Worldview.log)("ERROR: This is an error");
    }
        
});
