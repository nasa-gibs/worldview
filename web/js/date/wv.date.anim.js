/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * Licensed under the NASA Open Source Agreement, Version 1.3
 * http://opensource.gsfc.nasa.gov/nosa.php
 */
 var wv = wv || {};
 wv.date = wv.date || {};
 
 wv.date.anim = wv.date.anim || function(model, ui, options) {
    
     options = options || {};
     var self = {};
     
     self.delay = options.delay || 500;
     self.direction = "forward";
     self.interval = options.interval || "day";
     self.delta = options.delta || 1;
     self.active = false;
     
     var expired = false;
     var loaded  = false;
     var timer;
     
     var init = function() {
     };
     
     self.play = function(direction) {
         if ( self.active && direction !== self.direction ) {
             self.stop();
         } else if ( self.active ) {
             return;
         }
         notify("play");
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
         notify("stop");
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
         notify("prepare", self);
         loaded = false;
         expired = false;
         var amount = ( self.direction === "forward" ) ? 
                 self.delta : -self.delta;
         var newDate = wv.util.dateAdd(model.selected, self.interval, amount);
         ui.preload(newDate, function() {
             notify("loaded");
             loaded = true;
             checkFrame(newDate);
         });
         timer = setTimeout(function() {
             notify("expired");
             expired = true;
             checkFrame(newDate);
         }, self.delay);
     };
     
     var checkFrame = function(newDate) {
         if ( loaded && expired ) {
             notify("advance");
             var updated = model.select(newDate);
             if ( !updated ) {
                 self.stop();
             } else {
                 prepareFrame();
             }
         }
     };
    
     var notify = ( options.debug ) ? console.log : function() {};
     
     init();
     return self;
 };
 
