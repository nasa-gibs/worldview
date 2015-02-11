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

wv.ui.mouse.wheel = wv.ui.mouse.wheel || function(element, ui, options) {
    options = options || {};

    var self = {};
    self.timeout = options.timeout || 100; // millseconds
    self.threshold = options.threshold || 100; // delta units
    self.events = wv.util.events();

    var delta = 0;
    var zoomed = false;
    var timer = null;
    var timeout = false;
    var lastEvent = null;

    var init = function() {
        element.on("zoom", wheel);
    };

    self.change = function(listener) {
        self.events.on("change", listener);
        return self;
    };

    var wheel = function() {
        var evt = d3.event.sourceEvent;
        if((Math.abs(evt.deltaX) <= Math.abs(evt.deltaY)) && timeout===false){
            console.log('zoom with mousewheel');
            lastEvent = evt;
            delta += evt.deltaY;
            if ( !timer ) {
                zoomed = false;
            }
            clearTimeout(timer);
            timer = setTimeout(end, self.timeout);
            update(evt);
        }
        else if ((Math.abs(evt.deltaX) >= Math.abs(evt.deltaY))){
            if( ui.timeline.isCropped ){
                console.log('pan with trackpad');
                ui.timeline.pan.axis(d3.event);
                timeout = true;
                clearTimeout(timer);
                timer = setTimeout(function(){
                    timeout = false;
                },500);
            }
        }
        else{
            if ( ui.timeline.isCropped ){
                console.log('pan with mouse');
                ui.timeline.pan.axis();
            }
        }
    };

    var update = function(event) {
        var change = Math.floor(Math.abs(delta) / self.threshold);
        if ( change >= 1 ) {
            var sign = delta?delta<0?-1:1:0;
            self.events.trigger("change", sign * change, event);
            delta = delta % self.threshold;
            zoomed = true;
        }
    };

    var end = function() {
        timer = null;
        if ( !zoomed ) {
            var sign = delta?delta<0?-1:1:0;
            self.events.trigger("change", sign, lastEvent);
        }
        lastEvent = null;
        delta = 0;
        zoomed = false;
    };

    init();
    return self;

};
