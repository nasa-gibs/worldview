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

TestCase("Scheduler", TestSuite.Tests({

    setUp: function() {
    },
    
    // Check that a job's callback is invoked when completed.
    testExecute: function() {
        var callbackInvoked = false;
        var factory = function() {
            var target = {
                onSuccess: null,
                addEventListener: function(type, callback) {
                    if ( type === "message" ) {
                        onSuccess = callback;
                    }
                },
                postMessage: function(message) {
                    onSuccess({
                        target: target,
                        data: {
                            id: message.id,
                            status: "success"
                        }
                    });
                }
            };
            return target;
        }
        
        var scheduler = new Worldview.Scheduler({
            factory: factory
        });
        scheduler.submit({
            callback: function() {
                callbackInvoked = true;
            }
        });
        assertTrue(callbackInvoked);
    },
    
    // Check that a job' callback is invoked on an error.
    testFailure: function() {
        var callbackInvoked = false;
        var factory = function() {
            var target = {
                onError: null,
                addEventListener: function(type, callback) {
                    if ( type === "error" ) {
                        onError = callback;
                    }
                },
                postMessage: function(message) {
                    onError({
                        target: target,
                        data: {
                            id: message.id
                        }
                    });
                }
            }
            return target;
        };
        
        var scheduler = new Worldview.Scheduler({
            factory: factory
        });
        scheduler.submit({
            callback: function() {
                callbackInvoked = true;
            }
        });
        assertTrue(callbackInvoked);        
    }
    
}));
