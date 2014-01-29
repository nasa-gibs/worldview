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

var wv = wv || {};
wv.palettes = wv.palettes || {};

wv.palettes.custom = wv.palettes.custom || function(config, models, layer) {

    var alignTo = "#products";
    var dialog;
    var $dropDown;
    var self = {};
    var canvas;
    var palettes;

    var init = function() {
        canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 14;

        var url = wv.brand.url("conf/wv.palettes.json");
        var promise = wv.util.load(config.palettes, "custom", url);
        promise.done(loaded).fail(wv.util.error);
        wv.ui.indicator.delayed(promise);
    };

    var loaded = function(custom) {
        var properties = {
            width: "245px",
            height: "265px",
            visible: false,
            autofillheight: "body",
            constraintoviewport: true ,
            zindex: 210
        };

        var $element = $(alignTo);
        properties.x = Math.ceil($element.offset().left +
                $element.width() + 20);
        properties.y = Math.ceil($element.offset().top);

        dialog = new YAHOO.widget.Panel("palette-selector-dialog",
                properties);
        dialog.setHeader("Select palette");
        dialog.setBody([
            "<div class='product-name'>" + layer.title + "</div>",
            "<div class='product-description'>" +
                layer.subtitle +
            "</div>" +
            "<div id='palette-selector'></div>"
        ].join("\n"));
        dialog.hideEvent.subscribe(function(i) {
            setTimeout(function() {
                dialog.destroy();
                dialog = null;
            }, 5);
        });
        dialog.render(document.body);

        palettes = [];
        palettes.push(defaultPalette());
        _.each(config.paletteOrder, function(id) {
            palettes.push(customPalette(id));
        });


        $dropDown = $("#palette-selector").msDropDown({
            byJson: {
                name: "Palettes",
                data: palettes,
                width: 225,
            },
            visibleRows: 5,
            rowHeight: 17
        }).data("dd");

        $dropDown.on("change", selectPalette);

        /*
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
                console.error("No such palette: " + name);
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
            if ( palette.source === "rendered" ) {
                delete self.active[layer];
                delete self.inactive[layer];
            } else {
                self.active[layer] = palette.id;
                self.inactive[layer] = palette.id;
            }
            model.events.trigger("palette", palette, layer);
            REGISTRY.fire(self);
        });
        */
        dialog.show();
    };

    var defaultPalette = function() {
        var palette = config.palettes.rendered[layer.palette.id];
        wv.palettes.colorbar(canvas, palette);
        return {
            text: "Default",
            image: canvas.toDataURL("image/png")
        };
    };

    var customPalette = function(id) {
        var palette = config.palettes.custom[id];
        wv.palettes.colorbar(canvas, palette);
        return {
            text: palette.name,
            image: canvas.toDataURL("image/png"),
            id: palette.id
        };
    };

    var selectPalette = function() {
        var index = $dropDown.selectedIndex;
        if ( index > 0 ) {
            models.palettes.add(layer.id, palettes[index].id);
        } else {
            models.palettes.remove(layer.id);
        }
    };


    init();
    return self;

};

