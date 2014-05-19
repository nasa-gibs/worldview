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

    var parameters = wv.util.fromQueryString(location.search);
    var self = {};

    var init = function() {
        if ( parameters.loadDelay ) {
            loadDelay();
        }
    };

    var loadDelay = function() {
        var delay;
        try {
            delay = parseInt(parameters.loadDelay);
        } catch ( error ) {
            console.warn("Invalid load delay: " + delay);
            return;
        }

        var ajax = $.ajax;
        $.ajax = function() {
            var ajaxArgs = arguments;
            console.log("delay", ajaxArgs);
            var jqXHR = ajax.apply($, arguments);
            var done = jqXHR.done;
            jqXHR.done = function(fn) {
                done(function() {
                    var args = arguments;
                    setTimeout(function() {
                        fn.apply(jqXHR, args);
                    }, delay);
                });
                return jqXHR;
            };
            jqXHR.done(function() { console.log("done", ajaxArgs); });
            var fail = jqXHR.fail;
            jqXHR.fail = function(fn) {
                fail(function() {
                    var args = arguments;
                    setTimeout(function() {
                        fn.apply(jqXHR, args);
                    }, delay);
                });
                return jqXHR;
            };
            jqXHR.fail(function() { console.log("fail", ajaxArgs); });
            return jqXHR;
        }
    };

    self.error = function(parameters) {
        if ( parameters.showError ) {
            wv.util.error();
        }
    };

    init();
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
            //ui.dateSliders.collapse();
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
        if ( layer.id === "land_water_map" || layer.id === "land_mask" ) {
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
                var text = layer.title + "; " + layer.subtitle;
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
            models.layers.add("land_water_map");
        }
        updateLayers.apply($select);
        if ( type === "dataDownload" ) {
            models.data.activate();
        }
    };

    var updateLayers = function() {
        var layerId = $(this).val();
        console.log(config.layers[layerId].title + "; " + config.layers[layerId].subtitle);
        if ( selectedLayer ) {
            models.layers.remove(selectedLayer);
            models.palettes.clearCustom(selectedLayer);
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
                    models.palettes.setCustom(layerId, layer.palette.recommended[0]);
                } else {
                    models.palettes.setCustom(layerId, "rainbow_2");
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
