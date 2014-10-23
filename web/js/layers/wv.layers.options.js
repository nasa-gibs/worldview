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
    var index = 0;

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
                if ( models.palettes.getLegends(layer.id).length > 1 ) {
                    renderLegendButtons($dialog);
                }
                var legend = models.palettes.getLegend(layer.id, index);
                if ( legend.type === "scale" ) {
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
            hide: { effect: "slide", direction: "left" },
            width: 300,
            height: "auto",
            position: {
                my: "left top",
                at: "right+5 top",
                of: $("#products")
            },
            close: dispose
        })
        //.iCheck({radioClass: 'iradio_square-grey'});
        //$("#wv-layers-options-dialog .jspScrollable").each(function() {
        //    $(this).jScrollPane().data("jsp").reinitialise();
        //});
        ;
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
                },
            }).on("slide", function() {
                models.layers.setOpacity(layer.id, parseFloat($(this).val()));
            });
        var $label = $("<div></div>")
            .addClass("wv-label")
            .addClass("wv-label-opacity");
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

    var renderLegendButtons = function($dialog) {
        var $panel = $("<div></div>")
            .addClass("wv-legend-buttons");
        var legends = models.palettes.getLegends(layer.id);
        _.each(legends, function(legend, index) {
            id = "wv-legend-" + index;
            $panel.append("<input type='radio' id='" + id + "' " +
                "name='legend' value='" + index + "'>" +
                "<label for='" + id + "'>" + legend.title + "</label>");
        });
        $panel.buttonset();
        $dialog.append($panel);
    };

    var renderRange = function($dialog) {
        var legend = models.palettes.getLegend(layer.id, index);
        var max = legend.values.length - 1;
        var $header = $("<div></div>")
            .html("Thresholds")
            .addClass("wv-header");
        var startMin = legend.min || 0;
        var startMax = legend.max || max;
        var $slider = $("<div></div>")
            .noUiSlider({
                start: [startMin, startMax],
                step: 1,
                range: {
                    min: 0,
                    max: max
                }
            }).on("set", function() {
                models.palettes.setRange(
                    parseFloat($(this).val()[0]),
                    parseFloat($(this).val()[1]));
            }).on("slide", function() {
                updateRangeLabels(
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
        $dialog.append($slider);
        $dialog.append($label);
        $range = $slider;
        onRangeUpdate();
    };

    var onRangeUpdate = function() {
        updateRangeLabels();

        var legend = models.palettes.getLegend(layer.id, index);
        var imin = ( _.isUndefined(legend.min) ) ? 0 : legend.min;
        var imax = ( _.isUndefined(legend.max) ) ? legend.values.length - 1
                : legend.max;

        current = [parseFloat($range.val()[0]), parseFloat($range.val()[1])];
        if ( !_.isEqual(current, [imin, imax]) ) {
            $range.val([imin, imax]);
        }
    };

    var updateRangeLabels = function(min, max) {
        var legend = models.palettes.getLegend(layer.id, index);
        min = min || legend.min || 0;
        max = max || legend.max || legend.values.length - 1;

        var minLabel = legend.labels[min];
        var maxLabel = legend.labels[max];
        $("#wv-layers-options-dialog .wv-label-range-min").html(minLabel);
        $("#wv-layers-options-dialog .wv-label-range-max").html(maxLabel);
    };

    var onPaletteUpdateAll = function() {
        onRangeUpdate();
        onPaletteUpdate();
    };

    var renderPaletteSelector = function($dialog) {
        var $header = $("<div></div>")
            .addClass("wv-header")
            .html("Color Palette");
        var $pane = $("<div></div>")
            .attr("id", "wv-palette-selector");

        $pane.append(defaultLegend());
        var recommended = layer.palette.recommended || [];
        _.each(recommended, function(id) {
            var item = customLegend(id);
            if ( item ) {
                $pane.append(item);
            }
        });
        _.each(config.paletteOrder, function(id) {
            if ( _.indexOf(recommended, id) < 0 ) {
                var item = customLegend(id);
                if ( item ) {
                    $pane.append(item);
                }
            }
        });
        $dialog.append($header);
        $dialog.append($pane);
        $pane.jScrollPane();

        var palette = models.palettes.get(layer.id, index);
        if ( palette.custom ) {
            $(".wv-palette-selector-row input[data-palette='" +
                    palette.custom + "']").iCheck("check");
        } else {
            $(".wv-palette-selector-row input[data-palette='__default']")
                    .iCheck("check");
        }

        $("#wv-palette-selector input").on("ifChecked", function() {
            var that = this;
            setTimeout(function() {
                var id = $(that).attr("data-palette");
                if ( id === "__default" ) {
                    models.palettes.clearCustom(layer.id, index);
                } else {
                    models.palettes.setCustom(layer.id, id, index);
                }
            }, 0);
        });
    };

    var onPaletteUpdate = function() {
        var palette = models.palettes.get(layer.id, index);
        if ( palette.custom ) {
            $("#wv-palette-selector input[data-palette='" + palette.custom + "']")
                .iCheck("check");
        } else {
            $("#wv-palette-selector input[data-palette='__default']")
                .iCheck("check");
        }
    };

    var selectorItemScale = function(colors, id, description) {
        wv.palettes.colorbar(canvas, colors);

        var $row = $("<div></div>")
                .addClass("wv-palette-selector-row");
        var $radio = $("<input></input>")
                .attr("type", "radio")
                .attr("id", "wv-palette-radio-" + id)
                .attr("name", "wv-palette-radio")
                .attr("data-palette", id);

        var $label = $("<label></label>")
                .attr("for", "wv-palette-radio-" + id);
        var $image = $("<img></img>")
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
        var $radio = $("<input></input>")
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

    var defaultLegend = function() {
        var legend = models.palettes.getDefaultLegend(layer.id, index);
        if ( legend.type === "scale" ) {
            return selectorItemScale(legend.colors, "__default", "Default");
        } else {
            return selectorItemSingle(legend, "__default", "Default");
        }
    };

    var customLegend = function(id) {
        var source = models.palettes.getDefaultLegend(layer.id, index);
        var target = models.palettes.getCustom(id);
        var targetType = ( target.colors.length === 1 ) ? "single": "scale";

        if ( source.type === "scale" && targetType === "scale" ) {
            var translated = wv.palettes.translate(source.colors,
                    target.colors);
            return selectorItemScale(translated, id, target.name);
        }
        if ( source.type === "single" && targetType === "single" ) {
            return selectorItemSingle(target, id, target.name);
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
