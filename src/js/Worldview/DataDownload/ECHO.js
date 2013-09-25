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

Worldview.namespace("DataDownload");

Worldview.DataDownload.ECHO = function() {
    
    var ns = {};
    
    ns.REL_DATA = "http://esipfed.org/ns/fedsearch/1.1/data#";
    ns.REL_BROWSE = "http://esipfed.org/ns/fedsearch/1.1/browse#";
  
    ns.roundTime = function(timeString) {
        var time = Date.parseISOString(timeString);
        if ( time.getUTCMilliseconds() >= 500 ) {
            time.setUTCSeconds(time.getUTCSeconds() + 1);    
        }
        time.setUTCMilliseconds(0);
        return time.toISOString();   
    };
    
    return ns;
    
}();
