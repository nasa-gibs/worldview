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

/*
 * Inform JsMockito that JsTestDriver is being used so it will know when
 * to clean up the mock objects.
 */
JsHamcrest.Integration.JsTestDriver();
JsMockito.Integration.JsTestDriver();