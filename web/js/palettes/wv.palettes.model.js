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

    self.type = function(layerId) {
        var palette = models.palettes.get(layerId);
        if ( !palette ) {
            return;
        }
        if ( config.layers[layerId].palette.immutable ) {
            return false;
        }
        if ( palette.scale ) {
            return "scale";
        }
        if ( palette.classes && palette.classes.colors.length === 1 ) {
            return "single";
        }
        // FIXME: May not be needed any more
        if ( palette.lookup ) {
            return ( _.size(palette.lookup) === 1 ) ? "single" : "scale";
        }
    };

    self.allowed = function(layerId) {
        if ( !wv.palettes.supported ) {
            return false;
        }
        return self.type(layerId);
    };

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
        var def = active || {};
        def.custom = paletteId;
        updateLookup(layerId, def);
        self.active[layerId] = def;
        self.events.trigger("set-custom", layerId, def);
        self.events.trigger("change");
    };

    self.clearCustom = function(layerId) {
        var def = self.active[layerId];
        if ( def && def.custom ) {
            delete def.custom;
            if ( !_.isUndefined(def.min) || !_.isUndefined(def.max) ) {
                updateLookup(layerId, def);
            } else {
                delete def.lookup;
            }
            if ( !def.custom && !def.lookup ) {
                delete self.active[layerId];
            }
            self.events.trigger("clear-custom", layerId);
            self.events.trigger("change");
        }
    };

    self.setRange = function(layerId, min, max) {
        var def = self.active[layerId] || {};
        var paletteId = config.layers[layerId].palette.id;
        var rendered = config.palettes.rendered[paletteId];
        def.min = undefined;
        if ( min > 0 ) {
            def.min = min;
        }
        def.max = undefined;
        if ( max < rendered.scale.colors.length - 1 ) {
            def.max = max;
        }
        updateLookup(layerId, def);
        self.active[layerId] = def;
        self.events.trigger("range", layerId, def.min, def.max);
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
        self.active = {};
        self.events.trigger("update");
    };

    self.restore = function(active) {
        self.active = active;
        self.events.trigger("update");
    };

    self.save = function(state) {
        if ( self.inUse() && !state.l ) {
            throw new Error("No layers in state");
        }
        _.each(self.active, function(def, layerId) {
            if ( !_.find(models.layers.get(), {id: layerId}) ) {
                return;
            }
            var attr = _.find(state.l, {id: layerId}).attributes;
            if ( def.custom ) {
                attr.push({ id: "palette", value: def.custom });
            }
            if ( def.min ) {
                var minValue = def.scale.values[def.min];
                attr.push({ id: "min", value: minValue });
            }
            if ( def.max ) {
                var maxValue = def.scale.values[def.max];
                attr.push({ id: "max", value: maxValue });
            }
        });
    };

    self.key = function(layerId) {
        if ( !self.isActive(layerId) ) {
            return "";
        }
        var def = self.get(layerId);
        var keys = [];
        if ( def.custom ) {
            keys.push("palette=" + def.custom);
        }
        if ( def.min ) {
            keys.push("min=" + def.min);
        }
        if ( def.max ) {
            keys.push("max=" + def.max);
        }
        return keys.join(",");
    };

    self.load = function(state, errors) {
        if ( !wv.palettes.supported ) {
            return;
        }
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
    };

    var findIndex = function(layerId, type, value) {
        var values = self.get(layerId).scale.values;
        var result;
        _.each(values, function(check, index) {
            var min = check;
            var max = check;
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
        if ( models.palettes.type(layerId) === "single" ) {
            updateLookupSingle(layerId, def);
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

        var min = def.min || 0;
        var max = def.max || source.scale.colors.length;

        var sourceCount = source.scale.colors.length;
        var targetCount = target.colors.length;

        var scale = {
            "id": target.id,
            "name": target.name || undefined
        };

        var newScale = [];
        var newLabels = [];
        var newValues = [];
        _.each(source.scale.colors, function(color, index) {
            if ( index < def.min || index > def.max ) {
                newScale.push("00000000");
            } else {
                var sourcePercent = index / sourceCount;
                var targetIndex = Math.floor(sourcePercent * targetCount);
                newScale.push(target.colors[targetIndex]);
            }
            newLabels.push(source.scale.labels[index]);
            newValues.push(source.scale.values[index]);
        });
        scale.colors = newScale;
        scale.labels = newLabels;
        scale.values = newValues;
        def.scale = scale;

        var lookup = {};
        _.each(source.scale.colors, function(sourceColor, index) {
            var sourceEntry =
                parseInt(sourceColor.substring(0, 2), 16) + "," +
                parseInt(sourceColor.substring(2, 4), 16) + "," +
                parseInt(sourceColor.substring(4, 6), 16) + "," +
                parseInt(sourceColor.substring(6, 8), 16);
            var targetColor = newScale[index];
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

    var updateLookupSingle = function(layerId, def) {
        var layerDef = config.layers[layerId];
        var source = config.palettes.rendered[layerDef.palette.id];
        var target;
        if ( def.custom ) {
            target = config.palettes.custom[def.custom].colors;
        } else {
            target = source.colors;
        }
        var lookup = {};
        var sourceColor = source.classes.colors[0];
        var targetColor = target[0];

        var sourceEntry =
            parseInt(sourceColor.substring(0, 2), 16) + "," +
            parseInt(sourceColor.substring(2, 4), 16) + "," +
            parseInt(sourceColor.substring(4, 6), 16) + "," +
            parseInt(sourceColor.substring(6, 8), 16);
        var targetEntry = {
            r: parseInt(targetColor.substring(0, 2), 16),
            g: parseInt(targetColor.substring(2, 4), 16),
            b: parseInt(targetColor.substring(4, 6), 16),
            a: parseInt(targetColor.substring(6, 8), 16)
        };
        def.classes = {
            colors: [targetColor],
            labels: [source.classes.labels[0]]
        };
        lookup[sourceEntry] = targetEntry;
        def.lookup = lookup;
    };

    return self;

};
