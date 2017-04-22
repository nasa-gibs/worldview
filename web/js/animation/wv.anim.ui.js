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
    var queueLength;
    var animateArray;
    var map = ui.map.selected;
    var zooms = ['year', 'month', 'day'];
    var queue = new Queue(5, Infinity);
    var preload = {};
    var preloadArray;
    var inQueue;
    var pastDates;
    var loader;

    /*
     * sets listeners
     *
     * 
     * @method init
     * @static
     *
     * @returns {void}
     *
     */
    self.init = function() {
        self.refreshState();
        animModel.events.on('play', self.onPushedPlay);
        animModel.events.on('gif-click', self.refreshState);
        animModel.events.on('datechange', self.refreshState);
        animModel.events.on('toggle-widget', self.refreshState);
        if(models.proj) {
            models.proj.events.on("select", self.refreshState);
        }
        if(models.palettes) {
            models.palettes.events.on('update', self.refreshState);
        }
        if(models.data) {
            models.data.events.on('activate', self.refreshState);
            models.date.events.on('zoom-change', self.refreshState);
            models.date.events.on("select", self.dateChange);
        }
        if(ui.map) {
            ui.map.events.on('added-layer', self.refreshState);
        }
        //map.on('moveend', self.refreshState);
    };

    /*
     * If there is a change of date
     * and the animiation is not playing
     * the amin.ui states will be refreshed
     * 
     * @method dateChange
     * @static
     *
     * @returns {void}
     *
     */
    self.dateChange = function() {
        if(!self.state.playing) {
            self.refreshState();
        }
    };

    /*
     * Resets amin.ui object
     * and variable states
     *
     * @method refreshState
     * @static
     *
     * @returns {void}
     *
     */

    self.refreshState = function() {
        preloadArray = [];
        preload = {};
        pastDates = {};
        inQueue = {};
        queueLength = 10;
        self.state = {
            playing: false,
            playIndex: self.getStartDate(),
            supportingCustomLayers: self.hasCustomLayers()
        };
        animModel.rangeState.playing = false;
        animModel.events.trigger('change');
        wv.ui.indicator.hide(loader);
        wv.ui.indicator._hide(loader);
    };
    /*
     * Determines whether to start at
     * current date or to start at the 
     * selected start date
     *
     * @method getStartDate
     * @static
     *
     * @returns {string} ISO string Date
     *
     */

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

    /*
     * Handles a play click event 
     *
     * @method onPushedPlay
     * @static
     *
     * @returns {void}
     *
     */
    self.onPushedPlay = function() {
        self.checkQueue(queueLength, self.state.playIndex);
        self.checkShouldPlay();
    };

    /*
     * retrieves the current timeline zoom
     *
     * @method getInterval
     * @static
     *
     * @returns {string} Zoom increment
     *
     */
    self.getInterval = function() {
        return zooms[ui.timeline.config.currentZoom - 1];
    };

    /*
     * Gets next date based on current
     * increments
     *
     * @method nextDate
     * @static
     *
     * @param date {object} JS date obj
     *
     * @returns {object} JS Date
     *
     */
    self.nextDate = function(date) {
        return wv.util.dateAdd(date, self.getInterval(), 1);
    };

    /*
     * Gets next date based on current
     * increments
     *
     * @method nextDate
     * @static
     *
     * @param date {object} JS date obj
     *
     * @returns {object} JS Date
     *
     */
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

    /*
     * Add date to loading Queue
     * obj
     *
     * @method addToInQueue
     * @static
     *
     * @param date {object} JS date obj
     *
     * @returns {void}
     *
     */
    self.addToInQueue = function(date) {
        var strDate = wv.util.toISOStringDate(date);
        inQueue[strDate] = date;
        preloadArray.push(strDate);
    };

    /*
     * removes date from inQueue obj
     * and adds it to the preloaded
     * obj
     *
     * @method addDateToCache
     * @static
     *
     * @param date {object} JS date obj
     *
     * @returns {void}
     *
     */
    self.addDateToCache = function(date) {
        var strDate = wv.util.toISOStringDate(date);
        preload[strDate] = date;
        delete inQueue[strDate]; 
    };

    /*
     * removes item from cache after it has 
     * been played and quelimit reached
     *
     *
     * @method shiftCache
     * @static
     *
     * @returns {void}
     *
     */
    self.shiftCache = function() {
        var key;
        if(preload[preloadArray[0]] &&
           wv.util.objectLength(preload) > queueLength + (queueLength / 2) + 1 &&
           pastDates[preloadArray[0]] &&
           !self.isInToPlayGroup(preloadArray[0])) {
            key = preloadArray.shift();
            delete preload[key];
            delete pastDates[key];
        }
    };

    /*
     * checks if this date is in array of
     * dates that need to play in future
     * within buffer length
     *
     *
     * @method isInToPlayGroup
     * @static
     *
     * @param testDate {string} JS date string
     *
     * @returns {boolean}
     *
     */
    self.isInToPlayGroup = function(testDate) {
        var loop = animModel.rangeState.loop;
        var i = 0;
        var day = new Date(self.state.playIndex);
        var startDate = new Date(animModel.rangeState.startDate);
        var endDate = new Date(animModel.rangeState.endDate);
        var jsTestDate = new Date(testDate);
        while(i < queueLength) {
            if(self.nextDate(day) > endDate) {
                if(!loop) {
                    return false;
                }
                day = self.setNewDate(day, startDate);
            } else {
                day = self.nextDate(day);
            }
            if(day.valueOf() == jsTestDate.valueOf()) {
                return true;
            }
            i++;
        }
        return false;
    };

    /*
     * Clears precache
     *
     * @method clearCache
     * @static
     *
     *
     * @returns {void}
     *
     */
    self.clearCache = function() {
        preload = {};
        preloadArray = [];
    };

    /*
     * Determines what dates should
     * be queued
     *
     * @method checkQueue
     * @static
     *
     * @param bufferLength {number} JS date string
     * @param index {string} Date string
     * @returns {void}
     *
     */
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

    /*
     * Checks to see if custom layers are
     * active
     *
     * @method hasCustomLayers
     * @static
     *
     * @returns {boolean}
     *
     */
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

    /*
     * Custom date queuer created for
     * custom colormaps
     *
     * @method customQueuer
     * @static
     *
     * @param currentDate {object} JS date
     * @param startDate {object} JS date
     * @param endDate {object} JS date
     *
     * @returns {void}
     *
     */
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

    /*
     * adds dates to precache queuer
     *
     * @method initialPreload
     * @static
     *
     * @param currentDate {object} JS date
     * @param startDate {object} JS date
     * @param endDate {object} JS date
     * @param lastToQueue {string} date String
     *
     * @returns {void}
     *
     */
    self.initialPreload = function(currentDate, startDate, endDate, lastToQueue) {
        var day = currentDate;
        queueLength = self.getQueueLength(startDate, endDate);
        if(queueLength <= 1) { // if only one frame will play just move to that date
            dateModel.select(startDate);
            animModel.rangeState.playing = false;
            setTimeout(function() {self.refreshState();}, 100);
            return;
        }
        for(var i = 0; i < queueLength; i++) {
            self.addDate(day);
            day = self.getNextBufferDate(day, startDate, endDate);
            if(wv.util.toISOStringDate(day) === lastToQueue) {
                self.addDate(day);
                loader = wv.ui.indicator.loading();
                return;
            } else if(wv.util.toISOStringDate(day) === wv.util.toISOStringDate(currentDate)) {
                queueLength = i;
                loader = wv.ui.indicator.loading();
                return;
            }
        }
        loader = wv.ui.indicator.loading();
    };

    /*
     * calculates buffer length if
     * date array length is less than
     * default queueLength
     *
     * @method getQueueLength
     * @static
     *
     * @param startDate {object} JS date
     * @param endDate {object} JS date
     *
     * @returns {number} new buffer length
     *
     */
    self.getQueueLength= function(startDate, endDate) {
        var day = startDate;
        var i = 0;
        while(i < queueLength) {
            i++;
            day = self.nextDate(day);
            if(day > endDate){
                return i;
            }
        }
        return i;
    };

    /*
     * Verifies that date is 
     * valid and adds it to queuer
     *
     * @method addItemToQueue
     * @static
     *
     * @param startDate {object} JS date
     * @param endDate {object} JS date
     *
     * @returns {void}
     *
     */
    self.addItemToQueue = function(currentDate, startDate, endDate) {
        var nextDate = self.getNextBufferDate(currentDate, startDate, endDate);
        var nextDateStr = wv.util.toISOStringDate(nextDate);

        if(!inQueue[nextDateStr] &&
           !preload[nextDateStr] &&
           nextDate <= endDate &&
           nextDate >= startDate) {
            self.addDate(nextDate);
            self.checkQueue(queueLength, self.state.playIndex);
        }
    };

    /*
     * gets next date to add to
     * queue
     *
     * @method addItemToQueue
     * @static
     *
     * @param currentDate {object} JS date
     * @param startDate {object} JS date
     * @param endDate {object} JS date
     *
     * @returns {object} JS Date
     *
     */
    self.getNextBufferDate = function(currentDate, startDate, endDate) {
        var lastInBuffer = wv.util.parseDateUTC(preloadArray[preloadArray.length - 1]);
        var nextDate = self.nextDate(lastInBuffer);
        if(lastInBuffer >= endDate || self.nextDate(lastInBuffer) > endDate) {
            return self.setNewDate(nextDate, startDate);
        }
        return self.nextDate(lastInBuffer);
    };

    /*
     * Gets the last date that should be added
     * to the queuer
     *
     * @method getLastBufferDateStr
     * @static
     *
     * @param currentDate {object} JS date
     * @param startDate {object} JS date
     * @param endDate {object} JS date
     *
     * @returns {string} Date string
     *
     */
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

    /*
     * Gets the last date that should be added
     * to the queuer
     *
     * @method checkShouldLoop
     * @static
     *
     * @param playIndexJSDate {object} JS date
     *  that is currently being shown
     *
     * @returns {void}
     *
     */
    self.checkShouldLoop = function(playIndexJSDate) {
        if(animModel.rangeState.loop) {
            self.shiftCache();
            self.state.playIndex = wv.util.toISOStringDate(self.setNewDate(playIndexJSDate, new Date(animModel.rangeState.startDate)));
            setTimeout( function() {
                self.checkShouldPlay();
                self.checkQueue(queueLength,self.state.playIndex);
            }, 1000);
        } else {
            self.refreshState();
        }
    };

    /*
     * Gets the last date that should be added
     * to the queuer
     *
     * @method checkShouldLoop
     * @static
     *
     * @param playIndexJSDate {object} JS date
     *  that is currently being shown
     *
     * @returns {void}
     *
     */
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

    /*
     * removes loader and starts the
     * animation
     *
     * @method play
     * @static
     *
     * @param index {string} date string
     *
     * @returns {void}
     *
     */
    self.play = function(index) {
        self.state.playing = true;
        wv.ui.indicator.hide(loader);
        wv.ui.indicator._hide(loader);
        self.animate(index);
        return;
    };

    /*
     * Gets date to start on when animation
     * is being looped
     *
     * @method setNewDate
     * @static
     *
     * @param date {number} JS Date
     * @param newDate {number} JS Date
     *
     * @returns {void}
     *
     */
    self.setNewDate = function(date, newDate) {
        return newDate;
    };

    /*
     * function that loops through frames
     * at a specified time interval
     *
     * @method animate
     * @static
     *
     * @param index {string} Date string
     * @returns {void}
     *
     */
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