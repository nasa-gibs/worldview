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

Worldview.namespace("Map");

/**
 * Class: Worldview.Map.Product
 * Provides common methods for all products.
 * 
 * Constructor: Worldview.Map.Product
 * Creates a new instance.
 * 
 * Parameters:
 * c - Configuration for this layer as a <Worldview.JSON.MapConfig.Product>
 *     object.
 */
Worldview.Map.LayerSet = function(c) {
    
    var self = {};
    self.opacity = 1;
    self.visible = false;
    var config;
    
    var init = function() {
        config = $.extend(true, {}, c);
        
        var prop = config.properties || {};        
        if ( prop.style === undefined ) { prop.style = ""; }
        if ( prop.tileSize ) {
            prop.tileSize = new OpenLayers.Size(prop.tileSize[0], 
                                                prop.tileSize[1]);
        }
        if ( prop.transitionEffect === undefined ) {
            prop.transitionEffect = "resize";
        }
      
        // HACK: For the moment, some projections use TWMS and others use 
        // WMTS. Copy the type attribute to the correct location if required
        if ( config.properties.type ) {
            config.type = config.properties.type;
            delete config.properties.type;
        }        
        // If this is a WMS layer, the urls are passed in directly and not
        // part of the parameters or properties
        if ( config.type === "wms" && config.properties.url ) {
            config.url = config.properties.url;
            delete config.properties.url;
        }        
        // TWMS does not like the projection parameter, remove it
        if ( config.type === "wms" && config.parameters ) {
            delete config.parameters.projection;
        }
    };
    
    /**
     * Function: createLayer
     * Creates a new layer based on the configuration provided. 
     * 
     * Parameters:
     * additionalProperties - If specified, these properites are merged into
     *                        the product configuration to create the layer.
     * 
     * Return:
     * An OpenLayers Layer.
     */
    self.createLayer = function(additionalProperties, additionalParameters) {
        var properties = config.properties;
        if ( additionalProperties ) {
            properties = $.extend(true, {}, config.properties, 
                    additionalProperties);
        }
        var parameters = config.parameters;
        if ( additionalParameters ) {
            parameters = $.extend(true, {}, config.parameters, 
                    additionalParameters);
        }  
        var layer;
        if ( properties.opacity ) {
            self.opacity = properties.opacity;
        } else { 
            properties.opacity = self.opacity;
        }
        properties.visiblity = false;
        if ( config.type === "wms" ) {
            layer = new Worldview.Map.TWMSLayer(config.name, config.url, 
                    parameters, properties);
        } else if ( config.type === "wmts" ) {
            layer = new OpenLayers.Layer.WMTS(properties);
            if ( parameters && parameters.time ) {
                layer.mergeNewParams({"time": parameters.time});
            }
        } else if ( config.type === "graticule" ) {
            layer = new Worldview.Map.GraticuleLayer(config.name, 
                    properties);
        } else {
            throw new Error("Unsupported layer type: " + config.type);
        }
                
        return layer;
    };
    
    init();
    return self;
};
