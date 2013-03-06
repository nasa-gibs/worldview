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

    self.setValue = function(value) {
        log.debug("setValue: " + extent);
        var extent = Worldview.Widget.Map.extentFromValue(value);
        self.productMap.map.zoomToExtent(extent, true);
    };
    
    self.getValue = function() {
        var queryString = containerId + "=" + 
                Worldview.Widget.Map.valueFromExtent(
                    self.productMap.map.getExtent());
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
};

(function(ns) {
    
    ns.extentFromValue = function(value) {
        return OpenLayers.Bounds.fromString(value.replace(/_/g, ","));    
    };
    
    ns.valueFromExtent = function(extent) {
        return extent.toBBOX().replace(/,/g, "_");
    };
    
})(Worldview.Widget.Map);




