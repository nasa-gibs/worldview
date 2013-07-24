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
    self.selectedLayer = null;
    self.layers = [];
    
    /**
     * Fired when the data download mode is activated.
     * 
     * @event ACTIVATE
     * @final
     */
    self.ACTIVATE = "activate";
    
    /**
     * Fired when the data download mode is deactivated.
     * 
     * @event DEACTIVATE
     * @final
     */
    self.DEACTIVATE = "deactivate";
    
    self.LAYER_SELECT = "layerSelect";
    
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
    
    /**
     * Activates data download mode. If the mode is already active, this method
     * does nothing.
     * 
     * @method activate
     */    
    self.activate = function() {
        if ( !self.active ) {
            self.active = true;
            self.events.fire(self.ACTIVATE);
            if ( !selectedLayer ) {
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
            self.events.fire(self.DEACTIVATE);
        }
    };
    
    /**
     * Toggles the current mode of data download. Deactivates if already
     * active. Activates if already inactive.
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
        if ( selectedLayer === layerName ) {
            return;
        }
        if ( $.inArray(layerName, state.products) < 0 ) {
            throw new Error("Layer not in active list: " + layerName);
        }
        selectedLayer = layerName;
        self.events.fire(self.LAYER_SELECT, selectedLayer);    
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
            var id = layer;
            var layerName = config.products[layer].name;
            var productName = null;
            if ( config.products[layer].echo ) {
                productName = config.products[layer].echo.name;
            }
            self.layers.push({
                id: id,
                layerName: layerName,
                productName: productName
            });    
        });    
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