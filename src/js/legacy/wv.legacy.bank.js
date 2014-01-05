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
 * @class wv.legacy.bank
 */
wv.legacy.bank = wv.legacy.bank || function(model) {

    var self = {};

    self.id = "products";

    var init = function() {
        REGISTRY.register(self.id, self);
        REGISTRY.markComponentReady(self.id);

        model.events.on("add", fire);
        model.events.on("remove", fire);
        model.events.on("move", fire);
        model.events.on("visibility", fire);
        fire();
    };

    self.setValue = function(value) {
        model.fromPermalink(self.id + "=" + value);
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
        var projection = Worldview.extractFromQuery("switch", queryString);
        object.projection = projection;
        return object;
    };

    var fire = function() {
        REGISTRY.fire(self);
    };

    init();
    return self;
};