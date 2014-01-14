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

    /**
     * Representation of this model as a permalink.
     *
     * @method toPermalink
     * @return {String} current day in the form of ``time=YYYY-MM-DD``
     */
    self.toPermalink = function() {
        return "time=" + self.selected.toISOString().split("T")[0];
    };

    /**
     * Selects a day based on a value from a permalink.
     *
     * @method fromPermalink
     * @param {Object} queryString the query string used to select the day
     * with a parameter in the form of ``time=YYYY-MM-DD``. If the parameter
     * does not exist, this method does nothing. If the value of the day
     * is invalid, the value is not changed and a warning is emitted to
     * the console.
     */
    self.fromPermalink = function(queryString) {
        var query = wv.util.fromQueryString(queryString);
        if ( query.time ) {
            try {
                var value = wv.util.parseDateUTC(query.time);
                self.select(value);
            } catch ( error ) {
                wv.util.warn("Invalid date: " + query.time + ": " + error);
            }
        }
    };

    self.range = function(range) {
        if ( range ) {
            self.start = range.start;
            self.end = range.end;
        } else {
            self.start = null;
            self.end = null;
        }
        self.select(self.selected);
        self.events.trigger("range");
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

