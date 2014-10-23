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

var wv = wv || {};
wv.ui = wv.ui || {};

wv.ui.click = wv.ui.click || function($element, callback) {

    var startX, startY;

    var self = {};
    self.sensitivity = 5; // pixels

    var init = function() {
        $element.mousedown(mousedown);
        $element.mouseup(mouseup);
    };

    var mousedown = function(event) {
        startX = event.clientX;
        startY = event.clientY;
    };

    var mouseup = function(event) {
        if ( withinClickDistance(event) ) {
            callback.call(this);
        }
    };

    var withinClickDistance = function(event) {
        targetX = event.clientX;
        targetY = event.clientY;
        distance = Math.sqrt(Math.pow(startX - targetX, 2) +
                Math.pow(startY - targetY, 2));
        return distance <= self.sensitivity;
    };

    init();
    return self;

};
