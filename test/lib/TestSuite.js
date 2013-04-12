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
 * Namespace: TestSuite
 * Harness and testing utilities.
 */
var TestSuite = {};

/*
 * Inform JsMockito that JsTestDriver is being used so it will know when
 * to clean up.
 */
JsHamcrest.Integration.JsTestDriver();
JsMockito.Integration.JsTestDriver();

/**
 * Required elements that must appear in the document
 */
$(function() {
    $(document.body).append("<div id='map'></div>");
});

