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

Worldview.DataDownload.SwathLayers = function(model, maps, config) {

    var LAYER_NAME = "DataDownload_Swaths";
    var STYLE = {
        strokeColor: "#00ffff",
        strokeOpacity: 0.2,
        strokeWidth: 3
    };
    
    var self = {};
    
    self.update = function(results) {
        self.clear();
        var layer = getLayer();
        
        var swaths = [];
        var startTimes = {};
        var endTimes = {};
        
        $.each(results, function(index, result) {
            if ( !result.centroid[model.epsg] ) {
                return;
            }
            var swath = startTimes[result.time_end];
            var added = false;
            if ( swath ) {
                swath.unshift(result);
                delete startTimes[result.time_end];
                startTimes[result.time_start] = swath;
                added = true;
            }
            swath = endTimes[result.time_start];
            if ( swath ) {
                swath.push(result);
                delete endTimes[result.time_start];
                endTimes[result.time_end] = swath;
                added = true;
            }
            if ( !added ) {
                swath = [result];
                swaths.push(swath);
                startTimes[result.time_start] = swath;
                endTimes[result.time_end] = swath;
            }
        });
        
        var features = [];
        $.each(swaths, function(index, swath) {
            if ( swath.length <= 1 ) {
                return;
            }
            var points = [];
            $.each(swath, function(index, result) {
                points.push(result.centroid[model.epsg].clone());    
            });
            var line = new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.LineString(points)
            );
            features.push(line);           
        });
        layer.addFeatures(features);
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
    
    var createLayer = function() {
        var layer = new OpenLayers.Layer.Vector(LAYER_NAME, {
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
    