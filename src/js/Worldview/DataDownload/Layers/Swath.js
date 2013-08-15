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

Worldview.DataDownload.Layers.Swath = function(model, maps, config) {

    var log = Logging.getLogger("Worldview.DataDownload");
    
    var LAYER_NAME = "DataDownload_Swaths";
    var STYLE = {
        strokeColor: "#00ffff",
        strokeOpacity: 0.2,
        strokeWidth: 3
    };
    
    var self = {};
    
    var combineSwath = function(startTimes, endTimes, swath) {
        var combined = false;
        
        // Can this swath be added to the end of other swath?
        var otherSwath = endTimes[swath[0].time_start];
        if ( otherSwath ) {
            // Remove entries for this swath
            delete startTimes[swath[0].time_start];
            delete endTimes[swath[swath.length - 1].time_end];
            
            // Remove entries for other swath
            delete startTimes[otherSwath[0].time_start];
            delete endTimes[otherSwath[otherSwath.length - 1].time_end];
                        
            // Combine swaths
            var newSwath = otherSwath.concat(swath);
            
            startTimes[newSwath[0].time_start] = newSwath;
            endTimes[newSwath[newSwath.length - 1].time_end] = newSwath;
            combined = true;
            swath = newSwath;
        }
        
        var otherSwath = startTimes[swath[0].time_end];
        if ( otherSwath ) {
            // Remove entries for this swath
            delete startTimes[swath[0].time_start];
            delete endTimes[swath[swath.length - 1].time_end];
            
            // Remove entries for other swath
            delete startTimes[otherSwath[0].time_start];
            delete endTimes[otherSwath[otherSwath.length - 1].time_end];
                        
            // Combine swaths
            var newSwath = swath.concat(otherSwath);
            
            startTimes[newSwath[0].time_start] = newSwath;
            endTimes[newSwath[newSwath.length - 1].time_end] = newSwath;
            combined = true;
            swath = newSwath;
        }        

        if ( combined ) {
            combineSwath(startTimes, endTimes, swath);
        }
    };
    
    self.update = function(results) {
        self.clear();
        var swaths = results.meta.swaths;
        if ( !swaths ) {
            return;
        }
        var layer = getLayer();
                
        var features = [];
        $.each(swaths, function(index, swath) {
            var points = [];
            $.each(swath, function(index, granule) {
                points.push(granule.centroid[model.crs].clone());    
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
    