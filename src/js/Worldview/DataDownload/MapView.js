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

Worldview.DataDownload.MapView = function(model, maps, config) {
    
    var ns = Worldview.DataDownload;
    var self = {};
    var results = null;
    
    var HOVER_LAYER_NAME = "DataDownload_Hover";
    
    var buttonLayers = ns.ButtonLayers(model, maps, config);
    
    var STYLE_HOVER_UNSELECTED = {
        strokeColor: "#00ffff",
        fillColor: "#00ffff",
        fillOpacity: 0.25,
        fontColor: "#ffffff",
        fontWeight: "bold",
        labelOutlineColor: "black",
        labelOutlineWidth: 3
    };
    
    var STYLE_CONNECTOR = {
        strokeColor: "#ff0000",
    };
    
    var bounds = {};
    
    var init = function() {
        $.each(config.projections, function(projection, projectionConfig) {
            bounds[projection] = 
                new OpenLayers.Bounds(projectionConfig.echo.extent);
        });
        
        model.events
            .on("query", clear)
            .on("queryResults", onQueryResults)
            .on("projectionUpdate", onProjectionUpdate)
            .on("deactivate", onDeactivate)    
            .on("activate", update);  
    };
    
    var onQueryResults = function(r) {
        results = r;
        update();
    };
    
    var update = function() {
        if ( !results ) {
            return;
        }
        
        $.each(results, function(index, result) {
            if ( !result.geometry ) {
                result.geometry = {};
            }  
            if ( !result.centroid ) {
                result.centroid = {};
            }
            if ( !result.geometry[model.epsg] ) {
                var geom = Worldview.DataDownload.ECHOGeometry(result)
                        .toOpenLayers("EPSG:4326", "EPSG:" + model.epsg);
                // Only add the geometry if it is in the extents
                var extent = bounds[model.projection];
                var mbr = geom.getBounds();
                if ( extent.intersectsBounds(mbr) ) {
                    result.geometry[model.epsg] = geom;
                    result.centroid[model.epsg] = geom.getCentroid();
                }                
            }         
        });
        
        createHoverLayer();
        buttonLayers.update(results);
        
    }
        
    var createHoverLayer = function() {
        var hoverLayer = maps.map.getLayersByName(HOVER_LAYER_NAME)[0];
        if ( !hoverLayer ) {
            hoverLayer = new OpenLayers.Layer.Vector(HOVER_LAYER_NAME);
            maps.map.addLayer(hoverLayer);
        }
    };
    
    var onProjectionUpdate = function() {
        console.log("projection", model.projection, model.epsg);
        update();
    };
    
    var onDeactivate = function() {
        buttonLayers.dispose();
        $.each(maps.projections, function(index, map) {
            var hoverLayer = map.getLayersByName(HOVER_LAYER_NAME)[0];
            if ( hoverLayer ) {
                map.removeLayer(hoverLayer);
            }
        });
    };
    
    var onHoverOver = function(event) {
        var hoverLayer = maps.map.getLayersByName(HOVER_LAYER_NAME)[0];
        var feature = event.feature;
        var hoverFeature = new OpenLayers.Feature.Vector(
            feature.attributes.result.geometry[model.epsg], 
            feature.attributes,
            STYLE_HOVER_UNSELECTED
        );
        hoverLayer.addFeatures([hoverFeature]);
    };
    
    var onHoverOut = function(event) {
        var hoverLayer = maps.map.getLayersByName(HOVER_LAYER_NAME)[0];
        hoverLayer.removeAllFeatures();
    };
    
    var clear = function() {
        var hoverLayer = maps.map.getLayersByName(HOVER_LAYER_NAME)[0];
        if ( hoverLayer ) {
            hoverLayer.removeAllFeatures();
        }
        buttonLayers.clear();
    };
    
    init();
    return self;
}
