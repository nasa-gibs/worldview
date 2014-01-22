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
wv.palette = wv.palette || {};

/**
 * @class wv.palette.model
 */
wv.palette.model = wv.palette.model || function(models, config) {

    config.palettes = config.palettes || {
        rendered: {},
        custom: {}
    };

    var self = {};
    self.events = wv.util.events();

    self.active = {};

    self.load = function(layerId, callback) {
        var paletteId = config.layers[layerId].palette.id;
        if ( !paletteId ) {
            throw new Error("Layer " + layerId + " does not have a palette");
        }
        var result = $.Deferred();
        if ( config.palettes.rendered[paletteId] ) {
            result.resolve(config.palettes.rendered[paletteId]);
        } else {
            $.getJSON("conf/wv.palette/" + paletteId + ".json", function(data) {
                config.palettes.rendered[paletteId] = data;
                result.resolve(data);
            });
        }
        return result;
    };


    return self;

};