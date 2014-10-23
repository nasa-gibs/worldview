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

    self.getRendered = function(layerId, index) {
        var palette = config.palettes.rendered[layerId];
        if ( !_.isUndefined(index) ) {
            palette = palette.maps[index];
        }
        return palette;
    };

    self.getCustom = function(paletteId) {
        return config.palettes.custom[paletteId];
    };

    var prepare = function(layerId) {
        self.active[layerId] = self.active[layerId] || {};
        var active = self.active[layerId];
        active.maps = active.maps || [];
        _.each(self.getRendered(layerId).maps, function(palette, index) {
            if ( !active.maps[index] ) {
                active.maps[index] = palette;
            }
        });
    };

    self.allowed = function(layerId) {
        if ( !wv.palettes.supported ) {
            return false;
        }
        //FIXME: return self.type(layerId);
        return true;
    };

    self.setCustom = function(layerId, paletteId, index) {
        if ( !config.palettes.custom[paletteId] ) {
            throw new Error("Invalid palette: " + paletteId);
        }
        if ( !config.layers[layerId] ) {
            throw new Error("Invalid layer: "+ layerId);
        }
        prepare(layerId);
        index = ( _.isUndefined(index) ) ? 0 : index;
        var active = self.active[layerId];
        var palette = active[index];
        if ( palette.custom === paletteId ) {
            return;
        }
        palette.custom = paletteId;
        updateLookup(layerId);
        self.events.trigger("set-custom", layerId, active);
        self.events.trigger("change");
    };

    self.clearCustom = function(layerId, index) {
        index = ( _.isUndefined(index) ) ? 0 : index;
        var active = self.active[layerId];
        if ( !active || !active[index].custom ) {
            return;
        }
        delete active[index].custom;
        updateLookup(layerId);
        self.events.trigger("clear-custom", layerId);
        self.events.trigger("change");
    };

    self.setRange = function(layerId, min, max, index) {
        prepare(layerId);
        index = ( _.isUndefined(index) ) ? 0 : index;
        var palette = self.active[layerId][index];
        palette.min = min;
        palette.max = max;
        updateLookup(layerId);
        self.events.trigger("range", layerId, palette.min, palette.max);
        self.events.trigger("change");
    };

    self.getCount = function(layerId) {
        return self.getRendered(layerId).maps.length;
    };

    self.get = function(layerId, index) {
        index = ( _.isUndefined(index) ) ? 0 : index;
        if ( self.active[layer.id] ) {
            return self.active[layer.id];
        }
        return self.getRendered(layerId, index);
    };

    self.getLegend = function(layerId, index) {
        var value = self.get(layerId, index);
        return value.legend || value.entries;
    };

    self.getDefaultLegend = function(layerId, index) {
        var palette = self.getRendered(layerId, index);
        return palette.legend || palette.entries;
    };
    
    self.getLegends = function(layerId) {
        var legends = [];
        var count = self.getCount(layerId);
        for ( var i = 0; i < count; i++ ) {
            legends.push(self.getLegend(layerId, i));
        }
        return legends;
    };

    // Is a canvas required?
    self.isActive = function(layerId) {
        return self.active[layerId];
    };

    self.clear = function() {
        self.active = {};
        self.events.trigger("update");
    };

    self.restore = function(active) {
        self.active = active;
        self.events.trigger("update");
    };

    self.save = function(state) {
        /*
        if ( self.inUse() && !state.l ) {
            throw new Error("No layers in state");
        }
        _.each(self.active, function(def, layerId) {
            if ( !_.find(models.layers.active, {id: layerId}) ) {
                return;
            }
            var attr = _.find(state.l, {id: layerId}).attributes;
            if ( def.custom ) {
                attr.push({ id: "palette", value: def.custom });
            }
            if ( def.min ) {
                var minValue = def.scale.values[def.min][0];
                attr.push({ id: "min", value: minValue });
            }
            if ( def.max ) {
                var maxValue = ( def.scale.values[def.max].length === 2 ) ?
                        def.scale.values[def.max][1] :
                        def.scale.values[def.max][0];
                attr.push({ id: "max", value: maxValue });
            }
        });
        */
    };

    self.load = function(state, errors) {
        /*
        _.each(state.l, function(layerDef) {
            var layerId = layerDef.id;
            var minValue, maxValue;
            var min, max;
            _.each(layerDef.attributes, function(attr) {
                if ( attr.id === "palette" ) {
                    try {
                        self.setCustom(layerId, attr.value);
                    } catch ( error ) {
                        errors.push("Invalid palette: " + attr.value);
                    }
                }
                if ( attr.id === "min" ) {
                    minValue = parseFloat(attr.value);
                    if ( _.isNaN(minValue) ) {
                        errors.push("Invalid min value: " + attr.value);
                    } else {
                        min = findIndex(layerId, "min", minValue);
                    }
                }
                if ( attr.id === "max" ) {
                    maxValue = parseFloat(attr.value);
                    if ( _.isNaN(maxValue) ) {
                        errors.push("Invalid max value: " + attr.value);
                    } else {
                        max = findIndex(layerId, "max", maxValue);
                    }
                }
            });
            if ( !_.isUndefined(min) || !_.isUndefined(max) ) {
                self.setRange(layerId, min, max);
            }
        });
        */
    };

    var findIndex = function(layerId, type, value) {
        /*
        var values = self.get(layerId).scale.values;
        var result;
        _.each(values, function(check, index) {
            var min = check[0];
            var max = check.length === 2 ? check[1] : check[0];
            if ( type === "min" && value === min ) {
                result = index;
                return false;
            }
            if ( type === "max" && value === max ) {
                result = index;
                return false;
            }
        });
        return result;
        */
    };

    // If any custom rendering is being used, image download must turn it
    // off
    self.inUse = function() {
        /*
        var layers = models.layers.get();
        var found = false;
        _.each(layers, function(layer) {
            if ( self.active[layer.id] ) {
                found = true;
                return false;
            }
        });
        return found;
        */
    };

    var useLookup = function(layerId) {
        var use = false;
        var active = self.active[layerId];
        _.each(active, function(palette, index) {
            if ( palette.custom ) {
                use = true;
                return false;
            }
            var rendered = self.getRendered(layerId, index);
            if ( palette.min < _.first(_.last(rendered.values)) ) {
                delete palette.min;
            }
            if ( palette.min > _.last(_.first(rendered.values)) ) {
                delete palette.max;
            }
            if ( !_.isUndefined(palette.min) || !_.isUndefined(palette.max) ) {
                use = true;
                return false;
            }
        });
        return use;
    };

    var updateLookup = function(layerId) {
        if ( !useLookup(layerId) ) {
            delete self.active[layerId];
            return;
        }
        var active = self.active[layerId];
        var lookup = {};
        _.each(active, function(palette, index) {
            entries = palette.entries;
            legend = {
                colors: [],
                labels: entries.labels,
                values: entries.values,
                type: entries.type
            };
            var source = entries.colors;
            var values = entires.values;
            var target = ( palette.custom ) ?
                self.getCustom(palette.custom).colors : source;
            var min = palette.min || 0;
            var max = palette.max || source.length;

            _.each(source, function(color, index) {
                var newColor;
                if ( index < min || index > max ) {
                    targetColor = "00000000";
                } else {
                    var sourcePercent = index / source.length;
                    var targetIndex = Math.floor(sourcePercent * target.length);
                    targetColor = target[targetIndex];
                }
                legend.colors += [targetColor];
                var lookupSource =
                    _.parseInt(color.substring(0, 2), 16) + "," +
                    _.parseInt(color.substring(2, 4), 16) + "," +
                    _.parseInt(color.substring(4, 6), 16) + "," +
                    _.parseInt(color.substring(6, 8), 16);
                var lookupTarget = {
                    r: _.parseInt(targetColor.substring(0, 2), 16),
                    g: _.parseInt(targetColor.substring(2, 4), 16),
                    b: _.parseInt(targetColor.substring(4, 6), 16),
                    a: _.parseInt(targetColor.substring(6, 8), 16)
                };
                if ( color === targetColor ) {
                    lookupTarget = 0;
                }
                lookup[lookupSource] = lookupTarget;
            });

        });
    };

    return self;

};
