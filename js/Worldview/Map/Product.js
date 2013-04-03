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
Worldview.Map.Product = function(c) {
    
    var self = {};
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
    self.createLayer = function(additionalProperties, day) {
        var properties = config.properties;
        if ( additionalProperties ) {
            properties = $.extend(true, {}, config.properties, 
                    additionalProperties);
        }  
        if ( config.type === "wms" ) {
            if ( day ) {
                config.parameters.time = day;    
            }
            // HACK 
            // TWMS requires an exact order for the parameters. Rebuild the 
            // parameter object and ensure the correct order. 
            if ( config.type === "wms" ) {
                var oldParameters = config.parameters;
                if ( oldParameters.time ) {
                    config.parameters = {
                        time: oldParameters.time,
                        layers: oldParameters.layers,
                        format: oldParameters.format
                    };
                } else {
                    config.parameters = {
                        layers: oldParameters.layers,
                        format: oldParameters.format
                    };                    
                }
                $.each(oldParameters, function(key, value) {
                    if ( key !== "layers" && key !== "format" 
                            && key !== "time") {
                        config.parameters[key] = value;
                    }    
                });
            }            
            return new OpenLayers.Layer.WMS(config.name, config.url, 
                    config.parameters, properties);
        } else if ( config.type === "wmts" ) {
            return new OpenLayers.Layer.WMTS(properties);
        } else if ( config.type === "graticule" ) {
            return new Worldview.Map.GraticuleLayer(config.name, 
                    properties);
        } else {
            throw new Error("Unsupported layer type: " + config.type);
        }
    };
    
    init();
    return self;
}
