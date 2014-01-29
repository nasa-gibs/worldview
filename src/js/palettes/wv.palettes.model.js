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

    self.add = function(layerId, paletteId) {
        self.active[layerId] = paletteId;
        self.events.trigger("add", layerId, self.active[layerId]);
    };

    self.remove = function(layerId) {
        if ( self.active[layerId] ) {
            delete self.active[layerId];
            self.events.trigger("remove", layerId);
        }
    };

    self.forLayer = function(layerId) {
        var sourcePaletteId =  config.layers[layerId].palette.id;
        var sourcePalette = config.palettes.rendered[sourcePaletteId];
        if ( self.active[layerId] ) {
            var targetPaletteId = self.active[layerId];
            var targetPalette = config.palettes.custom[targetPaletteId];
            return wv.palettes.translate(sourcePalette, targetPalette);
        } else {
            return sourcePalette;
        }
    };

    self.toPermalink = function() {
        var parts = [];
        _.each(self.active, function(paletteId, layerId) {
            parts.push(layerId + "," + paletteId);
        });
        return ( parts.length > 0 ) ? "palettes=" + parts.join("~") : "";
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