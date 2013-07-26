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

Worldview.DataDownload.MapView = function(model, maps) {
    
    var self = {};
    var results = null;
    
    var GRANULE_LAYER_NAME = "Granule_Layer";
    
    var IMAGE_BUTTON_SELECT = "images/data-download-plus-button-cyan.svg";
    var IMAGE_BUTTON_UNSELECT = "images/data-download-minus-button-blue.svg";
    
    var init = function() {
        model.events
            .on("queryResults", onQueryResults)
            .on("projectionUpdate", onProjectionUpdate)
            .on("deactivate", onDeactivate)    
            .on("activate", updateGranules);  
    };
    
    var onQueryResults = function(r) {
        results = r;
        updateGranules();
    };
    
    var updateGranules = function() {
        if ( !results ) {
            return;
        }
        var layer = maps.map.getLayersByName(GRANULE_LAYER_NAME)[0];
        if ( !layer ) {
            size = {w: 20, h: 20};
            layer = new OpenLayers.Layer.Vector(GRANULE_LAYER_NAME, {
                styleMap: new OpenLayers.StyleMap({
                    externalGraphic: IMAGE_BUTTON_SELECT,
                    graphicWidth: size.w,
                    graphicHeight: size.h
                })                
            });
            maps.map.addLayer(layer);
        }
        layer.removeAllFeatures();
        
        features = [];
        $.each(results, function(index, result) {
            if ( !result.geometry ) {
                result.geometry = {};
            }
            if ( !result.geometry[model.epsg] ) {
                g = Worldview.DataDownload.ECHOGeometry(result).toOpenLayers();
                result.geometry[model.epsg] = g;
            }
            var geometry = result.geometry[model.epsg];
            var feature = new OpenLayers.Feature.Vector(geometry.getCentroid());
            features.push(feature);
        });
        layer.addFeatures(features);        
    }
    
    var onProjectionUpdate = function() {
        console.log("projection", model.projection, model.epsg);
    };
    
    var onDeactivate = function() {
        $.each(maps.projections, function(index, map) {
            var layer = map.getLayersByName(GRANULE_LAYER_NAME)[0];
            if ( layer ) {
                map.removeLayer(layer);
            }
        });
    };
    
    init();
    return self;
}
