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
    var $dialog;
    var $opacity;
    var $range;
    var $dropDown;
    var self = {};
    var canvas;
    var palettes;

    var init = function() {
        canvas = document.createElement("canvas");
        canvas.width = 120;
        canvas.height = 10;
        if ( config.features.customPalettes ) {
            wv.palettes.loadCustom(config).done(loaded);
        } else {
            loaded();
        }
    };

    var loaded = function(custom) {
        $dialog = wv.ui.getDialog();
        $dialog
            .attr("id", "wv-layers-options-dialog")
            .attr("data-layer", layer.id);
        renderOpacity($dialog);

        if ( config.features.customPalettes ) {
            if ( models.palettes.allowed(layer.id) ) {
                if ( models.palettes.type(layer.id) === "scale" ) {
                    renderRange($dialog);
                }
                renderPaletteSelector($dialog);
            }
        }
        var names = models.layers.getTitles(layer.id);
        $dialog.dialog({
            dialogClass: "wv-panel",
            title: names.title,
            show: { effect: "slide", direction: "left" },
            width: 300,
            height: "auto",
            position: {
                my: "left top",
                at: "right+5 top",
                of: $("#products")
            },
            close: dispose
        })
        .iCheck({
            radioClass: 'iradio_square-grey',
            checkboxClass: 'icheckbox_square-grey'
        });

        $("#wv-layers-options-dialog").find(".jspScrollable").each(function() {
            $(this).jScrollPane().data("jsp").reinitialise();
        });

        $("#wv-squash-button-check").on("ifChanged", function() {
            var squash = $("#wv-squash-button-check").prop("checked");
            var $slider = $("#wv-range-slider");
            models.palettes.setRange(layer.id,
                parseFloat($slider.val()[0]),
                parseFloat($slider.val()[1]),
                squash);
        });

        models.layers.events
            .on("remove", onLayerRemoved)
            .on("opacity", onOpacityUpdate);
        models.palettes.events
            .on("range", onRangeUpdate)
            .on("update", onPaletteUpdateAll);
    };

    var dispose = function() {
        models.layers.events
            .off("remove", onLayerRemoved)
            .off("opacity", onOpacityUpdate);
        models.palettes.events
            .off("range", onRangeUpdate)
            .off("update", onPaletteUpdateAll);
        $dialog = null;
        wv.ui.closeDialog();
    };

    var renderOpacity = function($dialog) {
        var $header = $("<div></div>")
            .html("Opacity")
            .addClass("wv-header");
        var $slider = $("<div></div>")
            .noUiSlider({
                start: layer.opacity,
                step: 0.01,
                range: {
                    min: 0,
                    max: 1
                }
            }).on("slide", function() {
                models.layers.setOpacity(layer.id, parseFloat($(this).val()));
            });
        var $label = $("<div></div>")
            .addClass("wv-label wv-label-opacity");
        $dialog.append($header);
        $dialog.append($slider);
        $dialog.append($label);
        $opacity = $slider;
        onOpacityUpdate(layer, layer.opacity);
    };

    var onOpacityUpdate = function(def, opacity) {
        if ( def.id !== layer.id ) {
            return;
        }
        var label = (opacity * 100).toFixed(0)  + "%";
        $("#wv-layers-options-dialog .wv-label-opacity").html(label);
        if ( $opacity.val() !== opacity ) {
            $opacity.val(opacity);
        }
    };

    var renderRange = function($dialog) {
        var layerDef = _.find(models.layers.active, { id: layer.id });
        var paletteDef = models.palettes.get(layerDef.id);
        var rendered = config.palettes.rendered[layerDef.palette.id];
        var max = rendered.scale.colors.length - 1;
        var $header = $("<div></div>")
            .html("Thresholds")
            .addClass("wv-header");

        var $squash = $("<div></div>")
            .addClass("wv-palette-squash");
        var $squashButton = $("<input />")
            .attr("type", "checkbox")
            .attr("id", "wv-squash-button-check");
        var $squashLabel = $("<label></label>")
            .attr("for", "wv-squash-button-check")
            .attr("title", "Squash Palette")
            .html("Squash Palette");
        $squash.append($squashButton).append($squashLabel);

        var startMin = paletteDef.min || 0;
        var startMax = paletteDef.max || max;
        var startSquash = paletteDef.squash;
        var $slider = $("<div></div>")
            .attr("id", "wv-range-slider")
            .noUiSlider({
                start: [startMin, startMax],
                step: 1,
                range: {
                    min: 0,
                    max: max
                }
            }).on("set", function() {
                var squash = $("#wv-squash-button-check").prop("checked");
                models.palettes.setRange(layer.id,
                    parseFloat($(this).val()[0]),
                    parseFloat($(this).val()[1]),
                    squash);
            }).on("slide", function() {
                updateRangeLabels(layer.id,
                    parseFloat($(this).val()[0]),
                    parseFloat($(this).val()[1]));
            });
        var $label = $("<div>&nbsp;</div>")
            .addClass("wv-label");
        $label.append($("<span></span>")
            .addClass("wv-label-range-min"));
        $label.append($("<span></span>")
            .addClass("wv-label-range-max"));
        $dialog.append($header);
        $dialog.append($squash);
        $dialog.append($slider);
        $dialog.append($label);
        $range = $slider;

        onRangeUpdate(layer.id, startMin, startMax, startSquash);
    };

    var onRangeUpdate = function(layerId, min, max, squash) {
        updateRangeLabels(layerId, min, max);

        var count = models.palettes.get(layerId).scale.colors.length;
        var imin = ( _.isUndefined(min) ) ? 0 : min;
        var imax = ( _.isUndefined(max) ) ? count - 1: max;

        var current = [parseFloat($range.val()[0]), parseFloat($range.val()[1])];
        if ( !_.isEqual(current, [imin, imax]) ) {
            $range.val([imin, imax]);
        }
        $("#wv-squash-button-check").prop("checked", squash);
    };

    var updateRangeLabels = function(layerId, min, max) {
        if ( layerId !== layer.id ) {
            return;
        }
        var layerDef = config.layers[layerId];
        var active = models.palettes.get(layerId);
        var rendered = config.palettes.rendered[layerDef.palette.id];

        if ( _.isUndefined(min) ) {
            min = active.min || 0;
        }
        max = max || active.max || rendered.scale.colors.length;

        var minLabel = rendered.scale.labels[min];
        var maxLabel = rendered.scale.labels[max], dialog_sel = $("#wv-layers-options-dialog");
        dialog_sel.find(".wv-label-range-min").html(minLabel);
        dialog_sel.find(".wv-label-range-max").html(maxLabel);
    };

    var onPaletteUpdateAll = function() {
        var def = models.palettes.get(layer.id);
        var min = ( _.isUndefined(def.min) ) ? 0 : def.min;
        var max = ( _.isUndefined(def.max) ) ? def.scale.colors.length - 1 : def.max;
        onRangeUpdate(layer.id, min, max);
        onPaletteUpdate();
    };

    var renderPaletteSelector = function($dialog) {
        var $header = $("<div></div>")
            .addClass("wv-header wv-color-palette-label")
            .html("Color Palette");
        var $pane = $("<div></div>")
            .attr("id", "wv-palette-selector");
        var palette = models.palettes.get(layer.id);
        $pane.append(defaultPalette());
        var recommended = layer.palette.recommended || [];
        _.each(recommended, function(id) {
            var item = customPalette(id);
            if ( item ) {
                $pane.append(item);
            }
        });
        _.each(config.paletteOrder, function(id) {
            if ( _.indexOf(recommended, id) < 0 ) {
                var item = customPalette(id);
                if ( item ) {
                    $pane.append(item);
                }
            }
        });
        $dialog.append($header);
        $dialog.append($pane);
        $pane.jScrollPane();

        if ( palette.custom ) {
            var index = $(".wv-palette-selector-row input[data-palette='" +
                    palette.custom + "']").iCheck("check");
        } else {
            $(".wv-palette-selector-row input[data-palette='__default']")
                    .iCheck("check");
        }

        $("#wv-palette-selector").find("input").on("ifChecked", function() {
            var that = this;
            setTimeout(function() {
                var id = $(that).attr("data-palette");
                if ( id === "__default" ) {
                    models.palettes.clearCustom(layer.id);
                } else {
                    models.palettes.setCustom(layer.id, id);
                }
            }, 0);
        });
    };

    var onPaletteUpdate = function() {
        var def = models.palettes.get(layer.id);
        if ( def.custom ) {
            $("#wv-palette-selector input[data-palette='" + def.custom + "']")
                .iCheck("check");
        } else {
            $("#wv-palette-selector input[data-palette='__default']")
                .iCheck("check");
        }
    };

    var selectorItemScale = function(palette, id, description) {
        wv.palettes.colorbar(canvas, palette);

        var $row = $("<div></div>")
                .addClass("wv-palette-selector-row");
        var $radio = $("<input />")
                .attr("type", "radio")
                .attr("id", "wv-palette-radio-" + id)
                .attr("name", "wv-palette-radio")
                .attr("data-palette", id);

        var $label = $("<label></label>")
                .attr("for", "wv-palette-radio-" + id);
        var $image = $("<img />")
                .attr("src", canvas.toDataURL("image/png"));
        var $description = $("<span></span>")
                .addClass("wv-palette-label")
                .html(description);
        $label.append($image);
        $label.append($description);

        $row.append($radio);
        $row.append($label);

        return $row;
    };

    var selectorItemSingle = function(palette, id, description) {
        var $row = $("<div></div>")
            .addClass("wv-palette-selector-row");
        var $radio = $("<input />")
            .attr("type", "radio")
            .attr("id", "wv-palette-radio-" + id)
            .attr("name", "wv-palette-radio")
            .attr("data-palette", id);

        var color = ( palette.classes ) ? palette.classes.colors[0] : palette.colors[0];
        var $label = $("<label></label>")
            .attr("for", "wv-palette-radio-" + id);
        var $image = $("<span></span>")
            .addClass("wv-palettes-class")
            .css("background-color", wv.util.hexToRGB(color))
            .html("&nbsp;");
        var $description = $("<span></span>")
            .html(description)
            .addClass("wv-palette-label");
        $label.append($image);
        $label.append($description);

        $row.append($radio);
        $row.append($label);

        return $row;
    };

    var defaultPalette = function() {
        var palette = config.palettes.rendered[layer.palette.id];
        if ( models.palettes.type(layer.id) === "scale" ) {
            return selectorItemScale(palette, "__default", "Default");
        } else {
            return selectorItemSingle(palette, "__default", "Default");
        }
    };

    var customPalette = function(id) {
        var targetPalette = config.palettes.custom[id];
        var sourceType = models.palettes.type(layer.id);
        var targetType = ( targetPalette.colors.length === 1 ) ? "single" : "scale";

        if ( sourceType === "scale" && targetType === "scale" ) {
            var sourcePalette = config.palettes.rendered[layer.palette.id];
            var translatedPalette =
                    wv.palettes.translate(sourcePalette.scale, targetPalette);
            return selectorItemScale(translatedPalette, id, targetPalette.name);
        }
        if ( sourceType === "single" && targetType === "single" ) {
            return selectorItemSingle(targetPalette, id, targetPalette.name);
        }
    };

    var onLayerRemoved = function(removedLayer) {
        if ( layer.id === removedLayer.id && $dialog ) {
            $dialog.dialog("close");
        }
    };

    init();
    return self;

};
