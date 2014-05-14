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
        var paletteId = layer.palette.id;
        if ( config.palettes.rendered[paletteId] ) {
            loaded = true;
            render();
        } else {
            wv.palettes.loadRendered(config, layer.id).done(function() {
                loaded = true;
                render();
                self.update();
            });
        }
    };

    var render = function() {
        var $parent = $(selector);
        var paletteId = layer.palette.id;
        var palette = config.palettes.rendered[paletteId];
        var singleClass = palette.classes && palette.classes.colors.length === 1;

        var $colorbarPanel = $("<div></div>")
                .addClass("wv-palettes-panel");
        $colorbar = $("<canvas></canvas>")
                .addClass("wv-palettes-colorbar")
                .attr("title", "X");

        $colorbarPanel.append($colorbar);
        if ( singleClass ) {
            $colorbar.attr("data-type", "single");
            var $type = $("<span></span>")
                .addClass("wv-palettes-type");
            $colorbarPanel.append($type);
        }

        $parent.append($colorbarPanel);

        if ( !singleClass ) {
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

        if ( layer.palette && !singleClass ) {
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

            $colorbar.addClass("editable");
        }

        wv.palettes.colorbar(selector + " .wv-palettes-colorbar", palette);
        rendered = true;
    };

    self.update = function() {
        if ( !loaded ) {
            return;
        }
        wv.palettes.colorbar(selector + " .wv-palettes-colorbar",
                model.get(layer.id));
        showUnitRange();
    };

    var showUnitRange = function() {
        if ( !loaded ) {
            return;
        }
        var palette = model.get(layer.id);
        var info = palette.scale || palette.classes;
        if ( !info ) {
            return;
        }
        if ( palette.classes && info.colors.length === 1 ) {
            $(selector + " .wv-palettes-type").html(info.labels[0]);
        } else {
            var min = info.labels[0];
            var max = info.labels[info.labels.length - 1];
            $(selector + " .wv-palettes-min").html(min);
            $(selector + " .wv-palettes-max").html(max);
            $(selector + " .wv-palettes-center").html("&nbsp;");
        }
    };

    var showUnitHover = function(event) {
        if ( !loaded ) {
            return;
        }
        var palette = model.get(layer.id);
        var info = palette.scale || palette.classes;
        if ( !info ) {
            return;
        }
        var x = event.pageX - $colorbar.offset().left;
        var width = $colorbar.width();
        var percent = x / width;
        var bins = info.labels.length;
        var index = Math.floor(bins * percent);
        if (index >= bins) {
            index = bins - 1;
        }

        var color = info.colors[index].substring(0, 6);
        var label = info.labels[index];
        $colorbar.tooltip("option", "content",
            "<span class='wv-palettes-color-box' style='background: #" +
            color + "'>" + "</span>" + label);
    };

    init();
    return self;
};
