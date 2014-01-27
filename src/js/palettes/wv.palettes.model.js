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

    self.custom = function() {
        var result = $.Deferred();
        if ( _.size(config.palettes.custom) > 0 ) {
            result.result(config.custom);
        } else {
            $.getJSON("conf/wv.palettes.json")
                .done(function(data) {
                    config.palettes.custom = data;
                    result.resolve(data);
                }).fail(function() {
                    self.events.trigger("error", arguments);
                    result.reject();
                });
        }
    };

    self.forLayer = function(layerId) {
        var paletteId = config.layers[layerId].palette.id;
        if ( !paletteId ) {
            throw new Error("Layer " + layerId + " does not have a palette");
        }
        var result = $.Deferred();
        if ( config.palettes.rendered[paletteId] ) {
            result.resolve(config.palettes.rendered[paletteId]);
        } else {
            $.getJSON("conf/wv.palettes/" + paletteId + ".json")
                .done(function(data) {
                    config.palettes.rendered[paletteId] = data;
                    result.resolve(data);
                }).fail(function() {
                    self.events.trigger("error", arguments);
                    result.reject();
                });
        }
        return result;
    };


    return self;

};