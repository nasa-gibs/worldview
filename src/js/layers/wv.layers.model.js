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
        $.each(config.defaults.startingLayers, function(type, layers) {
            $.each(layers, function(index, layer) {
                self.add(type, layer.id, layer.hidden);
            });
        });
        $.each(config.layers, function(id, layer) {
            layer.id = id;
        });
    };

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

    self.add = function(type, id, hidden) {
        var layer = getLayer(id);
        if ( $.inArray(layer, self.active[type]) >= 0 ) {
            return;
        }
        self.active[type].unshift(layer);
        hidden = hidden || false;
        self.visible[id] = !hidden;
        self.events.trigger("add", layer, type);
    };

    self.remove = function(type, id) {
        var layer = getLayer(id);
        var index = $.inArray(layer, self.active[type]);
        if ( index >= 0 ) {
            self.active[type].splice(index, 1);
            delete self.visible[id];
            self.events.trigger("remove", layer, type);
        }
    };

    self.replace = function(type, idOld, idNew) {
        var oldLayer = getLayer(idOld);
        var index = $.inArray(oldLayer, self.active[type]);
        if ( index < 0 ) {
            return;
        }
        var newLayer = getLayer(idNew);
        self.active[type][index] = newLayer;
        delete self.visible[idOld];
        self.visible[idNew] = true;
        self.events.trigger("update");
    };

    self.clear = function(proj) {
        projection = proj|| models.proj.selected.id;
        $.each(self.active, function(type, layers) {
            var layersClone = layers.slice(0);
            $.each(layersClone, function(i, layer) {
                if ( proj && layer.projections[proj] ) {
                    self.remove(type, layer.id);
                }
            });
        });
    };

    self.pushToBottom = function(type, id) {
        var layer = getLayer(id);
        var oldIndex = $.inArray(layer, self.active[type]);
        if ( oldIndex < 0 ) {
            throw new Error("Layer is not active: " + id);
        }
        self.active[type].splice(oldIndex, 1);
        self.active[type].push(layer);
        self.events.trigger("move", type, layer, self.active[type].length - 1);
    };

    self.moveBefore = function(type, source, target) {
        var sourceLayer = getLayer(source);
        var targetLayer = getLayer(target);
        var sourceIndex = $.inArray(sourceLayer, self.active[type]);
        if ( sourceIndex < 0 ) {
            throw new Error("Layer is not active: " + source);
        }
        var targetIndex = $.inArray(targetLayer, self.active[type]);
        if ( targetIndex < 0 ) {
            throw new Error("Layer is not active: " + target);
        }

        self.active[type].splice(targetIndex, 0, sourceLayer);
        if ( sourceIndex > targetIndex ) {
            sourceIndex++;
        }
        self.active[type].splice(sourceIndex, 1);
        self.events.trigger("move", type, sourceLayer, targetIndex);
    };

    self.setVisibility = function(id, visible) {
        var layer = getLayer(id);
        if ( self.visible[id] !== visible ) {
            self.visible[id] = visible;
            self.events.trigger("visibility", layer, visible);
        }
    };

    self.isActive = function(type, id) {
        var answer = false;
        $.each(self.active[type], function(index, layer) {
            if ( id === layer.id ) {
                answer = true;
                return false;
            }
        });
        return answer;
    };

    self.toPermalink = function() {
        var types = [];
        $.each(self.forProjection(), function(type, layers) {
            type = [type];
            $.each(layers, function(index, layer) {
                prefix = ( !self.visible[layer.id] ) ? "!": "";
                type.push(prefix + layer.id);
            });
            types.push(type.join(","));
        });
        return "products=" + types.join("~");
    };

    self.fromPermalink = function(queryString) {
        var query = Worldview.queryStringToObject(queryString);
        var values = query.layers || query.products;
        if ( values ) {
            self.clear(models.proj.selected.id);
            // Base layers / overlays
            var sections = values.split("~");
            $.each(sections, function(i, section) {
                var type = null;
                $.each(sections, function(i, section) {
                    var items = section.split(/[,\.]/);
                    var layers = [];
                    $.each(items, function(index, item) {
                        if ( index === 0 ) {
                            type = item;
                            if ( !Worldview.LAYER_TYPES[type] ) {
                                wv.util.warn("Invalid layer type: " + type);
                                return false;
                            }
                        } else {
                            var hidden = item.startsWith("!");
                            if ( hidden ) {
                                item = item.substring(1);
                            }
                            // Layers have to be added in reverse
                            layers.unshift({name: item, hidden: hidden});
                        }
                    });
                    $.each(layers, function(index, layer) {
                        var redirect = config.redirects.layers[layer.name];
                        if ( redirect ) {
                            layer.name = redirect;
                        }
                        try {
                            self.add(type, layer.name, layer.hidden);
                        } catch ( error ) {
                            wv.util.warn("Invalid layer: " + layer);
                        }
                    });
                });
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