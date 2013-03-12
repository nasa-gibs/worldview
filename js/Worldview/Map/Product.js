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
    
    /**
     * True if this product should be displayed on top of all other products.
     */
    self.bringToFront = false;
    
    var init = function() {
        config = $.extend(true, {}, c);
        
        var prop = config.properties || {};        
        if ( prop.style === undefined ) { prop.style = ""; }
        if ( prop.tileSize ) {
            prop.tileSize = new OpenLayers.Size(prop.tileSize[0], 
                                                prop.tileSize[1]);
        }
        if ( prop.bringToFront === true ) {
            self.bringToFront = true;
        }
        if ( prop.transitionEffect === undefined ) {
            prop.transitionEffect = "resize";
        }
        if ( prop.tileClass !== undefined ) {
            prop.tileClass = Worldview.getObjectByPath(prop.tileClass);
        }     
    };
    
    /**
     * Creates a new layer based on the configuration provided. 
     */
    self.createLayer = function() {      
        if ( config.type === "wms" ) {
            return new OpenLayers.Layer.WMS(config.name, config.url, 
                    config.parameters, config.properties);
        } else if ( config.type === "wmts") {
            return new OpenLayers.Layer.WMTS(config.properties);
        } else if ( config.type === "graticule") {
            return new Worldview.Map.GraticuleLayer(config.name, 
                    config.properties);
        } else {
            throw "Unsupported layer type: " + config.type;
        }
    };
    
    init();
    return self;
}
