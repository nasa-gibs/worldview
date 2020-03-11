import { dataCmrMockClient, dataCmrClient } from './cmr';
import { getActiveTime } from '../../modules/date/util';
import util from '../../util/util';
import {
  get as lodashGet,
  forOwn as lodashForOwn
} from 'lodash';
import brand from '../../brand';
import { CRS_WGS_84_QUERY_EXTENT, CRS_WGS_84 } from '../map';
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
  dataResultsTitleLabel,
  dataResultsTagVersionRegex
} from './results';

export function dataHandlerGetByName(name) {
  var map = {
    AquaSwathMultiDay: dataHandlerAquaSwathMultiDay,
    CollectionList: dataHandlerCollectionList,
    CollectionMix: dataHandlerCollectionMix,
    List: dataHandlerList,
    DailyGranuleList: dataHandlerDailyGranuleList,
    DailyAMSRE: dataHandlerDailyAMSRE,
    MODISGrid: dataHandlerModisGrid,
    MODISMix: dataHandlerModisMix,
    MODISSwath: dataHandlerModisSwath,
    TerraSwathMultiDay: dataHandlerTerraSwathMultiDay,
    HalfOrbit: dataHandlerHalfOrbit,
    VIIRSSwathDay: dataHandlerVIIRSSwathDay,
    VIIRSSwathNight: dataHandlerVIIRSSwathNight,
    WELDGranuleFootprints: dataHandlerWeldGranuleFootprints
  };
  var handler = map[name];
  if (!handler) {
    throw new Error('No such handler: ' + name);
  }
  return handler;
}

export function dataHandlerBase(config, store) {
  var self = {};

  self.events = util.events();
  self.cmr = null;
  self.ajax = null;

  const mockCMR = lodashGet(config, 'parameters.mockCMR');
  const timeoutCMR = lodashGet(config, 'parameters.timeoutCMR');
  var init = function() {
    var ns = self;
    if (!ns.cmr) {
      if (mockCMR) {
        ns.cmr = dataCmrMockClient(mockCMR, store);
      } else {
        ns.cmr = dataCmrClient({
          timeout: timeoutCMR
        });
      }
    }
    self.cmr = ns.cmr;

    if (!ns.ajax) {
      ns.ajax = util.ajaxCache();
    }
    self.ajax = ns.ajax;

    self.extents = {};
    lodashForOwn(config.projections, function(projection, key) {
      self.extents[projection.crs] = projection.maxExtent;
    });
  };

  self.submit = function() {
    const state = store.getState();
    const dataState = state.data;
    var productConfig = config.products[dataState.selectedProduct].query;
    var queryData = $.extend(true, {}, productConfig);
    var promise = self._submit(queryData);

    var queriedProduct = dataState.selectedProduct;
    promise
      .done(function(data) {
        try {
          if (dataState.selectedProduct !== queriedProduct) {
            self.events.trigger('results', {
              granules: [],
              meta: {}
            });
            return;
          }
          var results = self._processResults(data, queriedProduct);
          self.events.trigger('results', results);
        } catch (error) {
          self.events.trigger('error', 'exception', error);
        }
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
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
}

export function dataHandlerModisSwathMultiDay(config, store, spec) {
  const state = store.getState();
  const dataState = state.data;
  const crs = state.proj.selected.crs;
  var startTimeDelta = spec.startTimeDelta || 0;
  var endTimeDelta = spec.endTimeDelta || 0;

  var self = dataHandlerBase(config, store);

  var init = function() {
    self.extents[CRS_WGS_84] = CRS_WGS_84_QUERY_EXTENT;
  };

  self._submit = function(queryData) {
    var queryOptions = {
      time: getActiveTime(state),
      startTimeDelta: startTimeDelta,
      endTimeDelta: endTimeDelta,
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data, selectedProduct) {
    var results = {
      meta: {},
      granules: data
    };

    // var ns = dataResults;
    var productConfig = config.products[selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagProduct(selectedProduct),
      dataResultsTagNRT(productConfig.nrt),
      dataResultsTagURS(productConfig.urs),
      dataResultsCollectPreferred(dataState.prefer),
      dataResultsPreferredFilter(dataState.prefer),
      dataResultsTagVersion(),
      dataResultsTagVersionRegex(productConfig.tagVersionRegex),
      dataResultsCollectVersions(),
      dataResultsVersionFilter(),
      dataResultsGeometryFromCMR(),
      dataResultsTransform(crs),
      dataResultsExtentFilter(crs, self.extents[crs]),
      dataResultsTimeFilter({
        time: getActiveTime(state),
        eastZone: spec.eastZone,
        westZone: spec.westZone,
        maxDistance: spec.maxDistance
      }),
      dataResultsTimeLabel(getActiveTime(state)),
      dataResultsConnectSwaths(crs)
    ];
    return chain.process(results);
  };

  init();
  return self;
}

export function dataHandlerAquaSwathMultiDay(config, store) {
  var spec = {
    startTimeDelta: -180,
    endTimeDelta: 180,
    maxDistance: 270,
    eastZone: 300,
    westZone: 1380
  };

  var self = dataHandlerModisSwathMultiDay(config, store, spec);
  return $.extend(true, self, spec);
}

export function dataHandlerTerraSwathMultiDay(config, store) {
  var spec = {
    startTimeDelta: -180,
    endTimeDelta: 180,
    maxDistance: 270,
    eastZone: 180,
    westZone: 1260
  };

  var self = dataHandlerModisSwathMultiDay(config, store, spec);
  return $.extend(true, self, spec);
}

export function dataHandlerCollectionList(config, store, spec) {
  var self = dataHandlerBase(config, store);

  self._submit = function(queryData) {
    var queryOptions = {
      data: queryData,
      search: 'collections.json'
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data, selectedProduct) {
    var results = {
      meta: {},
      granules: data
    };

    var productConfig = config.products[selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagList(),
      dataResultsTagProduct(selectedProduct),
      dataResultsTagURS(productConfig.urs),
      dataResultsTagVersion(),
      dataResultsTagVersionRegex(productConfig.tagVersionRegex),
      dataResultsCollectVersions(),
      dataResultsVersionFilter(),
      dataResultsProductLabel(config.products[selectedProduct].name)
    ];
    return chain.process(results);
  };

  return self;
}

export function dataHandlerCollectionMix(config, store, spec) {
  const state = store.getState();
  const { data } = state;
  var self = dataHandlerBase(config, store);
  var nrtHandler;
  var scienceHandler;

  var init = function() {
    var productConfig = config.products[data.selectedProduct];

    var nrtHandlerName = productConfig.nrt.handler;
    var nrtHandlerFactory = dataHandlerGetByName(nrtHandlerName);
    nrtHandler = nrtHandlerFactory(config, store, spec);

    var scienceHandlerName = productConfig.science.handler;
    var scienceHandlerFactory = dataHandlerGetByName(scienceHandlerName);
    scienceHandler = scienceHandlerFactory(config, store, spec);
  };

  self._submit = function() {
    const state = store.getState();
    const dataState = state.data;
    var nrtQueryOptions = {
      time: getActiveTime(state),
      startTimeDelta: nrtHandler.startTimeDelta,
      endTimeDelta: nrtHandler.endTimeDelta,
      data: config.products[dataState.selectedProduct].query.nrt,
      search: 'collections.json'
    };
    var nrt = self.cmr.submit(nrtQueryOptions);

    var scienceQueryOptions = {
      time: getActiveTime(state),
      data: config.products[dataState.selectedProduct].query.science,
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

  self._processResults = function(data) {
    const dataState = store.getState().data;
    var useNRT = false;
    if (data.nrt.length > 0 && data.science.length > 0) {
      useNRT = dataState.prefer === 'nrt';
    } else {
      useNRT = data.nrt.length > 0;
    }

    if (useNRT) {
      return nrtHandler._processResults(data.nrt);
    } else {
      return scienceHandler._processResults(data.science);
    }
  };

  init();
  return self;
}

export function dataHandlerList(config, store, spec) {
  const state = store.getState();
  const dataState = state.data;
  var self = dataHandlerBase(config, store);

  self._submit = function(queryData) {
    var queryOptions = {
      startTimeDelta: 1,
      endTimeDelta: -1,
      time: getActiveTime(state),
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data, selectedProduct) {
    var results = {
      meta: {},
      granules: data
    };

    var productConfig = config.products[selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagList(),
      dataResultsTagProduct(selectedProduct),
      dataResultsTagNRT(productConfig.nrt),
      dataResultsTagURS(productConfig.urs),
      dataResultsCollectPreferred(dataState.prefer),
      dataResultsPreferredFilter(dataState.prefer),
      dataResultsTagVersion(),
      dataResultsTagVersionRegex(productConfig.tagVersionRegex),
      dataResultsCollectVersions(),
      dataResultsVersionFilter(),
      dataResultsDateTimeLabel(getActiveTime(state))
    ];
    return chain.process(results);
  };

  return self;
}

export function dataHandlerDailyGranuleList(config, store, spec) {
  const state = store.getState();
  var self = dataHandlerList(config, store, spec);

  self._submit = function(queryData) {
    var queryOptions = {
      startTimeDelta: 180,
      endTimeDelta: -180,
      time: getActiveTime(state),
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  return self;
}

export function dataHandlerDailyAMSRE(config, store, spec) {
  const state = store.getState();
  var self = dataHandlerBase(config, store);

  self._submit = function(queryData) {
    var queryOptions = {
      startTimeDelta: 180,
      endTimeDelta: -180,
      time: getActiveTime(state),
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data, selectedProduct) {
    var results = {
      meta: {},
      granules: data
    };

    var productConfig = config.products[selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagList(),
      dataResultsTagProduct(selectedProduct),
      dataResultsTagURS(productConfig.urs),
      dataResultsTagVersion(),
      dataResultsTagVersionRegex(productConfig.tagVersionRegex),
      dataResultsVersionFilterExact(productConfig.version),
      dataResultsDateTimeLabel(getActiveTime(state))
    ];
    return chain.process(results);
  };

  return self;
}

export function dataHandlerModisGrid(config, store, spec) {
  const state = store.getState();
  const dataState = state.data;
  const projCrs = state.proj.selected.crs;
  var self = dataHandlerBase(config, store);

  self._submit = function() {
    var crs = projCrs.replace(/:/, '_');

    var queryOptions = {
      startTimeDelta: 1,
      endTimeDelta: -1,
      time: getActiveTime(state),
      data: config.products[dataState.selectedProduct].query
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

  self._processResults = function(data) {
    var productConfig = config.products[dataState.selectedProduct];
    var results = {
      meta: {
        gridFetched: data.grid
      },
      granules: data.granules
    };

    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagProduct(dataState.selectedProduct),
      dataResultsTagVersion(),
      dataResultsTagVersionRegex(productConfig.tagVersionRegex),
      dataResultsTagURS(productConfig.urs),
      dataResultsCollectVersions(),
      dataResultsVersionFilter(),
      dataResultsModisGridIndex(),
      dataResultsGeometryFromMODISGrid(projCrs),
      dataResultsExtentFilter(projCrs, self.extents[projCrs]),
      dataResultsModisGridLabel()
    ];
    return chain.process(results);
  };

  return self;
}

export function dataHandlerModisMix(config, store, spec) {
  const state = store.getState();
  const dataState = state.data;
  var self = dataHandlerBase(config, store);
  var nrtHandler;
  var scienceHandler;

  var init = function() {
    var productConfig = config.products[dataState.selectedProduct];

    var nrtHandlerName = productConfig.nrt.handler;
    var nrtHandlerFactory = dataHandlerGetByName(nrtHandlerName);
    nrtHandler = nrtHandlerFactory(config, store, spec);

    var scienceHandlerName = productConfig.science.handler;
    var scienceHandlerFactory = dataHandlerGetByName(scienceHandlerName);
    scienceHandler = scienceHandlerFactory(config, store, spec);
  };

  self._submit = function() {
    const state = store.getState();
    const dataState = state.data;
    const projCrs = state.proj.selected.crs;

    var crs = projCrs.replace(/:/, '_');

    var nrtQueryOptions = {
      time: getActiveTime(state),
      startTimeDelta: nrtHandler.startTimeDelta,
      endTimeDelta: nrtHandler.endTimeDelta,
      data: config.products[dataState.selectedProduct].query.nrt
    };
    var nrt = self.cmr.submit(nrtQueryOptions);

    var scienceQueryOptions = {
      time: getActiveTime(state),
      data: config.products[dataState.selectedProduct].query.science
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

  self._processResults = function(data) {
    var useNRT = false;
    if (data.nrt.length > 0 && data.science.length > 0) {
      useNRT = dataState.prefer === 'nrt';
    } else {
      useNRT = data.nrt.length > 0;
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
}

export function dataHandlerModisSwath(config, store, spec) {
  const state = store.getState();
  const dataState = state.data;
  const projCrs = state.proj.selected.crs;

  var MAX_DISTANCE = 270;
  var self = dataHandlerBase(config, store);

  var init = function() {
    self.extents[CRS_WGS_84] = CRS_WGS_84_QUERY_EXTENT;
  };

  self._submit = function(queryData) {
    var queryOptions = {
      time: getActiveTime(state),
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data) {
    var results = {
      meta: {},
      granules: data
    };

    var productConfig = config.products[dataState.selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagProduct(dataState.selectedProduct),
      dataResultsTagNRT(productConfig.nrt),
      dataResultsTagURS(productConfig.urs),
      dataResultsCollectPreferred(dataState.prefer),
      dataResultsPreferredFilter(dataState.prefer),
      dataResultsTagVersion(),
      dataResultsTagVersionRegex(productConfig.tagVersionRegex),
      dataResultsCollectVersions(),
      dataResultsVersionFilter(),
      dataResultsGeometryFromCMR(),
      dataResultsAntiMeridianMulti(MAX_DISTANCE),
      dataResultsDensify(),
      dataResultsTransform(projCrs),
      dataResultsExtentFilter(projCrs, self.extents[projCrs]),
      dataResultsTimeLabel(getActiveTime(state)),
      dataResultsConnectSwaths(projCrs)
    ];
    return chain.process(results);
  };

  init();
  return self;
}

export function dataHandlerHalfOrbit(config, store, spec) {
  const state = store.getState();
  const dataState = state.data;
  const projCrs = state.proj.selected.crs;
  var self = dataHandlerBase(config, store);

  var init = function() {
    self.extents[CRS_WGS_84] = CRS_WGS_84_QUERY_EXTENT;
  };

  self._submit = function(queryData) {
    var queryOptions = {
      time: getActiveTime(state),
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data) {
    var results = {
      meta: {},
      granules: data
    };

    var productConfig = config.products[dataState.selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsOrbitFilter(productConfig.orbit),
      dataResultsTagProduct(dataState.selectedProduct),
      dataResultsTagNRT(productConfig.nrt),
      dataResultsTagURS(productConfig.urs),
      dataResultsCollectPreferred(dataState.prefer),
      dataResultsPreferredFilter(dataState.prefer),
      dataResultsTagVersion(),
      dataResultsTagVersionRegex(productConfig.tagVersionRegex),
      dataResultsCollectVersions(),
      dataResultsVersionFilter(),
      dataResultsGeometryFromCMR(),
      dataResultsDividePolygon(),
      dataResultsDensify(),
      dataResultsTransform(projCrs),
      dataResultsTimeLabel(getActiveTime(state))
    ];
    return chain.process(results);
  };

  init();
  return self;
}

export function dataHandlerVIIRSSwathDay(config, store) {
  const state = store.getState();
  const projCrs = state.proj.selected.crs;
  var self = dataHandlerBase(config, store);

  var spec = {
    startTimeDelta: -180, // process granules 3 hours before and
    endTimeDelta: 180, // 3 hours after the current day
    maxDistance: 270,
    eastZone: 300, // afternoon orbit
    westZone: 1380
  };

  var init = function() {
    // Normal north-south extent minus a degree on each side. This removes
    // granules that misbehave at the poles
    self.extents[CRS_WGS_84] = [-180, -59, 180, 59];
  };

  self._submit = function(queryData) {
    var queryOptions = {
      time: getActiveTime(state),
      startTimeDelta: spec.startTimeDelta,
      endTimeDelta: spec.endTimeDelta,
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data, selectedProduct) {
    var results = {
      meta: {},
      granules: data
    };

    var productConfig = config.products[selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagProduct(selectedProduct),
      dataResultsTagURS(productConfig.urs),
      dataResultsGeometryFromCMR(),
      dataResultsTransform(projCrs),
      dataResultsExtentFilter(projCrs, self.extents[projCrs]),
      dataResultsTimeFilter({
        time: getActiveTime(state),
        eastZone: spec.eastZone,
        westZone: spec.westZone,
        maxDistance: spec.maxDistance
      }),
      dataResultsTimeLabel(getActiveTime(state)),
      // End of one granule is 60 seconds behind the start of the next granule.
      // Use delta of -60.
      dataResultsConnectSwaths(projCrs, -60)
    ];
    return chain.process(results);
  };

  init();
  return self;
}

export function dataHandlerVIIRSSwathNight(config, store) {
  const state = store.getState();
  const projCrs = state.proj.selected.crs;
  var self = dataHandlerBase(config, store);

  var spec = {
    startTimeDelta: 0,
    endTimeDelta: 0,
    maxDistance: 270,
    eastZone: 0,
    westZone: 1440 // Move everything west of the anti-merdian to the east
  };

  var init = function() {
    // Normal north-south extent minus a degree on each side. This removes
    // granules that misbehave at the poles
    self.extents[CRS_WGS_84] = [-180, -59, 180, 59];
  };

  self._submit = function(queryData) {
    var queryOptions = {
      time: getActiveTime(state),
      startTimeDelta: spec.startTimeDelta,
      endTimeDelta: spec.endTimeDelta,
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data, selectedProduct) {
    var results = {
      meta: {},
      granules: data
    };

    var productConfig = config.products[selectedProduct];
    var chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagProduct(selectedProduct),
      dataResultsTagURS(productConfig.urs),
      dataResultsGeometryFromCMR(),
      dataResultsAntiMeridianMulti(spec.maxDistance),
      dataResultsTransform(projCrs),
      dataResultsExtentFilter(projCrs, self.extents[projCrs]),
      dataResultsTimeFilter({
        time: getActiveTime(state),
        eastZone: spec.eastZone,
        westZone: spec.westZone,
        maxDistance: spec.maxDistance
      }),
      dataResultsTimeLabel(getActiveTime(state)),
      // End of one granule is 60 seconds behind the start of the next granule.
      // Use delta of -60.
      dataResultsConnectSwaths(projCrs, -60)
    ];
    return chain.process(results);
  };

  init();
  return self;
}

export function dataHandlerWeldGranuleFootprints(config, store, spec) {
  const state = store.getState();
  const projCrs = state.proj.selected.crs;
  var self = dataHandlerBase(config, store);

  self._submit = function(queryData) {
    var queryOptions = {
      time: getActiveTime(state),
      data: queryData
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data, selectedProduct) {
    var results = {
      meta: {},
      granules: data
    };

    var chain = dataResultsChain(selectedProduct);
    chain.processes = [
      dataResultsTagButtonScale(0.35), // standard button size is too big
      dataResultsTagProduct(selectedProduct),
      dataResultsTagVersion(),
      dataResultsGeometryFromCMR(),
      dataResultsDensify(),
      dataResultsTransform(projCrs),
      dataResultsExtentFilter(projCrs, self.extents[projCrs]),
      dataResultsTitleLabel()
    ];
    return chain.process(results);
  };

  return self;
}
