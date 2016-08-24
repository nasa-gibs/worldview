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
wv.anim.ui = wv.anim.ui || function(models, ui) { 
    var self = {};
    var timer;
    var dateModel = models.date;
    var animModel = models.anim;
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

    self.init = function() {
        animModel.events.on('play', self.onPushedPlay);
    }
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
    self.onPushedPlay = function() {
        var state;
        var endDate;
        var dateBeingProcessed;
        var dateArray;
        var fps;

        dateArray = [];
        state = animModel.rangeState;
        endDate = new Date(state.endDate);
        dateBeingProcessed  = new Date(state.startDate);
        fps = 1000 / (state.speed * 60);
        while(dateBeingProcessed <= endDate) {
            dateBeingProcessed = wv.util.dateAdd(dateBeingProcessed, 'day', 1);
            var date = new Date(dateBeingProcessed);
            ui.map.preload(date);
            dateArray.push(date);
        }
        if(dateArray.length > 1) {
            self.playDateArray(dateArray, fps);
        }
    };
    self.checkShouldLoop = function(arra, fps, interval) {
        if(animModel.rangeState.loop) {
            self.playDateArray(arra, fps)
        } else {
            animModel.rangeState.playing = false;
            animModel.events.trigger('change');
        }
    }
    self.playDateArray = function(arra, fps) {
        var interval;
        var len = arra.length;
        var state = animModel.rangeState;
        var i = 0;

        if(state.playIndex) {
          i = state.playIndex;
          state.playIndex = null;
        }
        interval = setInterval(function() {
            if(i >= len) {
                clearInterval(interval);
                self.checkShouldLoop(arra, fps)
                return
            } else if(!animModel.rangeState.playing) {
                clearInterval(interval);
                state.playIndex = i;
                return
            }
            dateModel.select(arra[i]);
            i++;
        }, fps);
    };

    self.reverse = function() {
       self.play("reverse");
    };

    self.stop = function() {
       if (timer) {
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
       var newDate = wv.util.dateAdd(dateModel.selected, self.interval, amount);
       ui.map.preload(newDate);
       timer = setTimeout(function() {
           advance(newDate);
       }, self.delay);
    };

    var advance = function(newDate) {
       var updated = dateModel.select(newDate);
       if ( !updated ) {
           self.stop();
       } else {
           prepareFrame();
       }
    };
    self.init();
    return self;
}