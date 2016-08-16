 /*
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * Licensed under the NASA Open Source Agreement, Version 1.3
 * http://opensource.gsfc.nasa.gov/nosa.php
 */
var wv = wv || {};
wv.anim = wv.anim || {};
wv.anim.ui = wv.anim.ui || function(model, ui) { 
    var self = {};
    self.delay =  500;
    self.direction = "forward";
    self.interval = "day";
    self.delta = 1;
    self.active = false;
    self.loop = false;
    self.paused = false;
    self.doAnimation = false;
    self.initDate = undefined;
    self.endDate = undefined;
    self.events = wv.util.events();
    var timer;

    self.play = function(direction) {
       if ( self.active && direction !== self.direction ) {
           self.stop();
       } else if ( self.active ) {
           return;
       }
       self.direction = direction || self.direction;
       self.active = true;
       prepareFrame();
    };

    self.forward = function() {
       self.play("forward");
    };

    self.reverse = function() {
       self.play("reverse");
    };

    self.stop = function() {
       if ( timer ) {
           clearTimeout(timer);
           timer = null;
       }
       self.active = false;
    };

    var prepareFrame = function() {
       if ( !self.active ) {
           return;
       }
       var amount = ( self.direction === "forward" ) ?
               self.delta : -self.delta;
       var newDate = wv.util.dateAdd(model.selected, self.interval, amount);
       ui.preload(newDate);
       timer = setTimeout(function() {
           advance(newDate);
       }, self.delay);
    };

    var advance = function(newDate) {
       var updated = model.select(newDate);
       if ( !updated ) {
           self.stop();
       } else {
           prepareFrame();
       }
    };
    return self;
}