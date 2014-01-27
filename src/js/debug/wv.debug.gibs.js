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

/**
 * @module wv.debug
 */
var wv = wv || {};
wv.debug = wv.debug || {};

/**
 * @class wv.debug.gibs
 */
wv.debug.gibs = wv.debug.gibs || function(ui, models, config) {

    var self = {};

    var init = function() {
        ui.sidebar.collapse();
        ui.dateSliders.collapse();
        $(".olControlScaleLineCustom").hide();
        $(".olControlMousePosition").hide();

        render();
    };

    var render = function() {
        var $div = $(
            "<div id='wv-debug-gibs'>" +
                "<div class='wv-debug-gibs-layer'>" +
                    "<button class='wv-debug-gibs-previous-layer'>-</button>" +
                    "<button class='wv-debug-gibs-next-layer'>+</button>" +
                    "<select class='wv-debug-gibs-layerlist'></select>" +
                "</div>" +
                "<div class='wv-debug-gibs-date'>" +
                    "<button class='wv-debug-gibs-previous-date'>-</button>" +
                    "<button class='wv-debug-gibs-next-date'>+</button>" +
                    "<span class='wv-debug-gibs-date-label'>Date</span>" +
                "</div>" +
            "</div>");
        $("body").append($div);

        var $select = $(".wv-debug-gibs-layerlist");
        var sortedLayers = _.sortBy(config.layers, ["title", "subtitle"]);
        _.each(sortedLayers, function(layer) {
            if ( layer.period === "daily" ) {
                var option = $("<option></option>")
                    .val(layer.id)
                    .html(layer.title + "; " + layer.subtitle);
                $select.append(option);
            }
        });

        $select.on("change", updateLayers);
        models.date.events.on("select", updateDate);

        $(".wv-debug-gibs-next-layer").click(nextLayer);
        $(".wv-debug-gibs-previous-layer").click(previousLayer);

        $(".wv-debug-gibs-next-date").click(nextDate);
        $(".wv-debug-gibs-previous-date").click(previousDate);

        updateLayers.apply($select);
        updateDate();
    };

    var updateLayers = function() {
        var layerId = $(this).val();
        models.layers.clear();
        models.layers.add(layerId);
    };

    var nextLayer = function() {
        $(".wv-debug-gibs-layerlist option:selected")
                .next().attr("selected", "selected");
        updateLayers.apply($(".wv-debug-gibs-layerlist"));
    };

    var previousLayer = function() {
        $(".wv-debug-gibs-layerlist option:selected")
                .prev().attr("selected", "selected");
        updateLayers.apply( $(".wv-debug-gibs-layerlist"));
    };

    var updateDate = function() {
        $(".wv-debug-gibs-date-label").html(
            wv.util.toISOStringDate(models.date.selected));
    };

    var nextDate = function() {
        var d = new Date(models.date.selected.getTime());
        d.setUTCDate(d.getUTCDate() + 1);
        models.date.select(d);
    };

    var previousDate = function() {
        var d = new Date(models.date.selected.getTime());
        d.setUTCDate(d.getUTCDate() - 1);
        models.date.select(d);
    };

    init();
    return self;
};

