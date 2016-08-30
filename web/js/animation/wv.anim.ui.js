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
    self.fullLoaded = false;
    self.loadedLength = 0;
    self.paused = false;
    self.doAnimation = false;
    self.initDate = undefined;
    self.endDate = undefined;
    self.events = wv.util.events();
    self.animateArray= [];

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
        var startDate;
        var fps;

        state = animModel.rangeState;
        endDate = new Date(state.endDate);
        startDate  = new Date(state.startDate);
        fps = 1000 / state.speed;
        self.preload(startDate, endDate, fps);

    };
    self.preload = function(dateBeingProcessed, endDate, fps) {
        var dateArray = [];
        self.playing = false;
        var chunkedArray= [];
        var i = 1;
        var date;
        var queueLength = 5;
        self.loadedLength = queueLength;
        if(!self.fullLoaded) {
            /*
             * a callback function that
             * triggers the animation to play
             *
             * @function tileLoaded
             *
             */
            var tileLoaded = function() {
                var len;
                if(chunkedArray[i]) {
                    len = chunkedArray[i].length;
                    ui.map.preloadArrayOfDates(chunkedArray[i], tileLoaded);
                    self.loadedLength = self.loadedLength + len;
                    
                    if(i == chunkedArray.length - 1) {
                        self.fullLoaded = true;
                        self.animateArray = dateArray;
                    }
                    i++;
                }
                if(!self.playing) {
                    self.playing = true;
                    self.playDateArray(dateArray, fps);
                }
            }
            while(dateBeingProcessed <= endDate) {
                dateBeingProcessed = wv.util.dateAdd(dateBeingProcessed, 'day', 1);
                date = new Date(dateBeingProcessed);
                dateArray.push(date);
            }
        
            chunkedArray = _.chunk(dateArray, queueLength);
            ui.map.preloadArrayOfDates(chunkedArray[0], tileLoaded);
        } else {
            self.playDateArray(self.animateArray, fps);
        }
        
    }
    self.checkShouldLoop = function(arra) {
        var fps = 1000 / animModel.rangeState.speed;
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
                self.checkShouldLoop(arra);
                return
            } else if(!animModel.rangeState.playing || i >= self.loadedLength) {
                clearInterval(interval);
                self.playing = false;
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