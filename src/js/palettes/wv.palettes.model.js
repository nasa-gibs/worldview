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

    self.setCustom = function(layerId, paletteId) {
        if ( !config.palettes.custom[paletteId] ) {
            throw new Error("Invalid palette: " + paletteId);
        }
        if ( !config.layers[layerId] ) {
            throw new Error("Invalid layer: "+ layerId);
        }
        var active = self.active[layerId];
        if ( active && active.custom === paletteId ) {
            return;
        }
        var def = active || { custom: paletteId };
        updateLookup(layerId, def);
        self.active[layerId] = def;
        self.events.trigger("set-custom", layerId, def);
        self.events.trigger("change");
    };

    self.clearCustom = function(layerId) {
        var def = self.active[layerId];
        if ( def && def.custom ) {
            delete def.custom;
            delete def.lookup;
            self.events.trigger("clear-custom", layerId);
            self.events.trigger("change");
        }
    };

    self.setRange = function(layerId, min, max) {
        var def = self.active[layerId] || {};
        def.min = min;
        def.max = max;
        updateLookup(layerId, def);
        self.active[layerId] = def;
        self.events.trigger("range", layerId, min, max);
        self.events.trigger("change");
    };

    self.get = function(layerId) {
        var layer = config.layers[layerId];
        if ( self.active[layer.id] && self.active[layer.id].lookup ) {
            return self.active[layer.id];
        } else if ( layer.palette ) {
            return config.palettes.rendered[layer.palette.id];
        }
    };

    self.isActive = function(layerId) {
        var info = self.active[layerId];
        return info && info.lookup;
    };

    self.clear = function() {
        throw new Error("Clear called");
        //self.active = {};
        //self.events.trigger("change");
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
                    self.setCustom(layerId, paletteId);
                }
            });
        }
    };

    // If any custom rendering is being used, image download must turn it
    // off
    self.inUse = function() {
        var layers = models.layers.get();
        var found = false;
        _.each(layers, function(layer) {
            if ( self.active[layer.id] ) {
                found = true;
                return false;
            }
        });
        return found;
    };

    var useLookup = function(layerId, def) {
        var rendered = config.palettes.rendered[layerId];
        if ( def.custom ) {
            return true;
        }
        if ( rendered.scale ) {
            var bins = rendered.scale.colors.length;
            if ( def.min > 0 || def.max < bins - 1 ) {
                return true;
            }
        }
    };

    var updateLookup = function(layerId, def) {
        if ( !useLookup(layerId, def) ) {
            def.lookup = null;
            return;
        }

        var layerDef = config.layers[layerId];
        var source = config.palettes.rendered[layerDef.palette.id];
        var target;
        if ( def.custom ) {
            target = config.palettes.custom[def.custom];
        } else {
            target = source.scale;
        }

        var sourceCount = source.scale.colors.length;
        var targetCount = target.colors.length;

        var scale = {
            "id": target.id,
            "name": target.name || undefined
        };
        var newColors = [];
        var newScale = [];
        var newLabels = [];
        _.each(source.scale.colors, function(color, index) {
            if ( index < def.min || index > def.max ) {
                newColors.push("00000000");
            } else {
                var sourcePercent = index / sourceCount;
                var targetIndex = Math.floor(sourcePercent * targetCount);
                newColors.push(target.colors[targetIndex]);
                newScale.push(target.colors[targetIndex]);
                newLabels.push(source.scale.labels[targetIndex]);
            }
        });
        scale.colors = newScale;
        scale.labels = newLabels;
        def.scale = scale;

        var lookup = {};
        _.each(source.scale.colors, function(sourceColor, index) {
            var sourceEntry =
                parseInt(sourceColor.substring(0, 2), 16) + "," +
                parseInt(sourceColor.substring(2, 4), 16) + "," +
                parseInt(sourceColor.substring(4, 6), 16) + "," +
                parseInt(sourceColor.substring(6, 8), 16);
            var targetColor = newColors[index];
            var targetEntry = {
                r: parseInt(targetColor.substring(0, 2), 16),
                g: parseInt(targetColor.substring(2, 4), 16),
                b: parseInt(targetColor.substring(4, 6), 16),
                a: parseInt(targetColor.substring(6, 8), 16)
            };
            lookup[sourceEntry] = targetEntry;
        });
        def.lookup = lookup;
    };

    return self;

};
