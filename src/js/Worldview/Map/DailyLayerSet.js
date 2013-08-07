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
 * Class: Worldview.Map.DailyProduct
 * Product that updates on a daily basis.
 * 
 * A requirement in Worldview is to be able to slide between several dates
 * and quickly see the changes per day without redrawing the map. This trick is 
 * performed by adding a new layer for each day selected and setting the 
 * opacity for the other layers to zero. Once the map moves, the "cached" 
 * layers are invalidated and eligbile for removal the next time the map
 * needs to be redrawn.
 * 
 * Delegates to:
 * <Worldview.Map.Product>
 * 
 * Constructor: DailyProduct
 * Creates a new instance.
 * 
 * Parameters:
 * map - The map object that layers will be added and removed from.
 * config - Configuration for this layer as a <Worldview.JSON.MapConfig.Product>
 *          object.
 */
Worldview.Map.DailyLayerSet = function(map, config) {
    
    var self = Worldview.Map.LayerSet(config);
    
    // The current z-index for all layers.
    var zIndex = 0;
    
    // Layers from previous days are cached for quick display when moving
    // the time slider
    var cachedLayers = {};
    
    // Layers that are no longer valid because the map has moved. These
    // are removed using a timeout to prevent map flickering. 
    var staleLayers = [];
    
    // The layer that is currently visible and seen by the user
    var currentLayer = null;
    
    // The day of the data displayed on the map
    var currentDay;
    
    // Active lookup table for all layers in the product, null if no table
    // is active
    var lookupTable = null;
    
    // Timeout identifier for the reaper that cleans out stale layers.
    var reaperId = null;
    
    // Time, in milliseconds, to wait before reaping stale layers.
    var reapDelay = 500;
    
    //-------------------------------------------------------------------------
    // Public
    //-------------------------------------------------------------------------
            
    var init = function() {
        self.setDay(Worldview.today());
        
        map.events.register("movestart", self, invalidate);
        map.events.register("zoomend", self, invalidate);
        $(window).resize(invalidate);
    };
        
    /**
     * Method: setDay
     * Changes the map to display the product for the given day.
     * 
     * Parameters:
     * d - The day to display.
     */
    self.setDay = function(d) {
        // Don't do anything if nothing has changed or if there are no valid
        // layers
        if ( !d ) {
            return;
        }
        var ds = d.toISOStringDate();
        if ( ds === currentDay ) {
            return;
        }
        
        // If there is a current layer, cache it
        if ( currentLayer ) {
            cachedLayers[currentDay] = currentLayer;
        }
        currentDay = ds;
        
        // If the layer is hidden, don't fetch anything
        if ( self.visible ) {
            fetchLayer();
        } else {
            currentLayer = null;
        }
    };

    self.setOpacity = function(opacity) {    
        if ( self.opacity === opacity ) {
            return;
        } 
        self.opacity = opacity;
        if ( currentLayer ) {
            Worldview.Map.setVisiblity(currentLayer, self.visible, self.opacity);
        }
    };
    
    self.setVisibility = function(visible) {
        if ( self.visible === visible ) {
            return;
        }
        self.visible = visible;
        if ( visible && !currentLayer ) {
            fetchLayer();
        }
        if ( currentLayer ) {
            Worldview.Map.setVisibility(currentLayer, self.visible, 
                    self.opacity);  
        }      
    };
    
    /**
     * Method: setLookup
     * Applies a lookup table to this product. If this product doesn't have
     * a lookup table already, all layers are discarded and a new layer is
     * created using <Worldview.Map.CanvasTile>. 
     * 
     * Parameters:
     * lookup - The <ColorLookup> to apply.
     */
    self.setLookup = function(lookup) {
        var resetRequired = (lookupTable === null);
        lookupTable = lookup;
        if ( currentLayer ) {
            if ( resetRequired ) { 
                reset();
                fetchLayer();
            } else {
                invalidate();
                currentLayer.lookupTable = lookup;
                applyLookup(currentLayer); 
            }
        }
    };
    
    /**
     * Method: clearLookup
     * Removes a lookup table from this product. If the product has a lookup
     * table, all layers are discarded and a new layer using the standard
     * tile renderer is created.
     */
    self.clearLookup = function() {
        if ( lookupTable !== null ) {
            lookupTable = null;
            if ( currentLayer ) {
                reset();
                fetchLayer();
            }    
        }
    };
    
    /**
     * Method: setZIndex
     * Sets the z-index for all layers in this product.
     * 
     * Parameters:
     * index - The z-index to set. All layers are set with this z-index
     * except for the visible layer which is set to index + 1.
     */
    self.setZIndex = function(index) {
        zIndex = index;
        refreshZOrder();
    };
    
    /**
     * Method: dispose
     * Remove all layers from the map.
     */
    self.dispose = function() {
        reset();
        if ( reaperId !== null ) {
            clearTimeout(reaperId);
        }
        map.events.unregister("movestart", self, invalidate);
        map.events.unregister("zoomend", self, invalidate);
        $(window).unbind("resize", invalidate);      
    };
        
    //-------------------------------------------------------------------------
    // Private
    //-------------------------------------------------------------------------
    
    var fetchLayer = function() {
        var previousLayer = currentLayer;
                        
        if ( currentDay in cachedLayers ) {
            currentLayer = cachedLayers[currentDay];
            Worldview.Map.setVisibility(currentLayer, self.visible, 
                    self.opacity);
            delete cachedLayers[currentDay];
        } else {
            var additionalOptions = {};
            if ( lookupTable !== null ) {
                additionalOptions.tileClass = Worldview.Map.CanvasTile;
            }
            currentLayer = self.createLayer(additionalOptions, {
                time: currentDay
            });
            if ( lookupTable !== null ) {
                currentLayer.lookupTable = lookupTable;
            }            
            map.addLayer(currentLayer);   
        }

        if ( previousLayer ) {
            previousLayer.setZIndex(zIndex);
        }        
        currentLayer.setZIndex(zIndex + 1);
        Worldview.Map.setVisibility(currentLayer, self.visible, self.opacity);
        
        if ( previousLayer ) {
            Worldview.Map.setVisibility(previousLayer, false, 0);
        } 
    };
    
    /*
     * Iterates through each tile in the layer and applies the lookup.
     */        
    var applyLookup = function(layer) {
        $.each(layer.grid, function(index, row) {
            $.each(row, function(index, tile) {
                tile.applyLookup();    
            });  
        });     
    };
    
    /*
     * Sets the z-index on all layers.
     */
    var refreshZOrder = function() {
        $.each(cachedLayers, function(i, layer) {
            layer.setZIndex(zIndex);
        }); 
        if ( currentLayer ) {
            currentLayer.setZIndex(zIndex + 1);     
        }
    };
    
    /*
     * Clears the cache and removes the current layer. Called when switching
     * between a lookup and non-lookup based layer. 
     */
    var reset = function() {
        invalidate();
        if ( currentLayer ) {
            map.removeLayer(currentLayer);
        }
        currentLayer = null;
    }
    
    /*
     * Hide all layers that are not currently being displayed and move them
     * to the stale set. Restart the reaper to remove those layers.
     */
    var invalidate = function() {
        if ( currentLayer ) {
            var opacity = currentLayer.div.style.opacity;
            if ( opacity !== "" && opacity < 0.001 ) {
                currentLayer.setVisibility(false);
            }
        }
        if ( $.isEmptyObject(cachedLayers) ) {
            return;
        }
        $.each(cachedLayers, function(day, layer) {
            layer.setVisibility(false);
            staleLayers.push(layer);    
        });
        cachedLayers = {};

        if ( reaperId !== null ) {
            clearTimeout(reaperId);
        }
        reaperId = setTimeout(function() { reaper(); }, reapDelay);
    };
    
    
    /*
     * Remove all layers in the invalid set from the map.
     */
    var reaper = function(all) { 
        $.each(staleLayers, function(index, layer) {
            if ( map.getLayerIndex(layer) >= 0 ) {
                map.removeLayer(layer);
            }
        }); 
        staleLayers = [];
        refreshZOrder();
        reaperId = null;
    };
        
    init();
    return self;
}
