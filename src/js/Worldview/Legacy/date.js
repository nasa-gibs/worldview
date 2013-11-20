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

Worldview.namespace("Legacy");

Worldview.Legacy.Date = function(model) {

    var self = {};

    self.id = "time";

    var init = function() {
        REGISTRY.register(self.id, self);
        REGISTRY.markComponentReady(self.id);

        model.events.on("change", fire);
        fire();
    };

    self.setValue = function(value) {
        model.set(self.id + "=" + model.selected.toISOString());
    };

    self.getValue = function() {
        return decodeURIComponent(model.toPermalink());
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