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

Worldview.DataDownload.ButtonLayers = function(model, maps, config) {

    var LAYER_NAME = "DataDownload_Button";

    var IMAGE_SELECT = "images/data-download-plus-button-cyan.svg";
    var IMAGE_UNSELECT = "images/data-download-minus-button-blue.svg";  
    
    var self = {};
    
    self.EVENT_HOVER_OVER = "hoverover";
    self.EVENT_HOVER_OUT = "hoverout";
    
    self.events = Worldview.Events();
    
    self.update = function(results) {
        var layer = getLayer();
        if ( !layer ) {
            layer = createLayer();
        };
        
        layer.removeAllFeatures();
        var features = [];
        $.each(results, function(index, result) {
            var centroid = result.centroid[model.epsg];
            if ( centroid ) {
                var feature = new OpenLayers.Feature.Vector(centroid, 
                        {result: result});
                features.push(feature);    
            }
        });
        layer.addFeatures(features);
    };
    
    self.clear = function() {
        var layer = getLayer();
        if ( layer ) {
            layer.removeAllFeatures();
        };
    };
    
    self.dispose = function() {
        $.each(maps.projections, function(index, map) {
            var layer = getLayer(map);
            if ( layer ) {
                if ( layer.hoverControl ) {
                    map.rmeoveControl(hoverControl);
                    layer.hoverControl = null;
                }
                map.removeLayer(layer);     
            }  
        });     
    };
    
    var createLayer = function() {
        size = {w: 20, h: 20};
        layer = new OpenLayers.Layer.Vector(LAYER_NAME, {
            styleMap: new OpenLayers.StyleMap({
                externalGraphic: IMAGE_SELECT,
                graphicWidth: size.w,
                graphicHeight: size.h
            })                
        });
        maps.map.addLayer(layer);
        
        var hoverControl = new Worldview.Map.HoverControl(buttonLayer);
        hoverControl.events.on({
            "hoverover": function(event) {
                self.events.trigger(self.EVENT_HOVER_OVER, event);
            },
            "hoverout": function(event) {
                self.events.trigger(self.EVENT_HOVER_OUT, event);
            }
        });
        maps.map.addControl(hoverControl);
        hoverControl.activate();
        layer.hoverControl = hoverControl;
       
        return layer;       
    };
    
    var getLayer = function(map) {
        map = map || maps.map;
        Worldview.Map.getLayerByName(map, LAYER_NAME);
    };
    
    return self;
      
};