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
 * @module wv.layers
 */
var wv = wv || {};
wv.layers = wv.layers || {};

/**
 * @class wv.layers.model
 */
wv.layers.model = wv.layers.model || function(models, config) {

    var self = {};

    self.events = wv.util.events();

    self.active = {
        baselayers: [],
        overlays: []
    };
    self.visible = {};

    var init = function() {
        if ( config.defaults && config.defaults.startingLayers ) {
            _.each(config.defaults.startingLayers, function(layers, type) {
                _.each(layers, function(layer) {
                    self.add(layer.id, layer.hidden);
                });
            });
        }
    };

    // Deprecated
    self.forProjection = function(proj) {
        proj = proj || models.proj.selected.id;
        var results = {
            baselayers: [],
            overlays: []
        };
        $.each(self.active, function(type, layers) {
            $.each(layers, function(index, layer) {
                if ( layer.projections[proj] ) {
                    results[type].push(layer);
                }
            });
        });
        return results;
    };

    self.forGroup = function(group, spec) {
        spec = spec || {};
        var results = [];
        var groups = self.forProjection();
        _.each(groups[group], function(layer) {
            if ( spec.visibleOnly && !self.visible[layer.id] ) {
                return;
            }
            results.push(layer);
        });
        if ( spec.reverse ) {
            results = results.reverse();
        }
        return results;
    };

    self.get = function(spec) {
        spec = spec || {};
        var baselayers = self.forGroup("baselayers", spec);
        var overlays = self.forGroup("overlays", spec);
        return baselayers.concat(overlays);
    };

    self.dateRange = function(proj) {
        proj = proj || models.proj.selected.id;
        if ( config.parameters && config.parameters.debugGIBS ) {
            return {
                start: new Date(Date.UTC(1970, 0, 1)),
                end: wv.util.today()
            };
        }
        var min = Number.MAX_VALUE;
        var max = 0;
        var range = false;
        _.each(self.active, function(layers, type) {
            _.each(layers, function(layer) {
                if ( layer.startDate ) {
                    range = true;
                    var start = wv.util.parseDateUTC(layer.startDate).getTime();
                    min = Math.min(min, start);
                }
                // For now, we assume that any layer with an end date is
                // an ongoing product unless it is marked as inactive.
                if ( layer.inactive && layer.endDate ) {
                    range = true;
                    var end = wv.util.parseDateUTC(layer.endDate).getTime();
                    max = Math.max(max, end);
                } else if ( layer.endDate ) {
                    range = true;
                    max = wv.util.today().getTime();
                }
                // If there is a start date but no end date, this is a
                // product that is currently being created each day, set
                // the max day to today.
                if ( layer.startDate && !layer.endDate ) {
                    max = wv.util.today().getTime();
                }
            });
        });
        if ( range ) {
            if ( max === 0 ) {
                max = wv.util.today().getTime();
            }
            return {
                start: new Date(min),
                end: new Date(max)
            };
        }
    };

    self.count = function(type, proj) {
        proj = proj || models.proj.selected.id;
        var layers = self.forProjection(proj);
        return layers[type].length;
    };

    self.total = function(proj) {
        proj = proj || models.proj.selected.id;
        return self.count("baselayers", proj) +
               self.count("overlays", proj);
    };

    self.add = function(id, hidden) {
        var layer = getLayer(id);
        if ( $.inArray(layer, self.active[layer.group]) >= 0 ) {
            return;
        }
        self.active[layer.group].unshift(layer);
        hidden = hidden || false;
        self.visible[id] = !hidden;
        self.events.trigger("add", layer);
        self.events.trigger("change");
    };

    self.remove = function(id) {
        var layer = getLayer(id);
        var index = $.inArray(layer, self.active[layer.group]);
        if ( index >= 0 ) {
            self.active[layer.group].splice(index, 1);
            delete self.visible[id];
            self.events.trigger("remove", layer);
            self.events.trigger("change");
        }
    };

    self.replace = function(idOld, idNew) {
        var oldLayer = getLayer(idOld);
        var group = oldLayer.group;
        var index = $.inArray(oldLayer, self.active[group]);
        if ( index < 0 ) {
            return;
        }
        var newLayer = getLayer(idNew);
        self.active[group][index] = newLayer;
        delete self.visible[idOld];
        self.visible[idNew] = true;
        self.events.trigger("update");
        self.events.trigger("change");
    };

    self.clear = function(proj) {
        proj = proj || models.proj.selected.id;
        _.each(self.active, function(layers) {
            var layersClone = layers.slice(0);
            _.each(layersClone, function(layer) {
                if ( proj && layer.projections[proj] ) {
                    self.remove(layer.id);
                }
            });
        });
    };

    self.pushToBottom = function(id) {
        var layer = getLayer(id);
        var group = layer.group;
        var oldIndex = $.inArray(layer, self.active[layer.group]);
        if ( oldIndex < 0 ) {
            throw new Error("Layer is not active: " + id);
        }
        self.active[group].splice(oldIndex, 1);
        self.active[group].push(layer);
        self.events.trigger("update", layer, self.active[layer.group].length - 1);
        self.events.trigger("change");
    };

    self.moveBefore = function(source, target) {
        var sourceLayer = getLayer(source);
        var targetLayer = getLayer(target);
        var group = sourceLayer.group;
        var sourceIndex = $.inArray(sourceLayer, self.active[group]);
        if ( sourceIndex < 0 ) {
            throw new Error("Layer is not active: " + source);
        }
        var targetIndex = $.inArray(targetLayer, self.active[group]);
        if ( targetIndex < 0 ) {
            throw new Error("Layer is not active: " + target);
        }

        self.active[group].splice(targetIndex, 0, sourceLayer);
        if ( sourceIndex > targetIndex ) {
            sourceIndex++;
        }
        self.active[group].splice(sourceIndex, 1);
        self.events.trigger("update", sourceLayer, targetIndex);
        self.events.trigger("change");
    };

    self.setVisibility = function(id, visible) {
        var layer = getLayer(id);
        if ( self.visible[id] !== visible ) {
            self.visible[id] = visible;
            self.events.trigger("visibility", layer, visible);
            self.events.trigger("change");
        }
    };

    self.isActive = function(id) {
        var answer = false;
        var layer = getLayer(id);
        $.each(self.active[layer.group], function(index, l) {
            if ( id === l.id ) {
                answer = true;
                return false;
            }
        });
        return answer;
    };

    self.save = function(state) {
        var groups = [];
        _.each(self.forProjection(), function(layers, group) {
            group = [group];
            _.each(layers, function(layer) {
                prefix = ( !self.visible[layer.id] ) ? "!": "";
                group.push(prefix + layer.id);
            });
            // Only list group if there are layers to save
            if ( group.length > 1 ) {
                groups.push(group.join(","));
            }
        });
        state.products = groups.join("~");
    };

    self.load = function(state) {
        if ( state.products ) {
            self.clear(models.proj.selected.id);
            _.each(state.products, function(layerId) {
                var hidden = state.hidden && state.hidden[layerId];
                self.add(layerId, hidden);
            });
        }
    };

    var getLayer = function(id) {
        var layer = config.layers[id];
        if ( !layer ) {
            throw new Error("No such layer: " + id);
        }
        layer.id = id;
        return layer;
    };

    init();
    return self;

};