/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

var wv = wv || {}
wv.events = wv.events || (function() {

    var self = {};

    self.query = function() {
        console.log("DOING IT");
        $.getJSON("http://eonet.sci.gsfc.nasa.gov/events", function(data) {
            console.log("GOT IT");
            console.log(data);
        });
    };

    return self;
})();

$(function() {
    wv.events.query();
});
