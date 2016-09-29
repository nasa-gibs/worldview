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
    self.events = wv.util.events();
    var dateModel = models.date;
    var animModel = models.anim;
    var queueLength = 10;
    var animateArray;
    var map = ui.map.selected;
    var zooms = ['year', 'month', 'day'];
    var queue = new Queue(5, Infinity);
    var preload = new Cache(100);
    var preloadArray;
    var inQueue;
    var pastDates;
    var loader;

    self.init = function() {
        self.refreshState();
        animModel.events.on('play', self.onPushedPlay);
        animModel.events.on('gif-click', self.refreshState);
        animModel.events.on('datechange', self.refreshState);
        animModel.events.on('zoom-change', self.refreshState);
        models.proj.events.on("select", self.refreshState);
        models.layers.events.on('change', self.refreshState);
        models.date.events.on("select", self.dateChange);
        map.on('moveend', self.refreshState);
    };
    self.dateChange = function() {
        if(!self.state.playing) {
            self.refreshState();
        }
    };
    self.refreshState = function() {
        wv.ui.indicator._hide();
        preloadArray = [];
        preload.clear();
        pastDates = {};
        inQueue = {};
        self.state = {
            playing: false,
            playIndex: self.getStartDate()
        };
        animModel.rangeState.playing = false;
        animModel.events.trigger('change');
    };
    self.getStartDate = function() {
        var state;
        var endDate;
        var startDate;
        var currentDate;
        state = animModel.rangeState;
        endDate = new Date(state.endDate);
        startDate  = new Date(state.startDate); 
        currentDate = dateModel.selected;
        if(currentDate > startDate && self.nextDate(currentDate) < endDate) {
            return wv.util.toISOStringDate(self.nextDate(currentDate));
        }
        return wv.util.toISOStringDate(startDate);

    };
    self.onPushedPlay = function() {
        self.checkQueue(queueLength, self.state.playIndex);
        self.checkShouldPlay();
    };
    self.getInterval = function() {
        return zooms[ui.timeline.config.currentZoom - 1];
    };
    self.getDateArray = function(dateBeingProcessed, endDate) {
        var arra = [];

        while(dateBeingProcessed <= endDate) {
            dateBeingProcessed = wv.util.dateAdd(dateBeingProcessed, self.getInterval(), 1);
            date = new Date(dateBeingProcessed);
            arra.push(date);
        }
        return arra;
    };
    self.nextDate = function(date) {
        return new Date(wv.util.dateAdd(date, self.getInterval(), 1));
    };
    self.addDate = function(date) {
        self.addToInQueue(date);
        queue.add(function () {
            return ui.map.promiseDay(date);
        })
        .then(function(date) {
            self.addDateToCache(date);
            self.shiftCache();
            self.checkQueue(queueLength, self.state.playIndex);
            self.checkShouldPlay();
        });
    };
    self.addToInQueue = function(date) {
        var strDate = wv.util.toISOStringDate(date);
        inQueue[strDate] = date;
        preloadArray.push(strDate);
    };
    self.addDateToCache = function(date) {
        var strDate = wv.util.toISOStringDate(date);
        preload.setItem(strDate, date);
        delete inQueue[strDate]; 
    };
    self.shiftCache = function() {
        var key;
        if(preload.getItem(preloadArray[0]) &&
           preload.size() >= queueLength  &&
           pastDates[preloadArray[0]]) {
            key = preloadArray.shift();
            preload.removeItem(key);
            delete pastDates[key];
        }
    };
    self.checkQueue = function(bufferLength, index) {
        var date;
        var currentDate;
        var startDate = new Date(animModel.rangeState.startDate);
        var endDate = new Date(animModel.rangeState.endDate);
        var lastToQueue;
        var nextDate;
        var nextDateStr;
        var pending;
        var waiting;
        var processing;
        
        pending = queue.getQueueLength();
        waiting = queue.getPendingLength();
        processing = pending + waiting;
        if(!animModel.rangeState.playing) {
            return self.refreshState;
        }
        currentDate = new Date(index);
        lastToQueue = self.getLastBufferDateStr(new Date(currentDate), startDate, endDate);
        if(!preloadArray[0] && !inQueue[index]) {
            while(currentDate <= new Date(lastToQueue)) {
                self.addDate(currentDate);
                currentDate = self.nextDate(currentDate);
            }
            wv.ui.indicator.loading();

        } else if (!preload[lastToQueue] &&
                   !inQueue[lastToQueue] ) {// if last preload date doesn't exist
              nextDate = self.getNextBufferDate(currentDate, startDate, endDate);
              nextDateStr = wv.util.toISOStringDate(nextDate);
              if(!inQueue[nextDateStr] &&
                 preloadArray.length < bufferLength &&
                 !preload.getItem(nextDateStr) &&
                 nextDate <= endDate &&
                 nextDate >= startDate) {
                  self.addDate(nextDate);
            }
        }
    };
    self.getNextBufferDate = function(currentDate, startDate, endDate) {
        var lastInBuffer = new Date(preloadArray[preloadArray.length - 1]);
        var nextDate = self.nextDate(lastInBuffer);
        if(lastInBuffer >= endDate || self.nextDate(lastInBuffer) > endDate) {
            return startDate;
        }
        return self.nextDate(lastInBuffer);
    };
    self.getLastBufferDateStr = function(currentDate, startDate, endDate) {
        var day = currentDate;
        var loop = animModel.rangeState.loop;
        var i = 1; 
        while(i < queueLength) {
            if(day > endDate) {
                if(!loop) {
                    return wv.util.toISOStringDate(wv.util.dateAdd(day, self.getInterval(), -1));
                }
                day = startDate;
            } else {
                day = self.nextDate(day);
            }
            i++;
        }
        return wv.util.toISOStringDate(day);
    };
    self.checkShouldLoop = function() {
        if(animModel.rangeState.loop) {
            setTimeout( function() {
                self.shiftCache();
                self.checkShouldPlay();
                self.checkQueue(queueLength,self.state.playIndex);
            }, 1000 / animModel.rangeState.speed);
        } else {
            self.refreshState();
            animModel.events.trigger('change');
        }
    };
    self.checkShouldPlay = function() {
        var currentDate = new Date(self.state.playIndex);
        var fps = 1000 / animModel.rangeState.speed;
        var endDate = new Date(animModel.rangeState.endDate);
        var startDate = new Date(animModel.rangeState.startDate);
        if(self.state.playing || !animModel.rangeState.playing) {
            return false;
        }
        if(preload.getItem(self.getLastBufferDateStr(currentDate, startDate, endDate))) {
            self.state.playing = true;
            wv.ui.indicator._hide();
            return self.playDateArray(self.state.playIndex);
        }
        self.shiftCache();
        self.checkQueue(queueLength,self.state.playIndex);
    };
    self.playDateArray = function(index) {
        var interval;
        var playIndex = index;
        var endDate = new Date(animModel.rangeState.endDate);
        var player = function() {
            self.shiftCache();
            self.checkQueue(queueLength, playIndex);
           if(!animModel.rangeState.playing || !preload.getItem(playIndex)) {
                clearInterval(interval);
                self.state.playing = false;
                self.state.playIndex = playIndex;
                if(!preload.getItem(playIndex) && animModel.rangeState.playing) { // Still playing, add loader
                    wv.ui.indicator.loading();
                }
                return;
            }
            dateModel.select(new Date(playIndex));
            pastDates[playIndex] = new Date(playIndex); // played record
            self.state.playIndex = playIndex;
            playIndex = wv.util.toISOStringDate(self.nextDate(new Date(playIndex)));
            if(new Date(playIndex) > endDate) {
                clearInterval(interval);
                self.state.playIndex = animModel.rangeState.startDate;
                self.state.playing = false;
                self.checkShouldLoop();
                return;
            }
            interval = setTimeout(player, 1000 / animModel.rangeState.speed);
        };
        interval = setTimeout(player, animModel.rangeState.speed);
    };
    self.init();
    return self;
};