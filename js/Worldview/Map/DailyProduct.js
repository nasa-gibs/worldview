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
 * Inherits from:
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
Worldview.Map.DailyProduct = function(map, config) {
    
    var self = Worldview.Map.Product(config);
    
    // The current z-index for all layers.
    var zIndex = 0;
    
    // The function used to create a new layer
    var createLayer;
    
    // The layer that is currently displayed on the screen and all layers
    // that have their opacity set to zero for quick display when moving
    // the date.
    var validLayers = {};
    
    // Layers that are no longer valid because the map has moved. These
    // can be removed on the next map redrawn
    var invalidLayers = {};
    
    // The layer that is currently visible and seen by the user
    var currentLayer = null;
    
    // The day of the data displayed on the map
    var currentDay;
    
    var lookupTable = null;
    
    //-------------------------------------------------------------------------
    // Public
    //-------------------------------------------------------------------------
            
    var init = function() {
        self.setDay(Worldview.now());
        
        map.events.register("movestart", self, onMoveStart);
        map.events.register("zoomend", self, onZoomEnd);
    };
    
    /**
     * Method: setDay
     * Changes the map to display the product for the given day.
     * 
     * Parameters:
     * d - The day to display.
     */
    self.setDay = function(d) {
        if ( !d ) {
            return;
        }
        var ds = Worldview.toISODateString(d);
        if ( ds === currentDay ) {
            return;
        }
        currentDay = ds;
        
        var previousLayer = currentLayer;
        
        // If a layer was visible, hide it.
        if ( previousLayer ) { 
            previousLayer.setOpacity(0);
        }
        
        // If the layer has already been created, set it as the current
        // layer.
        if ( currentDay in validLayers ) {
            currentLayer = validLayers[currentDay];
            
        // If the layer was invalidated and scheduled for removal, reuse
        // it and bring it back to the valid set
        } else if ( currentDay in invalidLayers ) {
            currentLayer = invalidLayers[currentDay];
            validLayers[currentDay] = currentLayer;
            delete invalidLayers[currentDay];
            
        // Otherwise, create a new layer
        } else { 
            var additionalOptions = null;
            if ( lookupTable !== null ) {
                additionalOptions = {
                    tileClass: Worldview.Map.CanvasTile
                };
            }
            currentLayer = self.createLayer(additionalOptions);
            if ( lookupTable != null ) {
                currentLayer.lookupTable = lookupTable;
            }
            currentLayer.mergeNewParams({ time: currentDay });
            validLayers[currentDay] = currentLayer;
            map.addLayer(currentLayer);
        }
        
        // Make sure the layer is visible. 
        currentLayer.setOpacity(1);
        if ( currentLayer.getVisibility() === false ) {
            currentLayer.setVisibility(true);
        }
        
        // The visible layer is one level higher than all the other layers
        if ( previousLayer ) {
            previousLayer.setZIndex(zIndex);
        }        
        currentLayer.setZIndex(zIndex + 1);
    };
    
    self.setLookup = function(lookup) {
        if ( lookupTable === null ) { 
            purge(true);
            currentLayer = self.createLayer({
                tileClass: Worldview.Map.CanvasTile
            });
            currentLayer.lookupTable = lookup;
            validLayers[currentDay] = currentLayer;
            map.addLayer(currentLayer);
            currentLayer.setZIndex(zIndex + 1);
        } else {
            $.each(validLayers, function(index, layer) {
                layer.lookupTable = lookup;
                layer.redraw();
            });
            $.each(invalidLayers, function(index, layer) { 
                layer.lookupTable = lookup;
            });     
        }
        lookupTable = lookup;
    };
    
    self.clearLookup = function() {
        if ( lookupTable !== null ) {
            purge(true);
            currentLayer = self.createLayer();
            validLayers[currentDay] = currentLayer;
            map.addLayer(currentLayer);
            currentLayer.setZIndex(zIndex + 1);        
        }    
        lookupTable = null; 
    };
    
    /**
     * Method: getStatistics
     * Gets number of valid and invalid layers.
     *     
     * Returns:
     * A object containing two properites:
     * - valid:   The number of layers that are active and can be used for
     *            quickly flipping through days.
     * - invalid: The number of layers that can no longer be used for display
     *            and will be removed the next time the map is drawn.
     */
    self.getStatistics = function() {
        return {
            valid: Worldview.size(validLayers),
            invalid: Worldview.size(invalidLayers)
        };
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
        $.each(validLayers, function(index, layer) {
            map.removeLayer(layer);
        });
        validLayers = {};
        $.each(invalidLayers, function(index, layer) { 
            map.removeLayer(layer);
        });
        invalidLayers = {};
        map.events.unregister("movestart", self, onMoveStart);
        map.events.unregister("zoomend", self, onZoomEnd);        
    }
        
    //-------------------------------------------------------------------------
    // Private
    //-------------------------------------------------------------------------
        
    /*
     * Sets the z-index on all layers.
     */
    var refreshZOrder = function() {
        $.each(validLayers, function(i, layer) {
            layer.setZIndex(zIndex);
        });
        $.each(invalidLayers, function(i, layer) { 
            layer.setZIndex(zIndex);
        });   
        if ( currentLayer ) {
            currentLayer.setZIndex(zIndex + 1);     
        }
    };
    
    /*
     * Hide all layers that are not currently being displayed and move them
     * to the invalid set.
     */
    var invalidate = function() {
        if ( Worldview.size(validLayers) <= 1 ) {
            return;
        }

        for ( var day in validLayers ) {
            if ( validLayers.hasOwnProperty(day) ) {
                if ( day !== currentDay ) {
                    invalidLayers[day] = validLayers[day];
                    invalidLayers[day].setVisibility(false);
                }
            }
        }
        validLayers = {};
        validLayers[currentDay] = currentLayer;
    };
    
    /*
     * Remove all layers in the invalid set from the map.
     */
    var purge = function(all) { 
        invalidate();
        if ( all ) {
            validLayers = {};
            invalidLayers[day] = currentLayer;
            currentLayer = null;
        }
        for ( var day in invalidLayers ) {
            if ( map.getLayerIndex(invalidLayers[day]) >= 0 ) {
                map.removeLayer(invalidLayers[day]);
            }
        }
        invalidLayers = {};
        refreshZOrder();
    };
    
    var onMoveStart = function() {
        invalidate();    
    };
        
    var onZoomEnd = function() {
        purge();
    };
    
    init();
    return self;
}
