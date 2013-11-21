/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

Worldview.namespace("Models");

Worldview.Models.Layers = function(config, projectionModel) {

    var log = Logging.getLogger("Worldview.Models.Layers");

    var self = {};

    self.events = Worldview.Events();

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

    self.forProjection = function(projection) {
        projection = projection || projectionModel.selected;
        var results = {
            baselayers: [],
            overlays: []
        };
        $.each(self.active, function(type, layers) {
            $.each(layers, function(index, layer) {
                if ( layer.projections[projection] ) {
                    results[type].push(layer);
                }
            });
        });
        return results;
    };

    self.count = function(type, projection) {
        projection = projection || projectionModel.selected;
        var layers = self.forProjection(projection);
        return layers[type].length;
    };

    self.total = function(projection) {
        return self.count("baselayers", projection) +
               self.count("overlays", projection);
    };

    self.add = function(type, id, hidden) {
        var layer = getLayer(id);
        if ( $.inArray(layer, self.active[type]) >= 0 ) {
            log.debug("layers: add already active", type, layer.id);
            return;
        }
        log.debug("layers: add", type, id, hidden);
        self.active[type].unshift(layer);
        hidden = hidden || false;
        self.visible[id] = !hidden;
        self.events.trigger("add", layer, type);
    };

    self.remove = function(type, id) {
        var layer = getLayer(id);
        var index = $.inArray(layer, self.active[type]);
        if ( index >= 0 ) {
            log.debug("layers: remove", type, id);
            self.active[type].splice(index, 1);
            delete self.visible[id];
            self.events.trigger("remove", layer, type);
        } else {
            log.debug("layers: remove not active", type, layer.id);
        }
    };

    self.clear = function(projection) {
        projection = projection || projectionModel.selected;
        log.debug("layers: clearing", projection, self.active);
        $.each(self.active, function(type, layers) {
            var layersClone = layers.slice(0);
            $.each(layersClone, function(i, layer) {
                if ( projection && layer.projections[projection] ) {
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
        log.debug("layers: move", type, layer, self.active[type].length - 1);
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

        log.debug("layers: move", type, sourceLayer, targetIndex);
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
            var type = [type];
            $.each(layers, function(index, layer) {
                prefix = ( !self.visible[layer.id] ) ? "!": "";
                type.push(prefix + layer.id);
            });
            types.push(type.join(","));
        });
        return "products=" + Worldview.Permalink.encode(types.join("~"));
    };

    self.fromPermalink = function(queryString) {
        var query = Worldview.queryStringToObject(queryString);
        var values = query.layers || query.products;
        if ( values ) {
            self.clear(projectionModel.selected);
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
                                log.warn("Invalid layer type: " + type);
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
                        try {
                            self.add(type, layer.name, layer.hidden);
                        } catch ( error ) {
                            log.warn("Invalid layer: " + layer);
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
