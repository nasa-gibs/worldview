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
 * Class: Worldview.Map.MapSet
 * Map object that handles GIBS products. 
 * 
 * Constructor: MapSet
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
Worldview.Map.MapSet = function(containerId, mapConfig, component) {
    
    var log = Logging.getLogger("Worldview.Map");
    var self = {};
       
    // Configurations for each available product
    var productConfigs = {};
    
    // Current set of layers that have been added to the map, one set
    // for each supported projection.
    var activeLayers = {};
    
    // Display layers on the map for this day
    var currentDay = Worldview.today();
    
    // The number of layers in the processing of loading. This is used
    // to fire maploadstart and maploadend events.
    var layersLoading = 0;   
      
    //-------------------------------------------------------------------------
    // Public
    //-------------------------------------------------------------------------
    
    /**
     * Property: mapConfig
     * The <Wordlview.JSON.MapConfig> used in configuration (read only).
     */
    self.mapConfig = mapConfig;

    // Map objects, one for each supported projection    
    self.projections = {};
    
    /**
     * Property: map
     * OpenLayers.Map object used for the currently selected projection
     * (read only).
     */
    self.map = null;
    
    /**
     * Property: layers
     * Array containing the name of each layer that is visible on the map for 
     * the currently selected projection (read only).
     */
    self.layers = null;
    
    /**
     * Property: projection
     * Current map projection (read only). Set via <setProjection>.
     */
    self.projection = null;    
    
    var init = function() {        
        var $container = $("#" + containerId);
        if ( $container.length === 0 ) {
            throw new Error("No container for MapSet: " + containerId);
        }
        
        // Create map objects, one for each projection.     
        $.each(mapConfig.projections, function(projection, config) {
            config = validateMapConfig(config);
            var id = "map-" + projection;
            
            var newMap = createMap($container, id, projection, config);
            log.debug("newMap projection: " + newMap.projection);
            
            // Put in a bogus layer to act as the base layer to make the
            // map happy for setting up the starting location
            var options = {
                isBaseLayer: true,
                projection: config.projection,
                maxExtent: config.maxExtent,
                maxResolution: 0.5625,
                units: config.units || "dd"
            };
            var blankLayer = new OpenLayers.Layer("Blank", options);
            newMap.addLayer(blankLayer);
            
            // If a starting location is provided, go there otherwise
            // zoom to max extent
            if ( config.startCenter || config.startZoom ) {
                var startCenter = config.startCenter || [0, 0];
                var startZoom = config.startZoom || 0;
                log.debug(projection + " start: " + startCenter + ", " + 
                        startZoom);
                newMap.setCenter(startCenter, startZoom);
                log.debug("Center is: " + newMap.getCenter() + ", " + newMap.getZoom());
            } else {
                log.debug(projection + " start: maxExtent");
                newMap.zoomToMaxExtent();
            }
            
            newMap.layerSets = {};
            self.projections[projection] = newMap;
            activeLayers[projection] = [];
            
            newMap.events.register("addlayer", self, onAddLayer);
            newMap.events.register("removelayer", self, onRemoveLayer);
            newMap.events.register("moveend", self, fireEvent);
            newMap.events.register("zoomend", self, onZoomEnd);
            
            // Keep track of center point on projection switch
            newMap.previousCenter = newMap.getCenter();
        });
        layerConfigs = mapConfig.layers;
        
        self.setProjection(mapConfig.defaultProjection || "geographic");
        
        $(document.body).mousemove(function(event) {
            /* FIXME: This code breaks other components, see WV-150
            newEvent = $.extend(true, {}, event);
            newEvent.xy = {
                x: event.clientX,
                y: event.clientY
            };
            self.map.events.triggerEvent("mousemove", newEvent);
            */
        });
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
        if ( !(projection in self.projections) ) {
            throw new Error("Unsupported projection: " + projection);
        }
        log.debug("Switch projection: " + projection);
        
        // Hide all map elements and then display only the ones for this
        // projection
        $(".map-projection").css("display", "none");
        $(".map-" + projection).css("display", "block");
        
        // Keep track of center point on projection switch        
        if ( self.map ) {
            self.map.previousCenter = self.map.getCenter();
        }
        
        // Update convenience variables
        self.map = self.projections[projection];
        self.layers = activeLayers[projection];
        self.projection = projection;

        // If the browser was resized, the inactive map was not notified of
        // the event. Force the update no matter what and reposition the center
        // using the previous value.        
        self.map.updateSize();
        self.map.setCenter(self.map.previousCenter);
        
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
            $.each(self.map.layerSets, function(name, layer) {
                layer.setDay(day); 
            });
            refreshZOrder();
        }
    };
    
    self.setOpacity = function(layerName, opacity) {
        $.each(self.map.layerSets, function(name, layer) {
            if ( name == layerName ) {
                var value = parseFloat(opacity);
                if ( isNaN(value) ) {
                    log.warn("Invalid opacity for layer " + layerName + ": " + 
                            opacity);
                } else {
                    layer.setOpacity(value);
                }
            }    
        });
    }
    
    /**         
    * Method: set
    * Set the layers that should be displayed on the map. 
    * 
    * Parameters: 
    * requestedLayers - Array of product names to show on the map. If a
    *   product is currently displayed, but is not in the array, it will be
    *   removed from the map. If a product is not currently displayed, but it
    *   is in the array, it will be added to the map.
    * 
    * Throws:
    * An exception if the product for the given name is not defined.
    */
    self.set = function(requestedLayers, hiddenLayers) {
        var newLayers = [];
        
        $.each(requestedLayers, function(index, layer) {
            if ( $.inArray(layer, self.layers) < 0 ) {
                if ( add(layer) ) {
                    newLayers.push(layer);
                }
            } else {
                newLayers.push(layer);
            }
            if ( self.map.layerSets[layer] ) {
                if ( $.inArray(layer, hiddenLayers) >= 0 ) {
                    self.setVisibility(layer, false);    
                } else {
                    self.setVisibility(layer, true);
                }
            }
        });
        $.each(self.layers, function(index, layer) {
            if ( $.inArray(layer, requestedLayers) < 0 ) {
                remove(layer);
            } 
        });
        activeLayers[self.projection] = newLayers;
        self.layers = activeLayers[self.projection];
        refreshZOrder();
    };
    
    self.setVisibility = function(layer, value, options) {
        self.map.layerSets[layer].setVisibility(value, options);    
    };
    
    /**
     * Method: append
     * Appends a layer to the map which is displayed on top.
     * 
     * Parameters:
     * product - Name of the product to append to the map. If the product
     *           already exsits, this method does nothing.
     */
    self.append = function(layer) {
        if ( $.inArray(layer, self.layers) >= 0 ) {
            log.warn("Layer already exists: " + product);
            return;
        }
        var newLayers = $.extend([], self.layers);
        newLayers.push(layer);
        self.set(newLayers); 
        refreshZOrder();   
    };
    
    /**
     * Method: setPalettes
     * Sets which products should have custom palettes applied.
     * 
     * Parameters:
     * activePalettes - An object which has product names as properties
     * and palette names as values.
     */
    self.setPalettes = function(activePalettes) {
        $.each(self.projections, function(projection, map) {
            $.each(map.layerSets, function(layerName, layer) {
                var paletteName = activePalettes[layerName];
                if ( paletteName ) {
                    // Find the rendered palette for this product
                    var layerConfig = self.mapConfig.layers[layerName];
                    var renderedName = layerConfig.rendered;
                    var renderedPalette = self.mapConfig.palettes[renderedName];
                    
                    if ( !renderedPalette ) {
                        log.warn(productName + " does not support palettes");
                        return;
                    }
                    // Find the palette that should be used instead
                    var palette = self.mapConfig.palettes[paletteName];
                    
                    if ( !palette ) {
                        log.warn("No such palette: " + paletteName);
                        return;
                    }
                    // Create a lookup table and map it to the color
                    // values found in the rendered palette
                    var indexed = Worldview.Palette.toIndexedLookup(
                        layerConfig.bins, palette, layerConfig.stops);
                    var lookup = Worldview.Palette.toColorLookup(
                        indexed, renderedPalette.stops);
                        
                    // Apply     
                    layer.setLookup(lookup);
                } else {
                    layer.clearLookup();
                }
            });
        });
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
        
        var layerConfig = layerConfigs[name];
        if ( !layerConfig ) {
            log.warn("No such layer: " + name);
            return false;
        }
        if ( $.inArray(name, self.layers) >= 0 ) {
            log.warn("Layer already added: " + name);
            return true;
        }
        
        var supported = false;
        if ( self.projection in layerConfig.projections ) {
            log.debug("Adding layer: " + name);
            var layer = createLayer(self.map, self.projection, 
                    layerConfigs[name]);
            layer.setDay(currentDay);
            self.map.layerSets[name] = layer;
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
        if ( $.inArray(name, self.layers) < 0 ) {
            log.warn("Layer has not been added: " + name);
            return;
        }   
        var layer = self.map.layerSets[name];
        if ( layer ) {
            log.debug("Removing layer: " + name);
            layer.dispose();
            delete self.map.layerSets[name]; 
        } else {
            log.warn("Layer does not exist: " + name);
        }       
    };
        
    /*
     * The order of the layers in the OpenLayers.Map object is not used
     * to determine the z-index but is done manually instead since this
     * is much easier. Change the z-index for for each product based on 
     * its positition in the products array. 
     */    
    var refreshZOrder = function() {
        $.each(self.layers, function(index, name) { 
            var layer = self.map.layerSets[name];
            if ( layer ) {
                layer.setZIndex(index * 2);
            }
        });
    };
    
    /*
     * Creates the OpenLayers.Map object and all associated controls.
     */
    var createMap = function($div, id, projection, spec) {
        
        var config = $.extend(true, {}, spec);
        // Zooming feature is not as fluid as advertised
        config.zoomMethod = null;
        // Don't let OpenLayers fetch the stylesheet -- that is included
        // manually.
        config.theme = null;
        
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
    var createLayer = function(map, proj, config) {
        config = $.extend(true, {}, config);
        
        if ( config.properties === undefined ) {
            config.properties = {};    
        }
        
        // Merge in any projection specific properties
        config.properties = $.extend(true, config.properties, 
                                     config.projections[proj]);
        delete config.projections;  
                  
        if ( !config.properties.projection ) {
            config.properties.projection = mapConfig.projections[proj].projection;
        }
        if ( config.parameters ) {
            config.parameters.projection = 
                mapConfig.projections[proj].projection;
        }
        if ( config.product === "daily" ) {
            return Worldview.Map.DailyLayerSet(map, config);
        } else if ( config.product === "static" ) {
            return Worldview.Map.StaticLayerSet(map, config);
        }
        throw new Error("Unsupported product type: " + config.product);
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
      
    var onAddLayer = function(event) {
        var layer = event.layer;
        layer.events.register("loadstart", layer, function() {
            if ( layersLoading === 0 ) {
                self.map.events.triggerEvent("maploadstart");
            }
            layersLoading++;
        });
        layer.events.register("loadend", layer, function() {
            layersLoading--;
            if ( layersLoading === 0 ) {
                self.map.events.triggerEvent("maploadend");
            }   
        });
        refreshZOrder();
    };
    
    var onRemoveLayer = function(event) {
        refreshZOrder();
    };
           
    init();
    return self;
}
