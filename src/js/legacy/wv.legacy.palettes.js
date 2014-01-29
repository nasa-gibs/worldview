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

/**
 * @module wv.legacy
 */
var wv = wv || {};
wv.legacy = wv.legacy || {};

/**
 * Undocumented.
 *
 * @class wv.legacy.palettes
 */
wv.legacy.palettes = wv.legacy.palettes || function(model) {

    var self = {};

    self.id = "palettes";

    var init = function() {
        REGISTRY.register(self.id, self);
        REGISTRY.markComponentReady(self.id);

        model.events.on("add", fire);
        model.events.on("remove", fire);
        fire();
    };

    self.setValue = function(value) {
        model.fromPermalink(self.id + "=" + value);
    };

    self.getValue = function() {
        return decodeURIComponent(model.toPermalink());
    };

    self.updateComponent = function() {};

    self.loadFromQuery = function(queryString) {
        model.fromPermalink(queryString);
        fire();
    };

    self.parse = function(queryString, object) {
        object.palettes = {};
        palettes = Worldview.extractFromQuery("palettes", queryString);
        object.palettesString = palettes;

        if ( !palettes ) {
            return object;
        }
        var definitions = palettes.split("~");
        $.each(definitions, function(index, definition) {
            var items = definition.split(",");
            var layer = items[0];
            var palette = items[1];
            object.palettes[layer] = palette;
        });
        return object;
    };

    var fire = function() {
        REGISTRY.fire(self);
    };

    init();
    return self;
};