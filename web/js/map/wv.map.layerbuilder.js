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
wv.map.layerbuilder = wv.map.layerbuilder || function(models, config, cache, Parent) {
	var self = {};
    var map;
    self.init = function(Parent) {
        self.extentLayers = [];
        Parent.events.on('selecting', hideWrap);
        Parent.events.on('selectiondone', showWrap);
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
    self.createLayer = function(def, options) {
        var date, key, proj, layer, layerNext, layerPrior, group, attributes;

        group = null;
        options = options || {};
        key = self.layerKey(def, options);
        proj = models.proj.selected;
        layer = cache.getItem(key);
        if ( !layer ) {
            date = options.date || models.date.selected;
            attributes = {
                id: def.id,
                key: key,
                date: wv.util.toISOStringDate(date),
                proj: proj.id,
                def: def,
            };
            def = _.cloneDeep(def);
            _.merge(def, def.projections[proj.id]);
            if ( def.type === "wmts" ) {
                layer = createLayerWMTS(def, options);
                if(proj.id === 'geographic' && def.wrapadjacentdays === true) {
                    layerNext = createLayerWMTS(def, options, 1);
                    layerPrior = createLayerWMTS(def, options, -1);

                    layer.wv = attributes;
                    layerPrior.wv = attributes;
                    layerNext.wv = attributes;

                    layer = new ol.layer.Group({
                        layers: [layer, layerNext, layerPrior]
                    });
                }

            } else if ( def.type === "wms" ) {
                layer = createLayerWMS(def, options);
                if(proj.id === 'geographic' && def.wrapadjacentdays === true) {

                    layerNext = createLayerWMS(def, options, 1);
                    layerPrior = createLayerWMS(def, options, -1);

                    layer.wv = attributes;
                    layerPrior.wv = attributes;
                    layerNext.wv = attributes;

                    layer = new ol.layer.Group({
                        layers: [layer, layerNext, layerPrior]
                    });
                }
            } else {
                throw new Error("Unknown layer type: " + def.type);
            }
            layer.wv = attributes;
            cache.setItem(key, layer);
            layer.setVisible(false);
        }
        layer.setOpacity(def.opacity || 1.0);
        return layer;
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
    self.layerKey = function(def, options) {
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
    var createLayerWMTS = function(def, options, day) {
        var proj, source, matrixSet, matrixIds, extra,
            date, extent, start;
        proj = models.proj.selected;
        source = config.sources[def.source];
        extent = proj.maxExtent;
        start = [proj.maxExtent[0], proj.maxExtent[3]];
        if ( !source ) {
            throw new Error(def.id + ": Invalid source: " + def.source);
        }
        matrixSet = source.matrixSets[def.matrixSet];
        if ( !matrixSet ) {
            throw new Error(def.id + ": Undefined matrix set: " + def.matrixSet);
        }
        matrixIds = [];
        _.each(matrixSet.resolutions, function(resolution, index) {
            matrixIds.push(index);
        });
        extra = "";
        if(day) {
            if(day === 1){
                extent = [-250, -90, -180, 90];
                start = [-540,90];
            } else {
                extent = [180, -90, 250, 90];
                start = [180,90];
            }
        }
        if ( def.period === "daily" ) {
            date = options.date || models.date.selected;
            if(day) {
                date = wv.util.dateAdd(date, 'day', day);
            }
            extra = "?TIME=" + wv.util.toISOStringDate(date);
        }
        var sourceOptions = {
            url: source.url + extra,
            layer: def.layer || def.id,
            crossOrigin: "anonymous",
            format: def.format,
            matrixSet: matrixSet.id,
            tileGrid: new ol.tilegrid.WMTS({
                origin: start,
                resolutions: matrixSet.resolutions,
                matrixIds: matrixIds,
                tileSize: matrixSet.tileSize[0],
            }),
            wrapX: false,
            style: 'default'
        };
        if ( models.palettes.isActive(def.id) ) {
            var lookup = models.palettes.getLookup(def.id);
            sourceOptions.tileClass = ol.wv.LookupImageTile.factory(lookup);
        }
        var layer = new ol.layer.Tile({
            extent: extent,
            source: new ol.source.WMTS(sourceOptions),
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
    var createLayerWMS = function(def, options, day) {
        var proj, source, matrixSet, matrixIds, extra, transparent,
            date, extent, start, bbox, res;
        proj = models.proj.selected;
        source = config.sources[def.source];
        extent = proj.maxExtent;
        start = [proj.maxExtent[0], proj.maxExtent[3]];
        res = proj.resolutions;
        if ( !source )
            throw new Error(def.id + ": Invalid source: " + def.source);

        transparent = ( def.format === "image/png" );
        if(proj.id === "geographic") {
            res = [0.28125, 0.140625, 0.0703125, 0.03515625, 0.017578125, 0.0087890625, 0.00439453125, 0.002197265625, 0.0010986328125, 0.00054931640625, 0.00027465820313];
        }
        if(day) {
            if(day === 1){
                extent = [-250, -90, -180, 90];
                start = [-540,90];
            } else {
                extent = [180, -90, 250, 90];
                start = [180,90];
            }
        }
        parameters = {
            LAYERS: def.layer || def.id,
            FORMAT: def.format,
            TRANSPARENT: transparent,
            VERSION: "1.1.1"
        };
        if ( def.styles )
            parameters.STYLES = def.styles;

        extra = "";

        if ( def.period === "daily" ) {
            date = options.date || models.date.selected;
            if(day) {
                date = wv.util.dateAdd(date, 'day', day);
            }
            extra = "?TIME=" + wv.util.toISOStringDate(date);
        }
				var sourceOptions = {
					url: source.url + extra,
					wrapX: true,
					style: 'default',
					crossOrigin: "anonymous",
					params: parameters,
					tileGrid: new ol.tilegrid.TileGrid({
							origin: start,
							resolutions: res
					})
        };
		if ( models.palettes.isActive(def.id) ) {
            var lookup = models.palettes.getLookup(def.id);
            sourceOptions.tileClass = ol.wv.LookupImageTile.factory(lookup);
        }
        var layer = new ol.layer.Tile({
            extent: extent,
						source: new ol.source.TileWMS(sourceOptions),
        });
        return layer;
    };
    var hideWrap = function() {
        var layer;
        var key;
        var layers;

        layers = models.layers.active;

        for(var i = 0, len = layers.length; i < len; i++) {
            layer = layers[i];
            if(layer.wrapadjacentdays && layer.visible) {
                key = self.layerKey(layer, {date: models.date.selected});
                layer = cache.getItem(key);
                layer.setExtent([-180, -90, 180, 90]);
            }
        }
    };
    var showWrap = function() {
        var layer;
        var layers;
        var key;

        layers = models.layers.active;
        for(var i = 0, len = layers.length; i < len; i++) {

            layer = layers[i];
            if(layer.wrapadjacentdays && layer.visible) {
                key = self.layerKey(layer, {date: models.date.selected});
                layer = cache.getItem(key);
                layer.setExtent([-250, -90, 250, 90]);
            }
        }
    };
    self.init(Parent);
    return self;
};
