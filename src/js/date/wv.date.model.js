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
 * @class wv.date.model
 */
wv.date.model = wv.date.model || function(config) {

    var self = {};

    self.archiveStartDate =
            Date.parseISOString(config.defaults.archiveStartDate);

    self.events = Worldview.Events();
    self.selected = null;

    var init = function() {
        self.set(Worldview.today());
    };

    self.select = function(date) {
        if ( date < self.archiveStartDate ) {
            date = self.archiveStartDate;
        } else if ( date > Worldview.today() ) {
            date = Worldview.today();
        }

        if ( !self.selected || date.getTime() !== self.selected.getTime() ) {
            self.selected = date;
            self.events.trigger("change", date);
        }
    };

    self.toPermalink = function() {
        return "time=" + self.selected.toISOString();
    };

    self.fromPermalink = function(queryString) {
        var query = Worldview.queryStringToObject(queryString);
        if ( query.time ) {
            try {
                var value = Date.parseISOString(query.time);
                self.set(value);
            } catch ( error ) {
                log.warn("Invalid date: " + query.time + ": " + error);
            }
        }
    };

    init();
    return self;

};
