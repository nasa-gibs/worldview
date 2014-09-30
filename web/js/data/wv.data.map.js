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
 * @module wv.data
 */
var wv = wv || {};
wv.data = wv.data || {};

wv.data.map = wv.data.map || function(model, maps, config) {

    var ns = wv.data;

    var self = {};
    var results = [];

    var selectionLayers = ns.layers.selection(model, maps, config);
    var swathLayers = ns.layers.swath(model, maps, config);
    var gridLayers = ns.layers.grid(model, maps, config);
    var hoverLayers = ns.layers.hover(model, maps, config);
    var buttonLayers = ns.layers.button(model, maps, config);

    var init = function() {
        model.events
            .on("query", clear)
            .on("queryResults", onQueryResults)
            .on("projectionUpdate", onProjectionUpdate)
            .on("activate", onActivate)
            .on("deactivate", onDeactivate)
            .on("hoverOver", function(granule) {
                hoverLayers.hoverOver(granule);
            })
            .on("hoverOut", hoverLayers.hoverOut);

        buttonLayers.events
            .on("hoverover", function(event) {
                hoverLayers.hoverOver(event.feature.attributes.granule);
            })
            .on("hoverout", function() {
                hoverLayers.hoverOut();
            });
    };

    var onQueryResults = function(newResults) {
        update(newResults);
    };

    var update = function(newResults) {
        if ( newResults ) {
            results = newResults;
        }
        swathLayers.update(results);
        gridLayers.update(results);
        buttonLayers.update(results);
    };

    var onProjectionUpdate = function() {
        selectionLayers.refresh();
    };

    var onDeactivate = function() {
        selectionLayers.dispose();
        swathLayers.dispose();
        gridLayers.dispose();
        hoverLayers.dispose();
        buttonLayers.dispose();
    };

    var onActivate = function() {
        // FIXME: This is a major hack. "Reselect" all the granules again
        // if necessary.
        $.each(model.selectedGranules, function(index, granule) {
            selectionLayers.select(granule);
        });
    };

    var clear = function() {
        //selectionLayers.clear();
        swathLayers.clear();
        gridLayers.clear();
        hoverLayers.clear();
        buttonLayers.clear();
        // TODO: Remove if not used
        //maskLayers.clear();
    };

    init();
    return self;
};
