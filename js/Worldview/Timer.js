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

Worldview.Timer = function(callback, delay) {
    
    var timerId = null;
    var self = {};
        
    self.start = function() {
        if ( !timerId ) {
            timerId = setTimeout(callback, delay);
        }
    };
    
    self.cancel = function() {
        if ( timerId ) {
            clearTimeout(timerId);
        }
        timerId = null;
    };
    
    self.restart = function() {
        self.cancel();
        self.start();
    };
    
    return self;
};
