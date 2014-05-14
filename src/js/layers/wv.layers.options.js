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
wv.layers = wv.layers || {};

wv.layers.options = wv.layers.options || function(config, models, layer) {

    var alignTo = "#products";
    var dialog;
    var $dropDown;
    var self = {};
    var canvas;
    var palettes;

    var init = function() {
        if ( layer.palette ) {
            canvas = document.createElement("canvas");
            canvas.width = 140;
            canvas.height = 10;
            var promise = wv.palettes.loadCustom(config).done(loaded);
            wv.ui.indicator.delayed(promise);
        } else {
            loaded();
        }
        models.layers.events.on("remove", onLayerRemoved);
    };

    var loaded = function(custom) {
        var $dialog = wv.ui.getDialog();
        $dialog.attr("id", "wv-layers-options-dialog");
        renderOpacity($dialog);

        if ( custom ) {
            renderRange($dialog);
            renderPaletteSelector($dialog);
        }

        $dialog.dialog({
            dialogClass: "wv-panel",
            title: "Layer options",
            show: { effect: "slide", direction: "left" },
            hide: { effect: "slide", direction: "left" },
            width: 300,
            height: "auto",
            position: {
                my: "left top",
                at: "right+5 top",
                of: $("#products")
            }
        }).iCheck({radioClass: 'iradio_square-grey'});
    };

    var renderOpacity = function($dialog) {
        var def = _.find(models.layers.active, { id: layer.id });
        var $header = $("<div></div>")
            .html("Opacity");
        var $slider = $("<div></div>")
            .noUiSlider({
                start: def.opacity,
                step: 0.01,
                range: {
                    min: 0,
                    max: 1
                },
            }).on("slide", function() {
                models.layers.setOpacity(layer.id, parseFloat($(this).val()));
            });

        $dialog.append($header);
        $dialog.append($slider);
    };

    var renderRange = function($dialog) {
        var def = _.find(models.layers.active, { id: layer.id });
        var rendered = config.palettes.rendered[def.palette.id];
        var max = rendered.scale.colors.length - 1;
        var $header = $("<div></div>")
            .html("Thresholds");
        var $slider = $("<div></div>")
            .noUiSlider({
                start: [0, max],
                step: 1,
                range: {
                    min: 0,
                    max: max
                }
            }).on("set", function() {
                models.palettes.setRange(layer.id,
                    parseFloat($(this).val()[0]),
                    parseFloat($(this).val()[1]));
            });

        $dialog.append($header);
        $dialog.append($slider);
    };

    var renderPaletteSelector = function($dialog) {
        var $pane = $("<div><span autofocus></span>Color palette</div>")
            .attr("id", "wv-palette-selector");
        $pane.append(defaultPalette());
        var recommended = layer.palette.recommended || [];
        _.each(recommended, function(id) {
            $pane.append(customPalette(id));
        });
        _.each(config.paletteOrder, function(id) {
            if ( _.indexOf(recommended, id) < 0 ) {
                $pane.append(customPalette(id));
            }
        });
        $dialog.append($pane);
        $pane.jScrollPane();

        if ( models.palettes.active[layer.id] ) {
            var paletteId = models.palettes.active[layer.id];
            var index = $(".wv-palette-selector-row input[data-palette='" +
                    paletteId + "']").iCheck("check");
        } else {
            $(".wv-palette-selector-row input[data-palette='__default']")
                    .iCheck("check");
        }

        $("#wv-palette-selector input").on("ifChecked", function() {
            var that = this;
            setTimeout(function() {
                var id = $(that).attr("data-palette");
                if ( id === "__default" ) {
                    models.palettes.remove(layer.id);
                } else {
                    models.palettes.add(layer.id, id);
                }
            }, 0);
        });
    };

    var selectorItem = function(palette, id, description) {
        wv.palettes.colorbar(canvas, palette);

        var $row = $("<div></div>")
                .addClass("wv-palette-selector-row");
        var $radio = $("<input></input")
                .attr("type", "radio")
                .attr("id", "wv-palette-radio-" + id)
                .attr("name", "wv-palette-radio")
                .attr("data-palette", id);

        var $label = $("<label></label>")
                .attr("for", "wv-palette-radio-" + id);
        var $image = $("<img></img>")
                .attr("src", canvas.toDataURL("image/png"));
        var $description = $("<span></span>")
                .html(description);
        $label.append($image);
        $label.append($description);

        $row.append($radio);
        $row.append($label);

        return $row;
    };

    var defaultPalette = function() {
        var palette = config.palettes.rendered[layer.palette.id];
        return selectorItem(palette, "__default", "Default");
    };

    var customPalette = function(id) {
        var sourcePalette = config.palettes.rendered[layer.palette.id];
        var targetPalette = config.palettes.custom[id];
        var translatedPalette =
                wv.palettes.translate(sourcePalette.scale, targetPalette);

        return selectorItem(translatedPalette, id, targetPalette.name);
    };

    var selectPalette = function() {
        var index = $dropDown.selectedIndex;
        if ( index > 0 ) {
            models.palettes.add(layer.id, palettes[index].id);
        } else {
            models.palettes.remove(layer.id);
        }
    };

    var onLayerRemoved = function(removedLayer) {
        if ( layer.id === removedLayer.id ) {
            if ( wv.dialogs.customPalette ) {
                dialog.hide();
            }
        }
    };

    init();
    return self;

};
