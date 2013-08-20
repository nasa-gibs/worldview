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

Worldview.namespace("DataDownload");

/**
 * Data download model.
 * 
 * @module Worldview.DataDownload
 * @class Model
 * @constructor
 * @param config config
 */
Worldview.DataDownload.Model = function(config) {
    
    var log = Logging.getLogger("Worldview.DataDownload");
    
    var state = {
        layersString: null,
        projection: null,
        epsg: null,
        time: null
    };

    var ns = Worldview.DataDownload;
            
    var self = {};    

    /**
     * Fired when the data download mode is activated.
     * 
     * @event EVENT_ACTIVATE
     * @final
     */
    self.EVENT_ACTIVATE = "activate";
    
    /**
     * Fired when the data download mode is deactivated.
     * 
     * @event EVENT_ACTIVATE
     * @final
     */
    self.EVENT_DEACTIVATE = "deactivate";
    
    self.EVENT_LAYER_SELECT = "layerSelect";
    self.EVENT_LAYER_UPDATE = "layerUpdate";
    self.EVENT_QUERY = "query";
    self.EVENT_QUERY_RESULTS = "queryResults";
    self.EVENT_QUERY_CANCEL = "queryCancel";
    self.EVENT_QUERY_ERROR = "queryError";
    
    /**
     * Indicates if data download mode is active.
     * 
     * @attribute active {boolean}
     * @default false
     * @readOnly
     */
    self.active = false;
    
    /**
     * Handler for events fired by this class.
     * 
     * @attribute events {Events}
     * @readOnly
     * @type Events
     */
    self.events = Worldview.Events();
    
    self.selectedLayer = null;
    self.selectedProduct = null;
    self.layers = [];
    self.prefer = "science";
    
    self.granules = [];
    self.projection = null;
    self.crs = null;
    self.time = null;
    
    var init = function() {
    };
     
    /**
     * Activates data download mode. If the mode is already active, this method
     * does nothing.
     * 
     * @method activate
     */    
    self.activate = function(layerName) {
        if ( !self.active ) {
            self.active = true;
            self.events.trigger(self.EVENT_ACTIVATE);
            if ( layerName ) {
                self.selectLayer(layerName);
            } else if ( !self.selectedLayer ) {
                self.selectLayer(findAvailableLayer());
            } 
        }
    };
    
    /**
     * Deactivates data download mode. If the mode is not already active, this 
     * method does nothing.
     * 
     * @method deactivate
     */
    self.deactivate = function() {
        if ( self.active ) {
            self.active = false;
            self.events.trigger(self.EVENT_DEACTIVATE);
        }
    };
    
    /**
     * Toggles the current mode of data download. DeEVENT_ACTIVATEs if already
     * active. EVENT_ACTIVATEs if already inactive.
     * 
     * @method toggleMode
     */
    self.toggleMode = function() {
        if ( self.active ) {
            self.deactivate();
        } else {
            self.activate();
        }
    };
    
    self.selectLayer = function(layerName) {
        if ( !self.active || self.selectedLayer === layerName ) {
            return;
        }
        if ( layerName && $.inArray(layerName, state.layers) < 0 ) {
            throw new Error("Layer not in active list: " + layerName);
        }
        self.selectedLayer = layerName;
        if ( layerName && config.layers[layerName].echo ) {
            self.selectedProduct = config.layers[layerName].echo.product;
        } else {
            self.selectedProduct = null;
        }
        self.events.trigger(self.EVENT_LAYER_SELECT, self.selectedLayer);    
        query();
    };
    
    self.update = function(newState) {
        var oldState = state;
        state = newState;
        if ( oldState.layersString !== state.layersString ) {
            updateLayers();
        }
        if ( oldState.crs !== state.crs ) {
            updateProjection();
        }
        if ( !oldState.time || 
                oldState.time.getTime() !== state.time.getTime() ) {
            self.time = state.time;
            query();
        }
    };
    
    var query = function() {
        if ( !self.active ) {
            return;
        }
        if ( !self.selectedProduct ) {
            self.events.trigger(self.EVENT_QUERY_RESULTS, {
                meta: {},
                granules: []
            });
            return;
        }

        var productConfig = config.products[self.selectedProduct];
        var handlerFactory = 
                Worldview.DataDownload.Handler.getByName(productConfig.handler);
        
        var handler = handlerFactory(config, self);
        handler.events.on("query", function() {
            self.events.trigger(self.EVENT_QUERY);
        }).on("results", function(results) {
            self.events.trigger(self.EVENT_QUERY_RESULTS, results);
        }).on("error", function(textStatus, errorThrown) {
            self.events.trigger(self.EVENT_QUERY_ERROR, textStatus, errorThrown);
        });
        handler.submit();
    };
    
    var updateLayers = function() {
        if ( !state.layers ) {
            return;
        }
        self.layers = [];
        var foundSelected = false;
        $.each(state.layers, function(index, layer) {
            var id = layer;
            var layerName = config.layers[layer].name;
            var description = config.layers[layer].description;
            var productName = null;
            if ( config.layers[layer].echo ) {
                productName = config.layers[layer].echo.name;
            }
            self.layers.push({
                id: id,
                name: layerName,
                description: description,
                product: productName
            });
            if ( id === self.selectedLayer ) {
                foundSelected = true;
            }    
        });  
        if ( !foundSelected ) {
            self.selectLayer(null);
        }
        self.events.trigger(self.EVENT_LAYER_UPDATE);
        if ( self.active && !foundSelected ) {
            self.selectLayer(findAvailableLayer());
        }  
    };
    
    var updateProjection = function() {
        if ( !state.crs ) {
            return;
        }
        self.projection = state.projection;
        self.crs = state.crs;
        query();
    };
    
    var findAvailableLayer = function() {
        var foundLayer = null;
        
        // Find the top most layer that has a product entry in ECHO
        for ( var i = state.layers.length - 1; i >= 0; i-- ) {
            var layerName = state.layers[i];
            if ( config.layers[layerName].echo ) {
                foundLayer = layerName;
            }
        }
        
        // If no products found, select the bottom most layer
        if ( !foundLayer && state.layers[0] ) {
            foundLayer = state.layers[0];
        }
        return foundLayer;
    }
    
    init();
    return self;   
}