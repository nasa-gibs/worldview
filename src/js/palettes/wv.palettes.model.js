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
 * @module wv.palette
 */
var wv = wv || {};
wv.palettes = wv.palettes || {};

/**
 * @class wv.palette.model
 */
wv.palettes.model = wv.palettes.model || function(models, config) {

    config.palettes = config.palettes || {
        rendered: {},
        custom: {}
    };

    var self = {};
    self.events = wv.util.events();

    self.active = {};

    self.loadCustom = function() {
        var result = $.Deferred();
        if ( _.size(config.palettes.custom) > 0 ) {
            result.resolve(config.palettes.custom);
        } else {
            $.getJSON("conf/wv.palettes.json")
                .done(function(data) {
                    config.palettes.custom = data;
                    result.resolve(data);
                }).fail(function() {
                    self.events.trigger("error", "Unable to load custom " +
                            "palettes", arguments);
                    result.reject();
                });
        }
        return result;
    };

    self.loadRendered = function(layerId) {
        var paletteId = config.layers[layerId].palette.id;
        if ( !paletteId ) {
            throw new Error("Layer " + layerId + " does not have a palette");
        }
        var result = $.Deferred();
        if ( config.palettes.rendered[paletteId] ) {
            result.resolve(config.palettes.rendered[paletteId]);
        } else {
            $.getJSON("conf/wv.palettes/" + paletteId + ".json")
                .done(function(data) {
                    config.palettes.rendered[paletteId] = data;
                    result.resolve(data);
                }).fail(function() {
                    self.events.trigger("error", "Unable to load palette for " +
                            "layer " + layerId, arguments);
                    result.reject();
                });
        }
        return result;
    };

    self.add = function(layerId, paletteId) {
        var c = self.loadCustom;
        var r = self.loadRendered;
        $.when(c(), r(layerId)).then(function(customs, sourcePalette) {
            var targetPalette = customs[paletteId];
            self.active[layerId] = wv.palettes.translate(sourcePalette, targetPalette);
            self.events.trigger("add", layerId, self.active[layerId]);
        }).fail(function() {
            self.events.trigger("error", "Unable to set palette " + paletteId +
                    " for layer " + layerId);
        });
    };

    self.remove = function(layerId) {
        if ( self.active[layerId] ) {
            delete self.active[layerId];
            self.events.trigger("remove", layerId);
        }
    };

    self.forLayer = function(layerId) {
        var result = $.Deferred();
        if ( self.active[layerId] ) {
            result.resolve(self.active[layerId]);
        } else {
            result = self.loadRendered(layerId);
        }
        return result;
    };

    self.toPermalink = function() {
        var parts = [];
        _.each(self.active, function(palette, layerId) {
            parts.push(layerId + "," + palette.id);
        });
        return ( parts ) ? "palettes=" + parts.join("~") : "";
    };

    self.fromPermalink = function(queryString) {
        var query = wv.util.fromQueryString(queryString);
        if ( query.palettes ) {
            var parts = query.palettes.split("~");
            _.each(parts, function(part) {
                var items = part.split(",");
                self.add(items[0], items[1]);
            });
        }
    };

    return self;

};