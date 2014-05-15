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
 * @module wv.palettes
 */
var wv = wv || {};

wv.palettes = (function(self) {

    var checkerboard;

    self.supported = true;

    var init = function() {
        var browser = wv.util.browser;
        if ( browser.ie || !browser.webWorkers || !browser.cors ) {
            self.supported = false;
        } else {
            drawCheckerboard();
        }
    };

    self.colorbar = function(target, palette) {
        var canvas;
        if ( target.length ) {
            canvas = $(target).get(0);
        } else {
            canvas = target;
        }
        var g = canvas.getContext("2d");

        g.fillStyle = checkerboard;
        g.fillRect(0, 0, canvas.width, canvas.height);
        if ( !palette ) {
            return;
        }
        var info = palette.scale || palette.classes;
        if ( info ) {
            var colors = info.colors;
            var bins = info.colors.length;
            var binWidth = canvas.width / bins;
            var drawWidth = Math.ceil(binWidth);
            _.each(info.colors, function(color, i) {
                g.fillStyle = "rgba(" +
                    parseInt(color.substring(0,2), 16) + "," +
                    parseInt(color.substring(2,4), 16) + "," +
                    parseInt(color.substring(4,6), 16) + "," +
                    parseInt(color.substring(6,8), 16) + ")";
                g.fillRect(Math.floor(binWidth * i), 0, drawWidth,
                        canvas.height);
            });
        }
    };

    var drawCheckerboard = function() {
        var size = 2;
        var canvas = document.createElement("canvas");

        canvas.width = size * 2;
        canvas.height = size * 2;

        var g = canvas.getContext("2d");

        //g.fillStyle = "rgb(102, 102, 102)";
        g.fillStyle = "rgb(200, 200, 200)";
        g.fillRect(0, 0, size, size);
        g.fillRect(size, size, size, size);

        //g.fillStyle = "rgb(153, 153, 153)";
        g.fillStyle = "rgb(240, 240, 240)";
        g.fillRect(0, size, size, size);
        g.fillRect(size, 0, size, size);

        checkerboard = g.createPattern(canvas, "repeat");
    };

    self.translate = function(sourcePalette, targetPalette) {
        var sourceCount = sourcePalette.colors.length;
        var targetCount = targetPalette.colors.length;

        var newPalette = {
            "id": targetPalette.id,
            "name": targetPalette.name || undefined,
            "values": sourcePalette.values || undefined
        };
        var newColors = [];
        _.each(sourcePalette.colors, function(color, index) {
            var sourcePercent = index / sourceCount;
            var targetIndex = Math.floor(sourcePercent * targetCount);
            newColors.push(targetPalette.colors[targetIndex]);
        });
        newPalette.colors = newColors;
        return newPalette;
    };

    self.lookup = function(sourcePalette, targetPalette) {
        var lookup = {};
        _.each(sourcePalette.colors, function(sourceColor, index) {
            var source =
                parseInt(sourceColor.substring(0, 2), 16) + "," +
                parseInt(sourceColor.substring(2, 4), 16) + "," +
                parseInt(sourceColor.substring(4, 6), 16) + "," +
                "255";
            var targetColor = targetPalette.colors[index];
            var target = {
                r: parseInt(targetColor.substring(0, 2), 16),
                g: parseInt(targetColor.substring(2, 4), 16),
                b: parseInt(targetColor.substring(4, 6), 16),
                a: 255
            };
            lookup[source] = target;
        });
        return lookup;
    };

    self.loadCustom = function(config) {
        return wv.util.load(config.palettes, "custom", "config/palettes-custom.json");
    };

    self.loadRendered = function(config, layerId) {
        var layer = config.layers[layerId];
        return wv.util.load(config.palettes.rendered, layer.palette.id,
                "config/palettes/" + layer.palette.id + ".json");
    };

    self.parse = function(state, errors, config) {
        if ( state.palettes ) {
            if ( !wv.palettes.supported ) {
                // FIXME: This should go in errors
                delete state.palettes;
                wv.ui.notify("The custom palette feature is not supported " +
                        "with your web browser. Upgrade or try again in a " +
                        "different browser");
                return;
            }
            var results = {};
            var parts = state.palettes.split("~");
            _.each(parts, function(part) {
                var items = part.split(",");
                var layerId = items[0];
                var paletteId = items[1];
                if ( !config.layers[layerId] ) {
                    errors.push({message: "Invalid layer for palette " +
                        paletteId + ": " + layerId});
                } else if ( !config.layers[layerId].palette ) {
                    errors.push({message: "Layer " + layerId + " does not " +
                        "support palettes"});
                } else {
                    results[layerId] = paletteId;
                }
            });
            if ( _.size(results) > 0 ) {
                state.palettes = results;
            } else {
                delete state.palettes;
            }
        }
    };

    self.requirements = function(state, config) {
        var promises = [];
        config.palettes = {
            rendered: {},
            custom: {}
        };
        if ( config.parameters.palettes ) {
            promises.push(self.loadCustom(config));
        }
        _.each(state.products, function(layerId) {
            if ( config.layers[layerId].palette ) {
                promises.push(self.loadRendered(config, layerId));
            }
        });
        if ( promises.length > 0 ) {
            var promise = $.Deferred();
            $.when.apply(null, promises)
                .then(promise.resolve)
                .fail(promise.reject);
            return promise;
        }
    };

    init();
    return self;

})(wv.palettes || {});
