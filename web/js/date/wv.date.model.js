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

var wv = wv || {};
wv.date = wv.date || {};

wv.date.model = wv.date.model || function(config, spec) {

    spec = spec || {};

    var self = {};
    self.events = wv.util.events();
    self.selected = null;

    var init = function() {
        var initial = spec.initial || wv.util.today();
        self.select(initial);
    };

    self.string = function() {
        return wv.util.toISOStringDate(self.selected);
    };

    self.select = function(date) {
        date = wv.util.clearTimeUTC(date);
        if ( date > wv.util.today() ) {
            date = wv.util.today();
        }
        if ( config.startDate ) {
            startDate = wv.util.parseDateUTC(config.startDate);
            if ( date < startDate ) {
                date = startDate;
            }
        }

        var updated = false;
        if ( !self.selected || date.getTime() !== self.selected.getTime() ) {
            self.selected = date;
            self.events.trigger("select", date);
            updated = true;
        }
        return updated;
    };

    self.add = function(interval, amount) {
        self.select(wv.util.dateAdd(self.selected, interval, amount));
    };

    self.save = function(state) {
        state.t = self.selected.toISOString().split("T")[0];
    };

    self.load = function(state) {
        if ( state.t ) {
            self.select(state.t);
        }
    };

    init();
    return self;

};
