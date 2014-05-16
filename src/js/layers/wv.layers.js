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

var wv = wv || {};

wv.layers = (function(self) {

    self.parse = function(state, errors, config) {
        var str = state.products;
        if ( str ) {
            var layers = [];
            var hidden = {};
            var ids = str.split(/[~,\.]/);
            _.each(ids, function(id) {
                if ( id === "baselayers" || id == "overlays" ) {
                    return;
                }
                var visible = true;
                if ( id.startsWith("!") ) {
                    visible = false;
                    id = id.substring(1);
                }
                if ( config.redirects && config.redirects.layers ) {
                    id = config.redirects.layers[id] || id;
                }
                if ( !config.layers[id] ) {
                    errors.push({message: "No such layer: " + id});
                    return;
                }
                layers.push(id);
                if ( !visible ) {
                    hidden[id] = true;
                }
            });
            state.products = layers;
            state.hidden = hidden;
        }
    };

    self.validate = function(errors, config) {
        var error = function(layerId, cause) {
            errors.push({
                message: "Invalid layer: " + layerId,
                cause: cause,
                layerRemoved: true
            });
            delete config.layers[layerId];
            _.remove(config.layerOrder.baselayers, function(e) {
                return e === layerId;
            });
            _.remove(config.layerOrder.overlays, function(e) {
                return e === layerId;
            });
        };

        var layers = _.cloneDeep(config.layers);
        _.each(layers, function(layer) {
            if ( !layer.group ) {
                error(layer.id, "No group defined");
                return;
            }
            if ( !layer.projections ) {
                error(layer.id, "No projections defined");
                return;
            }
        });

        var orders = _.cloneDeep(config.layerOrder);
        _.each(orders, function(layerId) {
            if ( !config.layers[layerId] ) {
                error(layerId, "No configuration");
                return;
            }
        });
    };

    return self;

})(wv.layers || {});
