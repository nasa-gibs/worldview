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
     self.loop = false;
     self.paused = false;
     self.doAnimation = false;
     self.initDate = undefined;
     self.endDate = undefined;
     var timer;

     var init = function() {
     };

     self.load = function(state, errors) {

     };

     self.save = function(state) {

     };

     self.play = function(direction) {
         //Check for loop first
         self.loop = document.getElementById("loopcheck").checked;

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
         if ( self.active ) {
             notify("stop");
             self.delay = 500;
             self.loop = self.doAnimation = self.paused = self.active = false;
             if (timer) {
                 clearTimeout(timer);
                 timer = null;
             }
             ui.timeline.input.restoreDialog();
         }
     };

     //Pause button functionality, just pause it
     self.pause = function() {
         if(self.active) {
             notify("pause");
             clearTimeout(timer);
             self.paused = true;
         }
     };

     //Resume button functionality, just continue where left off
     self.resume = function() {
         if(self.paused) {
             notify("resume");
             self.paused = false;
             prepareFrame();
         }
     };

     var prepareFrame = function() {
         if ( !self.active ) 
             return;
         
         notify("prepare", self);
         var amount = ( self.direction === "forward" ) ?
                 self.delta : -self.delta;
         var newDate = wv.util.dateAdd(model.selected, self.interval, amount);
         ui.map.preload(newDate);

         timer = setTimeout(function() { //this function is called once either after 500 ms or animation delay
             advance(newDate);
         }, self.delay);
     };

     var stopAnimation = function() {
         self.loop = document.getElementById("loopcheck").checked;//check if user has unchecked loop box during animation
         if(self.loop) { //repeat animation by resetting days and calling play. direction is retained
             notify("looping");
             var amount = ( self.direction === "forward" ) ? self.delta : -self.delta; //determine if set date by -1 or +1
             model.selected = new Date(self.initDate.valueOf()); //clone then set correct date

             //The date needs to be set to the previous date that we want to start with to animate from the end to the start
             //In advance(), at the start of a loop, the current date is then set to the start date
             if(self.interval === 'day')
                 model.selected.setUTCDate(model.selected.getUTCDate() - amount);
             else if(self.interval === 'month')
                 model.selected.setUTCMonth(model.selected.getUTCMonth() - amount);
             else
                 model.selected.setUTCFullYear(model.selected.getUTCFullYear() - amount);

             console.log(model.selected);
             console.log(self.initDate);

             self.play(self.direction);
         } else { //stop animation normally
             self.stop();
         }
     };

     var advance = function(newDate) {
         notify("advance");
         var updated = model.select(newDate);

         //determine if animation should stop
         if(self.doAnimation && checkToStop())
             stopAnimation();

         //determine if we can continue
         if(!updated)
            stopAnimation();
         else
            prepareFrame();
     };

     //compare the current and end dates
     var checkToStop = function() {
         var curr = model.selected.valueOf(), to = self.endDate.valueOf();

         var daysLeft = self.delta > 0 ? ((to - curr) / (86400 * 1000)) : ((curr - to) / (86400 * 1000));

         if(self.interval === 'day') //check how many days left, animate if there are enough
             return Math.abs(daysLeft) < (self.delta * 1);
         else if(self.interval === 'month')
             return Math.abs(daysLeft) < (self.delta * 30);
         else
             return Math.abs(daysLeft) < (self.delta * 365);
     };

     options.debug = true;
     var notify = (options.debug) ? function(message) { console.log(message); } : function() {};

     init();
     return self;
 };
