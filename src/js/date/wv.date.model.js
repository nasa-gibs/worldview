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
 * @param {String} config.defaults.archiveStartDate the earliest day in
 * the archive that has data in the form of ``YYYY-MM-DD``.
 */

wv.date.model = wv.date.model || function(config) {

    var config = config || {};
    var self = {};

    /**
     * Earliest date which contains archived data.
     *
     * @attribute archiveStartDate
     * @type {Date}
     */
    self.archiveStartDate = null;

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

    var init = function() {
        var start = ( config.defaults ) ? config.defaults.archiveStartDate :
                null;
        if ( start ) {
            self.archiveStartDate = wv.util.parseDateUTC(start);
        }
        self.select(wv.util.today());
    };

    /**
     * Select a day to display on the map. If the selected date differs
     * from the current selection, a "selected" event is triggered.
     *
     * @method select
     * @param {Date} date The day to display. If the day is before the
     * archive start date, it is set to the archive start date. If the day
     * is after UTC today, it is set to UTC today.
     */
    self.select = function(date) {
        if ( date < self.archiveStartDate ) {
            date = self.archiveStartDate;
        } else if ( date > wv.util.today() ) {
            date = wv.util.today();
        }

        if ( !self.selected || date.getTime() !== self.selected.getTime() ) {
            self.selected = date;
            self.events.trigger("select", date);
        }
    };

    /**
     * Representation of this model as a permalink.
     *
     * @method toPermalink
     * @return {String} current day in the form of ``time=YYYY-MM-DD``
     */
    self.toPermalink = function() {
        return "time=" + self.selected.toISOString();
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
                var value = Date.parseDateUTC(query.time);
                self.set(value);
            } catch ( error ) {
                wv.util.warn("Invalid date: " + query.time + ": " + error);
            }
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

