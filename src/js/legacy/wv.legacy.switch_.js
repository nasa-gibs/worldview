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
 * @class wv.legacy.switch
 */
wv.legacy.switch_ = wv.legacy.switch_ || function(model) {

    var self = {};

    self.id = "switch";

    var init = function() {
        REGISTRY.register(self.id, self);
        REGISTRY.markComponentReady(self.id);

        model.events.on("select", fire);
        fire();
    };

    self.setValue = function(value) {
        model.set(self.id + "=" + model.selected.id);
    };

    self.getValue = function() {
        return decodeURIComponent(model.toPermalink()) +
                "&epsg=" + model.selected.epsg +
                "&crs=" + model.selected.crs;
    };

    self.updateComponent = function() {};

    self.loadFromQuery = function(queryString) {
        model.fromPermalink(queryString);
        fire();
    };

    var fire = function() {
        REGISTRY.fire(self);
    };

    init();
    return self;
};