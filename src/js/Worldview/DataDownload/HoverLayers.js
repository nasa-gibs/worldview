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
Worldview.namespace("DataDownload");

Worldview.DataDownload.HoverLayers = function(model, maps, config) {
    
    var LAYER_NAME = "DataDownload_Hover";
    
    var STYLE_HOVER_UNSELECTED = {
        strokeColor: "#00ffff",
        fillColor: "#00ffff",
        fillOpacity: 0.25,
        fontColor: "#ffffff",
        fontWeight: "bold",
        labelOutlineColor: "black",
        labelOutlineWidth: 3
    };
        
    var self = {};
    
    self.hoverOver = function(buttonFeature) {
        var layer = getLayer();
        var hoverFeature = new OpenLayers.Feature.Vector(
            buttonFeature.attributes.result.geometry[model.epsg],
            buttonFeature.attributes,
            STYLE_HOVER_UNSELECTED
        );
        layer.addFeatures([hoverFeature]);
    };
    
    self.hoverOut = function() {
        self.clear();
    };
    
    self.clear = function() {
        getLayer().removeAllFeatures();
    }
    
    self.dispose = function() {
        $.each(maps.projections, function(index, map) {
            var layer = getLayer(map);
            if ( layer ) {
                map.removeLayer(layer);
            }
        });
    };    
        
    var createLayer = function() {
        var layer = new OpenLayers.Layer.Vector(LAYER_NAME);
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
    
    return self;

};

    
