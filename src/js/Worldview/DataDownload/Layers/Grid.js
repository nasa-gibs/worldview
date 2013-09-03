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

Worldview.DataDownload.Layers.Grid = function(model, maps, config) {

    var log = Logging.getLogger("Worldview.DataDownload");
    
    var LAYER_NAME = "DataDownload_Grid";
    var STYLE = {
        strokeColor: "#00ffff",
        strokeOpacity: 0.2,
        fillOpacity: 0,
        strokeWidth: 3
    };
    
    var parser = new OpenLayers.Format.GeoJSON();
    
    var self = {};
    
    self.update = function(results) {
        self.clear();
        var grid = results.meta.grid;
        if ( !grid ) {
            return;
        }
        var layer = getLayer();
        
        var features = [];
        $.each(grid, function(index, cell) {
            var geom = parser.read(cell.geometry, "Geometry"); 
            var feature = new OpenLayers.Feature.Vector(geom);
            features.push(feature);  
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
