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

Worldview.namespace("Widget");

/**
 * Class: Worldview.Widget.WorldviewMap
 * Map features that are specific to Worldview.
 * 
 * Delegates to:
 * <Worldview.Widget.Map>
 * 
 * Constructor: Worldview.Widget.WorldviewMap
 * Creates a new instance.
 * 
 * Parameters:
 * containerId - The id of the div element to place the map into
 * spec.dataSourceUrl - The endpoint where configuration information should
 *                      be obtained from.
 * spec.onReady - function to be invoked once the map has read in the 
 *                configuration and is ready to be used. 
 */
Worldview.Widget.WorldviewMap = function(containerId, config) { 

    var ns = Worldview.Widget;
    
    var self = ns.Map(containerId, config);
    
    var log = Logging.getLogger("Worldview.Map");
    var lastState = {};
    var last = null;
    
    var init = function() {
        //Logging.debug("Worldview.Map");
        if ( REGISTRY ) {
            REGISTRY.register(containerId, self);
        } else {
            throw new Error("Cannot register Map, REGISTRY not found");
        }
                
        REGISTRY.markComponentReady(containerId);
        log.debug("Map is ready");
        
        setExtentToLeading();
    };
    
    /**
     * Method: updateComponent
     * Updates the map when the state of the application changes.
     * 
     * Parameters:
     * queryString - If products=X is defined, ensure that only the layers for 
     * X are visible. If switch=Y is defined, changes the projection of the
     * map to Y if necessary. 
     */    
    self.updateComponent = function(queryString) { 
        try {
            if ( !(self.maps.projection in lastState) ) {
                lastState[self.maps.projection] = {};
            }
            last = lastState[self.maps.projection];
            
            if ( last.queryString === queryString ) {
                return;
            }
            log.debug("WorldviewMap: updateComponent", queryString);
            
            var state = REGISTRY.getState(queryString);            

            log.debug("State", state);     
            log.debug("Last State", last);

            
            if ( state.projection !== undefined && 
                    state.projection !== last.projection ) {
                var projection = state.projection;
                if ( !(projection in self.maps.mapConfig.projections) ) {
                    var defaultProjection = 
                        self.maps.mapConfig.defaults.projection;
                    log.warn("Invalid projection: " + projection + ", using: " + 
                            defaultProjection);
                    projection = defaultProjection;
                }
                self.maps.setProjection(projection);
                self.maps.set(state.layers, state.hiddenLayers);
            } else if ( state.layersString !== last.layersString ) {
                log.debug("Visible layers", state.visibleLayers);
                log.debug("Hidden layers", state.hiddenLayers);
                self.maps.set(state.layers, state.hiddenLayers);
                // If the layers changed, force setting the palettes
                // again
                if ( !Worldview.arrayEquals(state.layers, last.layers) ) { 
                    last.palettesString = "";
                }
                var topLayerSelected = false;
                $.each(state.baselayers, function(index, layer) {
                    var alreadyHidden = 
                        $.inArray(layer, state.hiddenLayers) >= 0;
                    var visible = !topLayerSelected && !alreadyHidden;
                    if ( visible && !topLayerSelected ) {
                        topLayerSelected = true;
                    }
                    self.maps.setVisibility(layer, visible);  
                });
            }
            if ( state.time !== last.time ) {
                self.maps.setDay(state.time);
            }           
            if ( state.palettesString !== last.palettesString ) {
                self.maps.setPalettes(state.palettes);
            }
            if ( state.opacityString !== last.opacityString) {
                $.each(state.opacity, function(layerName, opacity) {
                    self.maps.setOpacity(layerName, opacity);    
                });
            }
            last = state;
            last.queryString = queryString;
            lastState[self.maps.projection] = last;
        } catch ( cause ) {
            Worldview.error("Unable to update map", cause);
        }
    };
    
    self.parse = function(queryString, object) {
        parseProducts(queryString, object);        
        return object;
    };
    
    // TODO: This should be moved to the product picker
    var parseProducts = function(queryString, object) {
        object.layers = [];
        object.visibleLayers = [];
        object.hiddenLayers = [];
        object.baselayers = [];
        object.overlays = [];
        
        var products = Worldview.extractFromQuery("products", queryString);
        object.layersString = products;
        if ( !products ) {
            return object;
        }
        var sets = products.split("~");
        for ( var i = 0; i < sets.length; i++ ) {
            var set = sets[i];
            var items = set.split(",");
            var values = [];
            var type = items[0];
            object[type] = [];
            for ( var j = 1; j < items.length; j++ ) {
                var name = items[j];
                if ( name.substring(0, 1) == "!" ) {
                    name = name.substring(1);
                    object.hiddenLayers.push(name);
                } else {
                    object.visibleLayers.push(name);
                }
                values.push(name);
                object[type].push(name);
            }
            // Products are listed in the "opposite" order from what is 
            // expected--the first layer is the layer to be drawn last. 
            // Flip them.
            values.reverse();
            object.layers = object.layers.concat(values);
        }
        return object;
    };
    
    var setExtentToLeading = function() {
        // Polar projections don't need to be positioned
        if ( self.maps.projection !== "geographic" ) {
            return;
        }

        var map = self.maps.map;
    
        // Set default extent according to time of day:  
        //   at 00:00 UTC, start at far eastern edge of map: "20.6015625,-46.546875,179.9296875,53.015625"
        //   at 23:00 UTC, start at far western edge of map: "-179.9296875,-46.546875,-20.6015625,53.015625"
        var curHour = Worldview.now().getUTCHours();

        // For earlier hours when data is still being filled in, force a far eastern perspective
        if (curHour < Worldview.GIBS_HOUR_DELAY) {
            curHour = 23;
        }
        else if (curHour < 9) {
            curHour = 0;
        }

        // Compute east/west bounds
        var minLon = 20.6015625 + curHour * (-200.53125/23.0);
        var maxLon = minLon + 159.328125;
        
        var minLat = -46.546875
        var maxLat = 53.015625
        
        var lat = minLat + (Math.abs(maxLat - minLat) / 2.0);
        var lon = minLon + (Math.abs(maxLon - minLon) / 2.0);
        var zoomLevel = 2
                
        map.setCenter(new OpenLayers.LonLat(lon, lat), zoomLevel);
    };   
        
    init();
    return self;
}
        