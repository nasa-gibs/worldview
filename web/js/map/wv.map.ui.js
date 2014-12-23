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

    var id = "wv-map";
    var selector = "#" + id;
    var cache = new Cache(100); // Save layers from days visited

    var self = {};
    self.proj = {}; // One map for each projection
    self.selected = null; // The map for the selected projection
    self.events = wv.util.events();

    var init = function() {
        if ( config.parameters.mockMap ) {
            return;
        }
        _.each(config.projections, function(proj) {
            var map = createMap(proj);
            self.proj[proj.id] = map;
        });

        models.proj.events.on("select", updateProjection);
        models.layers.events
            .on("add", addLayer)
            .on("remove", removeLayer)
            .on("visibility", updateLayerVisibilities)
            .on("opacity", updateOpacity)
            .on("update", updateLayerOrder);
        models.date.events.on("select", updateDate);

        updateProjection(true);
    };

    var updateProjection = function(start) {
        if ( self.selected ) {
            // Keep track of center point on projection switch
            self.selected.previousCenter = self.selected.center;
            hideMap(self.selected);
        }
        self.selected = self.proj[models.proj.selected.id];
        var map = self.selected;
        reloadLayers();

        // If the browser was resized, the inactive map was not notified of
        // the event. Force the update no matter what and reposition the center
        // using the previous value.
        showMap(map);
        map.updateSize();
        if ( start && models.proj.selected.id === "geographic" &&
                !models.map.extent ) {
            var extent = models.map.getLeadingExtent();
            map.getView().fitExtent(extent, map.getSize());
        }
        if ( self.selected.previousCenter ) {
            self.selected.setCenter(self.selected.previousCenter);
        }
        updateExtent();
    };

    var hideMap = function(map) {
        $("#" + map.getTarget()).hide();
    };

    var showMap = function(map) {
        $("#" + map.getTarget()).show();
    };

    var clearLayers = function(map) {
        var activeLayers = map.getLayers().getArray().slice(0);
        _.each(activeLayers, function(mapLayer) {
            if ( mapLayer.wv ) {
                map.removeLayer(mapLayer);
            }
        });
        removeGraticule();
        //cache.clear();
    };

    var reloadLayers = function(map) {
        map = map || self.selected;
        var proj = models.proj.selected;
        clearLayers(map);

        var defs = models.layers.get({reverse: true});
        _.each(defs, function(def) {
            if ( isGraticule(def) ) {
                addGraticule();
            } else {
                self.selected.addLayer(createLayer(def));
            }
        });
        updateLayerVisibilities();
    };

    var updateLayerVisibilities = function() {
        self.selected.getLayers().forEach(function(layer) {
            if ( layer.wv ) {
                var renderable = models.layers.isRenderable(layer.wv.id);
                layer.setVisible(renderable);
            }
        });
    };

    var updateOpacity = function(def, value) {
        var layer = findLayer(def);
        layer.setOpacity(value);
        updateLayerVisibilities();
    };

    var addLayer = function(def) {
        var mapIndex = _.findIndex(models.layers.get({reverse: true}), {
            id: def.id
        });
        if ( isGraticule(def) ) {
            addGraticule();
        } else {
            var layer = createLayer(def);
            self.selected.getLayers().insertAt(mapIndex, layer);
        }
        updateLayerVisibilities();
    };

    var removeLayer = function(def) {
        if ( isGraticule(def) ) {
            removeGraticule();
        } else {
            var layer = findLayer(def);
            self.selected.removeLayer(layer);
        }
    };

    var updateLayerOrder = function() {
        reloadLayers();
    };

    var updateDate = function() {
        var defs = models.layers.get();
        _.each(defs, function(def) {
            if ( def.period !== "daily" ) {
                return;
            }
            var index = findLayerIndex(def);
            self.selected.getLayers().setAt(index, createLayer(def));
        });
        updateLayerVisibilities();
    };

    // FIXME: OL3
    // Don't call directly, use an event instead
    self.preload = function() {
    };

    var findLayer = function(def) {
        var layers = self.selected.getLayers().getArray();
        var layer = _.find(layers, { wv: { id: def.id } });
        return layer;
    };

    var findLayerIndex = function(def) {
        var layers = self.selected.getLayers().getArray();
        var layer = _.findIndex(layers, { wv: { id: def.id } });
        return layer;
    };

    var createLayer = function(def, options) {
        options = options || {};
        var key = layerKey(def, options);
        var layer = cache.getItem(key);
        if ( !layer ) {
            var proj = models.proj.selected;
            def = _.cloneDeep(def);
            _.merge(def, def.projections[proj.id]);
            if ( def.type === "wmts" ) {
                layer = createLayerWMTS(def, options);
            } else if ( def.type === "wms" ) {
                layer = createLayerWMS(def, options);
            } else {
                throw new Error("Unknown layer type: " + def.type);
            }
            var date = options.date || models.date.selected;
            layer.wv = {
                id: def.id,
                key: key,
                date: wv.util.toISOStringDate(date),
                proj: proj.id,
                def: def
            };
            cache.setItem(key, layer);
            layer.setVisible(false);
        }
        layer.setOpacity(def.opacity || 1.0);
        return layer;
    };

    var createLayerWMTS = function(def, options) {
        var proj = models.proj.selected;
        var source = config.sources[def.source];
        if ( !source ) {
            throw new Error(def.id + ": Invalid source: " + def.source);
        }
        var matrixSet = source.matrixSets[def.matrixSet];
        if ( !matrixSet ) {
            throw new Error(def.id + ": Undefined matrix set: " + def.matrixSet);
        }
        var matrixIds = [];
        _.each(matrixSet.resolutions, function(resolution, index) {
            matrixIds.push(index);
        });
        var parameters = "";
        if ( def.period === "daily" ) {
            var date = options.date || models.date.selected;
            parameters = "?TIME=" + wv.util.toISOStringDate(date);
        }
        var layer = new ol.layer.Tile({
            source: new ol.source.WMTS({
                url: source.url + parameters,
                layer: def.layer || def.id,
                format: def.format,
                matrixSet: matrixSet.id,
                tileGrid: new ol.tilegrid.WMTS({
                    origin: [proj.maxExtent[0], proj.maxExtent[3]],
                    resolutions: matrixSet.resolutions,
                    matrixIds: matrixIds,
                    tileSize: matrixSet.tileSize[0]
                })
            })
        });
        return layer;
    };

    var createLayerWMS = function(def, options) {
        var proj = models.proj.selected;
        var source = config.sources[def.source];
        if ( !source ) {
            throw new Error(def.id + ": Invalid source: " + def.source);
        }

        var transparent = ( def.format === "image/png" );
        var parameters = {
            LAYERS: def.layer || def.id,
            FORMAT: def.format,
            TRANSPARENT: transparent,
            VERSION: "1.1.1"
        };
        var extra = "";
        if ( def.period === "daily" ) {
            var date = options.date || models.date.selected;
            extra = "?TIME=" + wv.util.toISOStringDate(date);
        }
        var layer = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: source.url + extra,
                params: parameters,
                tileGrid: new ol.tilegrid.TileGrid({
                    origin: [proj.maxExtent[0], proj.maxExtent[3]],
                    resolutions: proj.resolutions,
                    tileSize: 512
                })
            })
        });
        return layer;
    };

    var isGraticule = function(def) {
        var proj = models.proj.selected.id;
        return ( def.projections[proj].type === "graticule" ||
            def.type === "graticule" );
    };

    var addGraticule = function() {
        var graticule = new ol.Graticule({
            map: self.selected,
            strokeStyle: new ol.style.Stroke({
                color: 'rgba(255, 255, 255, 0.5)',
                width: 2,
                lineDash: [0.5, 4]
            })
        });
        self.selected.graticule = graticule;
    };

    var removeGraticule = function() {
        if ( self.selected.graticule ) {
            self.selected.graticule.setMap(null);
        }
    };

    var updateExtent = function() {
        var map = self.selected;
        models.map.update(map.getView().calculateExtent(map.getSize()));
    };

    var createMap = function(proj) {
        var id = "wv-map-" + proj.id;
        var $map = $("<div></div>")
            .attr("id", id)
            .attr("data-proj", proj.id)
            .addClass("wv-map")
            .hide();
        $(selector).append($map);

        var scaleMetric = new ol.control.ScaleLine({
            className: "wv-map-scale-metric",
            units: "metric"
        });
        var scaleImperial = new ol.control.ScaleLine({
            className: "wv-map-scale-imperial",
            units: "imperial"
        });
        var coordinateFormat = function(source) {
            var target = ol.proj.transform(source, proj.crs, "EPSG:4326");
            var crs = ( models.proj.change ) ? models.proj.change.crs
                    : models.proj.selected.crs;
            var str = wv.util.formatDMS(target[1], "latitude") + ", " +
                      wv.util.formatDMS(target[0], "longitude") + " " +
                      crs;
            return str;
        };
        var mousePosition = new ol.control.MousePosition({
            coordinateFormat: coordinateFormat
        });

        var map = new ol.Map({
            view: new ol.View({
                maxResolution: proj.resolutions[0],
                projection: ol.proj.get(proj.crs),
                extent: proj.maxExtent,
                center: proj.startCenter,
                zoom: proj.startZoom,
                maxZoom: proj.numZoomLevels,
                enableRotation: false
            }),
            target: id,
            renderer: ["canvas", "dom"],
            logo: false,
            controls: [
                scaleMetric,
                scaleImperial,
                mousePosition
            ],
            interactions: [
                new ol.interaction.DoubleClickZoom(),
                new ol.interaction.DragPan(),
                new ol.interaction.PinchZoom(),
                new ol.interaction.MouseWheelZoom(),
                new ol.interaction.DragZoom()
            ]
        });
        createZoomButtons(map, proj);
        return map;
    };

    var createZoomButtons = function(map, proj) {
        var $map = $("#" + map.getTarget());

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
        $zoomOut.click(zoomAction(map, -1));

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
        $zoomIn.click(zoomAction(map, 1));

        var onZoomChange = function() {
            var maxZoom = proj.resolutions.length;
            var zoom = map.getView().getZoom();
            if ( zoom === 0 ) {
                $zoomIn.button("enable");
                $zoomOut.button("disable");
            } else if ( zoom === maxZoom ) {
                $zoomIn.button("disable");
                $zoomOut.button("enable");
            } else {
                $zoomIn.button("enable");
                $zoomOut.button("enable");
            }
        };

        map.getView().on("change:resolution", onZoomChange);
        onZoomChange();
    };

    var zoomAction = function(map, amount) {
        return function() {
            var zoom = map.getView().getZoom();
            map.beforeRender(ol.animation.zoom({
                resolution: map.getView().getResolution(),
                duration: 250
            }));
            map.getView().setZoom(zoom + amount);
        };
    };

    var layerKey = function(def, options) {
        var layerId = def.id;
        var projId = models.proj.selected.id;
        var date;
        if ( options.date ) {
            date = wv.util.toISOStringDate(options.date);
        } else {
            date = wv.util.toISOStringDate(models.date.selected);
        }
        var dateId = ( def.period === "daily" ) ? date : "";
        return [layerId, projId, dateId].join(":");
    };

    init();
    return self;

};
