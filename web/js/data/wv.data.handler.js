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

/**
 * @module wv.data
 */
var wv = wv || {};
wv.data = wv.data || {};

wv.data.handler = wv.data.handler || {};

wv.data.handler.getByName = function(name) {
    var map = {
        "AquaSwathMultiDay":    wv.data.handler.aquaSwathMultiDay,
        "CollectionList":       wv.data.handler.collectionList,
        "CollectionMix":        wv.data.handler.collectionMix,
        "List":                 wv.data.handler.list,
        "DailyGranuleList":     wv.data.handler.dailyGranuleList,
        "DailyAMSRE":           wv.data.handler.dailyAMSRE,
        "MODISGrid":            wv.data.handler.modisGrid,
        "MODISMix":             wv.data.handler.modisMix,
        "MODISSwath":           wv.data.handler.modisSwath,
        "TerraSwathMultiDay":   wv.data.handler.terraSwathMultiDay,
        "HalfOrbit":            wv.data.handler.halfOrbit
    };
    var handler = map[name];
    if ( !handler ) {
        throw new Error("No such handler: " + name);
    }
    return handler;
};


wv.data.handler.base = function(config, model) {
    var self = {};

    self.events = wv.util.events();
    self.cmr = null;
    self.ajax = null;

    var init = function() {
        var ns = wv.data.handler.base;
        if ( !ns.cmr ) {
            if ( config.parameters.mockCMR ) {
                ns.cmr = wv.data.cmr.mockClient(
                        config.parameters.mockCMR);
            } else {
                ns.cmr = wv.data.cmr.client({
                    timeout: config.parameters.timeoutCMR
                });
            }
        }
        self.cmr = ns.cmr;

        if ( !ns.ajax ) {
            ns.ajax = wv.util.ajaxCache();
        }
        self.ajax = ns.ajax;

        self.extents = {};
        $.each(config.projections, function(key, projection) {
            self.extents[projection.crs] = projection.maxExtent;
        });
    };

    self.submit = function() {
        var productConfig = config.products[model.selectedProduct].query;
        var queryData = $.extend(true, {}, productConfig);
        var promise = self._submit(queryData);

        var queriedProduct = model.selectedProduct;
        promise.done(function(data) {
            try {
                if ( model.selectedProduct !== queriedProduct ) {
                    self.events.trigger("results", {granules: [], meta: {}});
                    return;
                }
                var results = self._processResults(data);
                self.events.trigger("results", results);
            } catch ( error ) {
                self.events.trigger("error", "exception", error);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            if ( textStatus === "timeout" ) {
                self.events.trigger("timeout");
            } else {
                self.events.trigger("error", textStatus, errorThrown);
            }
        });
        if ( promise.state() === "pending" ) {
            self.events.trigger("query");
        }
    };

    init();
    return self;
};


wv.data.handler.modisSwathMultiDay = function(config, model, spec) {
    var startTimeDelta = spec.startTimeDelta || 0;
    var endTimeDelta = spec.endTimeDelta || 0;

    var self = wv.data.handler.base(config, model);

    var init = function() {
        self.extents[wv.map.CRS_WGS_84] =
               wv.map.CRS_WGS_84_QUERY_EXTENT;
    };

    self._submit = function(queryData) {
        var queryOptions = {
            time: model.time,
            startTimeDelta: startTimeDelta,
            endTimeDelta: endTimeDelta,
            data: queryData
        };

        return self.cmr.submit(queryOptions);
    };

    self._processResults = function(data) {
        var results = {
            meta: {},
            granules: data
        };
        if ( model.crs === wv.map.CRS_WGS_84 ) {
            results.meta.queryMask = wv.map.CRS_WGS_84_QUERY_MASK;
        }

        var ns = wv.data.results;
        var productConfig = config.products[model.selectedProduct];
        var chain = ns.chain();
        chain.processes = [
            ns.tagProduct(model.selectedProduct),
            ns.tagNRT(productConfig.nrt),
            ns.tagURS(productConfig.urs),
            ns.collectPreferred(model.prefer),
            ns.preferredFilter(model.prefer),
            ns.tagVersion(),
            ns.collectVersions(),
            ns.versionFilter(),
            ns.geometryFromCMR(),
            ns.transform(model.crs),
            ns.extentFilter(model.crs, self.extents[model.crs]),
            ns.timeFilter({
                time: model.time,
                eastZone: spec.eastZone,
                westZone: spec.westZone,
                maxDistance: spec.maxDistance
            }),
            ns.timeLabel(model.time),
            ns.connectSwaths(model.crs)
        ];
        return chain.process(results);
    };

    init();
    return self;
};

wv.data.handler.aquaSwathMultiDay = function(config, model) {
    var spec = {
        startTimeDelta: -180,
        endTimeDelta: 180,
        maxDistance: 270,
        eastZone: 300,
        westZone: 1380
    };

    var self = wv.data.handler.modisSwathMultiDay(config, model, spec);
    return $.extend(true, self, spec);
};


wv.data.handler.terraSwathMultiDay = function(config, model) {
    var spec = {
        startTimeDelta: -180,
        endTimeDelta: 180,
        maxDistance: 270,
        eastZone: 180,
        westZone: 1260
    };

    var self = wv.data.handler.modisSwathMultiDay(config, model, spec);
    return $.extend(true, self, spec);
};


wv.data.handler.collectionList = function(config, model, spec) {
    var self = wv.data.handler.base(config, model);

    self._submit = function(queryData) {
        var queryOptions = {
            data: queryData,
            search: 'collections.json'
        };

        return self.cmr.submit(queryOptions);
    };

    self._processResults = function(data) {
        var results = {
            meta: {},
            granules: data
        };

        var ns = wv.data.results;
        var productConfig = config.products[model.selectedProduct];
        var chain = ns.chain();
        chain.processes = [
            ns.tagList(),
            ns.tagProduct(model.selectedProduct),
            ns.tagURS(productConfig.urs),
            ns.tagVersion(),
            ns.collectVersions(),
            ns.versionFilter(),
            ns.productLabel(config.products[model.selectedProduct].name)
        ];
        return chain.process(results);
    };

    return self;
};

wv.data.handler.collectionMix = function(config, model, spec) {

    var self = wv.data.handler.base(config, model);
    var nrtHandler;
    var scienceHandler;

    var init = function() {
        var productConfig = config.products[model.selectedProduct];

        var nrtHandlerName = productConfig.nrt.handler;
        var nrtHandlerFactory =
                wv.data.handler.getByName(nrtHandlerName);
        nrtHandler = nrtHandlerFactory(config, model, spec);

        var scienceHandlerName = productConfig.science.handler;
        var scienceHandlerFactory =
                wv.data.handler.getByName(scienceHandlerName);
        scienceHandler = scienceHandlerFactory(config, model, spec);
    };

    self._submit = function() {

        var nrtQueryOptions = {
            time: model.time,
            startTimeDelta: nrtHandler.startTimeDelta,
            endTimeDelta: nrtHandler.endTimeDelta,
            data: config.products[model.selectedProduct].query.nrt,
            search: 'collections.json'
        };
        var nrt = self.cmr.submit(nrtQueryOptions);

        var scienceQueryOptions = {
            time: model.time,
            data: config.products[model.selectedProduct].query.science,
            search: 'collections.json'
        };
        var science = self.cmr.submit(scienceQueryOptions);

        return wv.util.ajaxJoin([
            { item: "nrt",      promise: nrt },
            { item: "science",  promise: science }
        ]);
    };

    self._processResults = function(data) {
        var useNRT = false;
        if ( data.nrt.length > 0 && data.science.length > 0 ) {
            useNRT = ( model.prefer === "nrt" );
        } else {
            useNRT = ( data.nrt.length > 0 );
        }

        if ( useNRT ) {
            return nrtHandler._processResults(data.nrt);
        } else {
            return scienceHandler._processResults(data.science);
        }
    };

    init();
    return self;
};


wv.data.handler.list = function(config, model, spec) {
    var self = wv.data.handler.base(config, model);

    self._submit = function(queryData) {
        var queryOptions = {
            startTimeDelta: 1,
            endTimeDelta: -1,
            time: model.time,
            data: queryData
        };

        return self.cmr.submit(queryOptions);
    };

    self._processResults = function(data) {
        var results = {
            meta: {},
            granules: data
        };

        var ns = wv.data.results;
        var productConfig = config.products[model.selectedProduct];
        var chain = ns.chain();
        chain.processes = [
            ns.tagList(),
            ns.tagProduct(model.selectedProduct),
            ns.tagNRT(productConfig.nrt),
            ns.tagURS(productConfig.urs),
            ns.collectPreferred(model.prefer),
            ns.preferredFilter(model.prefer),
            ns.tagVersion(),
            ns.collectVersions(),
            ns.versionFilter(),
            ns.dateTimeLabel(model.time)
        ];
        return chain.process(results);
    };

    return self;
};

wv.data.handler.dailyGranuleList = function(config, model, spec) {
    var self = wv.data.handler.list(config, model, spec);

    self._submit = function(queryData) {
        var queryOptions = {
            startTimeDelta: 180,
            endTimeDelta: -180,
            time: model.time,
            data: queryData
        };

        return self.cmr.submit(queryOptions);
    };

    return self;
};

wv.data.handler.dailyAMSRE = function(config, model, spec) {

    var self = wv.data.handler.base(config, model);

    self._submit = function(queryData) {
        var queryOptions = {
            startTimeDelta: 180,
            endTimeDelta: -180,
            time: model.time,
            data: queryData
        };

        return self.cmr.submit(queryOptions);
    };

    self._processResults = function(data) {
        var results = {
            meta: {},
            granules: data
        };

        var ns = wv.data.results;
        var productConfig = config.products[model.selectedProduct];
        var chain = ns.chain();
        chain.processes = [
            ns.tagList(),
            ns.tagProduct(model.selectedProduct),
            ns.tagURS(productConfig.urs),
            ns.tagVersion(),
            ns.versionFilterExact(productConfig.version),
            ns.dateTimeLabel(model.time)
        ];
        return chain.process(results);
    };

    return self;
};

wv.data.handler.modisGrid = function(config, model, spec) {
    var self = wv.data.handler.base(config, model);

    self._submit = function() {
        var crs = model.crs.replace(/:/, "_");

        var queryOptions = {
            startTimeDelta: 1,
            endTimeDelta: -1,
            time: model.time,
            data: config.products[model.selectedProduct].query
        };

        var granules = self.cmr.submit(queryOptions);
        var grid = self.ajax.submit({
            url: "data/MODIS_Grid." + crs + ".json?v=" + wv.brand.BUILD_NONCE,
            dataType: "json"
        });

        var promise = $.Deferred();
        return wv.util.ajaxJoin([
            { item: "granules", promise: granules },
            { item: "grid",     promise: grid }
        ]);
    };

    self._processResults = function(data) {
        var productConfig = config.products[model.selectedProduct];
        var results = {
            meta: {
                gridFetched: data.grid
            },
            granules: data.granules
        };

        var ns = wv.data.results;
        var chain = ns.chain();
        chain.processes = [
            ns.tagProduct(model.selectedProduct),
            ns.tagVersion(),
            ns.tagURS(productConfig.urs),
            ns.collectVersions(),
            ns.versionFilter(),
            ns.modisGridIndex(),
            ns.geometryFromMODISGrid(model.crs),
            ns.extentFilter(model.crs, self.extents[model.crs]),
            ns.modisGridLabel()
        ];
        return chain.process(results);
    };

    return self;
};


wv.data.handler.modisMix = function(config, model, spec) {

    var self = wv.data.handler.base(config, model);
    var nrtHandler;
    var scienceHandler;

    var init = function() {
        var productConfig = config.products[model.selectedProduct];

        var nrtHandlerName = productConfig.nrt.handler;
        var nrtHandlerFactory =
                wv.data.handler.getByName(nrtHandlerName);
        nrtHandler = nrtHandlerFactory(config, model, spec);

        var scienceHandlerName = productConfig.science.handler;
        var scienceHandlerFactory =
                wv.data.handler.getByName(scienceHandlerName);
        scienceHandler = scienceHandlerFactory(config, model, spec);
    };

    self._submit = function() {
        var crs = model.crs.replace(/:/, "_");

        var nrtQueryOptions = {
            time: model.time,
            startTimeDelta: nrtHandler.startTimeDelta,
            endTimeDelta: nrtHandler.endTimeDelta,
            data: config.products[model.selectedProduct].query.nrt
        };
        var nrt = self.cmr.submit(nrtQueryOptions);

        var scienceQueryOptions = {
            time: model.time,
            data: config.products[model.selectedProduct].query.science
        };
        var science = self.cmr.submit(scienceQueryOptions);

        var grid = self.ajax.submit({
            url: "data/MODIS_Grid." + crs + ".json?v=" + wv.brand.BUILD_NONCE,
            dataType: "json"
        });

        return wv.util.ajaxJoin([
            { item: "nrt",      promise: nrt },
            { item: "science",  promise: science },
            { item: "grid",     promise: grid }
        ]);
    };

    self._processResults = function(data) {
        var useNRT = false;
        if ( data.nrt.length > 0 && data.science.length > 0 ) {
            useNRT = ( model.prefer === "nrt" );
        } else {
            useNRT = ( data.nrt.length > 0 );
        }

        if ( useNRT ) {
            return nrtHandler._processResults(data.nrt);
        } else {
            return scienceHandler._processResults({
                granules: data.science,
                grid: data.grid
            });
        }
    };

    init();
    return self;
};


wv.data.handler.modisSwath = function(config, model, spec) {

    var MAX_DISTANCE = 270;
    var self = wv.data.handler.base(config, model);

    var init = function() {
        self.extents[wv.map.CRS_WGS_84] =
               wv.map.CRS_WGS_84_QUERY_EXTENT;
    };

    self._submit = function(queryData) {
        var queryOptions = {
            time: model.time,
            data: queryData
        };

        return self.cmr.submit(queryOptions);
    };

    self._processResults = function(data) {
        var results = {
            meta: {},
            granules: data
        };
        if ( model.crs === wv.map.CRS_WGS_84 ) {
            results.meta.queryMask = wv.map.CRS_WGS_84_QUERY_MASK;
        }

        var ns = wv.data.results;
        var productConfig = config.products[model.selectedProduct];
        var chain = ns.chain();
        chain.processes = [
            ns.tagProduct(model.selectedProduct),
            ns.tagNRT(productConfig.nrt),
            ns.tagURS(productConfig.urs),
            ns.collectPreferred(model.prefer),
            ns.preferredFilter(model.prefer),
            ns.tagVersion(),
            ns.collectVersions(),
            ns.versionFilter(),
            ns.geometryFromCMR(),
            ns.antiMeridianMulti(MAX_DISTANCE),
            ns.densify(),
            ns.transform(model.crs),
            ns.extentFilter(model.crs, self.extents[model.crs]),
            ns.timeLabel(model.time),
            ns.connectSwaths(model.crs)
        ];
        return chain.process(results);
    };

    init();
    return self;
};

wv.data.handler.halfOrbit = function(config, model, spec) {

    var self = wv.data.handler.base(config, model);

    var init = function() {
        self.extents[wv.map.CRS_WGS_84] =
               wv.map.CRS_WGS_84_QUERY_EXTENT;
    };

    self._submit = function(queryData) {
        var queryOptions = {
            time: model.time,
            data: queryData
        };

        return self.cmr.submit(queryOptions);
    };

    self._processResults = function(data) {
        var results = {
            meta: {},
            granules: data
        };
        if ( model.crs === wv.map.CRS_WGS_84 ) {
            results.meta.queryMask = wv.map.CRS_WGS_84_QUERY_MASK;
        }

        var ns = wv.data.results;
        var productConfig = config.products[model.selectedProduct];
        var chain = ns.chain();
        chain.processes = [
            ns.orbitFilter(productConfig.orbit),
            ns.tagProduct(model.selectedProduct),
            ns.tagNRT(productConfig.nrt),
            ns.tagURS(productConfig.urs),
            ns.collectPreferred(model.prefer),
            ns.preferredFilter(model.prefer),
            ns.tagVersion(),
            ns.collectVersions(),
            ns.versionFilter(),
            ns.geometryFromCMR(),
            ns.dividePolygon(),
            ns.densify(),
            ns.transform(model.crs),
            ns.timeLabel(model.time)
        ];
        console.log("before process", results);
        return chain.process(results);
    };

    init();
    return self;
};
