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

wv.map.ui = wv.map.ui || function(models, config) {

    var self = {};

    var id = "map";
    var selector = "#" + id;

    // When the date changes, save the layer so that the tiles remain
    // cached.
    var layerCache = new Cache(50);
    var $proj  = {};

    // One map for each projection
    self.proj = {};

    // The map for the selected projection
    self.selected = null;

    var init = function() {
        _.each(config.projections, function(proj) {
            var map = createMap(proj);
            self.proj[proj.id] = map;
        });

        models.proj.events.on("select", updateProjection);
        models.layers.events.on("add", addLayer);
        models.layers.events.on("remove", removeLayer);
        models.layers.events.on("visibility", updateVisibility);
        models.layers.events.on("opacity", updateOpacity);
        models.layers.events.on("update", updateOrder);
        models.date.events.on("select", updateDate);
        models.palettes.events.on("add", addPalette);
        models.palettes.events.on("remove", removePalette);

        updateProjection();
    };

    var updateProjection = function() {
        if ( self.selected ) {
            hideMap(self.selected);
        }
        self.selected = self.proj[models.proj.selected.id];
        reloadLayers();
        showMap(self.selected);
    };

    var hideMap = function(map) {
        $(map.div).hide();
    };

    var showMap = function(map) {
        $(map.div).show();
    };

    var addLayer = function(layer) {
        var map = self.selected;
        var mapLayer = createLayer(layer, models.proj.selected);

        // If this is a base layer, it should be added after the last
        // base layer but before the first overlay
        var lastLayer = 0;
        _.each(map.layers, function(activeLayer, index) {
            if ( layer.group === activeLayer.wvgroup ) {
                lastLayer = index;
            }
        });
        self.selected.addLayer(mapLayer);
        map.setLayerIndex(mapLayer, lastLayer + 1);
        adjustLayers();
    };

    var removeLayer = function(layer) {
        var map = self.selected;
        var activeLayers = map.layers.slice(0);
        _.each(activeLayers, function(mapLayer) {
            if ( mapLayer.wvid === layer.id ) {
                map.removeLayer(mapLayer);
            }
        });
        adjustLayers();
    };

    var updateVisibility = function(layer, visible) {
        var mapLayer = findLayer(layer.id);
        mapLayer.setVisibility(visible);
        adjustLayers();
    };

    var updateOpacity = function(layer, opacity) {
        var mapLayer = findLayer(layer.id);
        adjustTransition(layer, mapLayer, opacity);
        mapLayer.setOpacity(opacity);
        adjustLayers();
    };

    var adjustTransition = function(layer, mapLayer, opacity) {
        if ( opacity > 0 && opacity < 1 ) {
            mapLayer.transitionEffect = null;
            mapLayer.applyBackBuffer = mapLayer.fnDisabledBackBuffer;
        } else {
            var effect = null;
            if ( layer.type === "wmts" ) {
                effect = ( layer.noTransition ) ? null: "resize";
            } else if ( layer.type === "wms" ) {
                effect = ( layer.transition ) ? "resize": null;
            }
            mapLayer.transitionEffect = effect;
            mapLayer.applyBackBuffer = mapLayer.fnEnabledBackBuffer;
        }
    };

    var refreshLayer = function(layer) {
        var map = self.selected;
        var proj = models.proj.selected;
        var oldMapLayer = findLayer(layer.id);
        var newMapLayer = createLayer(layer, proj);
        var index = map.getLayerIndex(oldMapLayer);

        map.addLayer(newMapLayer);
        map.setLayerIndex(newMapLayer, index + 1);
        map.removeLayer(oldMapLayer);
    };

    var updateDate = function() {
        var proj = models.proj.selected;
        var layers = models.layers.get({flat: true});
        _.each(layers, function(layer) {
            if ( layer.period === "daily" ) {
                refreshLayer(layer);
            }
        });
        adjustLayers();
    };

    var clearLayers = function(map) {
        var activeLayers = map.layers.slice(0);
        _.each(activeLayers, function(mapLayer) {
            if ( mapLayer.name !== "Blank" ) {
                map.removeLayer(mapLayer);
            }
        });
    };

    var reloadLayers = function(map) {
        map = map || self.selected;
        var proj = models.proj.selected;
        clearLayers(map);

        var layers = models.layers.get({flat: true, reverse: true});
        _.each(layers, function(layer) {
            map.addLayer(createLayer(layer, proj));
        });
        adjustLayers();
    };

    var updateOrder = function() {
        var map = self.selected;
        var proj = models.proj.selected;
        var layers = models.layers.get({proj: proj.id, reverse: true});
        _.each(layers, function(layer, index) {
            // Plus one because of the bogus base layer
            map.setLayerIndex(findLayer(layer.id), index + 1);
        });
        adjustLayers();
    };

    var getLookupTable = function(layerId) {
        var layer = config.layers[layerId];
        var source = config.palettes.rendered[layer.palette.id];
        var custom = config.palettes.custom[models.palettes.active[layerId]];
        var target = wv.palettes.translate(source, custom);
        return wv.palettes.lookup(source, target);
    };

    var addPalette = function(layerId, paletteId) {
        var layer = config.layers[layerId];
        var mapLayer = findLayer(layer.id);
        var redraw = false;
        if ( !mapLayer.lookupTable ) {
            layerCache.clear();
            refreshLayer(layer);
            updateOrder();
        } else {
            mapLayer.lookupTable = getLookupTable(layerId);
            _.each(mapLayer.grid, function(row) {
                _.each(row, function(tile) {
                    tile.applyLookup();
                });
            });
        }
    };

    var removePalette = function(layerId) {
        var layer = config.layers[layerId];
        layerCache.clear();
        refreshLayer(layer);
        updateOrder();
    };

    // After changes to the layer list, make sure that any layers underneath
    // an opaque layer are hidden to prevent tiles being fetched from the
    // server. Any layers that are semi-transparent must have transitions
    // turned off or the back buffer will interfere.
    var adjustLayers = function() {
        var bottom = false;
        _.eachRight(self.selected.layers, function(mapLayer) {
            if ( !mapLayer.wvid ) {
                return;
            }
            if ( bottom ) {
                mapLayer.setVisibility(false);
                return;
            }
            var layer = config.layers[mapLayer.wvid];
            var visible = models.layers.visible[layer.id];
            var opacity = models.layers.getOpacity(layer.id);
            if ( layer.group === "baselayer" && visible && opacity === 1.0 ) {
                bottom = true;
            }
        });
    };

    var updateExtent = function() {
        models.map.extent = self.selected.getExtent().toArray();
    };

    var createLayer = function(layer, proj) {
        var key = layerKey(proj, layer, models.date.selected);
        var mapLayer = layerCache.getItem(key);
        if ( !mapLayer ) {
            if ( layer.type === "wmts" ) {
                mapLayer = createLayerWMTS(layer, proj);
            } else if ( layer.type === "wms" ) {
                mapLayer = createLayerWMS(layer, proj);
            } else {
                throw new Error("Unknown layer type: " + layer.type);
            }
            layerCache.setItem(key, mapLayer);
        }
        mapLayer.wvid = layer.id;
        mapLayer.wvgroup = layer.group;

        mapLayer.fnEnabledBackBuffer = mapLayer.applyBackBuffer;
        mapLayer.fnDisabledBackBuffer = function() {};

        if ( models.layers.visible[layer.id] ) {
            mapLayer.setVisibility(true);
        }
        var opacity = models.layers.getOpacity(layer.id);
        mapLayer.setOpacity(opacity);
        adjustTransition(layer, mapLayer, opacity);
        return mapLayer;
    };

    var createLayerBlank = function(proj) {
        // Put in a bogus layer to act as the base layer to make the
        // map happy for setting up the starting location
        var options = {
            isBaseLayer: true,
            projection: proj.crs,
            maxExtent: proj.maxExtent,
            resolutions: proj.resolutions,
            units: proj.units || "dd",
            numZoomLevels: proj.numZoomLevels
        };
        return new OpenLayers.Layer("Blank", options);
    };

    var createLayerWMTS = function(layer, proj) {
        var matrixSet = config.matrixSets[layer.projections[proj.id].matrixSet];
        var source = config.sources[layer.projections[proj.id].source];
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
        if ( models.palettes.active[layer.id] ) {
            param.tileClass = wv.map.palette.canvasTile;
            param.lookupTable = getLookupTable(layer.id);
        }

        var olLayer = new OpenLayers.Layer.WMTS(param);
        if ( layer.period === "daily" ) {
            olLayer.mergeNewParams({"time": models.date.string()});
        }
        return olLayer;
    };

    var createLayerWMS = function(layer, proj) {
        var source = config.sources[layer.projections[projId].source];
        var layerParameter = layer.projections[projId].layer || layerId;

        var transparent = ( layer.format === "image/png" );

        var params = {
            layers: layerParameter,
            format: layer.format,
            transparent: transparent
        };
        if ( layer.period === "daily" ) {
            params.time = models.date.string();
        }
        var options = {
            tileSize: new OpenLayers.Size(512, 512),
            visiblity: false
        };
        var olLayer = new OpenLayers.Layer.WMS(layer.title, source.url,
                params, options);
        return olLayer;
    };

    var createMap = function(proj) {
        var target = id + "-" + proj.id;
        var $map = $("<div></div>")
            .attr("id", target)
            .attr("data-projection", proj.id)
            .addClass("map");
        $proj[proj.id] = $map;
        $(selector).append($map);

        var options = _.extend({}, proj);
        // OpenLayers uses "projection" for the map object. We use "crs"
        // instead
        options.projection = new OpenLayers.Projection(options.crs);

        // Zooming feature is not as fluid as advertised
        options.zoomMethod = null;

        // Don't let OpenLayers fetch the stylesheet -- that is included
        // manually.
        options.theme = null;

        // Let events propagate up
        options.fallThrough = true;

        // Force OL to get the latest tiles without caching
        options.tileManager = null;

        options.extent = options.maxExtent;
        options.allOverlays = true;
        options.fractionalZoom = false;

        var controls = [];

        // Add navigation controls
        controls.push(new OpenLayers.Control.Navigation({
            dragPanOptions: {
                enableKinetic: true
            }
        }));

        // While these aren't controls, per se, they are extra decorations
        controls.push(new OpenLayers.Control.Attribution());
        controls.push(new OpenLayers.Control.ScaleLine({
            displayClass: "olControlScaleLineCustom",
            maxWidth: 175
        }));

        var coordinateControl = new OpenLayers.Control.MousePosition({
            formatOutput: function(mouseXY) {
                var mouseLonLat = mouseXY.transform(proj.crs, "EPSG:4326");
                return mouseLonLat.lon.toFixed(3) + "&#176;, " +
                       mouseLonLat.lat.toFixed(3) + "&#176;";
            }
        });
        controls.push(coordinateControl);

        options.controls = controls;
        var map = new OpenLayers.Map(target, options);

        var navControl =
                map.getControlsByClass("OpenLayers.Control.Navigation")[0];
        navControl.handlers.wheel.interval = 100;
        navControl.handlers.wheel.cumulative = false;

        var $zoomOut = $("<button></button>")
            .addClass("wv-map-zoom-out")
            .addClass("wv-map-zoom");
        var $outIcon = $("<i></i>")
            .addClass("fa")
            .addClass("fa-minus")
            .addClass("fa-1x");
        $zoomOut.append($outIcon);
        $map.append($zoomOut);
        $zoomOut.button({
            text: false
        });

        var $zoomIn = $("<button></button>")
            .addClass("wv-map-zoom-in")
            .addClass("wv-map-zoom");
        var $inIcon = $("<i></i>")
            .addClass("fa")
            .addClass("fa-plus")
            .addClass("fa-1x");
        $zoomIn.append($inIcon);
        $map.append($zoomIn);
        $zoomIn.button({
            text: false
        });

        $zoomIn.click(function() {
            map.zoomIn();
        });

        $zoomOut.click(function() {
            map.zoomOut();
        });

        map.addLayer(createLayerBlank(proj));

        if ( models.proj.selected.id === proj.id && models.map.extent ) {
            map.zoomToExtent(models.map.extent);
        } else {
            map.setCenter(proj.startCenter, proj.startZoom);
        }

        map.events.register("zoomend", null, function() {
            if ( map.zoom === map.numZoomLevels - 1 ) {
                $zoomIn.button("disable");
                $zoomOut.button("enable");
            } else if ( map.zoom === 0 ) {
                $zoomIn.button("enable");
                $zoomOut.button("disable");
            } else {
                $zoomIn.button("enable");
                $zoomOut.button("enable");
            }
        });
        map.events.register("move", null, updateExtent);

        $map.hide();

        return map;
    };

    var findLayer = function(id) {
        var found;
        _.each(self.selected.layers, function(mapLayer) {
            if ( mapLayer.wvid === id ) {
                found = mapLayer;
                return false;
            }
        });
        return found;
    };

    var layerKey = function(proj, layer, date) {
        return proj.id + ":" + layer.id + ":" + date.getTime();
    };

    init();
    return self;

};
