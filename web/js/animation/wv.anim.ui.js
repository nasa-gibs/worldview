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
    var queueLength = 5;
    var animateArray;
    var map = ui.map.selected;
    var zooms = ['year', 'month', 'day'];
    self.delay =  500;
    self.direction = "forward";
    self.interval = "day";
    self.delta = 1;
    self.active = false;
    self.events = wv.util.events();
    self.state = {
        loadedLength: 0,
        fullyLoaded: false,
        playing: false,
        playIndex: 0
    };



    self.init = function() {
        animModel.events.on('play', self.onPushedPlay);
        animModel.events.on('datechange', self.refreshState);
        map.getView().on('moveend', self.refreshState);
    };
    self.refreshState = function() {
        self.state = {
            loadedLength: 0,
            fullyLoaded: false,
            playing: false,
            playIndex: 0
        };
    };
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
    self.getInterval = function() {
      return zooms[ui.timeline.config.currentZoom - 1];
    };
    //Determine interval for updating date
    self.returnNumberInterval = function() {
        var interval = self.getInterval();
        if (interval === 'month')
            return 30;
        else if (interval === 'year')
            return 365;
        else
            return 1;
    };
    self.preload = function(dateBeingProcessed, endDate, fps) {
        var dateArray = [];
        var chunkedArray= [];
        var i = 1;
        var date;
        var thisState = self.state;
        var timeline = ui.timeline;

        if(!thisState.fullyLoaded) {
          animateArray = [];
            /*
             * a callback function that
             * triggers the animation to play
             *
             * @function tileLoaded
             *
             */
            var tileLoaded = function() {
                var len;
                if(i == 1) {
                  thisState.loadedLength = queueLength;
                }
                if(chunkedArray[i]) {
                    len = chunkedArray[i].length;
                    ui.map.preloadArrayOfDates(chunkedArray[i], tileLoaded);
                    thisState.loadedLength = thisState.loadedLength + len;                    
                    if(i === chunkedArray.length - 1) {
                        self.state.fullyLoaded = true;
                        animateArray = dateArray;
                    }
                    i++;
                }
                if(!thisState.playing) {
                    thisState.playing = true;
                    setTimeout(function() {
                        self.playDateArray(dateArray, fps);
                    }, 300);
                }
            };
            while(dateBeingProcessed <= endDate) {
                dateBeingProcessed = wv.util.dateAdd(dateBeingProcessed, zooms[timeline.config.currentZoom - 1], 1);
                date = new Date(dateBeingProcessed);
                dateArray.push(date);
            }
            chunkedArray = _.chunk(dateArray, queueLength);
            ui.map.preloadArrayOfDates(chunkedArray[0], tileLoaded);
        } else {
            self.playDateArray(animateArray, fps);
        }
        
    };
    self.checkShouldLoop = function(arra) {
        var fps = 1000 / animModel.rangeState.speed;
        if(animModel.rangeState.loop) {
            self.playDateArray(arra, fps);
        } else {
            animModel.rangeState.playing = false;
            animModel.events.trigger('change');
        }
    };
    self.playDateArray = function(arra, fps) {
        var interval;
        var len = arra.length;
        var i = 0;
        var thisState = self.state;
        var playIndex = self.state.playIndex;
        
        if(playIndex) {
          i = playIndex;
          playIndex = null;
        }
        interval = setInterval(function() {
            if(i >= len) {
                clearInterval(interval);
                thisState.playIndex = null;
                self.checkShouldLoop(arra);
                return;
            } else if(!animModel.rangeState.playing || i >= thisState.loadedLength) {
                clearInterval(interval);
                thisState.playing = false;
                thisState. playIndex = i;
                return;
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
};