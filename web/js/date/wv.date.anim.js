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

     //Given the raw string, parse state.a into an object
     self.parse = function(state, errors, config) {
         if(!_.isUndefined(state.a)) {
             var str = state.a, astate = {attributes: []};

             //Get text before (
             var on = str.match(/[^\(,]+/)[0];
             if (on !== 'on') { //don't do anything if wrong format
                 state.a = undefined;
                 return;
             }

             //remove (, get key value pairs
             str = str.match(/\(.*\)/)[0].replace(/[\(\)]/g, "");
             var kvps = str.split(",");
             _.each(kvps, function (kvp) {
                 var parts = kvp.split("=");
                 astate.attributes.push({id: parts[0], value: parts[1]});
             });

             state.a = astate;
         }
     };

     //state.a is now an object, check input and set values
     self.load = function(state, errors) {
         if ( !_.isUndefined(state.a) ) {
             self.doAnimation = true; //set to false if something is wrong

             var attributes = state.a.attributes;
             attributes.forEach(function(attr) { //handle all input here
                 if(attr.id === 'speed') {
                     try {
                         self.delay = parseFloat(1000 / attr.value);
                         if (self.delay > 1000)
                             self.delay = 1000;
                         else if (self.delay < 33)
                             self.delay = 33;
                     } catch (e) {
                         errors.push({message: "Invalid speed: " + e});
                         self.doAnimation = false;
                     }
                 }
                 else if(attr.id === 'loop')
                     self.loop = attr.value === 'true';
                 else if(attr.id === 'interval') {
                     self.interval = attr.value;
                     if(self.interval !== 'day' && self.interval !== 'month' && self.interval !== 'year')
                         self.interval = 'day';
                 }
                 else if(attr.id === 'start') {
                     try {
                         self.initDate = wv.util.parseDateUTC(attr.value);
                     } catch (e) {
                         errors.push({message: e});
                         self.doAnimation = false;
                     }
                 }
                 else if(attr.id === 'end') {
                     try {
                         self.endDate = wv.util.parseDateUTC(attr.value);
                     } catch (e) {
                         errors.push({message: e});
                         self.doAnimation = false;
                     }
                 }
             });

             //Check if dates have been set, otherwise no animation
             if(self.initDate === undefined || self.endDate === undefined)
                 self.doAnimation = false;

             if(self.doAnimation) {
                 //Prepare and start animation. Set UI elements
                 $("#dialog").dialog("open");

                 //HACK: Weird functionality with Date objects mean to show the right date, need to offset it by one
                 var tempFrom = new Date(self.initDate), tempTo = new Date(self.endDate);
                 tempFrom.setUTCDate(tempFrom.getUTCDate() + 1);
                 tempTo.setUTCDate(tempTo.getUTCDate() + 1);
                 ui.timeline.input.fromDate = _.clone(self.initDate);
                 ui.timeline.input.toDate = _.clone(self.endDate);

                 //update date picker widgets and sliders
                 if(self.interval === 'month') {
                     $("#wv-month").attr("checked", "true");
                     ui.timeline.config.zoom(2); //zoom out to see pickers
                 }
                 else if(self.interval === 'year') {
                     $("#wv-year").attr("checked", "true");
                     ui.timeline.config.zoom(2);
                 }

                 $("#wv-speed-slider").val((1000 / self.delay).toFixed()); //val is the nouislider setter
                 $("#loopcheck").attr("checked", self.loop);
                 $("#from").datepicker("setDate", tempFrom);
                 $("#to").datepicker("setDate", tempTo);
                 d3.select("#fromPick").attr("transform", ui.timeline.pick.updateAnimPickers(self.initDate));
                 d3.select("#toPick").attr("transform", ui.timeline.pick.updateAnimPickers(self.endDate));
                 model.selected = new Date(self.initDate.valueOf());

                 ui.timeline.input.disableDialog();
                 self.setDirectionAndRun(self.endDate.getTime(), self.initDate.getTime());
             }
         }
     };

     //update animation fields, set animation settings into an object
     self.save = function(state) {
         self.loop = document.getElementById("loopcheck").checked;
         self.initDate = $("#from").datepicker("getDate");
         self.endDate = $("#to").datepicker("getDate");

         if($("#dialog").dialog("isOpen")) { //save if animation dialog open not just animating
             state.a = state.a || [];
             var astate = {id: "on"};
             astate.attributes = [];
             astate.attributes.push({id: "speed", value: (1000 /self.delay).toFixed()}, {id: "loop", value: (self.loop) ? "true" : "false"}, {id: "interval", value: self.interval});
             astate.attributes.push({id: "start", value: self.initDate.toISOString().split("T")[0]}, {id: "end", value: self.endDate.toISOString().split("T")[0]});
             state.a.push(astate);
         }
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
             self.loop = self.doAnimation = self.paused = self.active = false;
             if (timer) {
                 clearTimeout(timer);
                 timer = null;
             }
             ui.timeline.input.restoreDialog('reset');
         }
     };

     //Pause button functionality, just pause it
     self.pause = function() {
         if(self.active) {
             notify("pause");
             clearTimeout(timer);
             self.paused = true;
             ui.timeline.input.restoreDialog('pause');
         }
     };

     //Resume button functionality, check date range continue where left off
     self.resume = function() {
         if(self.paused) {
             notify("resume");
             self.paused = false;
             ui.timeline.input.disableDialog();

             //If the date range changed, set the guitarpick to the animation start slider, restart animation
             if(model.selected.getTime() > self.endDate.getTime() || model.selected.getTime() < self.initDate.getTime()) {
                 model.selected = new Date(self.initDate.getTime());
                 self.active = false;
                 self.setDirectionAndRun(self.endDate.getTime(), self.initDate.getTime());
             }
             else
                 prepareFrame();
         }
     };

     //Primary function to set the direction and play animation from dialog or permalink
     self.setDirectionAndRun = function(to, from) {
         self.doAnimation = true;
         if (to > from) { //set it back because animation needs to "animate" to the right date
             if (self.interval === 'year')
                 model.selected.setUTCFullYear(model.selected.getUTCFullYear() - 1);
             else if (self.interval === 'month')
                 model.selected.setUTCMonth(model.selected.getUTCMonth() - 1);
             else
                 model.selected.setUTCDate(model.selected.getUTCDate() - 1);
             model.add(self.interval, 1);
             self.play("forward");
         }
         else {
             if (self.interval === 'year')
                 model.selected.setUTCFullYear(model.selected.getUTCFullYear() + 1);
             else if (self.interval === 'month')
                 model.selected.setUTCMonth(model.selected.getUTCMonth() + 1);
             else
                 model.selected.setUTCDate(model.selected.getUTCDate() + 1);
             model.add(self.interval, -1);
             self.play("reverse");
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

     options.debug = false;
     var notify = (options.debug) ? function(message) { console.log(message); } : function() {};

     init();
     return self;
 };
