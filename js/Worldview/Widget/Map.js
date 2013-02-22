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

Worldview.Widget.Map = function(containerId, spec) { 
        
    var self = {};
    var log = Logging.Logger("Worldview.Map");
    
    self.productMap = null;
    self.config = null;
    
    var init = function() {
        if ( REGISTRY ) {
            REGISTRY.register(containerId, self);
        } else {
            throw "Cannot register Map, REGISTRY not found";
        }
        
        $.getJSON(spec.dataSourceUrl, onConfigLoad)
            .error(Worldview.ajaxError(onConfigLoadError));
    };  

    self.setValue = function(extent) {
        log.debug("setValue: " + extent);
        var bounds = OpenLayers.Bounds.fromString(extent);
        self.productMap.map.zoomToExtent(bounds, true);
    };
    
    self.getValue = function() {
        var queryString = containerId + "=" + 
                self.productMap.map.getExtent().toBBOX();
        log.debug("getValue: " + queryString);
        return queryString;
    };
        
    self.loadFromQuery = function(queryString) {
        log.debug("loadFromQuery: " + queryString);

        var query = Worldview.queryStringToObject(queryString);

        var projection = query["switch"] || "geographic";
        self.productMap.setProjection(projection)
        
        var extent = query[containerId];
        if ( extent ) {
            self.setValue(extent);
        }
    };
    
    self.validate = function() {
        return true;
    };
    
    self.setDataSourceUrl = function(url) {
        throw "setDataSourceUrl: unsupported";
    };
    
    self.getDataSourceUrl = function() {
        return spec.dataSourceUrl;
    };
    
    self.setStatus = function(status) {
        throw "setStatus: unsupported";      
    };
    
    self.getStatus = function() {
        throw "getStatus: unsupported";
    };
        
    self.isReady = function() {
        return self.productMap != null;
    }
    
    var onConfigLoad = function(result) {
        try {
            self.config = result;
            self.productMap = Worldview.Map.ProductMap(containerId, 
                    self.config, self);
            
            $.each(self.config.products, function(name, config) {
                if ( config.defaultLayer === "true" ) {
                    self.productMap.append(name);
                }
            });
            
            self.productMap.map.zoomToMaxExtent();
            
            if ( spec.onReady ) {
                spec.onReady();
            }
            
            REGISTRY.markComponentReady(containerId);
            log.debug("Map is ready");
        } catch ( cause ) {
            Worldview.error("Unable to configure map", cause);
        }
    };

    var onConfigLoadError = function(message) { 
        Worldview.error("Unable to load map configuration from server", 
                message);
    };
            
    init();
    return self;
}
