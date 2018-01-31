import $ from 'jquery';

import { cmrMockClient, cmrClient } from './cmr';
import util from '../util/util';
import brand from '../brand';
import {
  createChain,
  tagProduct,
  tagNRT,
  tagURS,
  tagList,
  collectPreferred,
  tagVersion,
  preferredFilter,
  collectVersions,
  versionFilter,
  dateTimeLabel,
  geometryFromCMR,
  antiMeridianMulti,
  transform,
  extentFilter,
  timeLabel,
  connectSwaths,
  productLabel,
  timeFilter,
  versionFilterExact,
  modisGridIndex,
  geometryFromMODISGrid,
  modisGridLabel,
  orbitFilter,
  dividePolygon
} from './processors';

// Data above 60 degrees or below -60 degrees should be downloaded with
// the polar projection instead of geographic
const geographicQueryExtent = [-180, -60, 180, 60];

function dataHandlerBase(config, model) {
  var self = {};
  self.events = util.events();
  self.cmr = null;
  self.ajax = null;

  var init = function () {
    var ns = self;
    if (!ns.cmr) {
      if (config.parameters.mockCMR) {
        ns.cmr = cmrMockClient(config.parameters.mockCMR);
      } else {
        ns.cmr = cmrClient({ timeout: config.parameters.timeoutCMR });
      }
    }
    self.cmr = ns.cmr;
    if (!ns.ajax) ns.ajax = util.ajaxCache();
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
          self.events.trigger('results', { granules: [], meta: {} });
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

export const handlers = {
  ModisSwathMultiDay: function(config, model, spec) {
    var startTimeDelta = spec.startTimeDelta || 0;
    var endTimeDelta = spec.endTimeDelta || 0;
    var self = dataHandlerBase(config, model);
    var init = function () {
      self.extents['EPSG:4326'] = geographicQueryExtent;
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
      var results = { meta: {}, granules: data };
      var productConfig = config.products[model.selectedProduct];
      var chain = createChain();
      chain.processes = [
        tagProduct(model.selectedProduct),
        tagNRT(productConfig.nrt),
        tagURS(productConfig.urs),
        collectPreferred(model.prefer),
        preferredFilter(model.prefer),
        tagVersion(),
        collectVersions(),
        versionFilter(),
        geometryFromCMR(),
        transform(model.crs),
        extentFilter(model.crs, self.extents[model.crs]),
        timeFilter({
          time: model.time,
          eastZone: spec.eastZone,
          westZone: spec.westZone,
          maxDistance: spec.maxDistance
        }),
        timeLabel(model.time),
        connectSwaths(model.crs)
      ];
      return chain.process(results);
    };
    init();
    return self;
  },

  AquaSwathMultiDay: function(config, model) {
    var spec = {
      startTimeDelta: -180,
      endTimeDelta: 180,
      maxDistance: 270,
      eastZone: 300,
      westZone: 1380
    };
    var self = this.ModisSwathMultiDay(config, model, spec);
    return $.extend(true, self, spec);
  },

  TerraSwathMultiDay: function(config, model) {
    var spec = {
      startTimeDelta: -180,
      endTimeDelta: 180,
      maxDistance: 270,
      eastZone: 180,
      westZone: 1260
    };
    var self = this.ModisSwathMultiDay(config, model, spec);
    return $.extend(true, self, spec);
  },

  CollectionList: function(config, model, spec) {
    var self = dataHandlerBase(config, model);
    self._submit = function (queryData) {
      var queryOptions = {
        data: queryData,
        search: 'collections.json'
      };
      return self.cmr.submit(queryOptions);
    };
    self._processResults = function (data) {
      var results = { meta: {}, granules: data };
      var productConfig = config.products[model.selectedProduct];
      var chain = createChain();
      chain.processes = [
        tagList(),
        tagProduct(model.selectedProduct),
        tagURS(productConfig.urs),
        tagVersion(),
        collectVersions(),
        versionFilter(),
        productLabel(config.products[model.selectedProduct].name)
      ];
      return chain.process(results);
    };
    return self;
  },

  CollectionMix: function(config, model, spec) {
    var self = dataHandlerBase(config, model);
    var nrtHandler;
    var scienceHandler;
    var init = function () {
      var productConfig = config.products[model.selectedProduct];
      var nrtHandlerName = productConfig.nrt.handler;
      nrtHandler = handlers[nrtHandlerName](config, model, spec);
      var scienceHandlerName = productConfig.science.handler;
      scienceHandler = handlers[scienceHandlerName](config, model, spec);
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
        { item: 'nrt', promise: nrt },
        { item: 'science', promise: science }
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
  },

  List: function(config, model, spec) {
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
      var results = { meta: {}, granules: data };
      var productConfig = config.products[model.selectedProduct];
      var chain = createChain();
      chain.processes = [
        tagList(),
        tagProduct(model.selectedProduct),
        tagNRT(productConfig.nrt),
        tagURS(productConfig.urs),
        collectPreferred(model.prefer),
        preferredFilter(model.prefer),
        tagVersion(),
        collectVersions(),
        versionFilter(),
        dateTimeLabel(model.time)
      ];
      return chain.process(results);
    };
    return self;
  },

  DailyGranuleList: function(config, model, spec) {
    var self = this.List(config, model, spec);
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
  },

  DailyAMSRE: function(config, model, spec) {
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
      var results = { meta: {}, granules: data };
      var productConfig = config.products[model.selectedProduct];
      var chain = createChain();
      chain.processes = [
        tagList(),
        tagProduct(model.selectedProduct),
        tagURS(productConfig.urs),
        tagVersion(),
        versionFilterExact(productConfig.version),
        dateTimeLabel(model.time)
      ];
      return chain.process(results);
    };
    return self;
  },

  MODISGrid: function(config, model, spec) {
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
        url: `data/MODIS_Grid.${crs}.json?v=${brand.BUILD_NONCE}`,
        dataType: 'json'
      });
      return util.ajaxJoin([
        { item: 'granules', promise: granules },
        { item: 'grid', promise: grid }
      ]);
    };
    self._processResults = function (data) {
      var productConfig = config.products[model.selectedProduct];
      var results = {
        meta: { gridFetched: data.grid },
        granules: data.granules
      };
      var chain = createChain();
      chain.processes = [
        tagProduct(model.selectedProduct),
        tagVersion(),
        tagURS(productConfig.urs),
        collectVersions(),
        versionFilter(),
        modisGridIndex(),
        geometryFromMODISGrid(model.crs),
        extentFilter(model.crs, self.extents[model.crs]),
        modisGridLabel()
      ];
      return chain.process(results);
    };
    return self;
  },

  MODISMix: function(config, model, spec) {
    var self = dataHandlerBase(config, model);
    var nrtHandler;
    var scienceHandler;
    var init = function () {
      var productConfig = config.products[model.selectedProduct];
      var nrtHandlerName = productConfig.nrt.handler;
      nrtHandler = handlers[nrtHandlerName](config, model, spec);
      var scienceHandlerName = productConfig.science.handler;
      scienceHandler = handlers[scienceHandlerName](config, model, spec);
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
        url: `data/MODIS_Grid.${crs}.json?v=${brand.BUILD_NONCE}`,
        dataType: 'json'
      });
      return util.ajaxJoin([
        { item: 'nrt', promise: nrt },
        { item: 'science', promise: science },
        { item: 'grid', promise: grid }
      ]);
    };
    self._processResults = function (data) {
      var useNRT = false;
      if (data.nrt.length > 0 && data.science.length > 0) {
        useNRT = (model.prefer === 'nrt');
      } else {
        useNRT = (data.nrt.length > 0);
      }
      if (useNRT) return nrtHandler._processResults(data.nrt);
      return scienceHandler._processResults({
        granules: data.science,
        grid: data.grid
      });
    };
    init();
    return self;
  },

  MODISSwath: function(config, model, spec) {
    var self = dataHandlerBase(config, model);
    var init = function () {
      self.extents['EPSG:4326'] = geographicQueryExtent;
    };
    self._submit = function (queryData) {
      return self.cmr.submit({ time: model.time, data: queryData });
    };
    self._processResults = function (data) {
      var results = { meta: {}, granules: data };
      var productConfig = config.products[model.selectedProduct];
      var chain = createChain();
      chain.processes = [
        tagProduct(model.selectedProduct),
        tagNRT(productConfig.nrt),
        tagURS(productConfig.urs),
        collectPreferred(model.prefer),
        preferredFilter(model.prefer),
        tagVersion(),
        collectVersions(),
        versionFilter(),
        geometryFromCMR(),
        antiMeridianMulti(270), // Max distance of 270
        transform(model.crs),
        extentFilter(model.crs, self.extents[model.crs]),
        timeLabel(model.time),
        connectSwaths(model.crs)
      ];
      return chain.process(results);
    };
    init();
    return self;
  },

  HalfOrbit: function(config, model, spec) {
    var self = dataHandlerBase(config, model);
    var init = function () {
      self.extents['EPSG:4326'] = geographicQueryExtent;
    };
    self._submit = function (queryData) {
      return self.cmr.submit({ time: model.time, data: queryData });
    };
    self._processResults = function (data) {
      var results = { meta: {}, granules: data };
      var productConfig = config.products[model.selectedProduct];
      var chain = createChain();
      chain.processes = [
        orbitFilter(productConfig.orbit),
        tagProduct(model.selectedProduct),
        tagNRT(productConfig.nrt),
        tagURS(productConfig.urs),
        collectPreferred(model.prefer),
        preferredFilter(model.prefer),
        tagVersion(),
        collectVersions(),
        versionFilter(),
        geometryFromCMR(),
        dividePolygon(),
        transform(model.crs),
        timeLabel(model.time)
      ];
      return chain.process(results);
    };
    init();
    return self;
  }
};
