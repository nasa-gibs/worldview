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
    
    var state = {};
    var client = Worldview.DataDownload.ECHOClient();
    
    var self = {};    

    /**
     * Fired when the data download mode is EVENT_ACTIVATEd.
     * 
     * @event EVENT_ACTIVATE
     * @final
     */
    self.EVENT_ACTIVATE = "activate";
    
    /**
     * Fired when the data download mode is deEVENT_ACTIVATEd.
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
    self.EVENT_PROJECTION_UPDATE = "projectionUpdate";
    
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
    self.layers = [];
    
    self.granules = [];
    self.projection = null;
    self.epsg = null;
    
    var init = function() {
        client.events
            .on("query", function() { 
                self.events.trigger(self.EVENT_QUERY);
            })
            .on("results", function(results, parameters) {
                self.events.trigger(self.EVENT_QUERY_RESULTS, results, 
                        parameters);
            })
            .on("cancel", function() {
                self.events.trigger(self.EVENT_QUERY_CANCEL);
            })
            .on("error", function(status, error, parameters) {
                self.events.trigger(self.EVENT_QUERY_ERROR, status, error,
                        parameters);
            });    
    };
     
    /**
     * Activates data download mode. If the mode is already active, this method
     * does nothing.
     * 
     * @method activate
     */    
    self.activate = function() {
        if ( !self.active ) {
            self.active = true;
            self.events.trigger(self.EVENT_ACTIVATE);
            if ( !self.selectedLayer ) {
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
        if ( self.selectedLayer === layerName ) {
            return;
        }
        if ( $.inArray(layerName, state.products) < 0 ) {
            throw new Error("Layer not in active list: " + layerName);
        }
        self.selectedLayer = layerName;
        self.events.trigger(self.EVENT_LAYER_SELECT, self.selectedLayer);    
        query();
    };
    
    self.update = function(newState) {
        if ( newState.productsString !== state.productsString ) {
            updateLayers(newState);
        }
        if ( newState.projection !== state.projection  ||
                newState.epsg !== state.epsg ) {
            updateProjection(newState);
        }
        state = newState;    
    };
    
    var query = function() {
        var layerConfig = config.products[self.selectedLayer];
        if ( !layerConfig.echo ) {
            self.events.trigger(self.EVENT_QUERY_RESULTS, []);
            return;
        }
        
        var parameters = {
            shortName: layerConfig.echo.shortName,
            dataCenterId: layerConfig.echo.dataCenterId,
            day: state.time.toISOStringDate()
        }
        client.query(parameters);
    };
    
    var updateLayers = function(newState) {
        self.layers = [];
        $.each(newState.products, function(index, layer) {
            var id = layer;
            var layerName = config.products[layer].name;
            var description = config.products[layer].description;
            var productName = null;
            if ( config.products[layer].echo ) {
                productName = config.products[layer].echo.name;
            }
            self.layers.push({
                id: id,
                name: layerName,
                description: description,
                product: productName
            });    
        });  
        self.events.trigger(self.EVENT_LAYER_UPDATE);  
    };
    
    var updateProjection = function(newState) {
        self.projection = newState.projection;
        self.epsg = newState.epsg;
        self.events.trigger(self.EVENT_PROJECTION_UPDATE, self.projection,
                self.epsg);
    };
    
    var findAvailableLayer = function() {
        // Find the top most layer that has a product entry in ECHO
        for ( var i = state.products.length - 1; i >= 0; i-- ) {
            var productName = state.products[i];
            if ( config.products[productName].echo ) {
                return productName;
            }
        }
        
        // If no products found, select the bottom most layer
        if ( state.products[0] ) {
            return state.products[0];
        }
    }
    
    init();
    return self;   
}