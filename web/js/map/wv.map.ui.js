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

/*
 * @Class
 */
wv.map.ui = wv.map.ui || function(models, config, Rotation, DataRunner) {
    var id = "wv-map";
    var selector = "#" + id;
    var cache = new Cache(100); // Save layers from days visited
    var animationDuration = 250;
    var self = {};
    var rotation = new Rotation(self, models);
    var dataRunner = new DataRunner(models);
    var mapIsbeingDragged = false;
    var hiDPI = ol.has.DEVICE_PIXEL_RATIO > 1;
    var pixelRatio = hiDPI ? 2 : 1;

    self.proj = {}; // One map for each projection
    self.selected = null; // The map for the selected projection
    self.events = wv.util.events();
    /*
     * Sets up map listeners
     *
     * @method init
     * @static
     *
     * @returns {void}
     */
    var init = function() {
        if ( config.parameters.mockMap ) {
            return;
        }

        // NOTE: iOS sometimes bombs if this is _.each instead. In that case,
        // it is possible that config.projections somehow becomes array-like.
        _.forOwn(config.projections, function(proj) {
            var map = createMap(proj);
            self.proj[proj.id] = map;
        });
        
        models.proj.events.on("select", function() {
            updateProjection();
        });
        models.layers.events
            .on("add", addLayer)
            .on("remove", removeLayer)
            .on("visibility", updateLayerVisibilities)
            .on("opacity", updateOpacity)
            .on("update", updateLayerOrder);
        models.date.events.on("select", updateDate);
        models.palettes.events
            .on("set-custom", updateLookup)
            .on("clear-custom", updateLookup)
            .on("range", updateLookup)
            .on("update", updateLookup);
        $(window).on("resize", onResize);
        updateProjection(true);
    };
    /*
     * Changes visual projection
     *
     * @method updateProjection
     * @static
     *
     * @param {boolean} start - new extents are needed: true/false
     *
     * @returns {void}
     */
    var updateProjection = function(start) {
        if ( self.selected ) {
            // Keep track of center point on projection switch
            self.selected.previousCenter = self.selected.center;
            hideMap(self.selected);
        }
        self.selected = self.proj[models.proj.selected.id];
        var map = self.selected;
        reloadLayers();

        //Update the rotation buttons if polar projection to display correct value
        if(models.proj.selected.id !== "geographic")
            rotation.updateRotation();

        // If the browser was resized, the inactive map was not notified of
        // the event. Force the update no matter what and reposition the center
        // using the previous value.
        showMap(map);
        map.updateSize();

        if ( self.selected.previousCenter ) {
            self.selected.setCenter(self.selected.previousCenter);
        }

        // This is awkward and needs a refactoring
        if ( start ) {
            var projId = models.proj.selected.id;
            var extent = null;
            if ( models.map.extent ) {
                extent = models.map.extent;
            } else if ( !models.map.extent && projId === "geographic" ) {
                extent = models.map.getLeadingExtent();
            }
            if ( extent ) {
                map.getView().fit(extent, map.getSize());
            }
        }
        updateExtent();
        onResize();
    };
    /*
     * When page is resised set for mobile or desktop
     *
     * @method onResize
     * @static
     *
     * @returns {void}
     */
    var onResize = function() {
        var map = self.selected;
        if ( map.small !== wv.util.browser.small ) {
            if ( wv.util.browser.small ) {
                map.removeControl(map.wv.scaleImperial);
                map.removeControl(map.wv.scaleMetric);
                $('#' + map.getTarget() + ' .select-wrapper').hide();
            } else {
                map.addControl(map.wv.scaleImperial);
                map.addControl(map.wv.scaleMetric);
                $('#' + map.getTarget() + ' .select-wrapper').show();
            }
        }
    };
    /*
     * Hide Map
     *
     * @method hideMap
     * @static
     *
     * @param {object} map - Openlayers Map obj
     *
     * @returns {void}
     */
    var hideMap = function(map) {
        $("#" + map.getTarget()).hide();
    };
    /*
     * Show Map
     *
     * @method showMap
     * @static
     *
     * @param {object} map - Openlayers Map obj
     *
     * @returns {void}
     */
    var showMap = function(map) {
        $("#" + map.getTarget()).show();
    };
    /*
     * Remove Layers from map
     *
     * @method clearLayers
     * @static
     *
     * @param {object} map - Openlayers Map obj
     *
     * @returns {void}
     */
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
    /*
     * get layers from models obj
     * and add each layer to the map
     *
     * @method reloadLayers
     * @static
     *
     * @param {object} map - Openlayers Map obj
     *
     * @returns {void}
     */
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
    /*
     * Function called when layers need to be updated
     * e.g: can be the result of new data or another display
     *
     * @method updateLayerVisibilities
     * @static
     *
     * @returns {void}
     */
    var updateLayerVisibilities = function() {
        var layers = self.selected.getLayers();
        layers.forEach(function(layer) {
            if ( layer.wv ) {
                var renderable = models.layers.isRenderable(layer.wv.id);
                layer.setVisible(renderable);
            }
        });
        var defs = models.layers.get();
        _.each(defs, function(def) {
            if ( isGraticule(def) ) {
                var renderable = models.layers.isRenderable(def.id);
                if ( renderable ) {
                    addGraticule();
                } else {
                    removeGraticule();
                }
            }
        });
    };
    /*
     * Sets new opacity to layer
     *
     * @method updateOpacity
     * @static
     *
     * @param {object} def - layer Specs
     *
     * @param {number} value - number value 
     *
     * @returns {void}
     */
    var updateOpacity = function(def, value) {
        var layer = findLayer(def);
        layer.setOpacity(value);
        updateLayerVisibilities();
    };
    /*
     *Initiates the adding of a layer or Graticule
     *
     * @method addLayer
     * @static
     *
     * @param {object} def - layer Specs
     *
     * @returns {void}
     */

    var addLayer = function(def) {
        var mapIndex = _.findIndex(models.layers.get({reverse: true}), {
            id: def.id
        });
        if ( isGraticule(def) ) {
            addGraticule();
        } else {
            self.selected.getLayers().insertAt(mapIndex, createLayer(def));
        }
        updateLayerVisibilities();
    };
    /*
     *Initiates the adding of a layer or Graticule
     *
     * @method removeLayer
     * @static
     *
     * @param {object} def - layer Specs
     *
     * @returns {void}
     */
    var removeLayer = function(def) {
        if ( isGraticule(def) ) {
            removeGraticule();
        } else {
            var layer = findLayer(def);
            self.selected.removeLayer(layer);
        }
        updateLayerVisibilities();
    };

    /*
     * Reloads layers on a change in layer order
     *
     * @method updateLayerOrder
     * @static
     *
     *
     * @returns {void}
     */
    var updateLayerOrder = function() {
        reloadLayers();
    };

    /*
     * Update layers for the correct Date
     *
     * @method updateDate
     * @static
     *
     *
     * @returns {void}
     */
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

    /*
     * Update layers for the correct Date
     *
     * @method updateDate
     * @static
     *
     *
     * @returns {void}
     */
    var updateLookup = function(layerId) {
        // If the lookup changes, all layers in the cache are now stale
        // since the tiles need to be rerendered. Remove from cache.
        var selectedDate = wv.util.toISOStringDate(models.date.selected);
        var selectedProj = models.proj.selected.id;
        cache.removeWhere(function(key, mapLayer) {
            if ( mapLayer.wvid === layerId &&
                 mapLayer.wvproj === selectedProj &&
                 mapLayer.wvdate !== selectedDate &&
                 mapLayer.lookupTable ) {
                return true;
            }
            return false;
        });
        reloadLayers();
    };

    /*
     * Loaded the layers that are needed for anyone data.
     * Checks the cache to see if a layer has already 
     * been stored
     *
     * @method preload
     * @static
     *
     * @param {object} date - Date of data to be displayed
     * on the map.
     *
     * @returns {void}
     */
    self.preload = function(date) {
        var layers = models.layers.get({
            renderable: true,
            dynamic: true
        });
        _.each(layers, function(def) {
            var key = layerKey(def, {date: date});
            var layer = cache.getItem(key);
            if ( !layer ) {
                layer = createLayer(def, {date: date});
            }
        });
    };

    /*
     * Get a layer object from id
     *
     * @method findlayer
     * @static
     *
     * @param {object} def - Layer Specs
     *
     *
     * @returns {object} Layer object
     */
    var findLayer = function(def) {
        var layers = self.selected.getLayers().getArray();
        var layer = _.find(layers, { wv: { id: def.id } });
        return layer;
    };

    /*
     * Return an Index value for a layer in the OPenLayers layer array
     *
     * @method findLayerIndex
     * @static
     *
     * @param {object} def - Layer Specs
     *
     *
     * @returns {number} Index of layer in OpenLayers layer array
     */
    var findLayerIndex = function(def) {
        var layers = self.selected.getLayers().getArray();
        var layer = _.findIndex(layers, { wv: { id: def.id } });
        return layer;
    };

    /*
     * Create a new OpenLayers Layer
     *
     * @method createLayer
     * @static
     *
     * @param {object} def - Layer Specs
     * 
     * @param {object} options - Layer options
     *
     *
     * @returns {object} OpenLayers layer
     */
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

    /*
     * Create a new WMTS Layer
     *
     * @method createLayerWMTS
     * @static
     *
     * @param {object} def - Layer Specs
     * 
     * @param {object} options - Layer options
     *
     *
     * @returns {object} OpenLayers WMTS layer
     */
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
        var extra = "";
        if ( def.period === "daily" ) {
            var date = options.date || models.date.selected;
            extra = "?TIME=" + wv.util.toISOStringDate(date);
        }
        var sourceOptions = {
            url: source.url + extra,
            layer: def.layer || def.id,
            crossOrigin: "anonymous",
            format: def.format,
            matrixSet: matrixSet.id,
            tileGrid: new ol.tilegrid.WMTS({
                origin: [proj.maxExtent[0], proj.maxExtent[3]],
                resolutions: matrixSet.resolutions,
                matrixIds: matrixIds,
                tileSize: matrixSet.tileSize[0],
            }),
            wrapX: false,
            style: 'default'
        };
        if ( models.palettes.isActive(def.id) ) {
            var lookup = models.palettes.get(def.id).lookup;
            sourceOptions.tileClass = ol.wv.LookupImageTile.factory(lookup);
        }
        var layer = new ol.layer.Tile({
            extent: proj.maxExtent,
            source: new ol.source.WMTS(sourceOptions)
        });
        return layer;
    };

    /*
     * Create a new WMS Layer
     *
     * @method createLayerWMTS
     * @static
     *
     * @param {object} def - Layer Specs
     * 
     * @param {object} options - Layer options
     *
     *
     * @returns {object} OpenLayers WMS layer
     */
    var createLayerWMS = function(def, options) {
        var proj = models.proj.selected;
        var source = config.sources[def.source];
        if ( !source )
            throw new Error(def.id + ": Invalid source: " + def.source);

        var transparent = ( def.format === "image/png" );
        var parameters = {
            LAYERS: def.layer || def.id,
            FORMAT: def.format,
            TRANSPARENT: transparent,
            VERSION: "1.1.1"
        };
        if ( def.styles )
            parameters.STYLES = def.styles;

        var extra = "";
        if ( def.period === "daily" ) {
            var date = options.date || models.date.selected;
            extra = "?TIME=" + wv.util.toISOStringDate(date);
        }
        var layer = new ol.layer.Tile({
            extent: proj.maxExtent,
            source: new ol.source.TileWMS({
                url: source.url + extra,
                crossOrigin: "anonymous",
                params: parameters,
                tileGrid: new ol.tilegrid.TileGrid({
                    origin: [proj.maxExtent[0], proj.maxExtent[3]],
                    resolutions: proj.resolutions
                })
            })
        });
        return layer;
    };

    /*
     * Checks a layer's properties to deterimine if 
     * it is a graticule
     * 
     *
     * @method isGraticule
     * @static
     *
     * @param def {object} Layer Specs
     * 
     *
     * @returns {boolean}
     */
    var isGraticule = function(def) {
        var proj = models.proj.selected.id;
        return ( def.projections[proj].type === "graticule" ||
            def.type === "graticule" );
    };

    /*
     * Adds a graticule to the OpenLayers Map
     * if a graticule does not already exist
     * 
     *
     * @method addGraticule
     * @static
     * 
     *
     * @returns {void}
     */
    var addGraticule = function() {
        if ( self.selected.graticule )
            return;

        self.selected.graticule = new ol.Graticule({
            map: self.selected,
            strokeStyle: new ol.style.Stroke({
                color: 'rgba(255, 255, 255, 0.5)',
                width: 2,
                lineDash: [0.5, 4]
            })
        });
    };

    /*
     * Adds a graticule to the OpenLayers Map
     * if a graticule does not already exist
     * 
     *
     * @method removeGraticule
     * @static
     *
     * @returns {void}
     */
    var removeGraticule = function() {
        if ( self.selected.graticule )
            self.selected.graticule.setMap(null);

        self.selected.graticule = null;
    };

    var triggerExtent = _.throttle(function() {
        self.events.trigger("extent");
    }, 500, { trailing: true });

    /*
     * Updates the extents of OpenLayers map
     * 
     *
     * @method updateExtent
     * @static
     *
     * @returns {void}
     */    
    var updateExtent = function() {
        var map = self.selected;
        models.map.update(map.getView().calculateExtent(map.getSize()));
        triggerExtent();
    };
    /*
     * Updates the extents of OpenLayers map
     * 
     *
     * @method updateExtent
     * @static
     *
     * @param {object} proj - Projection properties
     *
     *
     * @returns {object} OpenLayers Map Object
     */
    var createMap = function(proj) {
        var id = "wv-map-" + proj.id;
        var $map = $("<div></div>")
            .attr("id", id)
            .attr("data-proj", proj.id)
            .addClass("wv-map")
            .hide();
        $(selector).append($map);

        //Create two specific controls
        var scaleMetric = new ol.control.ScaleLine({
            className: "wv-map-scale-metric",
            units: "metric"
        });
        var scaleImperial = new ol.control.ScaleLine({
            className: "wv-map-scale-imperial",
            units: "imperial"
        });

        var rotateInteraction = new ol.interaction.DragRotate({
            condition: ol.events.condition.altKeyOnly,
            duration: animationDuration
        }), mobileRotation = new ol.interaction.PinchRotate({
            duration: animationDuration
        });

        var map = new ol.Map({
            view: new ol.View({
                maxResolution: proj.resolutions[0],
                projection: ol.proj.get(proj.crs),
                extent: proj.maxExtent,
                center: proj.startCenter,
                rotation: proj.id === "geographic" ? 0.0 : models.map.rotation,
                zoom: proj.startZoom,
                maxZoom: proj.numZoomLevels,
                enableRotation: true
            }),
            target: id,
            renderer: ["canvas", "dom"],
            logo: false,
            controls: [
                scaleMetric,
                scaleImperial
            ],
            interactions: [
                new ol.interaction.DoubleClickZoom({
                    duration: animationDuration
                }),
                new ol.interaction.DragPan({
                    kinetic: new ol.Kinetic(-0.005, 0.05, 100)
                }),
                new ol.interaction.PinchZoom({
                    duration: animationDuration
                }),
                new ol.interaction.MouseWheelZoom({
                    duration: animationDuration
                }),
                new ol.interaction.DragZoom({
                    duration: animationDuration
                })
            ],
            loadTilesWhileAnimating: true
        });
        map.wv = {
            small: false,
            scaleMetric: scaleMetric,
            scaleImperial: scaleImperial
        };
        createZoomButtons(map, proj);
        createMousePosSel(map, proj);

        //allow rotation by dragging for polar projections
        if(proj.id !== 'geographic') {
            rotation.init(map, proj.id);
            map.addInteraction(rotateInteraction);
            map.addInteraction(mobileRotation);
        }

        // Set event listeners for changes on the map view (when rotated, zoomed, panned)
        map.getView().on("change:center", updateExtent);
        map.getView().on("change:resolution", updateExtent);
        map.getView().on("change:rotation", rotation.updateRotation);
        map.on('pointerdrag', function() {
            mapIsbeingDragged = true;
        });
        map.on('moveend', function() {
            mapIsbeingDragged = false;
        });

        return map;
    };

    /*
     * Creates map zoom buttons
     * 
     *
     * @method createZoomButtons
     * @static
     *
     * @param {object} map - OpenLayers Map Object
     *
     * @param {object} proj - Projection properties
     *
     *
     * @returns {void}
     */
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

        /*
         * Sets zoom buttons as active or inactive based
         * on the zoom level 
         * 
         * @funct onZoomChange
         * @static
         *
         * @returns {void}
         *
         */
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

    /*
     * Creates map events based on mouse position
     * 
     *
     * @method createMousePosSel
     * @static
     *
     * @param {object} map - OpenLayers Map Object
     *
     * @param {object} proj - Projection properties
     *
     *
     * @returns {void}
     *
     * @todo move this component to another Location
     */
    var createMousePosSel = function(map, proj) {
        var $map;
        var mapId;
        var $mousePosition;
        var $latlonDD;
        var $latlonDMS;
        var $coordBtn;
        var $coordWrapper;
        var coordinateFormat;
        // var timer = null;
        // var isIntervalSet = false;
        
        $map = $("#" + map.getTarget());
        map = map || self.selected;
        mapId = 'coords-' + proj.id;

        $mousePosition = $('<div></div>')
            .attr("id", mapId)
            .addClass("wv-coords-map wv-coords-map-btn");

        /*
         * Creates map events based on mouse position
         *
         * @function coordinateFormat
         * @static
         *
         * @param {Array} source - Coordinates
         * @param {String} format - units of coordinates
         *
         * @returns {void}
         */
        var coordinateFormat = function(source, format) {
            if ( !source ) {
                return "";
            }
            var target = ol.proj.transform(source, proj.crs, "EPSG:4326");
            var crs = ( models.proj.change ) ? models.proj.change.crs
                : models.proj.selected.crs;

            return wv.util.formatCoordinate(target, format) + " " + crs;
        };

        $map.append($mousePosition);

        $latlonDD = $("<span></span>")
            .attr('id', mapId + '-latlon-dd')
            .attr('data-format', 'latlon-dd')
            .addClass('map-coord');
        $latlonDMS = $("<span></span>")
            .attr('id', mapId + '-latlon-dms')
            .attr('data-format', 'latlon-dms')
            .addClass('map-coord');


        if ( wv.util.getCoordinateFormat() === "latlon-dd" ) {
            $('div.map-coord').removeClass('latlon-selected');
            $latlonDD.addClass('latlon-selected');
        } else {
            $('div.map-coord').removeClass('latlon-selected');
            $latlonDMS.addClass('latlon-selected');
        }
        $coordBtn = $("<i></i>")
            .addClass('coord-switch');

        $coordWrapper = $("<div></div>")
            .addClass('coord-btn');

        $coordWrapper.append($coordBtn);

        $mousePosition
            .append($latlonDD)
            .append($latlonDMS)
            .append($coordWrapper)
            .click(function() {
                var $format = $(this).find(".latlon-selected");

                if($format.attr("data-format") === "latlon-dd"){
                    $('span.map-coord').removeClass('latlon-selected');
                    $('span.map-coord[data-format="latlon-dms"]').addClass('latlon-selected');
                    wv.util.setCoordinateFormat('latlon-dms');
                }
                else{
                    $('span.map-coord').removeClass('latlon-selected');
                    $('span.map-coord[data-format="latlon-dd"]').addClass('latlon-selected');
                    wv.util.setCoordinateFormat('latlon-dd');
                }

            });
        function onMouseMove(e) {
            var coords;
            var pixelValue;
            var pixels;

            pixels =  [e.pageX,e.pageY];
            coords = map.getCoordinateFromPixel(pixels);

            pixelValue = [pixels[0] * pixelRatio, pixels[1] * pixelRatio];
            $('#' + mapId).show();
            $('#' + mapId + ' span.map-coord').each(function(){
                var format = $(this).attr('data-format');
                $(this).html(coordinateFormat(coords, format));
            });

            // setting a limit on running-data retrievel
            if (mapIsbeingDragged) {
                return;
            }
            dataRunner.newPoint(pixelValue, map);
        }
        $(map.getViewport())
            .mouseover(function(){
                $('#' + mapId).show();
            })
            .mouseout(function(){
                $('#' + mapId).hide();
            })
            .mousemove(_.throttle(onMouseMove, 100));
    };

    /*
     * Setting a zoom action 
     *
     * @function zoomAction
     * @static
     *
     * @param {Object} map - OpenLayers Map Object
     * @param {number} amount - Direction and
     *  amount to zoom
     *
     * @returns {void}
     */
    var zoomAction = function(map, amount) {
        return function() {
            var zoom = map.getView().getZoom();
            map.beforeRender(ol.animation.zoom({
                resolution: map.getView().getResolution(),
                duration: animationDuration
            }));
            map.getView().setZoom(zoom + amount);
        };
    };

    /*
     * Create a layer key
     *
     * @function layerKey
     * @static
     *
     * @param {Object} def - Layer properties
     *
     * @param {number} options - Layer options
     *
     * @returns {object} layer key Object
     */
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
        var palette = "";
        if ( models.palettes.isActive(def.id) ) {
            palette = models.palettes.key(def.id);
        }
        return [layerId, projId, dateId, palette].join(":");
    };

    init();
    return self;

};

