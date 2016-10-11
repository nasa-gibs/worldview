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
    var preload = {};
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
        models.date.events.on("select", self.dateChange);
        models.palettes.events.on('update', self.refreshState);
        ui.map.events.on('added-layer', self.refreshState);
        //map.on('moveend', self.refreshState);
    };
    self.dateChange = function() {
        if(!self.state.playing) {
            self.refreshState();
        }
    };
    self.refreshState = function() {
        wv.ui.indicator._hide(loader);
        preloadArray = [];
        preload = {};
        pastDates = {};
        inQueue = {};
        self.state = {
            playing: false,
            playIndex: self.getStartDate(),
            supportingCustomLayers: self.hasCustomLayers()
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
        endDate = wv.util.parseDateUTC(state.endDate);
        startDate  = wv.util.parseDateUTC(state.startDate); 
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
    self.nextDate = function(date) {
        return wv.util.dateAdd(date, self.getInterval(), 1);
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
        preload[strDate] = date;
        delete inQueue[strDate]; 
    };
    self.shiftCache = function() {
        var key;
        if(preload[preloadArray[0]] &&
           wv.util.objectLength(preload) >= queueLength  &&
           pastDates[preloadArray[0]]) {
            key = preloadArray.shift();
            delete preload[key];
            delete pastDates[key];
        }
    };
    self.clearCache = function() {
        preload = {};
        preloadArray = [];
    };
    self.checkQueue = function(bufferLength, index) {
        var date;
        var currentDate;
        var startDate = wv.util.parseDateUTC(animModel.rangeState.startDate);
        var endDate = wv.util.parseDateUTC(animModel.rangeState.endDate);
        var loop = animModel.rangeState.loop;
        var lastToQueue;
        var nextDate;
        if(!animModel.rangeState.playing) {
            return self.refreshState();
        }
        currentDate = wv.util.parseDateUTC(index);
        lastToQueue = self.getLastBufferDateStr(currentDate, startDate, endDate);

        if(!preloadArray[0] && !inQueue[index]) {
            self.initialPreload(currentDate, startDate, endDate, lastToQueue);
        } else if (!preload[lastToQueue] && !inQueue[lastToQueue] && !self.state.supportingCustomLayers) {// if last preload date doesn't exist
            self.addItemToQueue(currentDate, startDate, endDate);
        } else if(self.state.supportingCustomLayers && preloadArray[0]) {
            self.customQueuer(currentDate, startDate, endDate);
        }

    };
    self.hasCustomLayers = function() {
        var layer;
        var layers = models.layers.get();

        for(var i = 0, len = layers; i < layers.length; i++) {
            layer = layers[i];
            if(!_.isEmpty(models.palettes.isActive(layer.id)) && layer.visible) {
                return true;
            }
        }
        return false;
    };
    self.customQueuer = function(currentDate, startDate, endDate) {
        var nextDateStr;
        var nextDate = self.nextDate(currentDate);
        if(nextDate > endDate) {
            nextDate = self.setNewDate(nextDate, startDate);
        }

        nextDateStr = wv.util.toISOStringDate(nextDate);

        if(!preload[nextDateStr] && !inQueue[nextDateStr] && !self.state.playing) {
            self.clearCache();
            self.checkQueue(queueLength, self.state.playIndex);
        }
    };
    self.initialPreload = function(currentDate, startDate, endDate, lastToQueue) {
        var day = currentDate;
        for(var i = 0; i < queueLength; i++ ) {
            self.addDate(day);
            day = self.getNextBufferDate(day, startDate, endDate);
            if(wv.util.toISOStringDate(day) === lastToQueue) {
                self.addDate(day);
                loader = wv.ui.indicator.loading();
                return 
            } else if(wv.util.toISOStringDate(day) === wv.util.toISOStringDate(currentDate)) {
                queueLength = i;
                loader = wv.ui.indicator.loading();
                return;
            }
        }
        loader = wv.ui.indicator.loading();
    };
    self.addItemToQueue = function(currentDate, startDate, endDate) {
        var nextDate = self.getNextBufferDate(currentDate, startDate, endDate);
        var nextDateStr = wv.util.toISOStringDate(nextDate);

        if(!inQueue[nextDateStr] &&
           preloadArray.length <= queueLength &&
           !preload[nextDateStr] &&
           nextDate <= endDate &&
           nextDate >= startDate) {
            self.addDate(nextDate);
            self.checkQueue(queueLength, self.state.playIndex);
        }
    };
    self.getNextBufferDate = function(currentDate, startDate, endDate) {
        var lastInBuffer = wv.util.parseDateUTC(preloadArray[preloadArray.length - 1]);
        var nextDate = self.nextDate(lastInBuffer);
        if(lastInBuffer >= endDate || self.nextDate(lastInBuffer) > endDate) {
            return self.setNewDate(nextDate, startDate);
        }
        return self.nextDate(lastInBuffer);
    };
    self.getLastBufferDateStr = function(currentDate, startDate, endDate) {
        var day = currentDate;
        var loop = animModel.rangeState.loop;
        var i = 1; 
        while(i < queueLength) {
            if(self.nextDate(day) > endDate) {
                if(!loop) {
                    return wv.util.toISOStringDate(day);
                }
                day = self.setNewDate(day, startDate);

            } else {
                day = self.nextDate(day);
            }
            i++;
        }
        return wv.util.toISOStringDate(day);
    };
    self.checkShouldLoop = function(playIndexJSDate) {
        if(animModel.rangeState.loop) {
            self.shiftCache();
            self.state.playIndex = wv.util.toISOStringDate(self.setNewDate(playIndexJSDate, new Date(animModel.rangeState.startDate)));
            self.checkShouldPlay();
            self.checkQueue(queueLength,self.state.playIndex);
        } else {
            self.refreshState();
        }
    };
    self.checkShouldPlay = function() {
        var currentDate = wv.util.parseDateUTC(self.state.playIndex);
        var fps = 1000 / animModel.rangeState.speed;
        var endDate = wv.util.parseDateUTC(animModel.rangeState.endDate);
        var startDate = wv.util.parseDateUTC(animModel.rangeState.startDate);
        if(self.state.playing || !animModel.rangeState.playing) {
            return false;
        }

        if(preload[self.getLastBufferDateStr(currentDate, startDate, endDate)]) {
            self.play(self.state.playIndex);
            return;
        }
        if(self.state.supportingCustomLayers &&
           preload[self.state.playIndex] &&
           _.isEmpty(inQueue)) {
            self.play(self.state.playIndex);
            return;
        }
        self.shiftCache();
    };
    self.play = function(index) {
        self.state.playing = true;
        wv.ui.indicator._hide(loader);
        self.animate(index);
        return;
    };
    self.setNewDate = function(date, newDate) {
        var interval = self.getInterval();
        var day = date.getDate() + 1;
        var newDateDay = newDate.getDate();
        var month = date.getMonth();
        if(day < newDateDay) {
            newDate = self.nextDate(newDate);
        }
        if(interval === 'month') {
            return new Date(newDate.setUTCDate(day));
        } else if(interval === 'year') {
            newDate.setUTCDate(month);
            return new Date(newDate.setUTCDate(day ));
        } else {
            return newDate;
        }
    };
    self.animate = function(index) {
        var interval;
        var playIndex = index;
        var playIndexJSDate;
        var endDate = wv.util.parseDateUTC(animModel.rangeState.endDate);
        var player = function() {
            self.shiftCache();
            self.checkQueue(queueLength, playIndex);

            dateModel.select(wv.util.parseDateUTC(playIndex));
            pastDates[playIndex] = wv.util.parseDateUTC(playIndex); // played record
            self.state.playIndex = playIndex;
            playIndex = wv.util.toISOStringDate(self.nextDate(new Date(playIndex)));
            playIndexJSDate = new Date(playIndex);
            if(playIndexJSDate > endDate) {
                clearInterval(interval);
                self.state.playing = false;
                self.checkShouldLoop(playIndexJSDate);
                return;
            }
            if(!animModel.rangeState.playing || !preload[playIndex]) {
                clearInterval(interval);
                self.state.playing = false;
                if(!preload[playIndex] && animModel.rangeState.playing) {// Still playing, add loader
                    loader = wv.ui.indicator.loading();
                    self.shiftCache();
                    self.checkQueue(queueLength, self.state.playIndex);
                } else {
                    self.refreshState();
                }
                return;
            }

            self.checkQueue(queueLength, self.state.playIndex);
            interval = setTimeout(player, 1000 / animModel.rangeState.speed);
        };
        interval = setTimeout(player, animModel.rangeState.speed);
    };
    self.init();
    return self;
};