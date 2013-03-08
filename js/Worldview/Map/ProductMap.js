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
 
Worldview.namespace("Map");

/**
 * Class: Worldview.Map.ProductMap
 * Map object that handles GIBS products. 
 * 
 * Constructor: ProductMap
 * Creates a new instance
 * 
 * Parameters: 
 * containerId - The identifier of the HTML DOM element to add the map objects
 *               to.
 * mapConfig   - Configuration for the maps and products of type 
 *               <MapConfig>.
 * 
 * Throws:
 * An exception if no DOM element exists with the provided containerId.
 */
Worldview.Map.ProductMap = function(containerId, mapConfig, component) {
    
    var log = Logging.Logger("Worldview.Map");
    var self = {};
    
    // Map objects, one for each supported projection
    var activeMaps = {};
    
    // Configurations for each available product
    var productConfigs = {};
    
    // Current set of products that have been added to the map, one set
    // for each supported projection.
    var activeProducts = {};
    
    // Display products on the map for this day
    var currentDay = new Date();
    
    //-------------------------------------------------------------------------
    // Public
    //-------------------------------------------------------------------------
    
    /**
     * Property: mapConfig
     * The <Wordlview.JSON.MapConfig> used in configuration (read only).
     */
    self.mapConfig = mapConfig;
    
    /**
     * Property: map
     * OpenLayers.Map object used for the currently selected projection
     * (read only).
     */
    self.map = null;
    
    /**
     * Property: products
     * Array containing the name of each prodcut that is visible on the map for 
     * the currently selected projection (read only).
     */
    self.products = null;
    
    /**
     * Property: projection
     * Current map projection (read only). Set via <setProjection>.
     */
    self.projection = null;    
    
    var init = function() {
        var $container = $("#" + containerId);
        if ( $container.length === 0 ) {
            throw "No container for ProductMap: " + containerId;
        }
        
        // Create map objects, one for each projection.     
        $.each(mapConfig.projections, function(projection, config) {
            config = validateMapConfig(config);
            var id = "map-" + projection;
            
            var newMap = createMap($container, id, projection, config);
            log.debug("newMap projection: " + newMap.projection);
            
            // Put in a bogus layer to act as the base layer to make the
            // map happy for setting up the starting location
            newMap.addLayer(new OpenLayers.Layer({
                isBaseLayer: true
            }));
            
            // If a starting location is provided, go there otherwise
            // zoom to max extent
            if ( config.startCenter || config.startZoom ) {
                var startCenter = config.startCenter || [0, 0];
                var startZoom = config.startZoom || 0;
                log.debug(projection + " start: " + startCenter + ", " + 
                        startZoom);
                newMap.setCenter(startCenter, startZoom);
            } else {
                log.debug(projection + " start: maxExtent");
                newMap.zoomToMaxExtent();
            }
            
            newMap.products = {};
            activeMaps[projection] = newMap;
            activeProducts[projection] = [];
            
            newMap.events.register("addlayer", self, refreshZOrder);
            newMap.events.register("removelayer", self, refreshZOrder);
            newMap.events.register("moveend", self, fireEvent);
            newMap.events.register("zoomend", self, onZoomEnd);
        });
        productConfigs = mapConfig.products;
        
        self.setProjection(mapConfig.defaultProjection || "geographic");
    };
    
    /**
     * Method: setProjection
     * Changes the projection of the map.
     * 
     * Parameters:
     * projection - The name of the projection to use (e.g., "geographic", 
     *              "arctic", "antarctic"). 
     * 
     * Throws:
     * An exception if the specified projection is not supported.
     */
    self.setProjection = function(projection) { 
        if ( !(projection in activeMaps) ) {
            throw "Unsupported projection: " + projection;
        }
        log.debug("Switch projection: " + projection);
        
        // Hide all map elements and then display only the ones for this
        // projection
        $(".map-projection").css("display", "none");
        $(".map-" + projection).css("display", "block");
        
        // Update convenience variables
        self.map = activeMaps[projection];
        self.products = activeProducts[projection];
        self.projection = projection;
        
        // Ensure the current layers are using the current day if this was
        // changed in the last projection
        self.setDay(currentDay);
    };
    
    /**
     * Method: setDay
     * Display product data for the specified ay.
     * 
     * Parameters:
     * day - Day to display as a Date object. If this is undefined or null,
     * this method does nothing.
     */
    self.setDay = function(day) {
        if ( day ) {
            currentDay = day;
            $.each(self.map.products, function(name, product) {
                product.setDay(day); 
            });
            refreshZOrder();
        }
    };
    
    /**         
    * Method: set
    * Set the products that should be displayed on the map. 
    * 
    * Parameters: 
    * requestedProducts - Array of product names to show on the map. If a
    *   product is currently displayed, but is not in the array, it will be
    *   removed from the map. If a product is not currently displayed, but it
    *   is in the array, it will be added to the map.
    * 
    * Throws:
    * An exception if the product for the given name is not defined.
    */
    self.set = function(requestedProducts) {
        var newProducts = [];
        
        $.each(requestedProducts, function(index, product) {
            if ( $.inArray(product, self.products) < 0 ) {
                if ( add(product) ) {
                    newProducts.push(product);
                }
            } else {
                newProducts.push(product);
            }
        });
        $.each(self.products, function(index, product) {
            if ( $.inArray(product, requestedProducts) < 0 ) {
                remove(product);
            } 
        });
        activeProducts[self.projection] = newProducts;
        self.products = activeProducts[self.projection];
        refreshZOrder();
    };
    
    /**
     * Method: append
     * Appends a layer to the map which is displayed on top.
     * 
     * Parameters:
     * product - Name of the product to append to the map. If the product
     *           already exsits, this method does nothing.
     */
    self.append = function(product) {
        if ( $.inArray(product, self.products) >= 0 ) {
            log.warn("Product already exists: " + product);
            return;
        }
        var newProducts = $.extend([], self.products);
        newProducts.push(product);
        self.set(newProducts); 
        refreshZOrder();   
    };
    
    //-------------------------------------------------------------------------
    // Private
    //-------------------------------------------------------------------------
    
    var fireEvent = function() {
        REGISTRY.fire(component);
    };
    
    /* 
     * Adds a product of the given name to map. Returns true if the product
     * was added or already exists, false if the product is not supported
     * by the projection.
     */    
    var add = function(name) {
        if ( name === "NON_EXISTENT_LAYER" ) {
            return;
        }
        
        var productConfig = productConfigs[name];
        if ( !productConfig ) {
            log.warn("No such product: " + name);
            return false;
        }
        if ( $.inArray(name, self.products) >= 0 ) {
            log.warn("Product already added: " + name);
            return true;
        }
        
        var supported = false;
        if ( self.projection in productConfig.projections ) {
            log.debug("Adding product: " + name);
            var product = createProduct(self.map, self.projection, 
                    productConfigs[name]);
            product.setDay(currentDay);
            self.map.products[name] = product;
            supported = true;
        } else {
            log.warn(name + " does not support " + self.projection);
            supported = false;
        }
        return supported;
    };
        
    /*
     * Removes the given product from the map.
     */
    var remove = function(name) {        
        if ( $.inArray(name, self.products) < 0 ) {
            log.warn("Product has not been added: " + name);
            return;
        }   
        var product = self.map.products[name];
        if ( product ) {
            log.debug("Removing product: " + name);
            product.dispose();
            delete self.map.products[name]; 
        } else {
            log.warn("Product does not exist: " + name);
        }       
    };
        
    /*
     * The order of the layers in the OpenLayers.Map object is not used
     * to determine the z-index but is done manually instead since this
     * is much easier. Change the z-index for for each product based on 
     * its positition in the products array. 
     */    
    var refreshZOrder = function() {
        $.each(self.products, function(index, name) { 
            var product = self.map.products[name];
            if ( product ) {
                product.setZIndex(index * 2);
            }
        });
        $.each(self.products, function(index, name) { 
            var product = self.map.products[name];
            if ( product && product.bringToFront === true ) {
                product.setZIndex(index * 2 + self.products.length * 2);
            }
        });
    };
    
    /*
     * Creates the OpenLayers.Map object and all associated controls.
     */
    var createMap = function($div, id, projection, spec) {
        
        var config = $.extend(true, {}, spec);
        var controls = [];
        
        $("<div></div>")
            .appendTo($div)
            .attr("id", id)
            .addClass("map-projection")
            .addClass(id);
        
        var mapClass = "map-projection " + id + " ";
        
        // Create zoom in/out controls                
        var zoomInControl = new OpenLayers.Control.ZoomIn();
        zoomInControl.title = "zoom in";
        zoomInControl.displayClass = mapClass + "olControlZoomInCustom";
        
        var zoomOutControl = new OpenLayers.Control.ZoomOut();
        zoomOutControl.title = "zoom out";
        zoomOutControl.displayClass = mapClass + "olControlZoomOutCustom";

        // Create panel to hold zoom controls and add to map
        var zoomPanel = new OpenLayers.Control.Panel();
        zoomPanel.displayClass = mapClass + "olControlZoomPanelCustom";
        zoomPanel.addControls(zoomInControl);
        zoomPanel.addControls(zoomOutControl);
        controls.push(zoomPanel);
       
        // Add navigation controls
        controls.push(new OpenLayers.Control.Navigation({
            dragPanOptions: {
                enableKinetic: true
            }
        }));
       
        // While these aren't controls, per se, they are extra decorations
        controls.push(new OpenLayers.Control.Attribution());
        controls.push(new OpenLayers.Control.ScaleLine({
            displayClass: mapClass + "olControlScaleLineCustom"
        }));        
        
        var coordinateControl = 
                Worldview.Map.COORDINATE_CONTROLS[projection];     
        if ( coordinateControl ) {
            controls.push(coordinateControl);
        } else {
            log.warn("No coordinate control for projection " + projection);
        }
        
        config.controls = controls;
        var m = new OpenLayers.Map(id, config);

        var navControl = 
                m.getControlsByClass("OpenLayers.Control.Navigation")[0];
        navControl.handlers.wheel.interval = 100;
        navControl.handlers.wheel.cumulative = false;
        
        return m;        
    }
    
    /*
     * Validates the configuraiton for the OpenLayers.Map object, provides
     * any missing defaults, and does any object conversions as needed.
     */
    var validateMapConfig = function(config) {
        var config = $.extend(true, config, {});
        config.maxExtent = new OpenLayers.Bounds(config.maxExtent);
        config.allOverlays = true;
        config.fractionalZoom = false;
        return config;
    };

    /*
     * Merges in any projection specific properties.
     */    
    var createProduct = function(map, proj, config) {
        config = $.extend(true, {}, config);
        
        if ( config.properties === undefined ) {
            config.properties = {};    
        }
        
        // Merge in any projection specific properties
        config.properties = $.extend(true, config.properties, 
                                     config.projections[proj]);
        delete config.projections;  
                  
        config.properties.projection = mapConfig.projections[proj].projection;
        if ( config.parameters ) {
            config.parameters.projection = 
                mapConfig.projections[proj].projection;
        }

        if ( config.product === "daily" ) {
            return Worldview.Map.DailyProduct(map, config);
        } else if ( config.product === "static" ) {
            return Worldview.Map.StaticProduct(map, config);
        }
        throw "Unsupported product type: " + config.product;
    };
    
    var onZoomEnd = function(evt) {
        // "Disable" zoom in icon if zoomed to highest level
        // TODO: fix "color" updates since they don't currently have an effect
        if ( self.map.zoom === self.map.numZoomLevels - 1 ) {
            $('.olControlZoomInCustomItemInactive', '.map-' + self.projection)
                .css("background-color", "rgba(38,38,38,0.3)");
            $('.olControlZoomInCustomItemInactive', '.map-' + self.projection)
                .css("color", "#555555");
        }
        else {
            $('.olControlZoomInCustomItemInactive', '.map-' + self.projection)
                .css("background-color", "rgba(45,50,55,0.70)");
            $('.olControlZoomInCustomItemInactive', '.map-' + self.projection)
                .css("color", "#FFFFFF");
        }
    
        // "Disable" zoom out icon if zoomed to lowest level
        if ( self.map.zoom === 0 ) {
            $('.olControlZoomOutCustomItemInactive', '.map-' + self.projection)
                .css("background-color", "rgba(38,38,38,0.3)");
            $('.olControlZoomOutCustomItemInactive', '.map-' + self.projection)
                .css("color", "#555555");
        }
        else {
            $('.olControlZoomOutCustomItemInactive', '.map-' + self.projection)
                .css("background-color", "rgba(45,50,55,0.70)");
            $('.olControlZoomOutCustomItemInactive', '.map-' + self.projection)
                .css("color", "#FFFFFF");
        }           
    };
            
    init();
    return self;
}
