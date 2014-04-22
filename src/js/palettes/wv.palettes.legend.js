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
    var loaded = false;

    var self = {};
    var $colorbar;

    var init = function() {
        var $parent = $(selector);

        var $colorbarPanel = $("<div></div>")
                .addClass("wv-palettes-panel");
        $colorbar = $("<canvas></canvas>")
                .addClass("wv-palettes-colorbar")
                .attr("title", "X");

        $colorbarPanel.append($colorbar);
        if ( layer.palette.single ) {
            $colorbar.attr("data-type", "single");
            var $type = $("<span></span>")
                .addClass("wv-palettes-type");
            $colorbarPanel.append($type);
        }

        $parent.append($colorbarPanel);

        if ( !layer.palette.single ) {
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
        }

        if ( layer.palette && layer.type !== "wms" && !layer.palette.single ) {
            $colorbar.on("click", showCustomSelector)
                .addClass("editable");
            $colorbar.on("mousemove", function(event) {
                showUnitHover(event);
            });
            $colorbar.tooltip({
                position: {
                    my: "left middle",
                    at: "right+15 middle",
                    of: $colorbar
                }
            });
        }
        wv.palettes.colorbar(selector + " .wv-palettes-colorbar");
        model.events
            .on("add", updateLegend)
            .on("remove", updateLegend);
        wv.palettes.loadRendered(config, layer.id).done(function() {
            loaded = true;
            updateLegend();
        });
    };

    self.dispose = function() {
        model.events.off("add", updateLegend);
        model.events.off("remove", updateLegend);
    };

    var updateLegend = function() {
        var palette = model.forLayer(layer.id);
        if ( palette ) {
            wv.palettes.colorbar(selector + " .wv-palettes-colorbar", palette);
            showUnitRange();
        }
    };

    var showUnitRange = function() {
        if ( !loaded ) {
            return;
        }
        var palette = model.forLayer(layer.id);
        if (layer.palette.single) {
            $(selector + " .wv-palettes-type").html(palette.values[0]);
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
        if ( !loaded ) {
            return;
        }
        var palette = model.forLayer(layer.id);
        var x = event.pageX - $colorbar.offset().left;
        var width = $colorbar.width();
        var percent = x / width;
        var bins = palette.values.length;
        var index = Math.floor(bins * percent);
        if (index >= bins) {
            index = bins - 1;
        }

        $colorbar.tooltip("option", "content",
            "<span class='wv-palettes-color-box' style='background: #" +
            palette.colors[index] + "'>" + "</span>" + palette.values[index]);
    };

    var showCustomSelector = function(event) {
        if ( wv.palettes.supported ) {
            wv.palettes.custom(config, models, layer);
        } else {
            wv.ui.notify("This feature is not supported with your web " +
                "browser. Upgrade or try again in a different browser");
        }
    };

    init();
    return self;
};

