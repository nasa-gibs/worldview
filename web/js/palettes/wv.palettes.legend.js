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
    var ui = spec.ui;
    var layer = spec.layer;
    var loaded = false;
    var rendered = false;

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
            if ( (legend.type === "continuous") ||
                 (legend.type === "discrete") ) {
                renderScale($legendPanel, legend, index, layer.id);
            }
            if ( legend.type === "classification" ) {
                renderClasses($legendPanel, legend, index);
            }
        });
        self.update();
    };

    var renderScale = function($legendPanel, legend, index, layerId) {
        $container = $("<div></div>")
            .addClass("wv-palettes-legend")
            .attr("data-index", index);
        $colorbar = $("<canvas></canvas>")
                .addClass("wv-palettes-colorbar")
                .attr("id", legend.id)
                .attr("data-index", index);
        //set fixed canvas dimensions
        $colorbar[0].width =  235;
        $colorbar[0].height = 12;

        $container.append($colorbar);

        var $runningDataPointBar = $("<div></div>")
            .addClass("wv-running-bar");
        var $runningDataPointLabel = $("<span></span>")
            .addClass("wv-running-label");


        var $ranges = $("<div></div>")
                .addClass("wv-palettes-ranges");
        var $min = $("<div></div>")
                .addClass("wv-palettes-min");
        var $max = $("<div></div>")
                .addClass("wv-palettes-max");
        var $title = $("<div></div>")
                .addClass("wv-palettes-title");
        $container.prepend($title);
        $ranges
            .append($min)
            .append($max)
            .append($runningDataPointLabel);
        $container
            .append($ranges)
            .append($runningDataPointBar);

        $colorbar.on("mousemove", showUnitHover);
        $colorbar.on("mouseout", hideUnitsOnMouseOut);
        $legendPanel.append($container);
        wv.palettes.colorbar(selector + " " +
            "[data-index='" + index + "'] canvas", legend.colors);
    };
    var renderClasses = function($legendPanel, legend, index) {
        var $runningDataPointLabel = $("<span></span>")
            .addClass("wv-running-category-label");
        var $panel = $("<div></div>")
                .addClass("wv-palettes-legend")
                .addClass("wv-palettes-classes")
                .attr("data-index", index);
        $legendPanel
            .attr("id", legend.id)
            .append($panel)
            .append($runningDataPointLabel);

    };

    var updateClasses = function(legend, index) {
        var $panel = $(selector + " [data-index='" + index + "']");
        $panel.empty();
        _.each(legend.colors, function(color, classIndex) {
            var $colorBox;
            $colorBox = $("<span></span>")
                .attr("data-index", index)
                .attr("data-class-index", classIndex)
                .attr("data-hex", color)
                .addClass("wv-palettes-class")
                .html("&nbsp;")
                .css("background-color", wv.util.hexToRGB(color))
                .hover(highlightClass, unhighlightClass);
            $panel.append($colorBox);
            $colorBox.on('mouseenter', showClassUnitHover);
            $colorBox.on('mouseout', hideUnitsOnMouseOut);
        });
        var $detailPanel = $("<div></div>");
        _.each(legend.colors, function(color, classIndex) {
            var label = legend.tooltips[classIndex];
            label =  (legend.units) ? label + " " + legend.units : label;
            var $row = $("<div></div>")
                .addClass("wv-palettes-class-detail")
                .attr("data-class-index", classIndex);
            $colorBox = 
            $row.append(
                $("<span></span>")
                    .addClass("wv-palettes-class")
                    .html("&nbsp;")
                    .css("background-color", wv.util.hexToRGB(color)))
            .append($("<span></span>")
                    .addClass("wv-palettes-class-label")
                    .attr("data-index", index)
                    .attr("data-class-index", classIndex)
                    .html(label));
            $detailPanel.append($row);
        });
        if( !rendered ) {
            rendered = true;
        }
    };

    self.update = function() {
        if ( !loaded ) {
            return;
        }
        var legends = model.getLegends(layer.id);
        _.each(legends, function(legend, index) {
            if ( (legend.type === "continuous") ||
                 (legend.type === "discrete") ) {
                wv.palettes.colorbar(selector + " " +
                    "[data-index='" + index + "'] canvas", legend.colors);
                showUnitRange(index);
            } else if ( legend.type === "classification" ) {
                updateClasses(legend, index);
            }
        });
    };

    var showUnitRange = function(index) {
        if ( !loaded ) {
            return;
        }
        var legends = model.getLegends(layer.id, index);
        var entries = model.get(layer.id, index).entries;
        _.each(legends, function(legend, index) {
            var min =  legend.minLabel || _.first(legend.tooltips);
            var max =  legend.maxLabel || _.last(legend.tooltips);
            min = (legend.units) ? min + " " + legend.units : min;
            max = (legend.units) ? max + " " + legend.units : max;
            $(selector + " [data-index='" + index + "'] .wv-palettes-min")
                .html(min);
            $(selector + " [data-index='" + index + "'] .wv-palettes-max")
                .html(max);
            var title = legend.title || "&nbsp;";
            if ( legends.length === 1) {
                $(selector + " [data-index='" + index + "'] .wv-palettes-title").hide();
            }
            else{
                $(selector + " [data-index='" + index + "'] .wv-palettes-title").html(title);
            }
        });
    };
    /**
     * get color from canvas bar and
     * send it to data processing
     *
     * @method showUnitHover
     * @static
     * @param {MouseEvent} e
     * @return {void}
     */
    var showUnitHover = function(e) {
        var rgba;
        var pos;
        var x;
        var y;
        var id;
        var legends;
        if ( !loaded ) {
            return;
        }
        legends = model.getLegends(layer.id)[0];
        offset = $(this).offset();
        x = e.pageX - offset.left;
        y = e.pageY - offset.top;
        rgba = wv.util.getCanvasPixelData(this, x, y);
        hex = wv.util.rgbaToHex(rgba[0], rgba[1], rgba[2]);
        ui.map.runningdata.newLegend(legends, hex);
    };

    /**
     * get color from data attr and
     * send it to data processing and
     * render legend
     *
     * @method showClassUnitHover
     * @static
     * @param {MouseEvent} e
     * @return {void}
     */
    var showClassUnitHover = function(e) {
        var hex = $(this).data('hex');
        var legends = model.getLegends(layer.id)[0];
        ui.map.runningdata.newLegend(legends, hex);
    };

    /**
     * get color from data attr and
     * send it to data processing and
     * render legend
     *
     * @method showClassUnitHover
     * @static
     * @param {MouseEvent} e
     * @return {void}
     */
    var hideUnitsOnMouseOut = function() {
        ui.map.runningdata.clearAll();
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
