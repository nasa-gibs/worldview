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
 * @module wv.palettes
 */
var wv = wv || {};
wv.palettes = wv.palettes || {};

wv.palettes.legend = wv.palettes.legend || function(spec) {

    var selector = spec.selector;
    var config = spec.config;
    var models = spec.models;
    var model = spec.models.palettes;
    var layer = spec.layer;

    var self = {};
    var $colorbar;

    var init = function() {
        var $parent = $(selector);

        var $colorbarPanel = $("<div></div>")
                .addClass("wv-palettes-panel");
        $colorbar = $("<canvas></canvas>")
                .addClass("wv-palettes-colorbar");
        $colorbarPanel.append($colorbar);
        $parent.append($colorbarPanel);

        var $info = $("<table></table>")
                .addClass("wv-palettes-info");
        var $row = $("<tr></tr>");
        var $min = $("<td></td>")
                .addClass("wv-palettes-min")
                .html("&nbsp;");
        var $center = $("<td></td>")
                .addClass("wv-palettes-center")
                .html("&nbsp;");
        var $max = $("<td></td>")
                .addClass("wv-palettes-max")
                .html("&nbsp;");

        $row.append($min).append($center).append($max);
        $info.append($row);

        var $infoPanel = $("<div></div>")
                .addClass("wv-palettes-panel");
        $infoPanel.append($info);
        $parent.append($infoPanel);

        $colorbar.on("mousemove", function(event) {
            showUnitHover(event);
        }).on("mouseout", function() {
            showUnitRange();
        }).on("click", function() {
            showCustomSelector();
        });
        wv.palettes.colorbar(selector + " .wv-palettes-colorbar");
        model.events
            .on("add", updateLegend)
            .on("remove", updateLegend);
        wv.palettes.loadRendered(config, layer.palette.id).done(updateLegend);
    };

    var updateLegend = function() {
        var palette = model.forLayer(layer.id);
        wv.palettes.colorbar(selector + " .wv-palettes-colorbar", palette);
        showUnitRange();
    };

    var showUnitRange = function() {
        var palette = model.forLayer(layer.id);
        if (layer.palette.single) {
            $(selector + " .wv-palettes-center").html(palette.values[0]);
        } else if (layer.palette.classified) {
            $(selector + " .wv-palettes-center").html("Classes");
        } else {
            var min = palette.values[0];
            var max = palette.values[palette.values.length - 1];
            $(selector + " .wv-palettes-min").html(min);
            $(selector + " .wv-palettes-max").html(max);
            $(selector + " .wv-palettes-center").html("&nbsp;");
        }
    };

    var showUnitHover = function(event) {
        var palette = model.forLayer(layer.id);
        var x = event.pageX - $colorbar.offset().left;
        var width = $colorbar.width();
        var percent = x / width;
        var bins = palette.values.length;
        var index = Math.floor(bins * percent);
        if (index > bins) {
            index = bins;
        }
        $(selector + " .wv-palettes-min").html("&nbsp;");
        $(selector + " .wv-palettes-max").html("&nbsp;");
        $(selector + " .wv-palettes-center").html(palette.values[index]);
    };

    var showCustomSelector = function(event) {
        wv.palettes.custom(config, models, layer);
    };

    init();
    return self;
};

