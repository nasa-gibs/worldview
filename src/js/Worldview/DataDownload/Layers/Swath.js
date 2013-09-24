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
        strokeColor: "#c3bd7b",
        strokeOpacity: 0.75,
        strokeWidth: 2
    };
    var MAX_DISTANCE_GEO = 270;
    
    var self = {};
      
    self.update = function(results) {
        self.clear();
        var swaths = results.meta.swaths;
        if ( !swaths ) {
            return;
        }
        var layer = getLayer();

        var maxDistance = ( model.crs === Worldview.Map.CRS_WGS_84 ) 
                ? MAX_DISTANCE_GEO : Number.POSITIVE_INFINITY; 
                                
        var features = [];
        $.each(swaths, function(index, swath) {
            var lastGranule = null;
            // Main granules or west side granuels
            $.each(swath, function(index, granule) {
                if ( !lastGranule ) {
                    lastGranule = granule;
                    return;
                }
                var polys1 = Worldview.Map.toPolys(lastGranule.geometry[model.crs]); 
                var polys2 = Worldview.Map.toPolys(granule.geometry[model.crs]);
                $.each(polys1, function(index1, poly1) {
                    $.each(polys2, function(index2, poly2) {
                        var c1 = poly1.getCentroid();
                        var c2 = poly2.getCentroid();
                        var distanceX = Worldview.Map.distanceX(c1, c2);
                        if ( distanceX < maxDistance ) {
                            features.push(new OpenLayers.Feature.Vector(
                                new OpenLayers.Geometry.LineString([c1, c2])
                            ));    
                        } 
                    });    
                });
                lastGranule = granule;
            });
      
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
    