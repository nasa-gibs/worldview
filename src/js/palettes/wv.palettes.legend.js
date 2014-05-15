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

        var $legendPanel = $("<div></div>")
                .addClass("wv-palettes-panel");
        $parent.append($legendPanel);
        if ( palette.scale ) {
            renderScale($legendPanel, palette);
        }
        if ( palette.classes ) {
            renderClasses($legendPanel, palette);
        }
        rendered = true;
        self.update();
    };

    var renderScale = function($legendPanel, palette) {
        $colorbar = $("<canvas></canvas>")
                .addClass("wv-palettes-colorbar")
                .attr("title", "X");
        $legendPanel.append($colorbar);

        var $ranges = $("<div></div>")
                .addClass("wv-palettes-ranges");
        var $min = $("<span></span>")
                .addClass("wv-palettes-min");
        var $max = $("<span></span>")
                .addClass("wv-palettes-max");

        $ranges.append($min).append($max);
        $legendPanel.append($ranges);

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
        wv.palettes.colorbar(selector + " .wv-palettes-colorbar");
    };

    var renderClasses = function($legendPanel, palette) {
        var $panel = $("<div></div>")
                .addClass("wv-palettes-classes")
                .attr("title", "X");
        $legendPanel.append($panel);

        var $detailPanel = $("<div></div>");
        _.each(palette.classes.colors, function(color, index) {
            var $row = $("<div></div>")
                .addClass("wv-palettes-class-detail")
                .attr("data-index", index);
            $row.append(
                $("<span></span>")
                    .addClass("wv-palettes-class")
                    .html("&nbsp;")
                    .css("background-color", wv.util.hexToRGB(color)))
            .append(
                $("<span></span>")
                    .addClass("wv-palettes-class-label")
                    .attr("data-index", index)
                    .html(palette.classes.labels[index]));
            $detailPanel.append($row);
        });

        $panel.tooltip({
            position: {
                my: "left middle",
                at: "right+15 middle",
                of: $panel
            },
            content: $detailPanel.html()
        });
    };

    var updateClasses = function(palette) {
        var $panel = $(selector + " .wv-palettes-classes");
        $panel.empty();
        _.each(palette.classes.colors, function(color, index) {
            $panel.append($("<span></span>")
                .attr("data-index", index)
                .addClass("wv-palettes-class")
                .html("&nbsp;")
                .css("background-color", wv.util.hexToRGB(color))
                .hover(highlightClass, unhighlightClass));
        });
    };

    self.update = function() {
        if ( !loaded ) {
            return;
        }
        var palette = model.get(layer.id);
        if ( palette.scale ) {
            wv.palettes.colorbar(selector + " .wv-palettes-colorbar",
                    palette);
            showUnitRange();
        }
        if ( palette.classes ) {
            updateClasses(palette);
        }
    };

    var showUnitRange = function() {
        if ( !loaded ) {
            return;
        }
        var palette = model.get(layer.id);
        var min = palette.scale.labels[0];
        var max = palette.scale.labels[palette.scale.labels.length - 1];
        $(selector + " .wv-palettes-min").html(min);
        $(selector + " .wv-palettes-max").html(max);
        $(selector + " .wv-palettes-center").html("&nbsp;");
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

        var color = info.colors[index];
        var label = info.labels[index];
        $colorbar.tooltip("option", "content",
            "<span class='wv-palettes-color-box' style='background: " +
            wv.util.hexToRGBA(color) + "'>" + "</span>" + label);
    };

    var highlightClass = function() {
        $(".wv-palettes-class-label[data-index='" +
            $(this).attr("data-index") + "']")
            .addClass("wv-palettes-class-highlight");
    };

    var unhighlightClass = function() {
        $(".wv-palettes-class-label[data-index='" +
            $(this).attr("data-index") + "']")
            .removeClass("wv-palettes-class-highlight");
    };


    init();
    return self;
};
