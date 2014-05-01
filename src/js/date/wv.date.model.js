/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * @module wv.date
 */
var wv = wv || {};
wv.date = wv.date || {};

/**
 * Selected day to display on the map.
 *
 * To select a day, call
 * {{#crossLink "wv.date.model/select:method"}}select{{/crossLink}}
 *
 * @class wv.date.model
 * @constructor
 * @param {Date} [spec.initial] initial date. If not specified,
 * UTC today is used.
 */

wv.date.model = wv.date.model || function(spec) {

    spec = spec || {};

    var self = {};

    /**
     * Use this to register listeners for when the date changes.
     *
     * @attribute events
     * @type {wv.util.events}
     */
    self.events = wv.util.events();

    /**
     * Selected day.
     *
     * @attribute selected
     * @type {Date}
     */
    self.selected = null;

    self.start = null;
    self.end = null;

    var init = function() {
        var initial = spec.initial || wv.util.today();
        self.select(initial);
    };

    self.string = function() {
        return wv.util.toISOStringDate(self.selected);
    };

    /**
     * Select a day to display on the map. If the selected date differs
     * from the current selection, a "selected" event is triggered.
     *
     * @method select
     * @param {Date} date The day to display. If the day is before the
     * archive start date, it is set to the archive start date. If the day
     * is after UTC today, it is set to UTC today.
     * @return {Boolean} true if the date was updated, otherwise false.
     */
    self.select = function(date) {
        date = wv.util.clearTimeUTC(date);
        if ( self.start && date < self.start ) {
            date = self.start;
        } else if ( self.end && date > self.end ) {
            date = self.end;
        }

        var updated = false;
        if ( !self.selected || date.getTime() !== self.selected.getTime() ) {
            self.selected = date;
            self.events.trigger("select", date);
            updated = true;
        }
        return updated;
    };

    self.range = function(range) {
        if ( range) {
            self.start = range.start;
            self.end = range.end;
            if ( self.end && wv.util.clearTimeUTC(self.end) > wv.util.today() ) {
                self.end = wv.util.today();
            } else {
                self.end = range.end;
            }
        } else {
            self.start = null;
            self.end = null;
        }
        self.select(self.selected);
        self.events.trigger("range");
    };

    self.save = function(state) {
        state.time = self.selected.toISOString().split("T")[0];
    };

    self.load = function(state) {
        if ( state.time ) {
            self.select(state.time);
        }
        if ( state.now ) {
            self.range({ start: self.start, end: self.end });
        }
    };

    init();
    return self;

};

/**
 * Triggered when the selected day is changed.
 *
 * @event selected
 * @param {Date} date the newly selected day.
 */
