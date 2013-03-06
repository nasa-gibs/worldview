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

TestCase("Logging.standard", TestSuite.Tests({
    
    patcher: null,
    mockConsole: null,
    
    setUp: function() {
        patcher = TestSuite.Patcher();
    },
    
    tearDown: function() {
        patcher.undo();
        Logging.undebug("foo");
        Logging.undebug();
    },
    
    // Check that it passes through to the correct object
    testMessage: function() {
        var mockLog = mockFunction();
        patcher.apply("console.log", mockLog);
        Logging.Logger().message("log");
        verify(mockLog)("log");    
    },

    // Check that it passes through to the correct object    
    testError: function() {
        var mockError = mockFunction();
        patcher.apply("console.error", mockError);
        Logging.Logger().error("error");
        verify(mockError)("error");
    },
    
    // Check that it passes through to the correct object
    testInfo: function() {
        var mockInfo = mockFunction();
        patcher.apply("console.info", mockInfo);
        Logging.Logger().info("info");
        verify(mockInfo)("info");    
    },   

    // Check that it passes through to the correct object
    testWarn: function() {
        var mockWarn = mockFunction();
        patcher.apply("console.warn", mockWarn);
        Logging.Logger().warn("warn");
        verify(mockWarn)("warn");    
    }, 

    // Check that it passes through to the correct object
    testTrace: function() {
        var mockTrace = mockFunction();
        patcher.apply("console.trace", mockTrace);
        Logging.Logger().trace();
        verify(mockTrace)();    
    },
    
    // Check for no output when debugging is not enabled
    testDebugDisabled: function() {
        var mockLog = mockFunction();
        patcher.apply("console.log", mockLog);
        Logging.Logger("foo").debug("foo");
        verifyZeroInteractions(mockLog);
    },
    
    // Check for output when debugging is enabled
    testDebugEnabled: function() {
        var mockLog = mockFunction();
        patcher.apply("console.log", mockLog);
        Logging.debug("foo");
        Logging.Logger("foo").debug("foo");
        verify(mockLog)("foo");
    },
    
    // Check for no output for debug with no namespace
    testDebugDisabledNoNamespace: function() {
        var mockLog = mockFunction();
        patcher.apply("console.log", mockLog);
        Logging.Logger().debug("foo");
        verifyZeroInteractions(mockLog);
    },
        
    // Check for output when all debughing is enabled with no namespace
   testAllDebugEnabledNoNamespace: function() {
        var mockLog = mockFunction();
        patcher.apply("console.log", mockLog);
        Logging.debug();
        Logging.Logger().debug("foo");
        verify(mockLog)("foo");
    },
    
    // Check for output when all debugging is enabled with namespace
    testAllDebugEnabled: function() {
        var mockLog = mockFunction();
        patcher.apply("console.log", mockLog);
        Logging.debug();
        Logging.Logger("foo").debug("foo");
        verify(mockLog)("foo");        
    }
                    
}));
    
TestCase("Logging.noConsole", TestSuite.Tests({
        
    patcher: null,
    
    setUp: function() {
        patcher = TestSuite.Patcher();
        patcher.apply("console", undefined);
    },
    
    tearDown: function() {
        patcher.undo();
    },
    
    // Test that no errors are thrown when console is undefined
    testAll: function() {
        Logging.Logger().error("foo");
        Logging.Logger().message("foo");
        Logging.Logger().info("foo");
        Logging.Logger().warn("foo");
        Logging.Logger().trace("foo");
    }

}));

TestCase("Logging.onlyLog", TestSuite.Tests({
    
    patcher: null,
    mockLog: null,
    
    setUp: function() {
        patcher = TestSuite.Patcher();
        mockLog = mockFunction();
        patcher.apply("console.log", mockLog);
        patcher.apply("console.error", undefined);
        patcher.apply("console.info", undefined);
        patcher.apply("console.warn", undefined);
        patcher.apply("console.trace", undefined);
    },
    
    tearDown: function() {
        patcher.undo();
    },
    
    // Check that log is called when error is not defined
    testError: function() {
        Logging.Logger().error("foo");
        verify(mockLog)("foo");
    },

    // Check that log is called when info is not defined    
    testInfo: function() {
        Logging.Logger().info("foo");
        verify(mockLog)("foo");
    },
    
    // Check that warn is called when error is not defined    
    testWarn: function() {
        Logging.Logger().warn("foo");
        verify(mockLog)("foo");
    },
    
    // Check that there is no error when trace is not defined  
    testTrace: function() {
        Logging.Logger().trace();
    }
    
}));

