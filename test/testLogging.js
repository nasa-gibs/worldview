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
    
    setUp: function() {
        patcher = TestSuite.Patcher();
    },
    
    tearDown: function() {
        patcher.undo();
        Logging.undebug();
        Logging.reset();
    },
    
    // Check that it passes through to the correct object
    testMessage: function() {
        var mockLog = mockFunction();
        patcher.apply("console.log", mockLog);
        Logging.getLogger("testMessage").message("log");
        verify(mockLog)("log");    
    },

    // Check that it passes through to the correct object    
    testError: function() {
        var mockError = mockFunction();
        patcher.apply("console.error", mockError);
        Logging.getLogger("testError").error("error");
        verify(mockError)("error");
    },
    
    // Check that it passes through to the correct object
    testInfo: function() {
        var mockInfo = mockFunction();
        patcher.apply("console.info", mockInfo);
        Logging.getLogger("testInfo").info("info");
        verify(mockInfo)("info");    
    },   

    // Check that it passes through to the correct object
    testWarn: function() {
        var mockWarn = mockFunction();
        patcher.apply("console.warn", mockWarn);
        Logging.getLogger("testWarn").warn("warn");
        verify(mockWarn)("warn");    
    }, 

    // Check that it passes through to the correct object
    testTrace: function() {
        var mockTrace = mockFunction();
        patcher.apply("console.trace", mockTrace);
        Logging.getLogger("testTrace").trace();
        verify(mockTrace)();    
    },
    
    // Check for no output when debugging is not enabled
    testDebugDisabled: function() {
        var mockLog = mockFunction();
        patcher.apply("console.log", mockLog);
        Logging.getLogger("testDebugDisabled").debug("foo");
        verifyZeroInteractions(mockLog);
    },
    
    // Check for output when debugging is enabled
    testDebugEnabled: function() {
        var mockLog = mockFunction();
        patcher.apply("console.log", mockLog);
        Logging.debug("testDebugEnabled");
        Logging.getLogger("testDebugEnabled").debug("foo");
        verify(mockLog)("foo");
    },
        
    // Check for output when all debugging
    testAllDebugEnabled: function() {
        var mockLog = mockFunction();
        patcher.apply("console.log", mockLog);
        Logging.debug();
        Logging.getLogger("testAllDebugE").debug("foo");
        Logging.getLogger("bar").debug("bar");
        verify(mockLog)("foo");        
        verify(mockLog)("bar");
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
        Logging.reset();
    },
    
    // Test that no errors are thrown when console is undefined
    testAll: function() {
        Logging.getLogger().error("foo");
        Logging.getLogger().message("foo");
        Logging.getLogger().info("foo");
        Logging.getLogger().warn("foo");
        Logging.getLogger().trace("foo");
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
        Logging.reset();
    },
    
    // Check that log is called when error is not defined
    testError: function() {
        Logging.getLogger().error("foo");
        verify(mockLog)("foo");
    },

    // Check that log is called when info is not defined    
    testInfo: function() {
        Logging.getLogger().info("foo");
        verify(mockLog)("foo");
    },
    
    // Check that warn is called when error is not defined    
    testWarn: function() {
        Logging.getLogger().warn("foo");
        verify(mockLog)("foo");
    },
    
    // Check that there is no error when trace is not defined  
    testTrace: function() {
        Logging.getLogger().trace();
    }
    
}));

