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

Worldview.namespace("Widget");

Worldview.Widget.Palette = function(config, model, spec) {

    var self = {};
    var containerId = "palettes";
    var log = Logging.getLogger("Worldview.Widget.Palette");
    var value = "";
    var dialog = null;
    var dialogForLayer = null;

    self.config = config;
    self.active = {};
    self.inactive = {};
    self.alignTo = spec.alignTo;
    self.noRestore = false;

    var init = function() {
        //Logging.debug("Worldview.Widget.Palette");
        if ( REGISTRY ) {
            REGISTRY.register(containerId, self);
        } else {
            throw new Error("Cannot register paletteWidget, REGISTRY " +
                    "not found");
        }
        REGISTRY.markComponentReady(containerId);
    };

    self.getPalette = function(layer) {
        var name = self.active[layer];
        if ( !name || !config.palettes[name] ) {
            name = config.layers[layer].rendered;
        }
        if ( !name ) {
            return null;
        }
        return config.palettes[name];
    };

    self.setValue = function(v) {
        if ( v === undefined ) {
            return;
        }
        log.debug("setValue: " + v);
        self.active = {};
        var parts = v.split("~");
        $.each(parts, function(index, part) {
            var segments = part.split(",");
            var layerName = segments[0];
            var paletteName = segments[1];
            self.active[layerName] = paletteName;
            self.inactive[layerName] = paletteName;
            model.events.trigger("palette", self.getPalette(layerName),
                    layerName);
        });
        REGISTRY.fire(self);
    };

    self.getValue = function() {
        try {
            var parts = [];
            $.each(self.active, function(product, palette) {
                if ( palette ) {
                    parts.push(product + "," + palette);
                }
            });
            var qs = "";
            if ( parts.length > 0 ) {
                qs = containerId + "=" + parts.join("~");
            }
            return qs;
        } catch ( error ) {
            Worldview.error("Unable to update", error);
        }
    };

    self.updateComponent = function(queryString) {
        if ( REGISTRY.isLoadingQuery ) {
            return;
        }
        queryString = queryString || "";
        var changed = false;
        try {
            var state = REGISTRY.getState(queryString);
            log.debug("Palette: updateComponent", state);
            $.each(self.active, function(layer, palette) {
                if ( $.inArray(layer, state.layers) < 0 ) {
                    log.debug("Removing palette for " + layer);
                    delete self.active[layer];
                    changed = true;
                }
            });
            $.each(self.inactive, function(layer, palette) {
                if ( !self.noRestore &&
                        $.inArray(layer, state.layers) >= 0 &&
                        !self.active[layer] ) {
                    log.debug("Restoring palette for " + layer);
                    self.active[layer] = self.inactive[layer];
                    changed = true;
                }
            });
            if ( dialogForLayer &&
                    $.inArray(dialogForLayer, state.layers) < 0 ) {
                dialog.hide();
            }
            if ( changed ) {
                REGISTRY.fire(self);
            }
        } catch ( error ) {
            Worldview.error("Unable to update state", error);
        }
    };

    self.loadFromQuery = function(queryString) {
        var query = Worldview.queryStringToObject(queryString);
        log.debug("Palette: loadFromQuery", query);
        if ( query.palettes && !Worldview.Support.allowCustomPalettes() ) {
            Worldview.Support.showUnsupportedMessage("custom palette");
        } else {
            self.setValue(query.palettes);
        }
    };

    self.displaySelector = function(layer) {
        if ( dialog ) {
            dialog.hide();
            setTimeout(function() {
                showSelector(layer);
            }, 6);
        } else {
            showSelector(layer);
        }
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

    var showSelector = function(layer) {
        var layerConfig = self.config.layers[layer];
        var properties = {
            width: "245px",
            height: "265px",
            visible: false,
            autofillheight: "body",
            constraintoviewport: true ,
            zindex: 210
        };
        if ( self.alignTo ) {
            var $element = $(self.alignTo);
            properties.x = Math.ceil($element.offset().left +
                    $element.width() + 20);
            properties.y = Math.ceil($element.offset().top);
        }

        dialog = new YAHOO.widget.Panel("palette-selector-dialog",
                properties);
        dialogForLayer = layer;
        dialog.setHeader("Select palette");
        dialog.setBody([
            "<div class='product-name'>" + layerConfig.name + "</div>",
            "<div class='product-description'>" +
                layerConfig.description +
            "</div>" +
            "<div id='palette-selector'></div>"
        ].join("\n"));
        dialog.hideEvent.subscribe(function(i) {
            setTimeout(function() {
                dialog.destroy();
                dialog = null;
                dialogForLayer = null;
            }, 5);
        });
        dialog.render(document.body);

        var palettes = [];
        var canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 14;

        // The default palette the layer is rendered in
        var renderedName = layerConfig.rendered;

        var renderedPalette = $.extend(true, {},
                config.palettes[renderedName]);
        var renderedColorBar = Worldview.Palette.ColorBar({
            canvas: canvas,
            palette: renderedPalette,
            bins: layerConfig.bins,
            stops: layerConfig.stops
        });
        renderedPalette.name = "Default";
        renderedPalette.image = renderedColorBar.toImage();
        palettes.push(renderedPalette);

        var activePalette = self.active[layer];
        var selected = null;

        // Palettes for the drop down, place the recommended ones first
        if ( layerConfig.recommendedPalettes ) {
            $.each(layerConfig.recommendedPalettes, function(index, name) {
                var palette = config.palettes[name];
                var colorBar = Worldview.Palette.ColorBar({
                    canvas: canvas,
                    palette: palette,
                    bins: layerConfig.bins,
                    stops: layerConfig.stops
                });
                palette.image = colorBar.toImage();
                palettes.push(palette);
            });
        }

        $.each(self.config.paletteOrder, function(index, name) {
            if ( $.inArray(name, layerConfig.recommendedPalettes) >= 0 ) {
                return;
            }
            var p = self.config.palettes[name];

            // Skip this palette if configuration says to exclude
            if ( $.inArray(name, layerConfig.excludePalettes) >= 0 ) {
                return;
            }
            if ( !p ) {
                log.error("No such palette: " + name);
                return;
            }
            if ( p.source === "stock" ) {
                var palette = $.extend(true, {}, p);
                var colorBar = Worldview.Palette.ColorBar({
                    canvas: canvas,
                    palette: palette,
                    bins: layerConfig.bins,
                    stops: layerConfig.stops
                });
                palette.image = colorBar.toImage();
                palettes.push(palette);
            }
        });

        $.each(palettes, function(index, palette) {
            if ( palette.id === activePalette ) {
                selected = index;
            }
        });

        var paletteSelector = Worldview.Palette.PaletteSelector({
            selector: "#palette-selector",
            palettes: palettes
        });
        if ( selected !== null ) {
            paletteSelector.select(selected);
        }

        paletteSelector.addSelectionListener(function(palette) {
            var log = Logging.getLogger("Worldview.PaletteSelection");
            if ( palette.source === "rendered" ) {
                delete self.active[layer];
                delete self.inactive[layer];
                log.debug("Palette: default");
            } else {
                self.active[layer] = palette.id;
                self.inactive[layer] = palette.id;
                log.debug("Palette: " + palette.id);
            }
            model.events.trigger("palette", palette, layer);
            REGISTRY.fire(self);
        });

        dialog.show();
    };

    init();
    return self;
};
