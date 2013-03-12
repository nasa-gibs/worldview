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

Worldview.Widget.PaletteManager = function(containerId, config) {
    
    var self = {};
    var log = Logging.Logger("Worldview.PaletteManager");
    var value = "";
    
    self.config = config;
    
    var init = function() {
        //Logging.debug("Worldview.PaletteManager");
        log.debug("PaletteManager.init");
        if ( REGISTRY ) {
            REGISTRY.register(containerId, self);
        } else {
            throw "Cannot register PaletteManager, REGISTRY not found";
        }
        REGISTRY.markComponentReady(containerId);        
    };
    
    self.setValue = function(v) {
        if ( v === undefined ) {
            return;
        }
        if ( v !== value ) {
            log.debug("PaletteManager.setValue: " + v);
            value = v;
            REGISTRY.fire(self);
        }
    }
    
    self.getValue = function() {
        return containerId + "=" + value;
    }
    
    self.loadFromQuery = function(queryString) {
        log.debug("PaletteManager.loadFromQuery: " + queryString);
        var query = Worldview.queryStringToObject(queryString);
        self.setValue(query.palettes);    
    };
    
    init();
    return self;
}
