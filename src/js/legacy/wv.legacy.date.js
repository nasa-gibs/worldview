/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * @module wv.legacy
 */
var wv = wv || {};
wv.legacy = wv.legacy || {};

/**
 * Undocumented.
 *
 * @class wv.legacy.date
 */
wv.legacy.date = wv.legacy.date || function(model) {

    var self = {};

    self.id = "time";

    var init = function() {
        REGISTRY.register(self.id, self);
        REGISTRY.markComponentReady(self.id);

        model.events.on("select", fire);
        fire();
    };

    self.setValue = function(value) {
        model.set(self.id + "=" + model.selected.toISOString().split("T")[0]);
    };

    self.getValue = function() {
        return decodeURIComponent(model.toPermalink());
    };

    self.updateComponent = function() {};

    self.loadFromQuery = function(queryString) {
        model.fromPermalink(queryString);
        fire();
    };

    self.parse = function(queryString, object) {
        var timeString = Worldview.extractFromQuery("time", queryString);
        if ( !timeString ) {
            object.time = Worldview.today();
        } else {
            try {
                object.time = Date.parseISOString(timeString).clearUTCTime();
            } catch ( error ) {
                this.log.warn("Invalid time: " + timeString + ", reason: " +
                    error);
                object.time = Worldview.today();
            }
        }
    };

    var fire = function() {
        REGISTRY.fire(self);
    };

    init();
    return self;
};