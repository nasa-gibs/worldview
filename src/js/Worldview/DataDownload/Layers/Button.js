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

Worldview.DataDownload.Layers.Button = function(model, maps, config) {

    var LAYER_NAME = "DataDownload_Button";

    var IMAGE_SELECT = "images/data-download-plus-button-orange.svg";
    var IMAGE_UNSELECT = "images/data-download-minus-button-red.svg";  
    
    var STYLE = {
        "default": {
            externalGraphic: IMAGE_SELECT,
            fontFamily: "helvetica, sans-serif",
            fontColor: "#ffffff",
            fontWeight: "bold",
            labelOutlineColor: "black",
            labelOutlineWidth: 2,
            labelOutlineOpacity: 0.7,
            label: "${label}",
            cursor: "pointer"
        }, 
        "select": {
            externalGraphic: IMAGE_UNSELECT,
            fontFamily: "helvetica, sans-serif",
            fontColor: "#ffffff",
            fontWeight: "bold",
            labelOutlineColor: "black",
            labelOutlineWidth: 2,
            labelOutlineOpacity: 0.7,
            label: "${label}",
            cursor: "pointer"          
        }
    };
    
    var features = {};
    var splitFeature = null;
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
        var featureList = [];
        var selectedFeatures = [];
        $.each(results.granules, function(index, granule) {
            if ( !granule.centroid ) {
                return;
            }
            var centroid = granule.centroid[model.crs];
            if ( centroid ) {
                var feature = new OpenLayers.Feature.Vector(centroid, {
                    granule: granule,
                    label: ""
                });
                featureList.push(feature);   
                features[granule.id] = feature; 
                if ( model.selectedGranules[granule.id] ) {
                    selectedFeatures.push(feature);
                }
            }
        });
        layer.addFeatures(featureList);
        var selectionControl = layer.selectionControl;
        $.each(selectedFeatures, function(index, selectedFeature) {
            selectionControl.select(selectedFeature);
        });
    };
    
    self.clear = function() {
        var layer = Worldview.Map.getLayerByName(maps.map, LAYER_NAME);
        if ( layer ) {
            features = {};
            layer.removeAllFeatures();
        }
    };
    
    self.dispose = function() {
        $.each(maps.projections, function(index, map) {
            var layer = Worldview.Map.getLayerByName(map, LAYER_NAME);
            if ( layer ) {
                map.removeControl(layer.hoverControl);
                map.removeControl(layer.selectionControl);
                map.removeLayer(layer);   
            }
            map.events.unregister("zoomend", self, resize);  
        });     
    };
    
    var createLayer = function() {
        size = getSize();
        
        layer = new OpenLayers.Layer.Vector(LAYER_NAME, {
            styleMap: new OpenLayers.StyleMap(getStyle())
        });
        
        layer.div.setAttribute("data-layer-name", LAYER_NAME);
        maps.map.addLayer(layer);
        
        layer.events.on({
            'featureselected': function(event) {
                model.selectGranule(event.feature.attributes.granule);        
            },
            'featureunselected': function(event) {
                model.unselectGranule(event.feature.attributes.granule);
            }
        });
        
        var hoverControl = new Worldview.Map.HoverControl(layer);
        hoverControl.events.on({
            "hoverover": function(event) {
                self.events.trigger(self.EVENT_HOVER_OVER, event);
                onHoverOver(event);
            },
            "hoverout": function(event) {
                self.events.trigger(self.EVENT_HOVER_OUT, event);
                onHoverOut(event);
            }
        });
        maps.map.addControl(hoverControl);
        hoverControl.activate();
        layer.hoverControl = hoverControl;

        var selectionControl = new OpenLayers.Control.SelectFeature(layer, {
            autoActivate: true,
            toggle: true,
            multiple: true,
            clickout: false            
        });
        maps.map.addControl(selectionControl);
        layer.selectionControl = selectionControl;
              
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
    
    var getStyle = function(intent) {
        var size = getSize();
        var newStyle = $.extend(true, {}, STYLE);
        
        newStyle["default"].graphicWidth = size.w;
        newStyle["default"].graphicHeight = size.h;
        newStyle["default"].labelYOffset = getLabelOffset();
        
        newStyle.select.graphicWidth = size.w;
        newStyle.select.graphicHeight = size.h;
        newStyle.select.labelYOffset = getLabelOffset();
        
        if ( intent ) {
            return newStyle[intent];
        } else {
            return newStyle;
        }
    };
    
    var resize = function() {
        getLayer().styleMap = new OpenLayers.StyleMap(getStyle());
        layer.redraw();
    };
    
    var onHoverOver = function(event) {
        var feature = event.feature;
        var granule = feature.attributes.granule;
        feature.attributes.label = granule.label;
        getLayer().drawFeature(feature);
        console.log(event);
        if ( feature.geometry.CLASS_NAME === 
                "OpenLayers.Geometry.MultiPoint" ) {
            var newStyle = $.extend(true, {}, getStyle("default"));
            delete newStyle.externalGraphic;
            newStyle.strokeOpacity = 1;
            newStyle.fillOpacity = 1;
            newStyle.label = granule.label;
            splitFeature = new OpenLayers.Feature.Vector(
                feature.geometry.components[1].clone(), 
                feature.attributes,
                newStyle
            );
            getLayer().addFeatures([splitFeature]);            
        }
    };
    
    var onHoverOut = function(event) {
        var feature = event.feature;
        feature.attributes.label = "";
        getLayer().drawFeature(feature);
        if ( splitFeature ) {
            getLayer().removeFeatures([splitFeature]);    
            splitFeature = null;
        }
    };
    
    var getLabelOffset = function() {
        var buttonHeight = getSize().h;
        return ( buttonHeight / 2.0 ) + 10;
    };
    
    init();
    return self;
      
};