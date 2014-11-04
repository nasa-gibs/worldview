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
wv.ui.mouse = wv.ui.mouse || {};

wv.ui.mouse.click = wv.ui.mouse.click || function($element, callback) {

    var self = {};
    self.sensitivity = 5; // pixels

    var startX, startY;

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

wv.ui.mouse.wheel = wv.ui.mouse.wheel || function($element, options) {

    options = options || {};

    var self = {};
    self.timeout = options.timeout || 100; // millseconds
    self.threshold = options.threshold || 100; // delta units
    self.events = wv.util.events();

    var delta = 0;
    var zoomed = false;
    var timer = null;
    var lastEvent = null;

    var init = function() {
        $element.on("mousewheel", wheel);
    };

    self.change = function(listener) {
        self.events.on("change", listener);
        return self;
    };

    var wheel = function(event) {
        lastEvent = event;
        delta += event.deltaY;
        if ( !timer ) {
            zoomed = false;
        }
        clearTimeout(timer);
        timer = setTimeout(end, self.timeout);
        update(event);
    };

    var update = function(event) {
        var change = Math.floor(Math.abs(delta) / self.threshold);
        if ( change >= 1 ) {
            var sign = Math.sign(delta);
            self.events.trigger("change", sign * change, event);
            delta = delta % self.threshold;
            zoomed = true;
        }
    };

    var end = function() {
        timer = null;
        if ( !zoomed ) {
            self.events.trigger("change", Math.sign(delta), lastEvent);
        }
        lastEvent = null;
        delta = 0;
        zoomed = false;
    };

    init();
    return self;

};
