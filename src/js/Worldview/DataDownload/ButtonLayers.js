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
    
    var init = function() {
        $.each(maps.projections, function(index, map) {
            map.events.register("zoomend", self, resize);
        });
    };
    
    self.update = function(results) {
        var layer = getLayer();
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
        getLayer().removeAllFeatures();
    };
    
    self.dispose = function() {
        $.each(maps.projections, function(index, map) {
            var layer = getLayer(map, true);
            if ( layer ) {
                map.removeControl(layer.hoverControl);
                map.removeLayer(layer);   
            }  
        });     
    };
    
    var createLayer = function() {
        size = getSize();
        var styleMap = {
            externalGraphic: IMAGE_SELECT
        };
        
        layer = new OpenLayers.Layer.Vector(LAYER_NAME, {
            styleMap: getStyle()
        });
        maps.map.addLayer(layer);
        
        var hoverControl = new Worldview.Map.HoverControl(layer);
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
    
    var getLayer = function(map, noCreate) {
        map = map || maps.map;
        var layer = Worldview.Map.getLayerByName(map, LAYER_NAME);
        if ( !layer && !noCreate ) {
            layer = createLayer();
        }
        return layer;
    };
    
    var getSize = function() {
        var zoom = maps.map.getZoom();
        // Minimum size of the button is 15 pixels
        var base = 15;
        // Double the size for each zoom level
        var add = Math.pow(2, zoom);
        // But 32 pixels is the maximum size
        var size = Math.min(base + add, base + 32);
        return new OpenLayers.Size(size, size);
    };
    
    var getStyle = function() {
        var size = getSize();
        var styleMap = new OpenLayers.StyleMap({
            externalGraphic: IMAGE_SELECT,
            graphicWidth: size.w,
            graphicHeight: size.h
        });
        return styleMap;
    }
    
    var resize = function() {
        getLayer().styleMap = getStyle();
        layer.redraw();
    };
    
    init();
    return self;
      
};