/* eslint-disable import/no-duplicates */
import OlTileGridWMTS from 'ol/tilegrid/WMTS';
import OlSourceWMTS from 'ol/source/WMTS';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlLayerGroup from 'ol/layer/Group';
import OlLayerTile from 'ol/layer/Tile';
import OlTileGridTileGrid from 'ol/tilegrid/TileGrid';
import OlStroke from 'ol/style/Stroke';
import OlText from 'ol/style/Text';
import OlFill from 'ol/style/Fill';
import OlGraticule from 'ol/layer/Graticule';
import MVT from 'ol/format/MVT';
import LayerVectorTile from 'ol/layer/VectorTile';
import SourceVectorTile from 'ol/source/VectorTile';
import lodashCloneDeep from 'lodash/cloneDeep';
import lodashMerge from 'lodash/merge';
import lodashEach from 'lodash/each';
import lodashGet from 'lodash/get';
import util from '../util/util';
import lookupFactory from '../ol/lookupimagetile';
import { createVectorUrl, getGeographicResolutionWMS, mergeBreakpointLayerAttributes } from './util';
import { datesInDateRanges, prevDateInDateRange } from '../modules/layers/util';
import getSelectedDate from '../modules/date/selectors';
import {
  isActive as isPaletteActive,
  getKey as getPaletteKeys,
  getLookup as getPaletteLookup,
} from '../modules/palettes/selectors';
import {
  isActive as isVectorStyleActive,
  getKey as getVectorStyleKeys,
  applyStyle,
} from '../modules/vector-styles/selectors';
import {
  nearestInterval,
} from '../modules/layers/util';

export default function mapLayerBuilder(config, cache, store) {
  const self = {};

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
    const layer = createLayerFunc(def, options, null, state, attributes);
    if (!wrapLayer) {
      return layer;
    }
    const layerNext = createLayerFunc(def, options, 1, state, attributes);
    const layerPrior = createLayerFunc(def, options, -1, state, attributes);
    layer.wv = attributes;
    layerPrior.wv = attributes;
    layerNext.wv = attributes;
    return new OlLayerGroup({
      layers: [layer, layerNext, layerPrior],
    });
  };

  /**
   * For subdaily layers, if the layer date is within 30 minutes of current
   * time, set expiration to ten minutes from now
   */
  const getCacheOptions = (period, date) => {
    const tenMin = 10 * 60000;
    const thirtyMin = 30 * 60000;
    const now = Date.now();
    const recentTime = Math.abs(now - date.getTime()) < thirtyMin;
    if (period !== 'subdaily' || !recentTime) {
      return {};
    }
    return {
      expirationAbsolute: new Date(now + tenMin),
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
    options = options || {};
    const group = options.group || null;
    const { closestDate, nextDate, previousDate } = self.getRequestDates(def, options);
    let date = closestDate;
    if (date) {
      options.date = date;
    }
    const key = self.layerKey(def, options, state);
    const proj = state.proj.selected;
    let layer = cache.getItem(key);

    if (!layer) {
      // layer is not in the cache
      if (!date) date = options.date || getSelectedDate(state);
      const cacheOptions = getCacheOptions(def.period, date);
      const attributes = {
        id: def.id,
        key,
        date,
        proj: proj.id,
        def,
        group,
        nextDate,
        previousDate,
      };
      def = lodashCloneDeep(def);
      lodashMerge(def, def.projections[proj.id]);
      if (def.breakPointLayer) def = mergeBreakpointLayerAttributes(def, proj.id);

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
        case 'graticule':
          layer = new OlGraticule({
            lonLabelStyle: new OlText({
              font: '12px Calibri,sans-serif',
              textBaseline: 'top',
              fill: new OlFill({
                color: 'rgba(0,0,0,1)',
              }),
              stroke: new OlStroke({
                color: 'rgba(255,255,255,1)',
                width: 3,
              }),
            }),
            // the style to use for the lines, optional.
            strokeStyle: new OlStroke({
              color: 'rgb(255, 255, 255)',
              width: 2,
              lineDash: [0.5, 4],
            }),
            extent: proj.maxExtent,
            lonLabelPosition: 1,
            showLabels: true,
          });
          break;
        default:
          throw new Error(`Unknown layer type: ${def.type}`);
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
  self.getRequestDates = function(def, options) {
    const state = store.getState();
    const { date } = state;
    const { appNow } = date;
    const stateCurrentDate = new Date(getSelectedDate(state));
    const previousLayer = options.previousLayer || {};
    let closestDate = options.date || stateCurrentDate;

    let previousDateFromRange;
    let previousLayerDate = previousLayer.previousDate;
    let nextLayerDate = previousLayer.nextDate;

    const dateTime = closestDate.getTime();
    // if current date is outside previous and next available dates, recheck date range
    if (previousLayerDate && nextLayerDate
      && dateTime > previousLayerDate.getTime()
      && dateTime < nextLayerDate.getTime()
    ) {
      previousDateFromRange = previousLayerDate;
    } else {
      const { dateRanges, inactive, period } = def;
      let dateRange;
      if (inactive) {
        dateRange = datesInDateRanges(def, closestDate);
      } else {
        let endDateLimit;
        let startDateLimit;

        let interval = 1;
        if (dateRanges && dateRanges.length > 0) {
          for (let i = 0; i < dateRanges.length; i += 1) {
            const d = dateRanges[i];
            const int = Number(d.dateInterval);
            if (int > interval) {
              interval = int;
            }
          }
        }

        if (period === 'daily') {
          endDateLimit = util.dateAdd(closestDate, 'day', interval);
          startDateLimit = util.dateAdd(closestDate, 'day', -interval);
        } else if (period === 'monthly') {
          endDateLimit = util.dateAdd(closestDate, 'month', interval);
          startDateLimit = util.dateAdd(closestDate, 'month', -interval);
        } else if (period === 'yearly') {
          endDateLimit = util.dateAdd(closestDate, 'year', interval);
          startDateLimit = util.dateAdd(closestDate, 'year', -interval);
        } else {
          endDateLimit = new Date(closestDate);
          startDateLimit = new Date(closestDate);
        }
        dateRange = datesInDateRanges(def, closestDate, startDateLimit, endDateLimit, appNow);
      }
      const { next, previous } = prevDateInDateRange(def, closestDate, dateRange);
      previousDateFromRange = previous;
      previousLayerDate = previous;
      nextLayerDate = next;
    }

    if (def.period === 'subdaily') {
      closestDate = nearestInterval(def, closestDate);
    } else if (previousDateFromRange) {
      closestDate = util.clearTimeUTC(previousDateFromRange);
    } else {
      closestDate = util.clearTimeUTC(closestDate);
    }

    return { closestDate, previousDate: previousLayerDate, nextDate: nextLayerDate };
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
    let date;
    const layerId = def.id;
    const projId = state.proj.id;
    let style = '';
    const activeGroupStr = options.group ? options.group : compare.activeString;

    // Don't key by time if this is a static layer--it is valid for
    // every date.
    if (def.period) {
      date = util.toISOStringSeconds(util.roundTimeOneMinute(options.date));
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
    let extent; let
      origin;

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

    // If number of set limits doesn't match sets, we are assuming this product
    // crosses the anti-meridian and don't have a reliable way to calculate a single
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
      minTileRow,
    } = matrixSetLimits[limitIndex];
    const minX = extent[0] + (minTileCol * tileWidth);
    const minY = extent[3] - ((maxTileRow + 1) * tileHeight);
    const maxX = extent[0] + ((maxTileCol + 1) * tileWidth);
    const maxY = extent[3] - (minTileRow * tileHeight);

    return {
      origin,
      extent: [minX, minY, maxX, maxY],
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
    const proj = state.proj.selected;
    const source = config.sources[def.source];
    if (!source) {
      throw new Error(`${def.id}: Invalid source: ${def.source}`);
    }
    const matrixSet = source.matrixSets[def.matrixSet];
    if (!matrixSet) {
      throw new Error(`${def.id}: Undefined matrix set: ${def.matrixSet}`);
    }
    let date = options.date || getSelectedDate(state);
    if (def.period === 'subdaily' && !date) {
      date = self.getRequestDates(def, options).closestDate;
      date = new Date(date.getTime());
    }
    if (day && def.wrapadjacentdays && def.period !== 'subdaily') {
      date = util.dateAdd(date, 'day', day);
    }
    const { tileMatrices, resolutions, tileSize } = matrixSet;
    const { origin, extent } = calcExtentsFromLimits(matrixSet, def.matrixSetLimits, day, proj);
    const sizes = !tileMatrices ? [] : tileMatrices.map(({ matrixWidth, matrixHeight }) => [matrixWidth, -matrixHeight]);
    const tileGridOptions = {
      origin,
      extent,
      sizes,
      resolutions,
      matrixIds: def.matrixIds || resolutions.map((set, index) => index),
      tileSize: tileSize[0],
    };
    const urlParameters = `?TIME=${util.toISOStringSeconds(util.roundTimeOneMinute(date))}`;
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
      style: typeof def.style === 'undefined' ? 'default' : def.style,
    };
    if (isPaletteActive(def.id, options.group, state)) {
      const lookup = getPaletteLookup(def.id, options.group, state);
      sourceOptions.tileClass = lookupFactory(lookup, sourceOptions);
    }
    return new OlLayerTile({
      preload: Infinity,
      className: def.id,
      extent,
      source: new OlSourceWMTS(sourceOptions),
    });
  };

  /**
    *
    * @param {object} def - Layer Specs
    * @param {object} options - Layer options
    * @param {number} day
    * @param {object} state
    * @param {object} attributes
    */
  const createLayerVector = function(def, options, day, state, attributes) {
    const { proj, animation } = state;
    let date;
    let gridExtent;
    let matrixIds;
    let start;
    let layerExtent;
    const selectedProj = proj.selected;
    const source = config.sources[def.source];
    const animationIsPlaying = animation.isPlaying;
    gridExtent = selectedProj.maxExtent;
    layerExtent = gridExtent;
    start = [selectedProj.maxExtent[0], selectedProj.maxExtent[3]];

    if (!source) {
      throw new Error(`${def.id}: Invalid source: ${def.source}`);
    }
    const matrixSet = source.matrixSets[def.matrixSet];
    if (!matrixSet) {
      throw new Error(`${def.id}: Undefined matrix set: ${def.matrixSet}`);
    }
    if (typeof def.matrixIds === 'undefined') {
      matrixIds = [];
      lodashEach(matrixSet.resolutions, (resolution, index) => {
        matrixIds.push(index);
      });
    } else {
      matrixIds = def.matrixIds;
    }

    if (day) {
      if (day === 1) {
        layerExtent = [-250, -90, -180, 90];
        start = [-180, 90];
        gridExtent = [110, -90, 180, 90];
      } else {
        gridExtent = [-180, -90, -110, 90];
        layerExtent = [180, -90, 250, 90];
        start = [-180, 90];
      }
    }

    const layerName = def.layer || def.id;
    const tileMatrixSet = def.matrixSet;
    date = options.date || getSelectedDate(state);

    if (day && def.wrapadjacentdays) date = util.dateAdd(date, 'day', day);
    const urlParameters = createVectorUrl(date, layerName, tileMatrixSet);
    const wrapX = !!(day === 1 || day === -1);
    const breakPointLayerDef = def.breakPointLayer;
    const breakPointResolution = lodashGet(def, `breakPointLayer.projections.${proj.id}.resolutionBreakPoint`);
    const breakPointType = lodashGet(def, 'breakPointLayer.breakPointType');
    const isMaxBreakPoint = breakPointType === 'max';
    const isMinBreakPoint = breakPointType === 'min';

    const sourceOptions = new SourceVectorTile({
      url: source.url + urlParameters,
      layer: layerName,
      day,
      format: new MVT(),
      matrixSet: tileMatrixSet,
      wrapX,
      projection: proj.selected.crs,
      tileGrid: new OlTileGridTileGrid({
        extent: gridExtent,
        resolutions: matrixSet.resolutions,
        tileSize: matrixSet.tileSize,
        origin: start,
        sizes: matrixSet.tileMatrices,
      }),
    });
    const layer = new LayerVectorTile({
      extent: layerExtent,
      source: sourceOptions,
      renderMode: 'image',
      className: def.id,
      vector: true,
      preload: 10,
      ...isMaxBreakPoint && { maxResolution: breakPointResolution },
      ...isMinBreakPoint && { minResolution: breakPointResolution },
    });
    applyStyle(def, layer, state, options);
    layer.wrap = day;
    layer.wv = attributes;
    layer.isVector = true;
    if (breakPointLayerDef && !animationIsPlaying) {
      const newDef = { ...def, ...breakPointLayerDef };
      const wmsLayer = createLayerWMS(newDef, options, day, state);
      const layerGroup = new OlLayerGroup({
        layers: [layer, wmsLayer],
      });
      wmsLayer.wv = attributes;
      return layerGroup;
    } if (breakPointResolution && animationIsPlaying) {
      delete breakPointLayerDef.projections[proj.id].resolutionBreakPoint;
      const newDef = { ...def, ...breakPointLayerDef };
      const wmsLayer = createLayerWMS(newDef, options, day, state);
      wmsLayer.wv = attributes;
      return wmsLayer;
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
    const { proj } = state;
    const selectedProj = proj.selected;
    let urlParameters;
    let date;
    let extent;
    let start;
    let res;

    const source = config.sources[def.source];
    extent = selectedProj.maxExtent;
    start = [selectedProj.maxExtent[0], selectedProj.maxExtent[3]];
    res = selectedProj.resolutions;
    if (!source) {
      throw new Error(`${def.id}: Invalid source: ${def.source}`);
    }

    const transparent = def.format === 'image/png';
    if (selectedProj.id === 'geographic') {
      res = getGeographicResolutionWMS(def.tileSize);
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
    const parameters = {
      LAYERS: def.layer || def.id,
      FORMAT: def.format,
      TRANSPARENT: transparent,
      VERSION: '1.1.1',
    };
    if (def.styles) {
      parameters.STYLES = def.styles;
    }

    urlParameters = '';

    date = options.date || getSelectedDate(state);
    if (day && def.wrapadjacentdays) {
      date = util.dateAdd(date, 'day', day);
    }
    urlParameters = `?TIME=${util.toISOStringSeconds(util.roundTimeOneMinute(date))}`;

    const sourceOptions = {
      url: source.url + urlParameters,
      cacheSize: 4096,
      wrapX: true,
      style: 'default',
      crossOrigin: 'anonymous',
      params: parameters,
      transition: 0,
      tileGrid: new OlTileGridTileGrid({
        origin: start,
        resolutions: res,
        tileSize: def.tileSize || [512, 512],
      }),
    };
    if (isPaletteActive(def.id, options.group, state)) {
      const lookup = getPaletteLookup(def.id, options.group, state);
      sourceOptions.tileClass = lookupFactory(lookup, sourceOptions);
    }
    const resolutionBreakPoint = lodashGet(def, `breakPointLayer.projections.${proj.id}.resolutionBreakPoint`);
    const layer = new OlLayerTile({
      preload: Infinity,
      className: def.id,
      extent,
      ...!!resolutionBreakPoint && { minResolution: resolutionBreakPoint },
      source: new OlSourceTileWMS(sourceOptions),
    });
    layer.isWMS = true;
    return layer;
  };

  return self;
}
