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
                // Layers have to be added in reverse
                layers.unshift(id);
                if ( !visible ) {
                    hidden[id] = true;
                }
            });
            if ( layers.length > 0 ) {
                state.products = layers;
                if ( _.size(hidden) > 0 ) {
                    state.hidden = hidden;
                }
            } else {
                delete state.products;
            }
        }
    };

    return self;

})(wv.layers || {});
