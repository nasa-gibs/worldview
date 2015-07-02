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
 * @module wv.proj
 */
var wv = wv || {};
wv.proj = wv.proj || {};

/**
 * @class wv.proj.model
 */
wv.proj.model = wv.proj.model || function(config) {

    var self = {};
    self.selected = null;
    self.events = wv.util.events();

    var init = function() {
        self.selectDefault();
        _.each(config.projections, function(proj) {
            if ( proj.crs && proj.proj4 ) {
                self.register(proj.crs, proj.proj4);
                ol.proj.get(proj.crs).setExtent(proj.maxExtent);
            }
        });
    };

    self.select = function(id) {
        var proj = config.projections[id];
        if ( !proj ) {
            throw new Error("Invalid projection: " + id);
        }
        var updated = false;
        if ( !self.selected || self.selected.id !== id ) {
            self.selected = proj;
            self.events.trigger("select", proj);
        }
        return updated;
    };

    self.selectDefault = function() {
        if ( config.defaults && config.defaults.projection ) {
            self.select(config.defaults.projection);
        }
    };

    self.save = function(state) {
        state.p = self.selected.id;
    };

    self.load = function(state) {
        var projId = state.p;
        if ( projId ) {
            self.select(projId);
        }
    };

    self.register = function(crs, def) {
        if ( def && window.proj4 ) {
            proj4.defs(crs, def);
        }
    };

    init();
    return self;
};
