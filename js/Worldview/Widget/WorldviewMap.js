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
            if ( !(self.productMap.projection in lastState) ) {
                lastState[self.productMap.projection] = {};
            }
            last = lastState[self.productMap.projection];
            
            if ( last.queryString === queryString ) {
                return;
            }
            log.debug("WorldviewMap: updateComponent", queryString);
            var state = Worldview.queryStringToObject(queryString);
            state.productsString = state.products;
            state.products = splitProducts(state);
            state.palettesString = state.palettes;
            state.palettes = splitPalettes(state);
            
            log.debug(state);     
            
            if ( state["switch"] !== undefined && 
                    state["switch"] !== last["switch"] ) {
                var projection = state["switch"];
                if ( !(projection in self.productMap.mapConfig.projections) ) {
                    var defaultProjection = 
                        self.productMap.mapConfig.defaultProjection;
                    log.warn("Invalid projection: " + projection + ", using: " + 
                            defaultProjection);
                    projection = defaultProjection;
                }
                self.productMap.setProjection(projection);
                self.productMap.set(state.products);
            } else if ( state.productsString !== last.productsString ) {
                self.productMap.set(state.products);
                // If the products changed, force setting the palettes
                // again
                last.palettesString = "";
            }
            if ( state.time !== last.time ) {
                var today = Worldview.today();
                if ( state.time === undefined ) {
                    state.time = today.toISOStringDate();
                }
                var date = Date.parseISOString(state.time);
                if ( isNaN(date.getTime()) ) {
                    log.warn("Invalid time: " + state.time + 
                            ", using today: " + today.toISOStringDate());
                    state.time = today.toISOStringDate();
                    date = today;                   
                }
                self.productMap.setDay(date);
            }           
            if ( state.palettesString !== last.palettesString ) {
                self.productMap.setPalettes(state.palettes);
            }
            last = state;
            last.queryString = queryString;
            lastState[self.productMap.projection] = last;
        } catch ( cause ) {
            Worldview.error("Unable to update map", cause);
        }
    };
    
    var setExtentToLeading = function() {
        // Polar projections don't need to be positioned
        if ( self.productMap.projection !== "geographic" ) {
            return;
        }

        var map = self.productMap.map;
    
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
    
    /**
     * Converts the product listed in the query string into an array.
     */    
    var splitProducts = function(state) {
        var results = [];
        if ( !state.products ) {
            return results;
        }
        var sets = state.products.split("~");
        for ( var i = 0; i < sets.length; i++ ) {
            var set = sets[i];
            var items = set.split(",");
            var values = [];
            // First item is the type (e.g., baselayer or overlay). Ignore it.
            for ( var j = 1; j < items.length; j++ ) {
                values.push(items[j]);
            }
            // Products are listed in the "opposite" order from what is 
            // expected--the first layer is the layer to be drawn last. 
            // Flip them.
            values.reverse();
            results = results.concat(values);
        }
        return results;
    };
    
    var splitPalettes = function(state) {
        var results = {};
        if ( !state.palettes ) {
            return results;
        }
        var definitions = state.palettes.split("~");
        $.each(definitions, function(index, definition) {
            var items = definition.split(",");
            var product = items[0];
            var palette = items[1];
            results[product] = palette;
        });
        return results;
    };
    
    init();
    return self;
}
        