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
Worldview.namespace("DataDownload.Layers");

Worldview.DataDownload.Layers.Selection = function(model, maps, config) {

    var LAYER_NAME = "DataDownload_Selection";

    var OPACITY = 0.6;    
    var STYLE = {
        strokeColor: "#808080",
        fillColor: "#808080",
    };
    
    var self = {};
    var features = {};
    
    var init = function() {
        model.events
            .on("granuleSelect", onGranuleSelect)
            .on("granuleUnselect", onGranuleUnselect);    
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
    
    var onGranuleSelect = function(granule) {
        var geom = granule.geometry[model.crs];
        var extent = 
                config.projections[model.projection].maxExtent.toGeometry();
        if ( geom && extent.intersects(geom) ) {
            var feature = new OpenLayers.Feature.Vector(geom.clone());
            features[granule.id] = feature;
            getLayer().addFeatures([feature]);
        }
    };
    
    
    var onGranuleUnselect = function(granule) {
        var feature = features[granule.id];
        getLayer().removeFeatures([feature]);    
    };
    
    var createLayer = function() {        
        layer = new OpenLayers.Layer.Vector(LAYER_NAME, {
            styleMap: new OpenLayers.StyleMap(STYLE)
        });
        layer.div.setAttribute("data-layer-name", LAYER_NAME);
        layer.setOpacity(OPACITY);
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