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

TestCase("TestSuite.Tests", {
   
   // Check that the setUp call is properly passed through
   testSetupCalled: function() {
       var called = false;
       var tc = TestSuite.Tests({
           setUp: function() {
               called = true;
           }
       }); 
       tc.setUp();
       assertTrue(called);
   },
   
   // Check that the tearDown call is properly passed through
   testTearDownCalled: function() {
       var called = false;
       var tc = TestSuite.Tests({
           tearDown: function() {
               called = true;
           }
       });
       tc.tearDown();
       assertTrue(called);
   },
   
   // Check that the test call is properly passed through
   testTestCalled: function() {
       var called = false;
       var tc = TestSuite.Tests({
           testSomething: function() {
               called = true;
           }
       })
       tc.testSomething();
       assertTrue(called);
   },
   
   
   // Check that if there is an error running the test, tearDown is still
   // called
   testTearDownCalledOnError: function() {
       var called = false;
       var tc = TestSuite.Tests({
           tearDown: function() {
               called = true;
           },
           testSomething: function() {
               throw "Test Error";
           }
       });
       
       try {
           tc.testSomething();
           fail();
       } catch ( message ) {
           assertEquals("Test Error", message);
           assertTrue(called);
       }
   }
    
});
