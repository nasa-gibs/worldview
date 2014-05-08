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
    var cache = {};
    var stale = [];

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
        models.layers.events.on("update", updateMap);
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

    var addLayer = function(def) {
        updateLayer(def);
        updateMap();
    };

    var updateLayer = function(def) {
        var map = self.selected;
        var key = layerKey(def);
        if ( !_.find(map.layers, { key: key }) ) {
            var renderable = models.layers.isRenderable(def.id);
            if ( renderable ) {
                if ( !cache[key] ) {
                    var layer = createLayer(def);
                    self.selected.addLayer(layer);
                }
            }
        }
    };

    var removeLayer = function(def) {
        updateMap();
    };

    var updateVisibility = function(def, visible) {
        updateLayer(def);
        updateMap();
    };

    var updateOpacity = function(def) {
        updateLayer(def);
        updateMap();
    };

    var updateDate = function() {
        var defs = models.layers.get();
        _.each(defs, function(def) {
            if ( def.period === "daily" ) {
                updateLayer(def);
            }
        });
        updateMap();
    };

    var clearLayers = function(map) {
        var activeLayers = map.layers.slice(0);
        _.each(activeLayers, function(mapLayer) {
            if ( mapLayer.name !== "Blank" ) {
                map.removeLayer(mapLayer);
            }
        });
        cache = {};
    };

    var reloadLayers = function(map) {
        map = map || self.selected;
        var proj = models.proj.selected;
        clearLayers(map);

        var defs = models.layers.get({reverse: true});
        _.each(defs, function(def) {
            addLayer(def);
        });
        updateMap();
    };

    var purgeCache = function() {
        var map = self.selected;
        _.each(_.clone(cache), function(layer) {
            var def = config.layers[layer.wvid];
            var renderable = models.layers.isRenderable(def.id);
            var key = layerKey(def);
            if ( !renderable || key !== layer.key ) {
                layer.setVisibility(false);
                delete cache[layer.key];
                stale.push(layer);
            }
        });
        _.delay(function() {
            _.each(stale, function(layer) {
                map.removeLayer(layer);
            });
            stale = [];
            updateMap();
        }, 500);
    };

    var updateMap = function() {
        var map = self.selected;
        _.each(self.selected.layers, function(layer) {
            if ( !layer.wvid ) {
                return;
            }
            var renderable, key;
            var def = _.find(models.layers.active, { id: layer.wvid });
            if ( !def ) {
                renderable = false;
            } else {
                var key = layerKey(def);
                var renderable = models.layers.isRenderable(def.id);
            }
            if ( layer.key !== key || !renderable ) {
                layer.setOpacity(0);
                layer.div.style.zIndex = 0;
            } else {
                layer.setVisibility(true);
                layer.setOpacity(def.opacity);
                var length = models.layers.active.length;
                var index = _.findIndex(models.layers.active, {id: def.id});
                layer.div.style.zIndex = (length - index) + 1;
                adjustTransition(def, layer);
            }
        });
    };

    var adjustTransition = function(def, layer) {
        // If the layer is not completely opaque, the resize transition
        // doesn't work. A back buffer is used during the transition which
        // ends up duplicating the layer during load which causes a
        // flicker. In this case turn the transition off. Also, it appears
        // that OpenLayers has a bug where the back buffer is used on a
        // visibility change even if the resize transition is turned off.
        // Also remove the back buffer function.
        if ( def.opacity > 0 && def.opacity < 1 ) {
            layer.transitionEffect = null;
            layer.applyBackBuffer = layer.fnDisabledBackBuffer;
        } else {
            var effect = null;
            if ( def.type === "wmts" ) {
                effect = ( def.noTransition ) ? null: "resize";
            } else if ( def.type === "wms" ) {
                effect = ( def.transition ) ? "resize": null;
            }
            layer.transitionEffect = effect;
            layer.applyBackBuffer = layer.fnEnabledBackBuffer;
        }
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

    var updateExtent = function() {
        models.map.extent = self.selected.getExtent().toArray();
    };

    var createLayer = function(def) {
        var key = layerKey(def);
        if ( def.type === "wmts" ) {
            layer = createLayerWMTS(def);
        } else if ( def.type === "wms" ) {
            layer = createLayerWMS(def);
        } else {
            throw new Error("Unknown layer type: " + def.type);
        }
        cache[key] = layer;
        layer.key = key;
        layer.wvid = def.id;
        layer.div.setAttribute("data-layer", def.id);
        layer.div.setAttribute("data-key", key);
        // See the notes for adjustTransition for this awkward behavior.
        layer.fnEnabledBackBuffer = layer.applyBackBuffer;
        layer.fnDisabledBackBuffer = function() {};

        layer.setVisibility(false);
        self.selected.addLayer(layer);
        return layer;
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

    var createLayerWMTS = function(def) {
        var proj = models.proj.selected;
        var source = config.sources[def.projections[proj.id].source];
        var matrixSet = source.matrixSets[def.projections[proj.id].matrixSet];
        var param = {
            url: source.url,
            layer: def.id,
            style: "",
            format: def.format,
            matrixSet: matrixSet.id,
            maxResolution: matrixSet.maxResolution,
            serverResolutions: matrixSet.serverResolutions,
            maxExtent: proj.maxExtent,
            tileSize: new OpenLayers.Size(matrixSet.tileSize[0],
                                          matrixSet.tileSize[1])
        };
        if ( models.palettes.active[def.id] ) {
            param.tileClass = wv.map.palette.canvasTile;
            param.lookupTable = getLookupTable(def.id);
        }

        var layer = new OpenLayers.Layer.WMTS(param);
        if ( def.period === "daily" ) {
            layer.mergeNewParams({"time": models.date.string()});
        }
        return layer;
    };

    var createLayerWMS = function(def) {
        var proj = models.proj.selected;
        var source = config.sources[def.projections[proj.id].source];
        var layerParameter = def.projections[proj.id].layer || def.id;

        var transparent = ( def.format === "image/png" );

        var params = {
            layers: layerParameter,
            format: def.format,
            transparent: transparent
        };
        if ( def.period === "daily" ) {
            params.time = models.date.string();
        }
        var options = {
            tileSize: new OpenLayers.Size(512, 512)
        };
        var layer = new OpenLayers.Layer.WMS(def.title, source.url,
                params, options);
        return layer;
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
        map.events.register("movestart", null, purgeCache);
        $map.hide();

        return map;
    };

    var layerKey = function(layerDef) {
        var layerId = layerDef.id;
        var projId = models.proj.selected.id;
        var date = wv.util.toISOStringDate(models.date.selected);
        var dateId = ( layerDef.period === "daily" ) ? date : "";
        var activePalette = models.palettes.active[layerDef.id];
        var typeId = ( activePalette ) ? "canvas" : "image";
        return [layerId, projId, dateId, typeId].join(":");
    };

    init();
    return self;

};
