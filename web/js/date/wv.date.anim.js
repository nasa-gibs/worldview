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
 var days = 0; //keep track of how many days to animate
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
         var amount = ( self.direction === "forward" ) ?
                 self.delta : -self.delta;
         var newDate = wv.util.dateAdd(model.selected, self.interval, amount);
         ui.preload(newDate);
         timer = setTimeout(function() { //this function is called once after 500 ms
             advance(newDate);
         }, self.delay);
		 days++;
     };

     var advance = function(newDate) {
         notify("advance");
         var updated = model.select(newDate);
         if ( !updated || days >= 4 ) { //do this 5 times
			 days = 0;
             self.stop();
         } else {
             prepareFrame();
         }
     };

     var notify = ( options.debug ) ? console.log : function() {};

     init();
     return self;
 };
