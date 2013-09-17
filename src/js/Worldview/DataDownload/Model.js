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
    
    var NO_PRODUCT_ID = "__NO_PRODUCT";
    var NO_PRODUCT = {
        name: "Not available",
        notSelectable: true
    };

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
    
    self.EVENT_PRODUCT_SELECT = "productSelect";
    self.EVENT_LAYER_UPDATE = "layerUpdate";
    self.EVENT_QUERY = "query";
    self.EVENT_QUERY_RESULTS = "queryResults";
    self.EVENT_QUERY_CANCEL = "queryCancel";
    self.EVENT_QUERY_ERROR = "queryError";
    self.EVENT_QUERY_TIMEOUT = "queryTimeout";
    self.EVENT_GRANULE_SELECT = "granuleSelect";
    self.EVENT_GRANULE_UNSELECT = "granuleUnselect";
    
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
    
    self.selectedProduct = null;
    self.selectedGranules = {};
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
    self.activate = function(productName) {
        if ( !self.active ) {
            self.active = true;
            self.events.trigger(self.EVENT_ACTIVATE);
            if ( productName ) {
                self.selectProduct(productName);
            } else if ( !self.selectedProduct ) {
                self.selectProduct(findAvailableProduct());
            } else {
                self.events.trigger(self.EVENT_PRODUCT_SELECT, 
                        self.selectedProduct);    
                query();
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
    
    self.groupByProducts = function() {
        var products = {};
        $.each(self.layers, function(index, layer) {
            var productId = layer.product || NO_PRODUCT_ID;
            var product = config.products[productId] || NO_PRODUCT;
            if ( !products[productId] ) {
                products[productId] = {
                    title: product.name,
                    items: [],
                    notSelectable: product.notSelectable
                };
            }
            products[productId].items.push({
                label: layer.name,
                sublabel: layer.description,
                value: layer.id,
                categories: { All: 1 }
            });
        });
        
        // Add not available to the end if it exists by removing it and
        // re-adding
        if ( products["__NO_PRODUCT"] ) {
            var x = products["__NO_PRODUCT"];
            delete products["__NO_PRODUCT"];
            products["__NO_PRODUCT"] = x;
        }
        return products;
    };
    
    self.getProductsString = function() {
        var parts = [];
        var products = self.groupByProducts();
        $.each(products, function(key, product) {
            var layers = []; 
            $.each(product.items, function(index, item) {
                layers.push(item.value);    
            });
            parts.push(key + "," + layers.join(","));
        });
        return parts.join("~");    
    };
    
    self.selectProduct = function(productName) {
        if ( self.selectedProduct === productName ) {
            return;
        }
        self.selectedProduct = productName;
                
        if ( self.active ) {
            self.events.trigger(self.EVENT_PRODUCT_SELECT, self.selectedProduct);    
            query();
        }
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
    
    self.selectGranule = function(granule) {
        self.selectedGranules[granule.id] = granule;
        self.events.trigger(self.EVENT_GRANULE_SELECT, granule);    
    };
    
    self.unselectGranule = function(granule) {
        delete self.selectedGranules[granule.id];
        self.events.trigger(self.EVENT_GRANULE_UNSELECT, granule); 
    };
    
    self.setPreference = function(preference) {
        self.prefer = preference;
        query();
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
        }).on("timeout", function() {
            self.events.trigger(self.EVENT_QUERY_TIMEOUT);
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
                productName = config.layers[layer].echo.product;
            }
            self.layers.push({
                id: id,
                name: layerName,
                description: description,
                product: productName
            });
            if ( productName === self.selectedProduct ) {
                foundSelected = true;
            }    
        });  
        if ( !foundSelected ) {
            self.selectProduct(null);
        }
        self.events.trigger(self.EVENT_LAYER_UPDATE);
        if ( self.active && !foundSelected ) {
            self.selectProduct(findAvailableProduct());
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
    
    var findAvailableProduct = function() {
        var foundProduct = null;
        
        // Find the top most layer that has a product entry in ECHO
        for ( var i = state.layers.length - 1; i >= 0; i-- ) {
            var layerName = state.layers[i];
            if ( config.layers[layerName].echo ) {
                foundProduct = config.layers[layerName].echo.product;
            }
        }
        return foundProduct;
    };
    
    init();
    return self;   
};