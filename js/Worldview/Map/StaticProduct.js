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
 * Class: Worldview.Map.StaticProduct
 * Product that is not based on the current date or time.
 * 
 * Inherits from:
 * <Worldview.Map.Product>
 * 
 * Constructor: StaticProduct
 * Creates a new instance.
 * 
 * Parameters:
 * map - The map object that layers will be added and removed from.
 * config - Configuration for this layer as a <Worldview.JSON.MapConfig.Product>
 *          object.
 */
Worldview.Map.StaticProduct = function(map, config) {
    
    var self = Worldview.Map.Product(config);
    
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
    
    self.setOpacity = function(opacity) {
        self.opacity = opacity;
        Worldview.Map.setVisibility(layer, self.visible, self.opacity);
    };
    
    self.setVisibility = function(visible) {
        self.visible = visible;
        Worldview.Map.setVisibility(layer, self.visible, self.opacity);
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
    
    /**
     * Method: setLookup
     * Does nothing. This can be implemented once there is a static data 
     * product that could be adjusted. 
     */    
    self.setLookup = function(lookup) {
    };

    /**
     * Method: clearLookup
     * Does nothing. This can be implemented once there is a static data 
     * product that could be adjusted. 
     */      
    self.clearLookup = function() {
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