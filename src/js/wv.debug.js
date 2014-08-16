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
wv.debug = wv.debug || (function() {

    var self = {};

    self.loadDelay = function(configURI, parameters) {
        var delay = parseInt(parameters.loadDelay);
        promise = $.Deferred();
        $.getJSON(configURI).done(function(data) {
            setTimeout(function() {
                promise.resolve(data);
            }, delay);
        });
        return promise;
    };

    self.error = function(parameters) {
        if ( parameters.showError ) {
            wv.util.error();
        }
    };

    return self;

})();


/**
 * @class wv.debug.gibs
 */
wv.debug.layers = wv.debug.layers || function(ui, models, config) {

    var type;
    var selectedLayer;

    var init = function() {
        type = config.parameters.debug;
        if ( config.parameters.debugGIBS ) {
            type = "gibs";
        }
        if ( type === "gibs" ) {
            ui.sidebar.collapse();
            ui.dateSliders.collapse();
        }
        if ( type ) {
            if ( type === "palettes" ) {
                wv.palettes.loadCustom(config).done(render);
            } else {
                render();
            }
        }
    };

    var render = function(type) {
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

        initLayers();
        var $select = $(".wv-debug-gibs-layerlist");
        $select.on("change", updateLayers);
        models.date.events.on("select", updateDate);
        models.proj.events.on("select", initLayers);

        $(".wv-debug-gibs-next-layer").click(nextLayer);
        $(".wv-debug-gibs-previous-layer").click(previousLayer);

        $(".wv-debug-gibs-next-date").click(nextDate);
        $(".wv-debug-gibs-previous-date").click(previousDate);

        updateDate();
    };

    var acceptLayer = function(layer) {
        var proj = models.proj.selected.id;
        if ( !layer.projections[proj] ) {
            return false;
        }
        if ( layer.id === "Land_Water_Map" || layer.id === "Land_Mask" ) {
            return false;
        }
        if ( type === "gibs" && layer.period === "daily" && layer.type === "wmts" ) {
            return true;
        }
        if ( type === "palettes" && layer.palette && !layer.palette.single &&
                layer.type !== "wms" ) {
            return true;
        }
        if ( type === "dataDownload" && layer.product ) {
            return true;
        }
        if ( type === "layers" ) {
            return true;
        }
        return false;
    };

    var initLayers = function() {
        var $select = $(".wv-debug-gibs-layerlist");
        $select.empty();
        var proj = models.proj.selected.id;
        var sortedLayers = _.sortBy(config.layers, ["title", "subtitle"]);
        _.each(sortedLayers, function(layer) {
            if ( acceptLayer(layer) ) {
                var names = models.layers.getTitles(layer.id);
                var text = names.title + "; " + names.subtitle;
                if ( text.length > 65 ) {
                    text = text.substr(0, 65) + "...";
                }
                var option = $("<option></option>")
                    .val(layer.id)
                    .html(text);
                $select.append(option);
            }
        });
        models.layers.clear();
        if ( type !== "gibs" ) {
            models.layers.add("Land_Water_Map");
        }
        updateLayers.apply($select);
        if ( type === "dataDownload" ) {
            models.data.activate();
        }
    };

    var updateLayers = function() {
        var layerId = $(this).val();
        var names = models.layers.getTitles(layerId);
        console.log(names.title + "; " + names.subtitle);
        if ( selectedLayer ) {
            models.layers.remove(selectedLayer);
            models.palettes.remove(selectedLayer);
        }
        models.layers.add(layerId);
        if ( type !== "gibs" ) {
            var range = models.layers.dateRange();
            if ( range ) {
                range.end.setUTCDate(range.end.getUTCDate() - 1);
                models.date.select(range.end);
            }
        }
        selectedLayer = layerId;
        if ( type === "palettes" ) {
            wv.palettes.loadRendered(config, layerId).done(function() {
                var layer = config.layers[layerId];
                if ( layer.palette.recommended ) {
                    models.palettes.add(layerId, layer.palette.recommended[0]);
                } else {
                    models.palettes.add(layerId, "rainbow_2");
                }
            });
        }
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
};
