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
        self.select(config.defaults.projection);
        _.each(config.projections, function(proj) {
            self.register(proj.crs, proj.proj4);
        });
    };

    self.select = function(id) {
        var proj = config.projections[id];
        if ( !proj ) {
            throw new Error("Invaid projection: " + id);
        }
        var updated = false;
        if ( !self.selected || self.selected.id !== id ) {
            self.selected = proj;
            self.events.trigger("select", proj);
        }
        return updated;
    };

    self.toPermalink = function() {
        return "switch=" + self.selected.id;
    };

    self.fromPermalink = function(queryString) {
        var query = wv.util.fromQueryString(queryString);
        var id = query.projection || query["switch"];
        if ( id ) {
            if ( !config.projections[id] ) {
                wv.util.warn("Unsupported projection: " + id);
            } else {
                self.select(id);
            }
        }
    };

    self.register = function(crs, def) {
        if ( def && Proj4js && !Proj4js.defs[crs] ) {
            Proj4js.defs[crs] = def;
        }
    };

    init();
    return self;
};

