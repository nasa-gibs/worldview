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
        if ( !config.palettes.custom[paletteId] ) {
            throw new Error("Invalid palette: " + paletteId);
        }
        if ( !config.layers[layerId] ) {
            throw new Error("Invalid layer: "+ layerId);
        }
        self.active[layerId] = paletteId;
        self.events.trigger("add", layerId, self.active[layerId]);
        self.events.trigger("change");
    };

    self.remove = function(layerId) {
        if ( self.active[layerId] ) {
            delete self.active[layerId];
            self.events.trigger("remove", layerId);
            self.events.trigger("change");
        }
    };

    self.clear = function() {
        self.active = {};
        self.events.trigger("change");
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

    self.save = function(state) {
        var parts = [];
        _.each(self.active, function(paletteId, layerId) {
            parts.push(layerId + "," + paletteId);
        });
        if ( parts.length > 0 ) {
            state.palettes = parts.join("~");
        }
    };

    self.load = function(state, errors) {
        if ( state.palettes ) {
            _.each(state.palettes, function(paletteId, layerId) {
                if ( !config.palettes.custom[paletteId] ) {
                    errors.push({message: "Invalid palette for layer" +
                        layerId + ": " + paletteId});
                } else {
                    self.add(layerId, paletteId);
                }
            });
        }
    };

    return self;

};