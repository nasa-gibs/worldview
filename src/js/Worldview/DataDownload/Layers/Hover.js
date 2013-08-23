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
Worldview.namespace("DataDownload.Hover");

Worldview.DataDownload.Layers.Hover = function(model, maps, config) {
    
    var log = Logging.getLogger("Worldview.DataDownload");
    
    var LAYER_NAME = "DataDownload_Hover";
    
    var STYLE_HOVER_UNSELECTED = {
        strokeColor: "#00ffff",
        fillColor: "#00ffff",
        fillOpacity: 0.25
    };
            
    var STYLE_HOVER_SELECTED = {
        strokeColor: "#0000ff",
        fillColor: "#0000ff",
        fillOpacity: 0.25,
    };

    var self = {};
    
    var init = function() {
        model.events
            .on("granuleSelect", refresh)
            .on("granuleUnselect", refresh);
    };
        
    self.hoverOver = function(buttonFeature) {
        var hoverFeature = new OpenLayers.Feature.Vector(
            buttonFeature.attributes.granule.geometry[model.crs],
            buttonFeature.attributes
        );
        applyStyle(hoverFeature);
        getLayer().addFeatures([hoverFeature]);
        log.debug(hoverFeature.attributes.granule);
    };
        
    self.hoverOut = function() {
        self.clear();
    };
    
    self.clear = function() {
        var layer = Worldview.Map.getLayerByName(maps.map, LAYER_NAME);
        if ( layer ) {
            layer.removeAllFeatures();
        }
    }
    
    self.dispose = function() {
        $.each(maps.projections, function(index, map) {
            var layer = Worldview.Map.getLayerByName(map, LAYER_NAME);
            if ( layer ) {
                map.removeLayer(layer);
            }
        });
    };    
    
    var refresh = function(granule) {
        var layer = getLayer();
        if ( layer.features.length === 0 ) {
            return;
        }
        var feature = layer.features[0];
        var hoverGranule = feature.attributes.granule;
        if ( hoverGranule.id === granule.id ) {
            applyStyle(feature);
            layer.drawFeature(feature);
        }        
    };
    
    var applyStyle = function(feature) {
        var granule = feature.attributes.granule;
        var selected = model.selectedGranules[granule.id];
        var style = ( selected ) ? STYLE_HOVER_SELECTED: STYLE_HOVER_UNSELECTED; 
        feature.style = style;         
    };
     
    var createLayer = function() {
        var layer = new OpenLayers.Layer.Vector(LAYER_NAME);
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
        
    init();
    return self;

};

    
