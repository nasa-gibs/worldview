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
     * @event DEEVENT_ACTIVATE
     * @final
     */
    self.EVENT_DEACTIVATE = "deactivate";
    
    self.EVENT_LAYER_SELECT = "layerSelect";
    self.EVENT_LAYER_UPDATE = "layerUpdate";
    
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
        
    /**
     * EVENT_ACTIVATEs data download mode. If the mode is already active, this method
     * does nothing.
     * 
     * @method EVENT_ACTIVATE
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
     * DeEVENT_ACTIVATEs data download mode. If the mode is not already active, this 
     * method does nothing.
     * 
     * @method deEVENT_ACTIVATE
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
    };
    
    self.update = function(newState) {
        if ( newState.productsString !== state.productsString ) {
            updateLayers(newState);
        }
        state = newState;    
    };
    
    var updateLayers = function(newState) {
        self.layers = [];
        $.each(newState.products, function(index, layer) {
            if ( $.inArray(layer, newState.hiddenProducts) >= 0 ) {
                return;
            }
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
    
    var findAvailableLayer = function() {
        // Find the top most layer that has a product entry in ECHO
        for ( var i = state.products.length - 1; i >= 0; i-- ) {
            var productName = state.products[i];
            console.log(config.products[productName]);
            if ( config.products[productName].echo ) {
                return productName;
            }
        }
        
        // If no products found, select the bottom most layer
        if ( state.products[0] ) {
            return state.products[0];
        }
    }
    
    return self;   
}