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
    
    var self = {};
    var results = null;
    
    var BUTTON_LAYER_NAME = "DataDownload_Button";
    var HOVER_LAYER_NAME = "DataDownload_Hover";
    
    var IMAGE_BUTTON_SELECT = "images/data-download-plus-button-cyan.svg";
    var IMAGE_BUTTON_UNSELECT = "images/data-download-minus-button-blue.svg";

    var STYLE_HOVER_UNSELECTED = {
        strokeColor: "#00ffff",
        fillColor: "#00ffff",
        fillOpacity: 0.25,
        fontColor: "#ffffff",
        fontWeight: "bold",
        labelOutlineColor: "black",
        labelOutlineWidth: 3
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
        
        createHoverLayer();
        
        var buttonLayer = createButtonLayer();
        buttonLayer.removeAllFeatures();
        
        features = [];
        $.each(results, function(index, result) {
            if ( !result.geometry ) {
                result.geometry = {};
            }
            if ( !result.geometry[model.epsg] ) {
                g = Worldview.DataDownload.ECHOGeometry(result)
                        .toOpenLayers("EPSG:4326", "EPSG:" + model.epsg);
                result.geometry[model.epsg] = g;
            }
            var geometry = result.geometry[model.epsg];
            var extent = bounds[model.projection];
            var geoBounds = geometry.getBounds();
            if ( extent.intersectsBounds(geoBounds) ) {
                var feature = new OpenLayers.Feature.Vector(
                        geometry.getCentroid(), 
                        { result: result }
                );
                features.push(feature);
            }
        });
        buttonLayer.addFeatures(features);        
    }
    
    var createButtonLayer = function() {
        var buttonLayer = maps.map.getLayersByName(BUTTON_LAYER_NAME)[0];
        if ( !buttonLayer ) {
            size = {w: 20, h: 20};
            buttonLayer = new OpenLayers.Layer.Vector(BUTTON_LAYER_NAME, {
                styleMap: new OpenLayers.StyleMap({
                    externalGraphic: IMAGE_BUTTON_SELECT,
                    graphicWidth: size.w,
                    graphicHeight: size.h
                })                
            });
            maps.map.addLayer(buttonLayer);
            
            var hoverControl = new Worldview.Map.HoverControl(buttonLayer);
            hoverControl.events.on({
                "hoverover": onHoverOver,
                "hoverout": onHoverOut
            });
            maps.map.addControl(hoverControl);
            hoverControl.activate();
            buttonLayer.hoverControl = hoverControl;
        }
        
        return buttonLayer;        
    };
    
    var createHoverLayer = function() {
        var hoverLayer = maps.map.getLayersByName(HOVER_LAYER_NAME)[0];
        if ( !hoverLayer ) {
            hoverLayer = new OpenLayers.Layer.Vector(HOVER_LAYER_NAME);
            maps.map.addLayer(hoverLayer);
        }
    };
    
    var onProjectionUpdate = function() {
        console.log("projection", model.projection, model.epsg);
        updateGranules();
    };
    
    var onDeactivate = function() {
        $.each(maps.projections, function(index, map) {
            var buttonLayer = map.getLayersByName(BUTTON_LAYER_NAME)[0];
            if ( buttonLayer ) {
                map.removeLayer(buttonLayer);
                if ( buttonLayer.hoverControl ) {
                    map.removeControl(buttonLayer.hoverControl);
                }
            }
            
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
        var buttonLayer = maps.map.getLayersByName(BUTTON_LAYER_NAME)[0];
        if ( buttonLayer ) {
            buttonLayer.removeAllFeatures();
        }
    };
    
    init();
    return self;
}
