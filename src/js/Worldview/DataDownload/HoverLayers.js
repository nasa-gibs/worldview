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

Worldview.DataDownload.HoverLayers = function(model, maps, config) {
    
    var log = Logging.getLogger("Worldview.DataDownload");
    
    var LAYER_NAME = "DataDownload_Hover";
    
    var STYLE_HOVER_UNSELECTED = {
        strokeColor: "#00ffff",
        fillColor: "#00ffff",
        fillOpacity: 0.25,
        fontColor: "#ffffff",
        fontWeight: "bold",
        labelOutlineColor: "black",
        labelOutlineWidth: 3
    };
        
    var self = {};
    
    self.hoverOver = function(buttonFeature) {
        var layer = getLayer();
        
        var style = $.extend(true, {}, STYLE_HOVER_UNSELECTED);
        style.label = getLabel(buttonFeature);
        style.labelYOffset = getLabelOffset(buttonFeature);
        
        var hoverFeature = new OpenLayers.Feature.Vector(
            buttonFeature.attributes.result.geometry[model.epsg],
            buttonFeature.attributes,
            style
        );
        layer.addFeatures([hoverFeature]);
        log.debug(hoverFeature.attributes.result);
    };
    
    self.hoverOut = function() {
        self.clear();
    };
    
    self.clear = function() {
        getLayer().removeAllFeatures();
    }
    
    self.dispose = function() {
        $.each(maps.projections, function(index, map) {
            var layer = getLayer(map);
            if ( layer ) {
                map.removeLayer(layer);
            }
        });
    };    
        
    var createLayer = function() {
        var layer = new OpenLayers.Layer.Vector(LAYER_NAME);
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
    
    var getLabel = function(feature) {
        var result = feature.attributes.result;
        var timeStart = Date.parseISOString(result.time_start);
        var timeEnd = Date.parseISOString(result.time_end);
        
        var diff = Math.floor(
            (timeStart.getTime() - model.time.getTime()) / (1000 * 60 * 60 * 24)
        );
                   
        var suffix = "";
        if ( diff !== 0 ) {
            if ( diff < 0 ) { 
                suffix = " (" + diff + " day)";
            } else {
                suffix = " (+" + diff + " day)";
            }    
        }
        var displayStart = timeStart.toISOStringTimeHM();
        var displayEnd = timeEnd.toISOStringTimeHM();
        
        return displayStart + " - " + displayEnd + suffix;
    };
    
    var getLabelOffset = function(feature) {
        var style = feature.layer.styleMap.styles["default"].defaultStyle;
        var buttonHeight = style.graphicHeight;
        return ( buttonHeight / 2.0 ) + 10;
    };
    
    return self;

};

    
