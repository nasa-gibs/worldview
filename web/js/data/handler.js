import $ from 'jquery';

import { dataCmrMockClient, dataCmrClient } from './cmr';

import util from '../util/util';
import brand from '../brand';
import { CRS_WGS_84_QUERY_EXTENT, CRS_WGS_84 } from '../map/map';
import {
  dataResultsChain,
  dataResultsTagButtonScale,
  dataResultsTagProduct,
  dataResultsTagNRT,
  dataResultsTagURS,
  dataResultsTagList,
  dataResultsCollectPreferred,
  dataResultsTagVersion,
  dataResultsPreferredFilter,
  dataResultsCollectVersions,
  dataResultsVersionFilter,
  dataResultsDateTimeLabel,
  dataResultsGeometryFromCMR,
  dataResultsAntiMeridianMulti,
  dataResultsDensify,
  dataResultsTransform,
  dataResultsExtentFilter,
  dataResultsTimeLabel,
  dataResultsConnectSwaths,
  dataResultsProductLabel,
  dataResultsTimeFilter,
  dataResultsVersionFilterExact,
  dataResultsModisGridIndex,
  dataResultsGeometryFromMODISGrid,
  dataResultsModisGridLabel,
  dataResultsOrbitFilter,
  dataResultsDividePolygon,
  dataResultsOfflineFilter,
  dataResultsTitleLabel
} from './results';

export function dataHandlerGetByName(name) {
  var map = {
    'AquaSwathMultiDay': dataHandlerAquaSwathMultiDay,
    'CollectionList': dataHandlerCollectionList,
    'CollectionMix': dataHandlerCollectionMix,
    'List': dataHandlerList,
    'DailyGranuleList': dataHandlerDailyGranuleList,
    'DailyAMSRE': dataHandlerDailyAMSRE,
    'MODISGrid': dataHandlerModisGrid,
    'MODISMix': dataHandlerModisMix,
    'MODISSwath': dataHandlerModisSwath,
    'TerraSwathMultiDay': dataHandlerTerraSwathMultiDay,
    'HalfOrbit': dataHandlerHalfOrbit,
    'VIIRSSwathDay': dataHandlerVIIRSSwathDay,
    'VIIRSSwathNight': dataHandlerVIIRSSwathNight,
    'WELDGranuleFootprints': dataHandlerWeldGranuleFootprints
  };
  var handler = map[name];
  if (!handler) {
    throw new Error('No such handler: ' + name);
  }
  return handler;
};

export function dataHandlerBase(config, model) {
  var self = {};

  self.events = util.events();
  self.cmr = null;
  self.ajax = null;

  var init = function () {
    var ns = self;
    if (!ns.cmr) {
      if (config.parameters.mockCMR) {
        ns.cmr = dataCmrMockClient(
          config.parameters.mockCMR);
      } else {
        ns.cmr = dataCmrClient({
          timeout: config.parameters.timeoutCMR
        });
      }
    }
    self.cmr = ns.cmr;

    if (!ns.ajax) {
      ns.ajax = util.ajaxCache();
    }
    self.ajax = ns.ajax;

    self.extents = {};
    $.each(config.projections, function (key, projection) {
      self.extents[projection.crs] = projection.maxExtent;
    });
  };

  self.submit = function () {
    var productConfig = config.products[model.selectedProduct].query;
    var queryData = $.extend(true, {}, productConfig);
    var promise = self._submit(queryData);

    var queriedProduct = model.selectedProduct;
    promise.done(function (data) {
      try {
        if (model.selectedProduct !== queriedProduct) {
          self.events.trigger('results', {
            granules: [],
            meta: {}
          });
          return;
        }
        var results = self._processResults(data);
        self.events.trigger('results', results);
      } catch (error) {
        self.events.trigger('error', 'exception', error);
      }
    })
      .fail(function (jqXHR, textStatus, errorThrown) {
        if (textStatus === 'timeout') {
          self.events.trigger('timeout');
        } else {
          self.events.trigger('error', textStatus, errorThrown);
        }
      });
    if (promise.state() === 'pending') {
      self.events.trigger('query');
    }
  };

  init();
  return self;
};

export function dataHandlerModisSwathMultiDay(config, model, spec) {
  var startTimeDelta = spec.startTimeDelta || 0;
  var endTimeDelta = spec.endTimeDelta || 0;

  var self = dataHandlerBase(config, model);

  var init = function () {
    self.extents[CRS_WGS_84] =
      CRS_WGS_84_QUERY_EXTENT;
  };

  self._submit = function (queryData) {
    var queryOptions = {
      time: model.time,
      startTimeDelta: startTimeDelta,
      endTimeDelta: endTimeDelta,
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function (data) {
    var results = {
      meta: {},
      granules: data
    };

    // var ns = dataResults;
    var productConfig = config.products[model.selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagProduct(model.selectedProduct),
      dataResultsTagNRT(productConfig.nrt),
      dataResultsTagURS(productConfig.urs),
      dataResultsCollectPreferred(model.prefer),
      dataResultsPreferredFilter(model.prefer),
      dataResultsTagVersion(),
      dataResultsCollectVersions(),
      dataResultsVersionFilter(),
      dataResultsGeometryFromCMR(),
      dataResultsTransform(model.crs),
      dataResultsExtentFilter(model.crs, self.extents[model.crs]),
      dataResultsTimeFilter({
        time: model.time,
        eastZone: spec.eastZone,
        westZone: spec.westZone,
        maxDistance: spec.maxDistance
      }),
      dataResultsTimeLabel(model.time),
      dataResultsConnectSwaths(model.crs)
    ];
    return chain.process(results);
  };

  init();
  return self;
};

export function dataHandlerAquaSwathMultiDay(config, model) {
  var spec = {
    startTimeDelta: -180,
    endTimeDelta: 180,
    maxDistance: 270,
    eastZone: 300,
    westZone: 1380
  };

  var self = dataHandlerModisSwathMultiDay(config, model, spec);
  return $.extend(true, self, spec);
};

export function dataHandlerTerraSwathMultiDay(config, model) {
  var spec = {
    startTimeDelta: -180,
    endTimeDelta: 180,
    maxDistance: 270,
    eastZone: 180,
    westZone: 1260
  };

  var self = dataHandlerModisSwathMultiDay(config, model, spec);
  return $.extend(true, self, spec);
};

export function dataHandlerCollectionList(config, model, spec) {
  var self = dataHandlerBase(config, model);

  self._submit = function (queryData) {
    var queryOptions = {
      data: queryData,
      search: 'collections.json'
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function (data) {
    var results = {
      meta: {},
      granules: data
    };

    var productConfig = config.products[model.selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagList(),
      dataResultsTagProduct(model.selectedProduct),
      dataResultsTagURS(productConfig.urs),
      dataResultsTagVersion(),
      dataResultsCollectVersions(),
      dataResultsVersionFilter(),
      dataResultsProductLabel(config.products[model.selectedProduct].name)
    ];
    return chain.process(results);
  };

  return self;
};

export function dataHandlerCollectionMix(config, model, spec) {
  var self = dataHandlerBase(config, model);
  var nrtHandler;
  var scienceHandler;

  var init = function () {
    var productConfig = config.products[model.selectedProduct];

    var nrtHandlerName = productConfig.nrt.handler;
    var nrtHandlerFactory =
      dataHandlerGetByName(nrtHandlerName);
    nrtHandler = nrtHandlerFactory(config, model, spec);

    var scienceHandlerName = productConfig.science.handler;
    var scienceHandlerFactory =
      dataHandlerGetByName(scienceHandlerName);
    scienceHandler = scienceHandlerFactory(config, model, spec);
  };

  self._submit = function () {
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

    return util.ajaxJoin([
      {
        item: 'nrt',
        promise: nrt
      },
      {
        item: 'science',
        promise: science
      }
    ]);
  };

  self._processResults = function (data) {
    var useNRT = false;
    if (data.nrt.length > 0 && data.science.length > 0) {
      useNRT = (model.prefer === 'nrt');
    } else {
      useNRT = (data.nrt.length > 0);
    }

    if (useNRT) {
      return nrtHandler._processResults(data.nrt);
    } else {
      return scienceHandler._processResults(data.science);
    }
  };

  init();
  return self;
};

export function dataHandlerList(config, model, spec) {
  var self = dataHandlerBase(config, model);

  self._submit = function (queryData) {
    var queryOptions = {
      startTimeDelta: 1,
      endTimeDelta: -1,
      time: model.time,
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function (data) {
    var results = {
      meta: {},
      granules: data
    };

    var productConfig = config.products[model.selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagList(),
      dataResultsTagProduct(model.selectedProduct),
      dataResultsTagNRT(productConfig.nrt),
      dataResultsTagURS(productConfig.urs),
      dataResultsCollectPreferred(model.prefer),
      dataResultsPreferredFilter(model.prefer),
      dataResultsTagVersion(),
      dataResultsCollectVersions(),
      dataResultsVersionFilter(),
      dataResultsDateTimeLabel(model.time)
    ];
    return chain.process(results);
  };

  return self;
};

export function dataHandlerDailyGranuleList(config, model, spec) {
  var self = dataHandlerList(config, model, spec);

  self._submit = function (queryData) {
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

export function dataHandlerDailyAMSRE(config, model, spec) {
  var self = dataHandlerBase(config, model);

  self._submit = function (queryData) {
    var queryOptions = {
      startTimeDelta: 180,
      endTimeDelta: -180,
      time: model.time,
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function (data) {
    var results = {
      meta: {},
      granules: data
    };

    var productConfig = config.products[model.selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagList(),
      dataResultsTagProduct(model.selectedProduct),
      dataResultsTagURS(productConfig.urs),
      dataResultsTagVersion(),
      dataResultsVersionFilterExact(productConfig.version),
      dataResultsDateTimeLabel(model.time)
    ];
    return chain.process(results);
  };

  return self;
};

export function dataHandlerModisGrid(config, model, spec) {
  var self = dataHandlerBase(config, model);

  self._submit = function () {
    var crs = model.crs.replace(/:/, '_');

    var queryOptions = {
      startTimeDelta: 1,
      endTimeDelta: -1,
      time: model.time,
      data: config.products[model.selectedProduct].query
    };

    var granules = self.cmr.submit(queryOptions);
    var grid = self.ajax.submit({
      url: 'data/MODIS_Grid.' + crs + '.json?v=' + brand.BUILD_NONCE,
      dataType: 'json'
    });

    return util.ajaxJoin([
      {
        item: 'granules',
        promise: granules
      },
      {
        item: 'grid',
        promise: grid
      }
    ]);
  };

  self._processResults = function (data) {
    var productConfig = config.products[model.selectedProduct];
    var results = {
      meta: {
        gridFetched: data.grid
      },
      granules: data.granules
    };

    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagProduct(model.selectedProduct),
      dataResultsTagVersion(),
      dataResultsTagURS(productConfig.urs),
      dataResultsCollectVersions(),
      dataResultsVersionFilter(),
      dataResultsModisGridIndex(),
      dataResultsGeometryFromMODISGrid(model.crs),
      dataResultsExtentFilter(model.crs, self.extents[model.crs]),
      dataResultsModisGridLabel()
    ];
    return chain.process(results);
  };

  return self;
};

export function dataHandlerModisMix(config, model, spec) {
  var self = dataHandlerBase(config, model);
  var nrtHandler;
  var scienceHandler;

  var init = function () {
    var productConfig = config.products[model.selectedProduct];

    var nrtHandlerName = productConfig.nrt.handler;
    var nrtHandlerFactory =
      dataHandlerGetByName(nrtHandlerName);
    nrtHandler = nrtHandlerFactory(config, model, spec);

    var scienceHandlerName = productConfig.science.handler;
    var scienceHandlerFactory =
      dataHandlerGetByName(scienceHandlerName);
    scienceHandler = scienceHandlerFactory(config, model, spec);
  };

  self._submit = function () {
    var crs = model.crs.replace(/:/, '_');

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
      url: 'data/MODIS_Grid.' + crs + '.json?v=' + brand.BUILD_NONCE,
      dataType: 'json'
    });

    return util.ajaxJoin([
      {
        item: 'nrt',
        promise: nrt
      },
      {
        item: 'science',
        promise: science
      },
      {
        item: 'grid',
        promise: grid
      }
    ]);
  };

  self._processResults = function (data) {
    var useNRT = false;
    if (data.nrt.length > 0 && data.science.length > 0) {
      useNRT = (model.prefer === 'nrt');
    } else {
      useNRT = (data.nrt.length > 0);
    }

    if (useNRT) {
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

export function dataHandlerModisSwath(config, model, spec) {
  var MAX_DISTANCE = 270;
  var self = dataHandlerBase(config, model);

  var init = function () {
    self.extents[CRS_WGS_84] =
      CRS_WGS_84_QUERY_EXTENT;
  };

  self._submit = function (queryData) {
    var queryOptions = {
      time: model.time,
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function (data) {
    var results = {
      meta: {},
      granules: data
    };

    var productConfig = config.products[model.selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagProduct(model.selectedProduct),
      dataResultsTagNRT(productConfig.nrt),
      dataResultsTagURS(productConfig.urs),
      dataResultsCollectPreferred(model.prefer),
      dataResultsPreferredFilter(model.prefer),
      dataResultsTagVersion(),
      dataResultsCollectVersions(),
      dataResultsVersionFilter(),
      dataResultsGeometryFromCMR(),
      dataResultsAntiMeridianMulti(MAX_DISTANCE),
      dataResultsDensify(),
      dataResultsTransform(model.crs),
      dataResultsExtentFilter(model.crs, self.extents[model.crs]),
      dataResultsTimeLabel(model.time),
      dataResultsConnectSwaths(model.crs)
    ];
    return chain.process(results);
  };

  init();
  return self;
};

export function dataHandlerHalfOrbit(config, model, spec) {
  var self = dataHandlerBase(config, model);

  var init = function () {
    self.extents[CRS_WGS_84] =
      CRS_WGS_84_QUERY_EXTENT;
  };

  self._submit = function (queryData) {
    var queryOptions = {
      time: model.time,
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function (data) {
    var results = {
      meta: {},
      granules: data
    };

    var productConfig = config.products[model.selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsOrbitFilter(productConfig.orbit),
      dataResultsTagProduct(model.selectedProduct),
      dataResultsTagNRT(productConfig.nrt),
      dataResultsTagURS(productConfig.urs),
      dataResultsCollectPreferred(model.prefer),
      dataResultsPreferredFilter(model.prefer),
      dataResultsTagVersion(),
      dataResultsCollectVersions(),
      dataResultsVersionFilter(),
      dataResultsGeometryFromCMR(),
      dataResultsDividePolygon(),
      dataResultsDensify(),
      dataResultsTransform(model.crs),
      dataResultsTimeLabel(model.time)
    ];
    return chain.process(results);
  };

  init();
  return self;
};

export function dataHandlerVIIRSSwathDay(config, model) {
  var self = dataHandlerBase(config, model);

  var spec = {
    startTimeDelta: -180, // process granules 3 hours before and
    endTimeDelta: 180, // 3 hours after the current day
    maxDistance: 270,
    eastZone: 300, // afternoon orbit
    westZone: 1380
  };

  var init = function () {
    // Normal north-south extent minus a degree on each side. This removes
    // granules that misbehave at the poles
    self.extents[CRS_WGS_84] = [-180, -59, 180, 59];
  };

  self._submit = function (queryData) {
    var queryOptions = {
      time: model.time,
      startTimeDelta: spec.startTimeDelta,
      endTimeDelta: spec.endTimeDelta,
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function (data) {
    var results = {
      meta: {},
      granules: data
    };

    var productConfig = config.products[model.selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagProduct(model.selectedProduct),
      dataResultsTagURS(productConfig.urs),
      dataResultsGeometryFromCMR(),
      dataResultsTransform(model.crs),
      dataResultsExtentFilter(model.crs, self.extents[model.crs]),
      dataResultsTimeFilter({
        time: model.time,
        eastZone: spec.eastZone,
        westZone: spec.westZone,
        maxDistance: spec.maxDistance
      }),
      dataResultsTimeLabel(model.time),
      // End of one granule is 60 seconds behind the start of the next granule.
      // Use delta of -60.
      dataResultsConnectSwaths(model.crs, -60)
    ];
    return chain.process(results);
  };

  init();
  return self;
};

export function dataHandlerVIIRSSwathNight(config, model) {
  var self = dataHandlerBase(config, model);

  var spec = {
    startTimeDelta: 0,
    endTimeDelta: 0,
    maxDistance: 270,
    eastZone: 0,
    westZone: 1440 // Move everything west of the anti-merdian to the east
  };

  var init = function () {
    // Normal north-south extent minus a degree on each side. This removes
    // granules that misbehave at the poles
    self.extents[CRS_WGS_84] = [-180, -59, 180, 59];
  };

  self._submit = function (queryData) {
    var queryOptions = {
      time: model.time,
      startTimeDelta: spec.startTimeDelta,
      endTimeDelta: spec.endTimeDelta,
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function (data) {
    var results = {
      meta: {},
      granules: data
    };

    var productConfig = config.products[model.selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagProduct(model.selectedProduct),
      dataResultsTagURS(productConfig.urs),
      dataResultsGeometryFromCMR(),
      dataResultsAntiMeridianMulti(spec.maxDistance),
      dataResultsTransform(model.crs),
      dataResultsExtentFilter(model.crs, self.extents[model.crs]),
      dataResultsTimeFilter({
        time: model.time,
        eastZone: spec.eastZone,
        westZone: spec.westZone,
        maxDistance: spec.maxDistance
      }),
      dataResultsTimeLabel(model.time),
      // End of one granule is 60 seconds behind the start of the next granule.
      // Use delta of -60.
      dataResultsConnectSwaths(model.crs, -60)
    ];
    return chain.process(results);
  };

  init();
  return self;
};

export function dataHandlerWeldGranuleFootprints(config, model, spec) {
  var self = dataHandlerBase(config, model);

  self._submit = function (queryData) {
    var queryOptions = {
      time: model.time,
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function (data) {
    var results = {
      meta: {},
      granules: data
    };

    var chain = dataResultsChain();
    chain.processes = [
      dataResultsTagButtonScale(0.35), // standard button size is too big
      dataResultsTagProduct(model.selectedProduct),
      dataResultsTagVersion(),
      dataResultsGeometryFromCMR(),
      dataResultsDensify(),
      dataResultsTransform(model.crs),
      dataResultsExtentFilter(model.crs, self.extents[model.crs]),
      dataResultsTitleLabel()
    ];
    return chain.process(results);
  };

  return self;
};
