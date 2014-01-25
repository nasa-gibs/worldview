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
 * @module wv.palette
 */
var wv = wv || {};
wv.palette = wv.palette || {};

wv.palette.legend = wv.palette.legend || function(selector, model, layer) {

    var self = {};
    var colorbar;
    var $colorbar;
    var palette;

    var init = function() {
        var $parent = $(selector);

        var $colorbarPanel = $("<div></div>")
                .addClass("wv-palette-panel");
        $colorbar = $("<canvas></canvas>")
                .addClass("wv-palette-colorbar");
        $colorbarPanel.append($colorbar);
        $parent.append($colorbarPanel);

        var $info = $("<table></table>")
                .addClass("wv-palette-info");
        var $row = $("<tr></tr>");
        var $min = $("<td></td>")
                .addClass("wv-palette-min")
                .html("&nbsp;");
        var $center = $("<td></td>")
                .addClass("wv-palette-center")
                .html("&nbsp;");
        var $max = $("<td></td>")
                .addClass("wv-palette-max")
                .html("&nbsp;");

        $row.append($min).append($center).append($max);
        $info.append($row);

        var $infoPanel = $("<div></div>")
                .addClass("wv-palette-panel");
        $infoPanel.append($info);
        $parent.append($infoPanel);

        colorbar = wv.palette.colorbar(selector + " .wv-palette-colorbar");
        $colorbar.on("mousemove", function(event) {
            showUnitHover(event);
        }).on("mouseout", function() {
            showUnitRange();
        });
        model.load(layer.id).done(function(p) {
            palette = p;
            colorbar.set(palette);
            showUnitRange();
        });
    };

    var showUnitRange = function() {
        if (layer.palette.single) {
            $(selector + " .wv-palette-center").html(palette.values[0]);
        } else if (layer.palette.classified) {
            $(selector + " .wv-palette-center").html("Classes");
        } else {
            var min = palette.values[0];
            var max = palette.values[palette.values.length - 1];
            $(selector + " .wv-palette-min").html(min);
            $(selector + " .wv-palette-max").html(max);
            $(selector + " .wv-palette-center").html("&nbsp;");
        }
    };

    var showUnitHover = function(event) {
        var x = event.pageX - $colorbar.offset().left;
        var width = $colorbar.width();
        var percent = x / width;
        var bins = palette.values.length;
        var index = Math.floor(bins * percent);
        if (index > bins) {
            index = bins;
        }
        $(selector + " .wv-palette-min").html("&nbsp;");
        $(selector + " .wv-palette-max").html("&nbsp;");
        $(selector + " .wv-palette-center").html(palette.values[index]);
    };

    init();
    return self;
};

