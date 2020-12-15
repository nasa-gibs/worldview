import {
  get as lodashGet,
  forOwn as lodashForOwn,
} from 'lodash';
import { dataCmrMockClient, dataCmrClient } from './cmr';
import { getSelectedDate } from '../../modules/date/selectors';
import util from '../../util/util';
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
  dataResultsTagVersionRegex,
} from './results';

export function dataHandlerGetByName(name) {
  const map = {
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
    WELDGranuleFootprints: dataHandlerWeldGranuleFootprints,
  };
  const handler = map[name];
  if (!handler) {
    throw new Error(`No such handler: ${name}`);
  }
  return handler;
}

export function dataHandlerBase(config, store) {
  const self = {};

  self.events = util.events();
  self.cmr = null;
  self.ajax = null;

  const mockCMR = lodashGet(config, 'parameters.mockCMR');
  const timeoutCMR = lodashGet(config, 'parameters.timeoutCMR');
  const init = function() {
    const ns = self;
    if (!ns.cmr) {
      if (mockCMR) {
        ns.cmr = dataCmrMockClient(mockCMR, store);
      } else {
        ns.cmr = dataCmrClient({
          timeout: timeoutCMR,
        });
      }
    }
    self.cmr = ns.cmr;

    if (!ns.ajax) {
      ns.ajax = util.ajaxCache();
    }
    self.ajax = ns.ajax;

    self.extents = {};
    lodashForOwn(config.projections, (projection, key) => {
      self.extents[projection.crs] = projection.maxExtent;
    });
  };

  self.submit = function() {
    const state = store.getState();
    const dataState = state.data;
    const productConfig = config.products[dataState.selectedProduct].query;
    const queryData = $.extend(true, {}, productConfig);
    const promise = self._submit(queryData);

    const queriedProduct = dataState.selectedProduct;
    promise
      .done((data) => {
        try {
          if (dataState.selectedProduct !== queriedProduct) {
            self.events.trigger('results', {
              granules: [],
              meta: {},
            });
            return;
          }
          const results = self._processResults(data, queriedProduct);
          self.events.trigger('results', results);
        } catch (error) {
          self.events.trigger('error', 'exception', error);
        }
      })
      .fail((jqXHR, textStatus, errorThrown) => {
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
  const { crs } = state.proj.selected;
  const startTimeDelta = spec.startTimeDelta || 0;
  const endTimeDelta = spec.endTimeDelta || 0;

  const self = dataHandlerBase(config, store);

  const init = function() {
    self.extents[CRS_WGS_84] = CRS_WGS_84_QUERY_EXTENT;
  };

  self._submit = function(queryData) {
    const queryOptions = {
      time: getSelectedDate(state),
      startTimeDelta,
      endTimeDelta,
      data: queryData,
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data, selectedProduct) {
    const results = {
      meta: {},
      granules: data,
    };

    // var ns = dataResults;
    const productConfig = config.products[selectedProduct];
    const chain = dataResultsChain();
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
        time: getSelectedDate(state),
        eastZone: spec.eastZone,
        westZone: spec.westZone,
        maxDistance: spec.maxDistance,
      }),
      dataResultsTimeLabel(getSelectedDate(state)),
      dataResultsConnectSwaths(crs),
    ];
    return chain.process(results);
  };

  init();
  return self;
}

export function dataHandlerAquaSwathMultiDay(config, store) {
  const spec = {
    startTimeDelta: -180,
    endTimeDelta: 180,
    maxDistance: 270,
    eastZone: 300,
    westZone: 1380,
  };

  const self = dataHandlerModisSwathMultiDay(config, store, spec);
  return $.extend(true, self, spec);
}

export function dataHandlerTerraSwathMultiDay(config, store) {
  const spec = {
    startTimeDelta: -180,
    endTimeDelta: 180,
    maxDistance: 270,
    eastZone: 180,
    westZone: 1260,
  };

  const self = dataHandlerModisSwathMultiDay(config, store, spec);
  return $.extend(true, self, spec);
}

export function dataHandlerCollectionList(config, store, spec) {
  const self = dataHandlerBase(config, store);

  self._submit = function(queryData) {
    const queryOptions = {
      data: queryData,
      search: 'collections.json',
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data, selectedProduct) {
    const results = {
      meta: {},
      granules: data,
    };

    const productConfig = config.products[selectedProduct];
    const chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagList(),
      dataResultsTagProduct(selectedProduct),
      dataResultsTagURS(productConfig.urs),
      dataResultsTagVersion(),
      dataResultsTagVersionRegex(productConfig.tagVersionRegex),
      dataResultsCollectVersions(),
      dataResultsVersionFilter(),
      dataResultsProductLabel(config.products[selectedProduct].name),
    ];
    return chain.process(results);
  };

  return self;
}

export function dataHandlerCollectionMix(config, store, spec) {
  const state = store.getState();
  const { data } = state;
  const self = dataHandlerBase(config, store);
  let nrtHandler;
  let scienceHandler;

  const init = function() {
    const productConfig = config.products[data.selectedProduct];

    const nrtHandlerName = productConfig.nrt.handler;
    const nrtHandlerFactory = dataHandlerGetByName(nrtHandlerName);
    nrtHandler = nrtHandlerFactory(config, store, spec);

    const scienceHandlerName = productConfig.science.handler;
    const scienceHandlerFactory = dataHandlerGetByName(scienceHandlerName);
    scienceHandler = scienceHandlerFactory(config, store, spec);
  };

  self._submit = function() {
    const state = store.getState();
    const dataState = state.data;
    const nrtQueryOptions = {
      time: getSelectedDate(state),
      startTimeDelta: nrtHandler.startTimeDelta,
      endTimeDelta: nrtHandler.endTimeDelta,
      data: config.products[dataState.selectedProduct].query.nrt,
      search: 'collections.json',
    };
    const nrt = self.cmr.submit(nrtQueryOptions);

    const scienceQueryOptions = {
      time: getSelectedDate(state),
      data: config.products[dataState.selectedProduct].query.science,
      search: 'collections.json',
    };
    const science = self.cmr.submit(scienceQueryOptions);

    return util.ajaxJoin([
      {
        item: 'nrt',
        promise: nrt,
      },
      {
        item: 'science',
        promise: science,
      },
    ]);
  };

  self._processResults = function(data) {
    const dataState = store.getState().data;
    let useNRT = false;
    if (data.nrt.length > 0 && data.science.length > 0) {
      useNRT = dataState.prefer === 'nrt';
    } else {
      useNRT = data.nrt.length > 0;
    }

    if (useNRT) {
      return nrtHandler._processResults(data.nrt);
    }
    return scienceHandler._processResults(data.science);
  };

  init();
  return self;
}

export function dataHandlerList(config, store, spec) {
  const state = store.getState();
  const dataState = state.data;
  const self = dataHandlerBase(config, store);

  self._submit = function(queryData) {
    const queryOptions = {
      startTimeDelta: 1,
      endTimeDelta: -1,
      time: getSelectedDate(state),
      data: queryData,
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data, selectedProduct) {
    const results = {
      meta: {},
      granules: data,
    };

    const productConfig = config.products[selectedProduct];
    const chain = dataResultsChain();
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
      dataResultsDateTimeLabel(getSelectedDate(state)),
    ];
    return chain.process(results);
  };

  return self;
}

export function dataHandlerDailyGranuleList(config, store, spec) {
  const state = store.getState();
  const self = dataHandlerList(config, store, spec);

  self._submit = function(queryData) {
    const queryOptions = {
      startTimeDelta: 180,
      endTimeDelta: -180,
      time: getSelectedDate(state),
      data: queryData,
    };

    return self.cmr.submit(queryOptions);
  };

  return self;
}

export function dataHandlerDailyAMSRE(config, store, spec) {
  const state = store.getState();
  const self = dataHandlerBase(config, store);

  self._submit = function(queryData) {
    const queryOptions = {
      startTimeDelta: 180,
      endTimeDelta: -180,
      time: getSelectedDate(state),
      data: queryData,
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data, selectedProduct) {
    const results = {
      meta: {},
      granules: data,
    };

    const productConfig = config.products[selectedProduct];
    const chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagList(),
      dataResultsTagProduct(selectedProduct),
      dataResultsTagURS(productConfig.urs),
      dataResultsTagVersion(),
      dataResultsTagVersionRegex(productConfig.tagVersionRegex),
      dataResultsVersionFilterExact(productConfig.version),
      dataResultsDateTimeLabel(getSelectedDate(state)),
    ];
    return chain.process(results);
  };

  return self;
}

export function dataHandlerModisGrid(config, store, spec) {
  const state = store.getState();
  const dataState = state.data;
  const projCrs = state.proj.selected.crs;
  const self = dataHandlerBase(config, store);

  self._submit = function() {
    const crs = projCrs.replace(/:/, '_');

    const queryOptions = {
      startTimeDelta: 1,
      endTimeDelta: -1,
      time: getSelectedDate(state),
      data: config.products[dataState.selectedProduct].query,
    };

    const granules = self.cmr.submit(queryOptions);
    const grid = self.ajax.submit({
      url: `data/MODIS_Grid.${crs}.json?v=${brand.BUILD_NONCE}`,
      dataType: 'json',
    });

    return util.ajaxJoin([
      {
        item: 'granules',
        promise: granules,
      },
      {
        item: 'grid',
        promise: grid,
      },
    ]);
  };

  self._processResults = function(data) {
    const productConfig = config.products[dataState.selectedProduct];
    const results = {
      meta: {
        gridFetched: data.grid,
      },
      granules: data.granules,
    };

    const chain = dataResultsChain();
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
      dataResultsModisGridLabel(),
    ];
    return chain.process(results);
  };

  return self;
}

export function dataHandlerModisMix(config, store, spec) {
  const state = store.getState();
  const dataState = state.data;
  const self = dataHandlerBase(config, store);
  let nrtHandler;
  let scienceHandler;

  const init = function() {
    const productConfig = config.products[dataState.selectedProduct];

    const nrtHandlerName = productConfig.nrt.handler;
    const nrtHandlerFactory = dataHandlerGetByName(nrtHandlerName);
    nrtHandler = nrtHandlerFactory(config, store, spec);

    const scienceHandlerName = productConfig.science.handler;
    const scienceHandlerFactory = dataHandlerGetByName(scienceHandlerName);
    scienceHandler = scienceHandlerFactory(config, store, spec);
  };

  self._submit = function() {
    const state = store.getState();
    const dataState = state.data;
    const projCrs = state.proj.selected.crs;

    const crs = projCrs.replace(/:/, '_');

    const nrtQueryOptions = {
      time: getSelectedDate(state),
      startTimeDelta: nrtHandler.startTimeDelta,
      endTimeDelta: nrtHandler.endTimeDelta,
      data: config.products[dataState.selectedProduct].query.nrt,
    };
    const nrt = self.cmr.submit(nrtQueryOptions);

    const scienceQueryOptions = {
      time: getSelectedDate(state),
      data: config.products[dataState.selectedProduct].query.science,
    };
    const science = self.cmr.submit(scienceQueryOptions);

    const grid = self.ajax.submit({
      url: `data/MODIS_Grid.${crs}.json?v=${brand.BUILD_NONCE}`,
      dataType: 'json',
    });

    return util.ajaxJoin([
      {
        item: 'nrt',
        promise: nrt,
      },
      {
        item: 'science',
        promise: science,
      },
      {
        item: 'grid',
        promise: grid,
      },
    ]);
  };

  self._processResults = function(data) {
    let useNRT = false;
    if (data.nrt.length > 0 && data.science.length > 0) {
      useNRT = dataState.prefer === 'nrt';
    } else {
      useNRT = data.nrt.length > 0;
    }

    if (useNRT) {
      return nrtHandler._processResults(data.nrt);
    }
    return scienceHandler._processResults({
      granules: data.science,
      grid: data.grid,
    });
  };

  init();
  return self;
}

export function dataHandlerModisSwath(config, store, spec) {
  const state = store.getState();
  const dataState = state.data;
  const projCrs = state.proj.selected.crs;

  const MAX_DISTANCE = 270;
  const self = dataHandlerBase(config, store);

  const init = function() {
    self.extents[CRS_WGS_84] = CRS_WGS_84_QUERY_EXTENT;
  };

  self._submit = function(queryData) {
    const queryOptions = {
      time: getSelectedDate(state),
      data: queryData,
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data) {
    const results = {
      meta: {},
      granules: data,
    };

    const productConfig = config.products[dataState.selectedProduct];
    const chain = dataResultsChain();
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
      dataResultsTimeLabel(getSelectedDate(state)),
      dataResultsConnectSwaths(projCrs),
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
  const self = dataHandlerBase(config, store);

  const init = function() {
    self.extents[CRS_WGS_84] = CRS_WGS_84_QUERY_EXTENT;
  };

  self._submit = function(queryData) {
    const queryOptions = {
      time: getSelectedDate(state),
      data: queryData,
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data) {
    const results = {
      meta: {},
      granules: data,
    };

    const productConfig = config.products[dataState.selectedProduct];
    const chain = dataResultsChain();
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
      dataResultsTimeLabel(getSelectedDate(state)),
    ];
    return chain.process(results);
  };

  init();
  return self;
}

export function dataHandlerVIIRSSwathDay(config, store) {
  const state = store.getState();
  const projCrs = state.proj.selected.crs;
  const self = dataHandlerBase(config, store);

  const spec = {
    startTimeDelta: -180, // process granules 3 hours before and
    endTimeDelta: 180, // 3 hours after the current day
    maxDistance: 270,
    eastZone: 300, // afternoon orbit
    westZone: 1380,
  };

  const init = function() {
    // Normal north-south extent minus a degree on each side. This removes
    // granules that misbehave at the poles
    self.extents[CRS_WGS_84] = [-180, -59, 180, 59];
  };

  self._submit = function(queryData) {
    const queryOptions = {
      time: getSelectedDate(state),
      startTimeDelta: spec.startTimeDelta,
      endTimeDelta: spec.endTimeDelta,
      data: queryData,
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data, selectedProduct) {
    const results = {
      meta: {},
      granules: data,
    };

    const productConfig = config.products[selectedProduct];
    const chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagProduct(selectedProduct),
      dataResultsTagURS(productConfig.urs),
      dataResultsGeometryFromCMR(),
      dataResultsTransform(projCrs),
      dataResultsExtentFilter(projCrs, self.extents[projCrs]),
      dataResultsTimeFilter({
        time: getSelectedDate(state),
        eastZone: spec.eastZone,
        westZone: spec.westZone,
        maxDistance: spec.maxDistance,
      }),
      dataResultsTimeLabel(getSelectedDate(state)),
      // End of one granule is 60 seconds behind the start of the next granule.
      // Use delta of -60.
      dataResultsConnectSwaths(projCrs, -60),
    ];
    return chain.process(results);
  };

  init();
  return self;
}

export function dataHandlerVIIRSSwathNight(config, store) {
  const state = store.getState();
  const projCrs = state.proj.selected.crs;
  const self = dataHandlerBase(config, store);

  const spec = {
    startTimeDelta: 0,
    endTimeDelta: 0,
    maxDistance: 270,
    eastZone: 0,
    westZone: 1440, // Move everything west of the anti-merdian to the east
  };

  const init = function() {
    // Normal north-south extent minus a degree on each side. This removes
    // granules that misbehave at the poles
    self.extents[CRS_WGS_84] = [-180, -59, 180, 59];
  };

  self._submit = function(queryData) {
    const queryOptions = {
      time: getSelectedDate(state),
      startTimeDelta: spec.startTimeDelta,
      endTimeDelta: spec.endTimeDelta,
      data: queryData,
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data, selectedProduct) {
    const results = {
      meta: {},
      granules: data,
    };

    const productConfig = config.products[selectedProduct];
    const chain = dataResultsChain();
    chain.processes = [
      dataResultsOfflineFilter(),
      dataResultsTagProduct(selectedProduct),
      dataResultsTagURS(productConfig.urs),
      dataResultsGeometryFromCMR(),
      dataResultsAntiMeridianMulti(spec.maxDistance),
      dataResultsTransform(projCrs),
      dataResultsExtentFilter(projCrs, self.extents[projCrs]),
      dataResultsTimeFilter({
        time: getSelectedDate(state),
        eastZone: spec.eastZone,
        westZone: spec.westZone,
        maxDistance: spec.maxDistance,
      }),
      dataResultsTimeLabel(getSelectedDate(state)),
      // End of one granule is 60 seconds behind the start of the next granule.
      // Use delta of -60.
      dataResultsConnectSwaths(projCrs, -60),
    ];
    return chain.process(results);
  };

  init();
  return self;
}

export function dataHandlerWeldGranuleFootprints(config, store, spec) {
  const state = store.getState();
  const projCrs = state.proj.selected.crs;
  const self = dataHandlerBase(config, store);

  self._submit = function(queryData) {
    const queryOptions = {
      time: getSelectedDate(state),
      data: queryData,
    };

    return self.cmr.submit(queryOptions);
  };

  self._processResults = function(data, selectedProduct) {
    const results = {
      meta: {},
      granules: data,
    };

    const chain = dataResultsChain(selectedProduct);
    chain.processes = [
      dataResultsTagButtonScale(0.35), // standard button size is too big
      dataResultsTagProduct(selectedProduct),
      dataResultsTagVersion(),
      dataResultsGeometryFromCMR(),
      dataResultsDensify(),
      dataResultsTransform(projCrs),
      dataResultsExtentFilter(projCrs, self.extents[projCrs]),
      dataResultsTitleLabel(),
    ];
    return chain.process(results);
  };

  return self;
}
