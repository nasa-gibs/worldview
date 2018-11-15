import util from '../util/util';
import OlTileGridWMTS from 'ol/tilegrid/WMTS';
import OlSourceWMTS from 'ol/source/WMTS';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlLayerGroup from 'ol/layer/Group';
import OlLayerTile from 'ol/layer/Tile';
import OlTileGridTileGrid from 'ol/tilegrid/TileGrid';
import MVT from 'ol/format/MVT';
import LayerVectorTile from 'ol/layer/VectorTile';
import SourceVectorTile from 'ol/source/VectorTile';
import lodashCloneDeep from 'lodash/cloneDeep';
import lodashMerge from 'lodash/merge';
import lodashEach from 'lodash/each';
import { lookupFactory } from '../ol/lookupimagetile';

export function mapLayerBuilder(models, config, cache, mapUi) {
  var self = {};
  self.init = function(Parent) {
    self.extentLayers = [];
    mapUi.events.on('selecting', hideWrap);
    mapUi.events.on('selectiondone', showWrap);
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
    var date, key, group, proj, layer, layerNext, layerPrior, attributes;
    options = options || {};
    group = options.group || null;
    date = self.closestDate(def, options);
    key = self.layerKey(def, options, group);
    proj = models.proj.selected;
    layer = cache.getItem(key);
    if (!layer) {
      // layer is not in the cache
      if (!date) date = options.date || models.date[models.date.activeDate];
      attributes = {
        id: def.id,
        key: key,
        date: date,
        proj: proj.id,
        def: def,
        group: group
      };
      def = lodashCloneDeep(def);
      lodashMerge(def, def.projections[proj.id]);
      if (def.type === 'wmts') {
        layer = createLayerWMTS(def, options);
        if (proj.id === 'geographic' && (def.wrapadjacentdays === true || def.wrapX)) {
          layerNext = createLayerWMTS(def, options, 1);
          layerPrior = createLayerWMTS(def, options, -1);

          layer.wv = attributes;
          layerPrior.wv = attributes;
          layerNext.wv = attributes;

          layer = new OlLayerGroup({
            layers: [layer, layerNext, layerPrior]
          });
        }
      } else if (def.type === 'vector') {
        layer = createLayerVector(def, options, null);
        if (proj.id === 'geographic' && (def.wrapadjacentdays === true || def.wrapX)) {
          layerNext = createLayerVector(def, options, 1);
          layerPrior = createLayerVector(def, options, -1);

          layer.wv = attributes;
          layerPrior.wv = attributes;
          layerNext.wv = attributes;

          layer = new OlLayerGroup({
            layers: [layer, layerNext, layerPrior]
          });
        }
      } else if (def.type === 'wms') {
        layer = createLayerWMS(def, options);
        if (proj.id === 'geographic' && (def.wrapadjacentdays === true || def.wrapX)) {
          layerNext = createLayerWMS(def, options, 1);
          layerPrior = createLayerWMS(def, options, -1);

          layer.wv = attributes;
          layerPrior.wv = attributes;
          layerNext.wv = attributes;

          layer = new OlLayerGroup({
            layers: [layer, layerNext, layerPrior]
          });
        }
      } else {
        throw new Error('Unknown layer type: ' + def.type);
      }
      layer.wv = attributes;
      cache.setItem(key, layer);
      layer.setVisible(false);
    }
    layer.setOpacity(def.opacity || 1.0);
    return layer;
  };

  /**
   * Returns the closest date, from the layer's array of availableDates
   *
   * @param  {object} def     Layer definition
   * @param  {object} options Layer options
   * @return {object}         Closest date
   */
  self.closestDate = function(def, options) {
    var date;
    var animRange;
    if (models.anim) {
      animRange = models.anim.rangeState;
    }
    var dateArray = def.availableDates || [];
    if (options.date) {
      date = options.date;
    } else {
      date = models.date[models.date.activeDate];
      // If this not a subdaily layer, truncate the selected time to
      // UTC midnight
      if (def.period !== 'subdaily') {
        date = util.clearTimeUTC(date);
      }
    }
    // Perform extensive checks before finding closest date
    if (
      !options.precache &&
      (animRange && animRange.playing === false) &&
      ((def.period === 'daily' && models.date.selectedZoom > 3) ||
        (def.period === 'monthly' && models.date.selectedZoom >= 2) ||
        (def.period === 'yearly' && models.date.selectedZoom >= 1))
    ) {
      date = util.prevDateInDateRange(def, date, dateArray);

      // Is current "rounded" previous date not in array of availableDates
      if (date && !dateArray.includes(date)) {
        // Then, update layer object with new array of dates
        def.availableDates = util.datesinDateRanges(def, date, true);
        date = util.prevDateInDateRange(def, date, dateArray);
      }
    }
    return date;
  };

  /*
   * Create a layer key
   *
   * @function layerKey
   * @static
   *
   * @param {Object} def - Layer properties
   * @param {number} options - Layer options
   * @param {boolean} precache
   *
   * @returns {object} layer key Object
   */
  self.layerKey = function(def, options) {
    var date;
    var layerGroupStr;
    var layerId = def.id;
    var projId = models.proj.selected.id;
    var palette = '';
    layerGroupStr = options.group ? options.group : models.layers.activeLayers;
    // Don't key by time if this is a static layer--it is valid for
    // every date.
    if (def.period) {
      date = util.toISOStringSeconds(
        util.roundTimeOneMinute(self.closestDate(def, options))
      );
    }
    if (models.palettes.isActive(def.id)) {
      palette = models.palettes.key(def.id);
    }
    return [layerId, projId, date, palette, layerGroupStr].join(':');
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
    var proj, source, matrixSet, matrixIds, urlParameters, date, extent, start;
    proj = models.proj.selected;
    source = config.sources[def.source];
    extent = proj.maxExtent;
    start = [proj.maxExtent[0], proj.maxExtent[3]];
    if (!source) {
      throw new Error(def.id + ': Invalid source: ' + def.source);
    }
    matrixSet = source.matrixSets[def.matrixSet];
    if (!matrixSet) {
      throw new Error(def.id + ': Undefined matrix set: ' + def.matrixSet);
    }
    if (typeof def.matrixIds === 'undefined') {
      matrixIds = [];
      lodashEach(matrixSet.resolutions, function(resolution, index) {
        matrixIds.push(index);
      });
    } else {
      matrixIds = def.matrixIds;
    }

    if (day) {
      if (day === 1) {
        extent = [-250, -90, -180, 90];
        start = [-540, 90];
      } else {
        extent = [180, -90, 250, 90];
        start = [180, 90];
      }
    }

    date = options.date || models.date[models.date.activeDate];
    if (day) {
      date = util.dateAdd(date, 'day', day);
    }
    urlParameters =
      '?TIME=' + util.toISOStringSeconds(util.roundTimeOneMinute(date));

    var sourceOptions = {
      url: source.url + urlParameters,
      layer: def.layer || def.id,
      cacheSize: 4096,
      crossOrigin: 'anonymous',
      format: def.format,
      transition: 0,
      matrixSet: matrixSet.id,
      tileGrid: new OlTileGridWMTS({
        origin: start,
        resolutions: matrixSet.resolutions,
        matrixIds: matrixIds,
        tileSize: matrixSet.tileSize[0]
      }),
      wrapX: false,
      style: typeof def.style === 'undefined' ? 'default' : def.style
    };
    if (models.palettes.isActive(def.id, options.group)) {
      var lookup = models.palettes.getLookup(def.id, options.group);
      sourceOptions.tileClass = lookupFactory(lookup, sourceOptions);
    }
    return new OlLayerTile({
      preload: Infinity,
      extent: extent,
      source: new OlSourceWMTS(sourceOptions)
    });
  };

  /*
   * Create a new Vector Layer
   *
   * @method createLayerVector
   * @static
   *
   * @param {object} def - Layer Specs
   *
   * @param {object} options - Layer options
   *
   *
   * @returns {object} OpenLayers Vector layer
   */
  var createLayerVector = function(def, options, day) {
    var date, urlParameters, proj, extent, source, matrixSet, matrixIds, start;
    proj = models.proj.selected;
    source = config.sources[def.source];
    extent = proj.maxExtent;
    start = [proj.maxExtent[0], proj.maxExtent[3]];

    if (!source) {
      throw new Error(def.id + ': Invalid source: ' + def.source);
    }
    matrixSet = source.matrixSets[def.matrixSet];
    if (!matrixSet) {
      throw new Error(def.id + ': Undefined matrix set: ' + def.matrixSet);
    }
    if (typeof def.matrixIds === 'undefined') {
      matrixIds = [];
      lodashEach(matrixSet.resolutions, function(resolution, index) {
        matrixIds.push(index);
      });
    } else {
      matrixIds = def.matrixIds;
    }

    if (day) {
      if (day === 1) {
        extent = [-250, -90, -180, 90];
        start = [-540, 90];
      } else {
        extent = [180, -90, 250, 90];
        start = [180, 90];
      }
    }

    var layerName = def.layer || def.id;
    var tms = def.matrixSet;

    date = options.date || models.date[models.date.activeDate];
    if (day) {
      date = util.dateAdd(date, 'day', day);
    }

    urlParameters =
      '?' +
      'TIME=' +
      util.toISOStringSeconds(util.roundTimeOneMinute(date)) +
      '&layer=' +
      layerName +
      '&tilematrixset=' +
      tms +
      '&Service=WMTS' +
      '&Request=GetTile' +
      '&Version=1.0.0' +
      '&FORMAT=application%2Fvnd.mapbox-vector-tile' +
      '&TileMatrix={z}&TileCol={x}&TileRow={y}';

    var sourceOptions = new SourceVectorTile({
      url: source.url + urlParameters,
      layer: layerName,
      crossOrigin: 'anonymous',
      format: new MVT(),
      matrixSet: tms,
      tileGrid: new OlTileGridTileGrid({
        extent: extent,
        origin: start,
        resolutions: matrixSet.resolutions,
        tileSize: matrixSet.tileSize
      })
    });

    var layer = new LayerVectorTile({
      renderMode: 'image',
      preload: 1,
      extent: extent,
      source: sourceOptions
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
    var proj,
      source,
      urlParameters,
      transparent,
      date,
      extent,
      start,
      res,
      parameters;
    proj = models.proj.selected;
    source = config.sources[def.source];
    extent = proj.maxExtent;
    start = [proj.maxExtent[0], proj.maxExtent[3]];
    res = proj.resolutions;
    if (!source) {
      throw new Error(def.id + ': Invalid source: ' + def.source);
    }

    transparent = def.format === 'image/png';
    if (proj.id === 'geographic') {
      res = [
        0.28125,
        0.140625,
        0.0703125,
        0.03515625,
        0.017578125,
        0.0087890625,
        0.00439453125,
        0.002197265625,
        0.0010986328125,
        0.00054931640625,
        0.00027465820313
      ];
    }
    if (day) {
      if (day === 1) {
        extent = [-250, -90, -180, 90];
        start = [-540, 90];
      } else {
        extent = [180, -90, 250, 90];
        start = [180, 90];
      }
    }
    parameters = {
      LAYERS: def.layer || def.id,
      FORMAT: def.format,
      TRANSPARENT: transparent,
      VERSION: '1.1.1'
    };
    if (def.styles) {
      parameters.STYLES = def.styles;
    }

    urlParameters = '';

    date = options.date || models.date[models.date.activeDate];
    if (day) {
      date = util.dateAdd(date, 'day', day);
    }
    urlParameters =
      '?TIME=' + util.toISOStringSeconds(util.roundTimeOneMinute(date));

    var sourceOptions = {
      url: source.url + urlParameters,
      cacheSize: 4096,
      wrapX: true,
      style: 'default',
      crossOrigin: 'anonymous',
      params: parameters,
      transition: 0,
      tileGrid: new OlTileGridTileGrid({
        origin: start,
        resolutions: res
      })
    };

    if (models.palettes.isActive(def.id, options.group)) {
      var lookup = models.palettes.getLookup(def.id, options.group);
      sourceOptions.tileClass = lookupFactory(lookup, sourceOptions);
    }
    var layer = new OlLayerTile({
      preload: Infinity,
      extent: extent,
      source: new OlSourceTileWMS(sourceOptions)
    });
    return layer;
  };
  var hideWrap = function() {
    var layer;
    var key;
    var layers;

    layers = models.layers[models.layers.activeLayers];

    for (var i = 0, len = layers.length; i < len; i++) {
      layer = layers[i];
      if ((layer.wrapadjacentdays || layer.wrapX) && layer.visible) {
        key = self.layerKey(layer, {
          date: models.date[models.date.activeDate]
        });
        layer = cache.getItem(key);
        if (!layer) {
          throw new Error(`no such layer in cache: ${key}`);
        }
        layer.setExtent([-180, -90, 180, 90]);
      }
    }
  };
  var showWrap = function() {
    var layer;
    var layers;
    var key;

    layers = models.layers[models.layers.activeLayers];
    for (var i = 0, len = layers.length; i < len; i++) {
      layer = layers[i];
      if ((layer.wrapadjacentdays || layer.wrapX) && layer.visible) {
        key = self.layerKey(layer, {
          date: models.date[models.date.activeDate]
        });
        layer = cache.getItem(key);
        layer.setExtent([-250, -90, 250, 90]);
      }
    }
  };
  self.init(mapUi);
  return self;
}
