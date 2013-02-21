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

Worldview.Widget.WorldviewMap = function(containerId, spec) { 

    var ns = Worldview.Widget;

    var onReady = function() {
        setExtentToLeading();
    };
    spec.onReady = onReady;
    
    var self = ns.Map(containerId, spec);
    
    var log = Logging.Logger("Worldview.Map");
    var lastState = {};
    var last = null;
        
    self.updateComponent = function(queryString) { 
        try {
            if ( !self.isReady() ) {
                return;
            }
            if ( !(self.productMap.projection in lastState) ) {
                lastState[self.productMap.projection] = {};
            }
            last = lastState[self.productMap.projection];
            
            if ( last.queryString === queryString ) {
                return;
            }
            var state = Worldview.queryStringToObject(queryString);
            state.productsString = state.products;
            state.products = splitProducts(state);
            
            log.debug(state);     
            
            if ( state["switch"] !== last["switch"] ) {
                self.productMap.setProjection(state["switch"]);
                self.productMap.set(state.products);
            } else if ( state.productsString !== last.productsString ) {
                self.productMap.set(state.products);
            }
            if ( state.time !== last.time ) {
                self.productMap.setDay(new Date(state.time));
            }           

            last = state;
            last.queryString = queryString;
            lastState[self.productMap.projection] = last;
        } catch ( cause ) {
            Worldview.error("Unable to update map", cause);
        }
    };
    
    var setExtentToLeading = function() {
        if ( self.productMap.projection !== "geographic" ) {
            return;
        }
        
        // Set default extent according to time of day:  
        //   at 00:00 UTC, start at far eastern edge of map: 
        //      "20.6015625,-46.546875,179.9296875,53.015625"
        //   at 23:00 UTC, start at far western edge of map: 
        //      "-179.9296875,-46.546875,-20.6015625,53.015625"
        var curHour = new Date().getUTCHours();

        // For earlier hours when data is still being filled in, force a far 
        // eastern perspective
        if (curHour < 9)
            curHour = 0;

        // Compute east/west bounds
        var minLon = 20.6015625 + curHour * (-200.53125/23.0);
        var maxLon = minLon + 159.328125;
                 
        var bbox = minLon.toString() + ",-46.546875," + maxLon.toString() + 
                ",53.015625";
        
        
        //this.setExtent("-146.390625,-93.921875,146.390625,93.953125",true);
        self.productMap.map.zoomToExtent([
                minLon, -46.546875, maxLon, 53.015625], true);

        //this.fire();         
    };   
        
    var splitProducts = function(state) {
        var results = [];
        var sets = state.products.split("~");
        for ( var i = 0; i < sets.length; i++ ) {
            var set = sets[i];
            var items = set.split(".");
            // First item is the type (e.g., baselayer or overlay). Ignore it.
            for ( var j = 1; j < items.length; j++ ) {
                results.push(items[j]);
            }
        }
        return results;
    }
    
    return self;
}
        