/* eslint-disable import/no-duplicates */
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
import {
  isActive as isPaletteActive,
  getKey as getPaletteKeys,
  getLookup as getPaletteLookup
} from '../modules/palettes/selectors';
import {
  isActive as isVectorStyleActive,
  getKey as getVectorStyleKeys,
  setStyleFunction
} from '../modules/vector-styles/selectors';
import {
  nearestInterval,
  datesinDateRanges,
  prevDateInDateRange
} from '../modules/layers/util';

export function mapLayerBuilder(models, config, cache, ui, store) {
  const self = {};

  self.init = function() {
    self.extentLayers = [];
  };

  /**
   * Return a layer, or layergroup, created with the supplied function
   * @param {*} createLayerFunc
   * @param {*} def
   * @param {*} options
   * @param {*} attributes
   * @param {*} wrapLayer
   */
  const getLayer = (createLayerFunc, def, options, attributes, wrapLayer) => {
    const state = store.getState();
    const layer = createLayerFunc(def, options, null, state);
    if (!wrapLayer) {
      return layer;
    }
    const layerNext = createLayerFunc(def, options, 1, state);
    const layerPrior = createLayerFunc(def, options, -1, state);
    layer.wv = layerPrior.wv = layerNext.wv = attributes;
    return new OlLayerGroup({
      layers: [layer, layerNext, layerPrior]
    });
  };

  /**
   * For subdaily layers, if the layer date is within 30 minutes of current
   * time, set expiration to ten minutes from now
   */
  const getCacheOptions = (period, date, state) => {
    const tenMin = 10 * 60000;
    const thirtyMin = 30 * 60000;
    const now = new Date().getTime();
    const recentTime = Math.abs(now - date.getTime()) < thirtyMin;
    if (period !== 'subdaily' || !recentTime) {
      return {};
    }
    return {
      expirationAbsolute: new Date(now + tenMin)
    };
  };

  /**
   * Create a new OpenLayers Layer
   *
   * @method createLayer
   * @static
   * @param {object} def - Layer Specs
   * @param {object} options - Layer options
   * @returns {object} OpenLayers layer
   */
  self.createLayer = function(def, options) {
    const state = store.getState();
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    options = options || {};
    const group = options.group || null;
    let date = self.closestDate(def, options);
    const key = self.layerKey(def, options, state);
    const proj = state.proj.selected;
    let layer = cache.getItem(key);

    if (!layer) {
      // layer is not in the cache
      if (!date) date = options.date || state.date[activeDateStr];
      const cacheOptions = getCacheOptions(def.period, date, state);
      const attributes = {
        id: def.id,
        key,
        date,
        proj: proj.id,
        def,
        group
      };
      def = lodashCloneDeep(def);
      lodashMerge(def, def.projections[proj.id]);

      const wrapLayer = proj.id === 'geographic' && (def.wrapadjacentdays === true || def.wrapX);
      switch (def.type) {
        case 'wmts':
          layer = getLayer(createLayerWMTS, def, options, attributes, wrapLayer);
          break;
        case 'vector':
          layer = getLayer(createLayerVector, def, options, attributes, wrapLayer);
          break;
        case 'wms':
          layer = getLayer(createLayerWMS, def, options, attributes, wrapLayer);
          break;
        default:
          throw new Error('Unknown layer type: ' + def.type);
      }
      layer.wv = attributes;
      cache.setItem(key, layer, cacheOptions);
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
    const state = store.getState();
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    let date = options.date || new Date(state.date[activeDateStr]);

    if (def.period === 'subdaily') {
      date = nearestInterval(def, date);
    } else {
      date = options.date
        ? util.clearTimeUTC(new Date(date.getTime()))
        : util.clearTimeUTC(date);
    }

    return date;
  };

  /**
   * Create a layer key
   *
   * @function layerKey
   * @static
   * @param {Object} def - Layer properties
   * @param {number} options - Layer options
   * @param {boolean} precache
   * @returns {object} layer key Object
   */
  self.layerKey = function(def, options, state) {
    const { compare } = state;
    var date;
    var layerId = def.id;
    var projId = state.proj.id;
    var style = '';
    const activeGroupStr = options.group ? options.group : compare.activeString;

    // Don't key by time if this is a static layer--it is valid for
    // every date.
    if (def.period) {
      date = util.toISOStringSeconds(
        util.roundTimeOneMinute(self.closestDate(def, options))
      );
    }
    if (isPaletteActive(def.id, activeGroupStr, state)) {
      style = getPaletteKeys(def.id, undefined, state);
    }
    if (isVectorStyleActive(def.id, activeGroupStr, state)) {
      style = getVectorStyleKeys(def.id, undefined, state);
    }
    return [layerId, projId, date, style, activeGroupStr].join(':');
  };

  /**
   * Determine the extent based on TileMatrixSetLimits defined in GetCapabilities response
   * @param {*} matrixSet - from GetCapabilities
   * @param {*} matrixSetLimits - from GetCapabilities
   * @param {*} day
   * @param {*} proj - current projection
   */
  const calcExtentsFromLimits = (matrixSet, matrixSetLimits, day, proj) => {
    let extent, origin;

    switch (day) {
      case 1:
        extent = [-250, -90, -180, 90];
        origin = [-540, 90];
        break;
      case -1:
        extent = [180, -90, 250, 90];
        origin = [180, 90];
        break;
      default:
        extent = proj.maxExtent;
        origin = [extent[0], extent[3]];
        break;
    }

    const resolutionLen = matrixSet.resolutions.length;
    const setlimitsLen = matrixSetLimits && matrixSetLimits.length;

    // If number of set limits doens't match sets, we are assuming this product
    // crosses the antimeridian and don't have a reliable way to calculate a single
    // extent based on multiple set limits.
    if (!matrixSetLimits || setlimitsLen !== resolutionLen || day) {
      return { origin, extent };
    }

    const limitIndex = resolutionLen - 1;
    const resolution = matrixSet.resolutions[limitIndex];
    const tileWidth = matrixSet.tileSize[0] * resolution;
    const tileHeight = matrixSet.tileSize[1] * resolution;
    const {
      minTileCol,
      maxTileRow,
      maxTileCol,
      minTileRow
    } = matrixSetLimits[limitIndex];
    const minX = extent[0] + (minTileCol * tileWidth);
    const minY = extent[3] - ((maxTileRow + 1) * tileHeight);
    const maxX = extent[0] + ((maxTileCol + 1) * tileWidth);
    const maxY = extent[3] - (minTileRow * tileHeight);

    return {
      origin,
      extent: [minX, minY, maxX, maxY]
    };
  };

  /**
   * Create a new WMTS Layer
   * @method createLayerWMTS
   * @static
   * @param {object} def - Layer Specs
   * @param {object} options - Layer options
   * @returns {object} OpenLayers WMTS layer
   */
  const createLayerWMTS = function(def, options, day, state) {
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    const proj = state.proj.selected;
    const source = config.sources[def.source];
    if (!source) {
      throw new Error(def.id + ': Invalid source: ' + def.source);
    }
    const matrixSet = source.matrixSets[def.matrixSet];
    if (!matrixSet) {
      throw new Error(def.id + ': Undefined matrix set: ' + def.matrixSet);
    }
    let date = options.date || state.date[activeDateStr];
    if (def.period === 'subdaily') {
      date = self.closestDate(def, options);
      date = new Date(date.getTime());
    }
    if (day && def.period !== 'subdaily') {
      date = util.dateAdd(date, 'day', day);
    }
    const { tileMatrices, resolutions, tileSize } = matrixSet;
    const { origin, extent } = calcExtentsFromLimits(matrixSet, def.matrixSetLimits, day, proj);
    const sizes = tileMatrices.map(({ matrixWidth, matrixHeight }) => [matrixWidth, -matrixHeight]);
    const tileGridOptions = {
      origin,
      extent,
      sizes,
      resolutions,
      matrixIds: def.matrixIds || resolutions.map((set, index) => index),
      tileSize: tileSize[0]
    };
    const urlParameters = '?TIME=' + util.toISOStringSeconds(util.roundTimeOneMinute(date));
    const sourceOptions = {
      url: source.url + urlParameters,
      layer: def.layer || def.id,
      cacheSize: 4096,
      crossOrigin: 'anonymous',
      format: def.format,
      transition: 0,
      matrixSet: matrixSet.id,
      tileGrid: new OlTileGridWMTS(tileGridOptions),
      wrapX: false,
      style: typeof def.style === 'undefined' ? 'default' : def.style
    };
    if (isPaletteActive(def.id, options.group, state)) {
      var lookup = getPaletteLookup(def.id, options.group, state);
      sourceOptions.tileClass = lookupFactory(lookup, sourceOptions);
    }
    return new OlLayerTile({
      preload: Infinity,
      extent: extent,
      source: new OlSourceWMTS(sourceOptions)
    });
  };

  /**
   * Create a new Vector Layer
   *
   * @method createLayerVector
   * @static
   * @param {object} def - Layer Specs
   * @param {object} options - Layer options
   * @returns {object} OpenLayers Vector layer
   */
  const createLayerVector = function(def, options, day, state) {
    const { proj, compare } = state;
    var date, urlParameters, extent, source, matrixSet, matrixIds, start;
    const selectedProj = proj.selected;
    const activeDateStr = compare.isCompareA ? 'selected' : 'selectedB';
    const activeGroupStr = options.group ? options.group : compare.activeString;

    source = config.sources[def.source];
    extent = selectedProj.maxExtent;
    start = [selectedProj.maxExtent[0], selectedProj.maxExtent[3]];

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

    date = options.date || state.date[activeDateStr];
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
      extent: extent,
      source: sourceOptions
    });

    if (config.vectorStyles && def.vectorStyle && def.vectorStyle.id) {
      var vectorStyles = config.vectorStyles;
      var vectorStyleId;

      vectorStyleId = def.vectorStyle.id;
      if (state.layers[activeGroupStr]) {
        const layers = state.layers[activeGroupStr];
        layers.forEach(layer => {
          if (layer.id === layerName && layer.custom) {
            vectorStyleId = layer.custom;
          }
        });
      }
      setStyleFunction(def, vectorStyleId, vectorStyles, layer, state);
    }

    return layer;
  };

  /**
   * Create a new WMS Layer
   *
   * @method createLayerWMTS
   * @static
   * @param {object} def - Layer Specs
   * @param {object} options - Layer options
   * @returns {object} OpenLayers WMS layer
   */
  const createLayerWMS = function(def, options, day, state) {
    const { proj, compare } = state;
    const activeDateStr = compare.isCompareA ? 'selected' : 'selectedB';
    const selectedProj = proj.selected;
    var source,
      urlParameters,
      transparent,
      date,
      extent,
      start,
      res,
      parameters;

    source = config.sources[def.source];
    extent = selectedProj.maxExtent;
    start = [selectedProj.maxExtent[0], selectedProj.maxExtent[3]];
    res = selectedProj.resolutions;
    if (!source) {
      throw new Error(def.id + ': Invalid source: ' + def.source);
    }

    transparent = def.format === 'image/png';
    if (selectedProj.id === 'geographic') {
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

    date = options.date || state.date[activeDateStr];
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
    if (isPaletteActive(def.id, options.group, state)) {
      var lookup = getPaletteLookup(def.id, options.group, state);
      sourceOptions.tileClass = lookupFactory(lookup, sourceOptions);
    }
    var layer = new OlLayerTile({
      preload: Infinity,
      extent: extent,
      source: new OlSourceTileWMS(sourceOptions)
    });
    return layer;
  };

  self.init();
  return self;
}
