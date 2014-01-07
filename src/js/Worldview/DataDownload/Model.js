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

Worldview.DataDownload.Model = function(config, spec) {

    var NO_PRODUCT_ID = "__NO_PRODUCT";
    var NO_PRODUCT = {
        name: "Not available for download &nbsp;&nbsp;<span>(?)</span>",
        notSelectable: true
    };

    var state = {
        layersString: null,
        projection: null,
        epsg: null,
        time: null
    };
    var layersModel = spec.layersModel;
    var queryExecuting = false;
    var nextQuery = null;

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
    self.events = wv.util.events();

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
            try {
                if ( productName ) {
                    validateProduct(productName);
                }
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
            } catch ( error ) {
                self.active = false;
                self.selectedProduct = null;
                throw error;
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
            if ( productName ) {
                query();
            }
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
        if ( self.selectedGranules[granule.id] ) {
            delete self.selectedGranules[granule.id];
            self.events.trigger(self.EVENT_GRANULE_UNSELECT, granule);
        }
    };

    self.isSelected = function(granule) {
        var selected = false;
        $.each(self.selectedGranules, function(index, selection) {
            if ( granule.id === selection.id ) {
                selected = true;
            }
        });
        return selected;
    };

    self.getSelectionSize = function() {
        var totalSize = 0;
        var sizeValid = true;
        $.each(self.selectedGranules, function(index, granule) {
            if ( sizeValid && granule.granule_size ) {
                totalSize += parseFloat(granule.granule_size);
            } else {
                sizeValid = false;
            }
        });
        if ( sizeValid ) {
            return totalSize;
        }
    };

    self.getSelectionCounts = function() {
        counts = {};
        $.each(self.layers, function(index, layer) {
            if ( layer.product ) {
                counts[layer.product] = 0;
            }
        });
        $.each(self.selectedGranules, function(index, granule) {
            counts[granule.product] ++;
        });
        return counts;
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
        if ( !productConfig ) {
            throw Error("Product not defined: " + self.selectedProduct);
        }

        var handlerFactory =
                Worldview.DataDownload.Handler.getByName(productConfig.handler);

        var handler = handlerFactory(config, self);
        handler.events.on("query", function() {
            self.events.trigger(self.EVENT_QUERY);
        }).on("results", function(results) {
            queryExecuting = false;
            if ( self.active && !nextQuery ) {
                self.events.trigger(self.EVENT_QUERY_RESULTS, results);
            }
            if ( nextQuery ) {
                var q = nextQuery;
                nextQuery = null;
                executeQuery(q);
            }
        }).on("error", function(textStatus, errorThrown) {
            queryExecuting = false;
            if ( self.active ) {
                self.events.trigger(self.EVENT_QUERY_ERROR, textStatus,
                        errorThrown);
            }
        }).on("timeout", function() {
            queryExecuting = false;
            if ( self.active ) {
                self.events.trigger(self.EVENT_QUERY_TIMEOUT);
            }
        });
        executeQuery(handler);
    };

    var executeQuery = function(handler) {
        if ( !queryExecuting ) {
            try {
                queryExecuting = true;
                handler.submit();
            } catch ( error ) {
                queryExecuting = false;
                throw error;
            }
        } else {
            nextQuery = handler;
        }
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
            var productName = config.layers[layer].product;
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

        // If a layer was removed and the product no longer exists,
        // remove any selected items in that product
        // FIXME: This is a hack for now and should be cleaned up when
        // everything changes to models.
        var products = self.groupByProducts();
        $.each(self.selectedGranules, function(index, selected) {
            if ( !products[selected.product] &&
                    !productActive(selected.product)) {
                self.unselectGranule(selected);
            }
        });
    };

    var productActive = function(product) {
        var active = false;
        $.each(["baselayers", "overlays"], function(i, type) {
            $.each(layersModel.active[type], function(j, layer) {
                if ( layer.product === product ) {
                    active = true;
                    return false;
                }
            });
        });
        return active;
    };

    var updateProjection = function() {
        if ( !state.crs ) {
            return;
        }
        self.projection = state.projection;
        self.crs = state.crs;
        self.events.trigger("projectionUpdate");
        query();
        //self.selectProduct(null);
    };

    var findAvailableProduct = function() {
        var foundProduct = null;

        // Find the top most layer that has a product entry in ECHO
        for ( var i = state.layers.length - 1; i >= 0; i-- ) {
            var layerName = state.layers[i];
            if ( config.layers[layerName].product) {
                foundProduct = config.layers[layerName].product;
            }
        }
        return foundProduct;
    };

    var validateProduct = function(productName) {
        var found = false;
        $.each(self.layers, function(index, layer) {
            var layerProduct = layer.product;
            if ( layerProduct === productName ) {
                found = true;
                return false;
            }
        });
        if ( !found ) {
            throw Error("No layer displayed for product: " + productName);
        }
    };

    init();
    return self;
};