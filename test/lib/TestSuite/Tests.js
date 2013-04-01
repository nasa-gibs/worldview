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

/**
 * Class: TestSuite.Tests
 * Wrapper for defining test cases.
 * 
 * Normally, the tearDown method is not called when there is an error running
 * a test case. Use this instead to ensure that tearDown is always called if
 * defined.
 * 
 * Example:
 * (begin code)
 * TestCase("Foo", TestSuite.Tests({
 *      
 *      done: null,
 * 
 *      setUp: function() {
 *          done = false;
 *      },
 * 
 *      tearDown: function() {
 *          done = true;
 *      },
 * 
 *      testItem: function() {
 *          // Done should always be false at the start of a test
 *          assertFalse(done);
 *      },
 * }));
 * (end code)
 * 
 * Constructor: Tests
 * Creates a new instance
 * 
 * Parameters:
 * testCases - Object containing the test case functions to execute.
 */
TestSuite.Tests = function(testCases) {
        
    var self = {};
    
    // Wrap the actual function call for the test case and call tearDown
    // if an exception is thrown
    var wrapper = function(target) {
        return function() {
            try {
                target();
            } catch ( message ) {
                if ( self.tearDown ) {
                    self.tearDown();
                }
                throw message;
            }
        }
    };
        
    for ( property in testCases ) {
        if ( property === "setUp" || property === "tearDown" ) {
            // Simply pass these through
            self[property] = testCases[property];
        } else if ( typeof testCases[property] === "function" ) {
            self[property] = wrapper(testCases[property]);
        }
    }
    
    return self;
}
