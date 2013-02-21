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

TestCase("Worldview.general", TestSuite.TestCases({

    testToISODateString: function() {
        assertEquals("2013-03-15", 
            Worldview.toISODateString(new Date(2013, 02, 15)));
    }
        
}));

TestCase("Worldview.namespace", TestSuite.TestCases({

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
   
}));

TestCase("Worldview.error", TestSuite.TestCases({
    
    patcher: null,
    mockPanel: null,
    mockLog: null,
    
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
        mockLog = mockFunction();  
        patcher.apply("console.error", mockLog);
        patcher.apply("YAHOO.widget.Panel", mockPanelConstructor);
    },
    
    tearDown: function() {
        patcher.undo();
    },
    
    // Check that error gets written to console
    testErrorConsole: function() {
        Worldview.error("This is an error");
        verify(mockLog)("This is an error");
    },

    // Check that error text gets placed in the dialog    
    testErrorPanel: function() {
        Worldview.error("This is an error");
        verify(mockPanel).setBody("An unexpected error has occurred." +
                "<br/><br/>This is an error");          
    },
    
    // Check that error with cause is written to console
    testErrorWithCause: function() {
        Worldview.error("This is an error", "with a cause");
        verify(mockLog)("This is an error: with a cause");
    },
    
    // Check that the cause is not placed in the dialog
    testErrorDialogNoCause: function() {
        Worldview.error("This is an error", "with a cause");
        verify(mockPanel).setBody("An unexpected error has occurred." +
                "<br/><br/>This is an error");       
    }
    
}));

TestCase("Worldview.error.withoutYahoo", TestSuite.TestCases({
    
    patcher: null,
    
    setUp: function() {
        patcher = TestSuite.Patcher();
        patcher.apply("console.error", mockFunction());
        patcher.apply("YAHOO", {});        
    },
    
    tearDown: function() {
        patcher.undo();
    },
    
    // Make sure function still works without Yahoo.
    testErrorConsole: function() {
        Worldview.error("This is an error");
        verify(console.error)("This is an error");
    }
        
}));

TestCase("Worldview.getObjectByPath", TestSuite.TestCases({
    
    ns: null,
        
    setUp: function() {
        ns = Worldview;
        window.__TEST_GET_OBJECT_BY_PATH = {};
        window.__TEST_GET_OBJECT_BY_PATH.Foo = {};
    },
    
    tearDown: function() {
        delete window.__TEST_GET_OBJECT_BY_PATH;
    },
    
    
    // Check that the correct object is obtained
    testValid: function() {
        __TEST_GET_OBJECT_BY_PATH.Foo.bar = "baz";
        assertEquals("baz", 
            ns.getObjectByPath("__TEST_GET_OBJECT_BY_PATH.Foo.bar"));
    },
    
    // Check that an error is thrown on an invalid path
    testInvalidPath: function() {
        try {
            ns.getObjectByPath("__TEST_GET_OBJECT_BY_PATH.XXX.bar");
            fail("Should not have been a valid path");
        } catch ( message ) {
            assertEquals("In __TEST_GET_OBJECT_BY_PATH.XXX.bar, XXX is " + 
                "undefined", message);
        }
    }
    
}));
