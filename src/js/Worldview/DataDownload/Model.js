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
    
    var client = null;
    
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
    self.selectedProduct = null;
    self.layers = [];
    
    self.granules = [];
    self.projection = null;
    self.epsg = null;
    self.time = null;
    
    var init = function() {
        if ( config.parameters.mockECHO ) {
            log.warn("Using mock ECHO client");
            client = Worldview.DataDownload.ECHOClientMock();
        } else {
            client = Worldview.DataDownload.ECHOClient();
        }
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
        if ( $.inArray(layerName, state.layers) < 0 ) {
            throw new Error("Layer not in active list: " + layerName);
        }
        self.selectedLayer = layerName;
        if ( config.layers[layerName].echo ) {
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
        if ( oldState.projection !== state.projection  ||
                oldState.epsg !== state.epsg ) {
            updateProjection();
        }
        if ( oldState.time !== state.time ) {
            self.time = state.time;
            query();
        }
    };
    
    var query = function() {
        if ( !self.active ) {
            return;
        }
        if ( !self.selectedProduct ) {
            self.events.trigger(self.EVENT_QUERY_RESULTS, []);
            return;
        }

        var productConfig = config.products[self.selectedProduct];
        
        var t = state.time;
        startTime = new Date(Date.UTC(
            t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 0, 0, 0));
        endTime = new Date(Date.UTC(
            t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 23, 59, 59));
                             
        var method = productConfig.echo.method;
        var options = config.echo[method].query || {};
        if ( options.timeWindow ) {
            startDelta = options.timeWindow[0];
            endDelta = options.timeWindow[1];
            
            startTime.setUTCMinutes(startTime.getUTCMinutes() + startDelta);
            endTime.setUTCMinutes(endTime.getUTCMinutes() + endDelta);
        }    
         
        var parameters = {
            shortName: productConfig.echo.shortName,
            dataCenterId: productConfig.echo.dataCenterId,
            startTime: startTime.toTimestampUTC(),
            endTime: endTime.toTimestampUTC()
        }
        client.query(parameters);
    };
    
    var updateLayers = function() {
        if ( !state.layers ) {
            return;
        }
        self.layers = [];
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
        });  
        self.events.trigger(self.EVENT_LAYER_UPDATE);  
    };
    
    var updateProjection = function() {
        if ( !state.projection || !state.epsg ) {
            return;
        }
        self.projection = state.projection;
        self.epsg = state.epsg;
        self.events.trigger(self.EVENT_PROJECTION_UPDATE, self.projection,
                self.epsg);
    };
    
    var findAvailableLayer = function() {
        // Find the top most layer that has a product entry in ECHO
        for ( var i = state.layers.length - 1; i >= 0; i-- ) {
            var layerName = state.layers[i];
            if ( config.layers[layerName].echo ) {
                return layerName;
            }
        }
        
        // If no products found, select the bottom most layer
        if ( state.layers[0] ) {
            return state.layers[0];
        }
    }
    
    init();
    return self;   
}