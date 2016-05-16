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

    var init = function() {
        var paletteId = layer.palette.id;
        if ( config.palettes.rendered[paletteId] ) {
            loaded = true;
            render();
        } else {
            wv.palettes.loadRendered(config, layer.id).done(function() {
                if ( !loaded ) {
                    loaded = true;
                    render();
                    self.update();
                    if ( spec.onLoad ) {
                        spec.onLoad();
                    }
                }
            });
        }
    };

    var render = function() {
        var $parent = $(selector);
        var paletteId = layer.palette.id;
        var palette = config.palettes.rendered[paletteId];

        var $legendPanel = $("<div></div>")
                .addClass("wv-palettes-panel")
                .attr("data-layer", layer.id);
        $parent.append($legendPanel);
        var legends = model.getLegends(layer.id);
        _.each(legends, function(legend, index) {
            if ( legend.type === "scale" ) {
                renderScale($legendPanel, legend, index);
            }
            if ( legend.type === "class" ) {
                renderClasses($legendPanel, legend, index);
            }
        });
        rendered = true;
        self.update();
    };

    var renderScale = function($legendPanel, legend, index) {
        $container = $("<div></div>")
            .addClass("wv-palettes-legend")
            .attr("data-index", index);
        $colorbar = $("<canvas></canvas>")
                .addClass("wv-palettes-colorbar")
                .attr("data-index", index)
                .attr("title", "X");
        $container.append($colorbar);

        var $ranges = $("<div></div>")
                .addClass("wv-palettes-ranges");
        var $min = $("<div></div>")
                .addClass("wv-palettes-min");
        var $max = $("<div></div>")
                .addClass("wv-palettes-max");
        var $title = $("<div></div>")
                .addClass("wv-palettes-title");


        $ranges.append($min).append($max).append($title);
        $container.append($ranges);

        $colorbar.on("mousemove", showUnitHover);
        $colorbar.tooltip({
            position: {
                my: "left middle",
                at: "right+30 middle",
                of: $colorbar
            }
        });
        $legendPanel.append($container);
        wv.palettes.colorbar(selector + " " +
            "[data-index='" + index + "'] canvas", legend.colors);
    };

    var renderClasses = function($legendPanel, legend, index) {
        var $panel = $("<div></div>")
                .addClass("wv-palettes-legend")
                .addClass("wv-palettes-classes")
                .attr("data-index", index)
                .attr("title", "X");
        $legendPanel.append($panel);

        $panel.tooltip({
            position: {
                my: "left middle",
                at: "right+30 middle",
                of: $panel
            },
            content: "X"
        });
    };

    var updateClasses = function(legend, index) {
        var $panel = $(selector + " [data-index='" + index + "']");
        $panel.empty();
        _.each(legend.colors, function(color, classIndex) {
            $panel.append($("<span></span>")
                .attr("data-index", index)
                .attr("data-class-index", classIndex)
                .addClass("wv-palettes-class")
                .html("&nbsp;")
                .css("background-color", wv.util.hexToRGB(color))
                .hover(highlightClass, unhighlightClass));
        });
        var $detailPanel = $("<div></div>");
        _.each(legend.colors, function(color, classIndex) {
            var $row = $("<div></div>")
                .addClass("wv-palettes-class-detail")
                .attr("data-class-index", classIndex);
            $row.append(
                $("<span></span>")
                    .addClass("wv-palettes-class")
                    .html("&nbsp;")
                    .css("background-color", wv.util.hexToRGB(color)))
            .append(
                $("<span></span>")
                    .addClass("wv-palettes-class-label")
                    .attr("data-index", index)
                    .attr("data-class-index", classIndex)
                    .html(legend.labels[classIndex]));
            $detailPanel.append($row);
        });
        $panel.tooltip("option", "content", $detailPanel.html());
    };

    self.update = function() {
        if ( !loaded ) {
            return;
        }
        var legends = model.getLegends(layer.id);
        _.each(legends, function(legend, index) {
            if ( legend.type === "scale" ) {
                wv.palettes.colorbar(selector + " " +
                    "[data-index='" + index + "'] canvas", legend.colors);
                showUnitRange(index);
            } else if ( legend.type === "class" ) {
                updateClasses(legend, index);
            }
        });
    };

    var showUnitRange = function(index) {
        if ( !loaded ) {
            return;
        }
        var legend = model.getLegend(layer.id, index);
        var min = _.first(legend.labels);
        var max = _.last(legend.labels);
        $(selector + " [data-index='" + index + "'] .wv-palettes-min").html(min);
        $(selector + " [data-index='" + index + "'] .wv-palettes-max").html(max);
        var title = legend.title || "&nbsp;";
        $(selector + " [data-index='" + index + "'] .wv-palettes-title").html(title);
    };

    var showUnitHover = function(event) {
        if ( !loaded ) {
            return;
        }
        var index = _.parseInt($(this).attr("data-index"));
        var legend = model.getLegend(layer.id, index);
        var $colorbar = $(this);
        var x = event.pageX - $colorbar.offset().left;
        var width = $colorbar.width();
        var percent = x / width;
        var bins = legend.colors.length;
        var colorIndex = Math.floor(bins * percent);
        if (colorIndex >= bins) {
            colorIndex = bins - 1;
        }

        var color = legend.colors[colorIndex];
        var label = legend.labels[colorIndex];
        $colorbar.tooltip("option", "content",
            "<span class='wv-palettes-color-box' style='background: " +
            wv.util.hexToRGBA(color) + "'>" + "</span>" + label);
    };

    var highlightClass = function() {
        legendIndex = $(this).attr("data-index");
        classIndex = $(this).attr("data-class-index");
        $(".wv-palettes-class-label[data-index='" + legendIndex + "']" +
            "[data-class-index='" + classIndex + "']")
            .addClass("wv-palettes-class-highlight");
    };

    var unhighlightClass = function() {
        legendIndex = $(this).attr("data-index");
        classIndex = $(this).attr("data-class-index");
        $(".wv-palettes-class-label[data-index='" + legendIndex + "']" +
            "[data-class-index='" + classIndex + "']")
            .removeClass("wv-palettes-class-highlight");
    };


    init();
    return self;
};
