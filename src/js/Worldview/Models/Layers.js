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
            return;
        }
        self.active[type].push(layer);
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
        var query = Worldvie.queryStringToObject(queryString);
        var layers = query.layers || query.products;
        if ( layers ) {
            var sections = layers.split("~");
            var type = null;
            $.each(sections, function(index, item) {
                if ( index === 0 ) {
                    type = item;
                } else {
                    try {
                        model.add(type, item);
                    } catch ( error ) {
                        log.error("Unable to add layer [" + type + "]" +
                            item, error);
                    }
                }
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
