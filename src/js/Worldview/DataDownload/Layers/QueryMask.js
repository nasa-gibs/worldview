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

Worldview.DataDownload.Layers.QueryMask = function(model, maps, config) {

    var LAYER_NAME = "DataDownload_QueryMask";
    
    var STYLE = {
        strokeColor: "#000000",
        strokeOpacity: 0.5,
        fillColor: "#000000",
        fillOpacity: 0.5,
    };
    
    var self = {};
        
    self.update = function(results) {
        var layer = getLayer();
        layer.removeAllFeatures();        
        if ( results.meta.queryMask ) {
            var feature = new OpenLayers.Feature.Vector(results.meta.queryMask);
            layer.addFeatures([feature]);
        }
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
                map.removeControl(layer.hoverControl);
                map.removeLayer(layer);   
            }  
        });     
    };
    
    var createLayer = function() {        
        layer = new OpenLayers.Layer.Vector(LAYER_NAME, {
            styleMap: new OpenLayers.StyleMap(STYLE)
        });
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
    
    return self;
      
};