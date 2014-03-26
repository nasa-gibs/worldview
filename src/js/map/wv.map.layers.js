/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

var wv = wv || {};
wv.map = wv.map || {};

wv.map.layers = wv.map.layers || {};

wv.map.layers.set = function(config, projId, layerId) {

    var self = {};
    self.opacity = 1;
    self.visible = false;

    var init = function() {
    };

    var createWMTS = function(options) {
        var proj = config.projections[projId];
        var layer = config.layers[layerId];
        var matrixSet = config.matrixSets[layer.projections[projId].matrixSet];
        var source = config.sources[layer.projections[projId].source];
        var param = {
            url: source.url,
            layer: layer.id,
            style: "",
            format: layer.format,
            matrixSet: matrixSet.id,
            maxResolution: matrixSet.maxResolution,
            serverResolutions: matrixSet.serverResolutions,
            maxExtent: proj.maxExtent,
            tileSize: new OpenLayers.Size(matrixSet.tileSize[0],
                                          matrixSet.tileSize[1]),
            visibility: false
        };
        if ( layer.noTransition ) {
            param.transitionEffect = "none";
        } else {
            param.transitionEffect = "resize";
        }
        if ( options.tileClass ) {
            param.tileClass = options.tileClass;
        }
        var olLayer = new OpenLayers.Layer.WMTS(param);
        if ( options && options.time ) {
            olLayer.mergeNewParams({"time": options.time});
        }
        olLayer.wvid = layerId;
        return olLayer;
    };

    var createWMS = function(add) {
        var proj = config.projections[projId];
        var layer = config.layers[layerId];
        var source = config.sources[layer.projections[projId].source];
        var layerParameter = layer.projections[projId].layer || layerId;

        var transparent = ( layer.format === "image/png" );

        var params = {
            layers: layerParameter,
            format: layer.format,
            transparent: transparent
        };
        if ( layer.period === "daily" ) {
            params.time = add.time;
        }
        var options = {
            tileSize: new OpenLayers.Size(512, 512),
            visiblity: false
        };
        if ( layer.opacity ) {
            options.opacity = layer.opacity;
        }
        if ( layer.transition ) {
            options.transitionEffect = "resize";
        } else {
            options.transitionEffect = "none";
        }
        var olLayer = new OpenLayers.Layer.WMS(layer.title, source.url,
                params, options);
        olLayer.wvid = layerId;
        return olLayer;
    };

    /**
     * Function: createLayer
     * Creates a new layer based on the configuration provided.
     *
     * Parameters:
     * additionalProperties - If specified, these properites are merged into
     *                        the product configuration to create the layer.
     *
     * Return:
     * An OpenLayers Layer.
     */
    self.createLayer = function(options) {
        options = options || {};
        var type = config.layers[layerId].type;
        if ( type === "wmts" ) {
            return createWMTS(options);
        } else if ( type === "wms" ) {
            return createWMS(options);
        } else if ( type === "graticule" ) {
            return new wv.map.layers.graticule("Graticule");
        } else {
            throw new Error("Invalid layer type: " + type);
        }
    };

    init();
    return self;
};


wv.map.layers.daily = function(map, config, projId, layerId) {

    var self = wv.map.layers.set(config, projId, layerId);

    // The current z-index for all layers.
    var zIndex = 0;

    // Layers from previous days are cached for quick display when moving
    // the time slider
    var cachedLayers = {};

    // Layers that are no longer valid because the map has moved. These
    // are removed using a timeout to prevent map flickering.
    var staleLayers = [];

    // The layer that is currently visible and seen by the user
    var currentLayer = null;

    // The day of the data displayed on the map
    var currentDay;

    // Active lookup table for all layers in the product, null if no table
    // is active
    var lookupTable = null;

    // Timeout identifier for the reaper that cleans out stale layers.
    var reaperId = null;

    // Time, in milliseconds, to wait before reaping stale layers.
    var reapDelay = 500;

    //-------------------------------------------------------------------------
    // Public
    //-------------------------------------------------------------------------

    var init = function() {
        self.setDay(wv.util.today());

        map.events.register("movestart", self, invalidate);
        map.events.register("zoomend", self, invalidate);
        $(window).resize(invalidate);
    };

    /**
     * Method: setDay
     * Changes the map to display the product for the given day.
     *
     * Parameters:
     * d - The day to display.
     */
    self.setDay = function(d) {
        // Don't do anything if nothing has changed or if there are no valid
        // layers
        if ( !d ) {
            return;
        }
        var ds = wv.util.toISOStringDate(d);
        if ( ds === currentDay ) {
            return;
        }

        // If there is a current layer, cache it
        if ( currentLayer ) {
            cachedLayers[currentDay] = currentLayer;
        }
        currentDay = ds;
        fetchLayer();
        /*
        // If the layer is hidden, don't fetch anything
        if ( self.visible ) {
            fetchLayer();
        } else {
            currentLayer = null;
        }
        */
    };

    self.setOpacity = function(opacity) {
        if ( self.opacity === opacity ) {
            return;
        }
        self.opacity = opacity;
        if ( currentLayer ) {
            wv.map.setVisibility(currentLayer, self.visible, self.opacity);
        }
    };

    self.setVisibility = function(visible) {
        if ( self.visible === visible ) {
            return;
        }
        self.visible = visible;
        if ( visible && !currentLayer ) {
            fetchLayer();
        }
        if ( currentLayer ) {
            wv.map.setVisibility(currentLayer, self.visible,
                    self.opacity);
        }
    };

    /**
     * Method: setLookup
     * Applies a lookup table to this product. If this product doesn't have
     * a lookup table already, all layers are discarded and a new layer is
     * created using canvas tile
     *
     * Parameters:
     * lookup - The <ColorLookup> to apply.
     */
    self.setLookup = function(lookup) {
        var resetRequired = (lookupTable === null);
        lookupTable = lookup;
        if ( currentLayer ) {
            if ( resetRequired ) {
                reset();
                fetchLayer();
            } else {
                invalidate();
                currentLayer.lookupTable = lookup;
                applyLookup(currentLayer);
            }
        }
    };

    /**
     * Method: clearLookup
     * Removes a lookup table from this product. If the product has a lookup
     * table, all layers are discarded and a new layer using the standard
     * tile renderer is created.
     */
    self.clearLookup = function() {
        if ( lookupTable !== null ) {
            lookupTable = null;
            if ( currentLayer ) {
                reset();
                fetchLayer();
            }
        }
    };

    /**
     * Method: setZIndex
     * Sets the z-index for all layers in this product.
     *
     * Parameters:
     * index - The z-index to set. All layers are set with this z-index
     * except for the visible layer which is set to index + 1.
     */
    self.setZIndex = function(index) {
        zIndex = index;
        refreshZOrder();
    };

    /**
     * Method: dispose
     * Remove all layers from the map.
     */
    self.dispose = function() {
        reset();
        if ( reaperId !== null ) {
            clearTimeout(reaperId);
        }
        map.events.unregister("movestart", self, invalidate);
        map.events.unregister("zoomend", self, invalidate);
        $(window).unbind("resize", invalidate);
    };

    //-------------------------------------------------------------------------
    // Private
    //-------------------------------------------------------------------------

    var fetchLayer = function() {
        var previousLayer = currentLayer;

        if ( currentDay in cachedLayers ) {
            currentLayer = cachedLayers[currentDay];
            wv.map.setVisibility(currentLayer, self.visible,
                    self.opacity);
            delete cachedLayers[currentDay];
        } else {
            var additionalOptions = {
                time: currentDay
            };
            if ( lookupTable !== null ) {
                additionalOptions.tileClass = wv.map.palette.canvasTile;
            }
            currentLayer = self.createLayer(additionalOptions);
            if ( lookupTable !== null ) {
                currentLayer.lookupTable = lookupTable;
            }
            map.addLayer(currentLayer);
        }

        if ( previousLayer ) {
            previousLayer.setZIndex(zIndex);
        }
        currentLayer.setZIndex(zIndex + 1);
        wv.map.setVisibility(currentLayer, self.visible, self.opacity);

        if ( previousLayer ) {
            wv.map.setVisibility(previousLayer, false, 0);
        }
    };

    /*
     * Iterates through each tile in the layer and applies the lookup.
     */
    var applyLookup = function(layer) {
        $.each(layer.grid, function(index, row) {
            $.each(row, function(index, tile) {
                tile.applyLookup();
            });
        });
    };

    /*
     * Sets the z-index on all layers.
     */
    var refreshZOrder = function() {
        $.each(cachedLayers, function(i, layer) {
            layer.setZIndex(zIndex);
        });
        if ( currentLayer ) {
            currentLayer.setZIndex(zIndex + 1);
        }
    };

    /*
     * Clears the cache and removes the current layer. Called when switching
     * between a lookup and non-lookup based layer.
     */
    var reset = function() {
        invalidate();
        if ( currentLayer ) {
            map.removeLayer(currentLayer);
        }
        currentLayer = null;
    };

    /*
     * Hide all layers that are not currently being displayed and move them
     * to the stale set. Restart the reaper to remove those layers.
     */
    var invalidate = function() {
        if ( currentLayer ) {
            var opacity = currentLayer.div.style.opacity;
            if ( opacity !== "" && opacity < 0.001 ) {
                currentLayer.setVisibility(false);
            }
        }
        if ( $.isEmptyObject(cachedLayers) ) {
            return;
        }
        $.each(cachedLayers, function(day, layer) {
            layer.setVisibility(false);
            staleLayers.push(layer);
        });
        cachedLayers = {};

        if ( reaperId !== null ) {
            clearTimeout(reaperId);
        }
        reaperId = setTimeout(function() { reaper(); }, reapDelay);
    };


    /*
     * Remove all layers in the invalid set from the map.
     */
    var reaper = function(all) {
        $.each(staleLayers, function(index, layer) {
            if ( map.getLayerIndex(layer) >= 0 ) {
                map.removeLayer(layer);
            }
        });
        staleLayers = [];
        refreshZOrder();
        reaperId = null;
    };

    init();
    return self;
};


wv.map.layers.static = function(map, config, projId, layerId) {

    var self = wv.map.layers.set(config, projId, layerId);

    // There is only one layer and this is it
    var layer = null;

    // Tue current z-index for the layer
    var zIndex = 0;

    //-------------------------------------------------------------------------
    // Public
    //-------------------------------------------------------------------------
    var init = function() {
        layer = self.createLayer();
        map.addLayer(layer);
        layer.setZIndex(zIndex);

        map.events.register("movestart", self, invalidate);
        map.events.register("zoomend", self, invalidate);
    };

    /**
     * Method: setDay
     * Does nothing.
     */
    self.setDay = function(d) {
    };

    self.setOpacity = function(opacity) {
        if ( self.opacity === opacity ) {
            return;
        }
        self.opacity = opacity;
        wv.map.setVisibility(layer, self.visible, self.opacity);
    };

    self.setVisibility = function(visible) {
        if ( self.visible === visible ) {
            return;
        }
        self.visible = visible;
        wv.map.setVisibility(layer, self.visible, self.opacity);
    };

    /**
     * Method: setZIndex
     * Sets the z-index for the product's layer.
     *
     * Parameters:
     * index - The z-index to set.
     */
    self.setZIndex = function(index) {
        zIndex = index;
        setZOrder();
    };

    /**
     * Method: dispose
     * Removes the layer from the map.
     */
    self.dispose = function() {
        map.removeLayer(layer);
        map.events.unregister("movestart", self, invalidate);
        map.events.unregister("zoomend", self, invalidate);
    };

    /**
     * Method: setLookup
     * Does nothing. This can be implemented once there is a static data
     * product that could be adjusted.
     */
    self.setLookup = function(lookup) {
    };

    /**
     * Method: clearLookup
     * Does nothing. This can be implemented once there is a static data
     * product that could be adjusted.
     */
    self.clearLookup = function() {
    };

    //-------------------------------------------------------------------------
    // Private
    //-------------------------------------------------------------------------
    var setZOrder = function() {
        layer.setZIndex(zIndex);
    };

    var invalidate = function() {
        if ( layer ) {
            var opacity = layer.div.style.opacity;
            if ( opacity !== "" && opacity < 0.001 ) {
                layer.setVisibility(false);
            }
        }
        setZOrder();
    };

    init();
    return self;
};


wv.map.layers.mock = function() {

    return {
        setDay: function() {},
        setOpacity: function() {},
        setVisibility: function() {},
        setZIndex: function() {},
        dispose: function() {},
        setLookup: function() {},
        clearLookup: function() {}
    };

};


wv.map.layers.graticule = OpenLayers.Class(OpenLayers.Layer, {

    graticuleLineStyle: null,
    graticuleLabelStyle: null,
    graticule: null,
    isControl: true,

    initialize: function(name, options) {
        OpenLayers.Layer.prototype.initialize.apply(this, arguments);

        this.graticuleLineStyle = new OpenLayers.Symbolizer.Line({
            strokeColor: '#AAAAAA',
            strokeOpacity: 0.95,
            strokeWidth: 1.35,
            strokeLinecap: 'square',
            strokeDashstyle: 'dot'
        });

        this.graticuleLabelStyle = new OpenLayers.Symbolizer.Text({
            fontFamily: 'Gill Sans',
            fontSize: '16',
            fontWeight: '550',
            fontColor: '#0000e1',
            fontOpacity: 1.0
        });
    },

    /*
     * Add the control when the layer is added to the map
     */
    setMap: function(map) {
        OpenLayers.Layer.prototype.setMap.apply(this, arguments);

        this.graticule = new OpenLayers.Control.Graticule({
            layerName: 'ol_graticule_control',
            numPoints: 2,
            labelled: true,
            lineSymbolizer: this.graticuleLineStyle,
            labelSymbolizer: this.graticuleLabelStyle
        });

        map.addControl(this.graticule);
    },

    /*
     * Remove the contorl when the layer is removed from the map
     */
    removeMap: function(map) {
        OpenLayers.Layer.prototype.removeMap.apply(this, arguments);
        map.removeControl(this.graticule);
        this.graticule.destroy();
        this.graticule = null;
    },

    setVisibility: function(value) {
        if ( !this.granule ) {
            return;
        }
        if ( value ) {
            this.graticule.activate();
        } else {
            this.graticule.deactivate();
        }
    },

    /*
     * Name of this class per OpenLayers convention.
     */
    CLASS_NAME: "wv.map.layers.graticule"
});

