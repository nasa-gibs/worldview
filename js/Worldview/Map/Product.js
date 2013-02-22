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

Worldview.Map.Product = function(c) {
    
    var self = {};
    var config;
    
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
    };
    
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
