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

Worldview.Widget.Opacity = function(config) {
    
    var self = {};
    var layers = {};
    var log = Logging.getLogger("Worldview.Widget.Opacity");
    
    self.containerId = "opacity";
    
    var init = function() {
        REGISTRY.register(self.containerId, self);
        REGISTRY.markComponentReady(self.containerId);        
    };
    
    var getConfigOpacity = function(layerName) {
        var layer = config.products[layerName];
        if ( layer && layer.properties ) {
            if ( layer.properties.opacity === 0 || layer.properties.opacity ) {
                return layer.properties.opacity;
            }
        }    
        return 1;
    };
    
    self.setLayer = function(layerName, value) {
        layers[layerName] = value; 
        REGISTRY.fire(self);   
    };
    
    self.getLayer = function(layerName) {
        var opacity = layers[layerName];
        if ( !opacity && opacity !== 0 ) {
            opacity = getConfigOpacity(layerName);
        }
        if ( !opacity && opacity !== 0 ) {
            opacity = 1;
        }
        return opacity;
    };
    
    self.getValue = function() {
        var items = [];
        $.each(layers, function(layerName, opacity) {
            items.push(layerName + "," + opacity);
        });
        if ( items.length > 0 ) {
            return self.containerId + "=" + items.join("~");   
        } else { 
            return "";
        }
    };
    
    self.setValue = function(queryString) {
        layers = {};
        if ( !queryString ) {
            return;
        }
        var items = queryString.split("~");
        $.each(items, function(index, item) {
            var parts = item.split(",");
            var layerName = parts[0];
            var opacity = parseFloat(parts[1]);
            if ( isNaN(opacity) ) {
                log.warn("Invalid opacity for " + layerName + ": " + parts[1]);
            } else {
                layers[layerName] = opacity;  
            }  
        });
        REGISTRY.fire(self);
    };
    
    self.loadFromQuery = function(queryString) { 
        value = Worldview.extractFromQuery("opacity", queryString);
        if ( value ) {
            self.setValue(value);
        }
    };
    
    self.parse = function(queryString, object) {
        object.opacity = {};
        var opacityString = Worldview.extractFromQuery("opacity", queryString);
        object.opacityString = opacityString;
        if ( !opacityString ) {
            return object;
        }
        var definitions = opacityString.split("~");
        $.each(definitions, function(index, definition) {
            var items = definition.split(",");
            var layerName = items[0];
            var opacity = parseFloat(items[1]);
            object.opacity[layerName] = opacity;
        });
        return object;            
    };
    
    init();
    return self;
}
