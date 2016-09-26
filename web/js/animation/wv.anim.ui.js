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
    var dateModel = models.date;
    var animModel = models.anim;
    var queueLength = 5;
    var animateArray;
    var map = ui.map.selected;
    var zooms = ['year', 'month', 'day'];
    var queue = new Queue(5, queueLength);
    var preloadedArray;
    var dateArray;
    self.events = wv.util.events();

    self.init = function() {
        self.refreshState();
        animModel.events.on('play', self.onPushedPlay);
        animModel.events.on('gif-click', self.refreshState);
        animModel.events.on('datechange', self.refreshState);
        animModel.events.on('zoom-change', self.refreshState);
        models.proj.events.on("select", self.refreshState);
        models.layers.events.on('change', self.refreshState);
        map.on('moveend', self.refreshState);
    };
    self.refreshState = function() {
        preloadedArray = [];
        dateArray = [];
        self.state = {
            loadedLength: 0,
            fullyLoaded: false,
            playing: false,
            playIndex: 0
        };
        animModel.rangeState.playing = false;
        animModel.events.trigger('change');
    };
    self.onPushedPlay = function() {
        var state;
        var endDate;
        var startDate;

        state = animModel.rangeState;
        endDate = new Date(state.endDate);
        startDate  = new Date(state.startDate);

        if(!dateArray[0]) {
            dateArray = self.getDateArray(startDate, endDate);
        }
        self.checkShouldPlay();
        self.checkQueue(queueLength, self.state.playIndex);

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
    self.addDate = function(date) {
        queue.add(function () {
            return ui.map.promiseDay(date);
        })
        .then(function() {
            preloadedArray.push(' ');
            self.checkQueue(queueLength, self.state.playIndex);
            self.checkShouldPlay();
        });
    };
    self.checkQueue = function(bufferLength,  index) {
        var alreadyLoaded;
        var inQueue;
        var loading;
        var totalQueuedOrInQueue;
        var i;

        alreadyLoaded = preloadedArray.length;
        inQueue = queue.getQueueLength(); // added to queue but hasn't been requested
        loading = queue.getPendingLength(); // currently loading
        totalQueuedOrInQueue = alreadyLoaded + inQueue + loading;

        if(totalQueuedOrInQueue === 0) {
            i = 0;
            while(i < bufferLength) {
                if(!dateArray[i]) {
                    return;
                }
                self.addDate(dateArray[i]);
                i++;
            }
            return;
        }
        if(dateArray[totalQueuedOrInQueue] && totalQueuedOrInQueue < index + bufferLength) {
            i = totalQueuedOrInQueue;
            while(i < index + bufferLength) {
                if(!dateArray[i]) {
                    return;
                }
                self.addDate(dateArray[i]);
                i++;
            }
            return;
        }
    };
    self.checkShouldLoop = function(arra) {
        var fps = 1000 / animModel.rangeState.speed;
        if(animModel.rangeState.loop) {
            self.playDateArray(arra, fps);
        } else {
            self.state.playing = false;
            animModel.rangeState.playing = false;
            animModel.events.trigger('change');
        }
    };
    self.checkShouldPlay = function() {
        var dateArraLength = dateArray.length;
        var index = self.state.playIndex;
        var fps = 1000 / animModel.rangeState.speed;
        if(self.state.playing || !animModel.rangeState.playing) {
            return false;
        }
        if(preloadedArray[index + queueLength - 1]) {
            self.state.playing = true;
            return self.playDateArray(dateArray, fps);
        }
        if(index !== dateArraLength && preloadedArray.length === dateArraLength) {
            self.state.playing = true;
            return self.playDateArray(dateArray, fps);
        }
    };
    self.playDateArray = function(arra, fps) {
        var interval;
        var len = arra.length;
        var playIndex = self.state.playIndex;
        var player = function() {
            if(playIndex >= len) {
                // clearInterval(interval);
                self.state.playIndex = 0;
                self.checkShouldLoop(arra);
                return;
            } else if(!animModel.rangeState.playing || playIndex >= preloadedArray.length) {
                clearInterval(interval);
                self.state.playing = false;
                self.state.playIndex = playIndex;
                return;
            }
            dateModel.select(arra[playIndex]);
            self.checkQueue(queueLength, playIndex);
            playIndex++;
            interval = setTimeout(player, 1000 / animModel.rangeState.speed);
        };
        interval = setTimeout(player, fps);
    };
    self.init();
    return self;
};