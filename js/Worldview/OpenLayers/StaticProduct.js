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

Worldview.namespace("OpenLayers");

/**
 * Class: Worldview.OpenLayers.StaticProduct
 * Product that is not based on the current date or time.
 * 
 * Constructor: StaticProduct
 * Creates a new instance.
 * 
 * Parameters:
 * map - The map object that layers will be added and removed from.
 * config - Options passed to the OpenLayers.Layer constructor to create
 *          each layer. This object must also have one other property:
 *          layerClass which defines the type of layer to create (e.g., 
 *          OpenLayers.Layer.WMTS)
 */
Worldview.OpenLayers.StaticProduct = function(map, config) {
    
    var self = Worldview.OpenLayers.Product(config);
    
    // There is only one layer and this is it
    var layer = null;
    
    // Tue current z-index for the layer
    var zIndex = 0;
    
    //-------------------------------------------------------------------------
    // Public
    //-------------------------------------------------------------------------    
    var init = function() {
        layer = self.createLayer();
        map.addLayer(layer);
        layer.setZIndex(zIndex);
        
        map.events.register("movestart", self, refreshZOrder);
        map.events.register("zoomend", self, refreshZOrder);        
    };
    
    /**
     * Method: setDay
     * Does nothing.
     */
    self.setDay = function(d) {
    };
    
    /**
     * Method: setZIndex
     * Sets the z-index for the product's layer.
     * 
     * Parameters:
     * index - The z-index to set. 
     */
    self.setZIndex = function(index) {
        zIndex = index;
        refreshZOrder();
    };

    /**
     * Method: dispose
     * Removes the layer from the map.
     */
    self.dispose = function() {
        map.removeLayer(layer);
        map.events.unregister("movestart", self, refreshZOrder);
        map.events.unregister("zoomend", self, refreshZOrder);    
    };
        
    //-------------------------------------------------------------------------
    // Private
    //-------------------------------------------------------------------------    
    var refreshZOrder = function() {
        layer.setZIndex(zIndex);
    };
    
    init();
    return self;
}