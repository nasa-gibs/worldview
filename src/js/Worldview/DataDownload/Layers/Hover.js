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
Worldview.namespace("DataDownload.Hover");

Worldview.DataDownload.Layers.Hover = function(model, maps, config) {

    var LAYER_NAME = "DataDownload_Hover";

    var STYLE_HOVER_UNSELECTED = {
        strokeColor: "#fbe26d",
        fillColor: "#b59e32",
        fillOpacity: 0.25
    };

    var STYLE_HOVER_SELECTED = {
        strokeColor: "#ff0600",
        fillColor: "#f20c0c",
        fillOpacity: 0.25,
    };

    var self = {};

    var init = function() {
        model.events
            .on("granuleSelect", refresh)
            .on("granuleUnselect", refresh);
    };

    self.hoverOver = function(granule) {
        if ( !granule.geometry ) {
            return;
        }
        var geom = granule.geometry[model.crs];
        var extent =
                config.projections[model.projection].maxExtent.toGeometry();
        if ( geom && extent.intersects(geom) ) {
            var hoverFeature = new OpenLayers.Feature.Vector(
                granule.geometry[model.crs], {
                    granule: granule
                }
            );
            applyStyle(hoverFeature);
            getLayer().addFeatures([hoverFeature]);
        }
    };

    self.hoverOut = function() {
        self.clear();
    };

    self.clear = function() {
        var layer = Worldview.Map.getLayerByName(maps.map, LAYER_NAME);
        if ( layer ) {
            layer.removeAllFeatures();
        }
    };

    self.dispose = function() {
        $.each(maps.projections, function(index, map) {
            var layer = Worldview.Map.getLayerByName(map, LAYER_NAME);
            if ( layer ) {
                map.removeLayer(layer);
            }
        });
    };

    var refresh = function(granule) {
        var layer = getLayer();
        if ( layer.features.length === 0 ) {
            return;
        }
        var feature = layer.features[0];
        var hoverGranule = feature.attributes.granule;
        if ( hoverGranule.id === granule.id ) {
            applyStyle(feature);
            layer.drawFeature(feature);
        }
    };

    var applyStyle = function(feature) {
        var granule = feature.attributes.granule;
        var selected = model.selectedGranules[granule.id];
        var style = ( selected ) ? STYLE_HOVER_SELECTED: STYLE_HOVER_UNSELECTED;
        feature.style = style;
    };

    var createLayer = function() {
        var layer = new OpenLayers.Layer.Vector(LAYER_NAME);
        layer.div.setAttribute("data-layer-name", LAYER_NAME);
        maps.map.addLayer(layer);
        return layer;
    };

    var getLayer = function(map) {
        map = map || maps.map;
        var layer = Worldview.Map.getLayerByName(map, LAYER_NAME);
        if ( !layer ) {
            layer = createLayer();
        }
        return layer;
    };

    init();
    return self;

};


