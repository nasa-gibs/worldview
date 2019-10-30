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
import { ADD_GRANULE_LAYER_DATES } from '../modules/layers/constants';

export function mapLayerBuilder(models, config, cache, ui, store) {
  const self = {};

  self.init = function() {
    self.extentLayers = [];
    self.proj = null;
    self.granuleLayers = {};
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
   * Find index for date string to add to sorted array of date strings
   *
   * @method getIndexForSortedInsert
   * @static
   * @param {object} array - array of dates (already sorted)
   * @param {string} date - date string ISO format
   * @returns {number} index
   */
  const getIndexForSortedInsert = (array, date) => {
    const newDate = new Date(date);
    const len = array.length;
    if (new Date(array[0]) > newDate) {
      return 0;
    }
    let i = 1;
    while (i < len && !(new Date(array[i]) > newDate && new Date(array[i - 1]) <= newDate)) {
      i = i + 1;
    }
    return i;
  };

  /**
   * Create collection of granule TileLayers from range of granule times
   *
   * @method createGranuleDayLayers
   * @static
   * @param {array} granuleDayTimes - array of dates (already sorted)
   * @param {object} def - Layer specs
   * @param {object} proj - Layer projection
   * @param {object} state - App state
   * @param {object} attributes - Layer specs
   * @returns {array} collection of OpenLayers TileLayers
   */
  const createGranuleDayLayers = (granuleDayTimes, def, proj, state, attributes) => {
    const granuleLayers = granuleDayTimes.map(granuleDateISO => {
      const group = attributes.group || state.compare.activeDateStr;
      const granuleISOKey = `${def.id}:${proj.id}:${granuleDateISO}::${group}`;

      // return cached layer if available
      const layerCache = cache.getItem(granuleISOKey);
      if (layerCache) {
        return layerCache;
      }

      self.granuleLayers[def.id][proj.id][group].dates[granuleDateISO] = granuleISOKey;
      const granuleISODateType = new Date(granuleDateISO);
      const dateOption = { date: granuleISODateType };
      const layerPromise = new Promise(resolve => {
        const createdLayer = createLayerWMTS(def, dateOption, null, state);
        // update attributes
        attributes.key = granuleISOKey;
        attributes.date = granuleISODateType;
        createdLayer.wv = attributes;
        // save to cache and push
        cache.setItem(granuleISOKey, createdLayer, getCacheOptions(def.period, new Date(granuleDateISO)));
        createdLayer.setVisible(false);
        // can set opacity for individual granules here and still control group opacity from the sidebar
        // createdLayer.setOpacity(0.2);
        resolve(createdLayer);
      });
      return layerPromise;
    });
    return new Promise(resolve => {
      return Promise.all(granuleLayers).then(results => {
        resolve(results);
      });
    });
  };

  /**
   * Process granule layer to determine if init creation/proj change or adding to exisiting collection
   *
   * @method processGranuleLayer
   * @static
   * @param {object} def - Layer specs
   * @param {object} date - current date
   * @param {object} proj - Layer projection
   * @param {boolean} isActive - is active group?
   * @param {boolean} activeKey - active or activeB group
   * @param {number} dateInterval - interval for granules
   * @param {number} granuleCount - number of granules to add to collection
   * @returns {array} collection of granuleDayTimes
   */
  const processGranuleLayer = (def, date, proj, isActive, activeKey, dateInterval, granuleCount) => {
    // createLayers for trailing date range using granuleCount based on interval from dateRanges[0].dateInterval
    const granuleDayTimes = [];
    const startDateForGranuleDay = new Date(date.getTime() - (60000 * (dateInterval * granuleCount)));

    // add dates to granuleDayTimes array
    const minuteDifference = util.minuteDiff(startDateForGranuleDay, date);
    for (let i = dateInterval; i <= minuteDifference; i += dateInterval) {
      const granuleTime = new Date(
        startDateForGranuleDay.getFullYear(),
        startDateForGranuleDay.getMonth(),
        startDateForGranuleDay.getDate(),
        startDateForGranuleDay.getHours(),
        startDateForGranuleDay.getMinutes() + i,
        0
      ).toISOString().split('.')[0] + 'Z';
      granuleDayTimes.push(granuleTime);
    }

    // init group/projection specific granule day storage
    if (self.granuleLayers[def.id] === undefined || proj.id !== self.proj) {
      const activeGranuleDayTimes = isActive ? granuleDayTimes : [];
      const activeBGranuleDayTimes = !isActive ? granuleDayTimes : [];

      const isArctic = proj.id === 'arctic';
      const isGeographic = proj.id === 'geographic';
      const isAntarctic = proj.id === 'antarctic';
      self.granuleLayers[def.id] = {
        arctic: {
          active: {
            sortedDates: isArctic ? activeGranuleDayTimes : [],
            dates: {}
          },
          activeB: {
            sortedDates: isArctic ? activeBGranuleDayTimes : [],
            dates: {}
          }
        },
        geographic: {
          active: {
            sortedDates: isGeographic ? activeGranuleDayTimes : [],
            dates: {}
          },
          activeB: {
            sortedDates: isGeographic ? activeBGranuleDayTimes : [],
            dates: {}
          }
        },
        antarctic: {
          active: {
            sortedDates: isAntarctic ? activeGranuleDayTimes : [],
            dates: {}
          },
          activeB: {
            sortedDates: isAntarctic ? activeBGranuleDayTimes : [],
            dates: {}
          }
        }
      };
    } else {
      // add sorted dates to granule layer store
      let dateArray = [...self.granuleLayers[def.id][proj.id][activeKey].sortedDates];
      dateArray = [...new Set(dateArray)];
      lodashEach(granuleDayTimes, (granuleDayTime) => {
        dateArray.splice(getIndexForSortedInsert(dateArray, granuleDayTime), 0, granuleDayTime);
      });
      self.granuleLayers[def.id][proj.id][activeKey].sortedDates = [...new Set(dateArray)];
    }
    return granuleDayTimes;
  };

  /**
   * Create a new OpenLayers Layer
   *
   * @method createLayer
   * @static
   * @param {object} def - Layer Specs
   * @param {object} options - Layer options
   * @param {object} granuleLayerParam
   *    * @param {array} granuleDates - Reordered granule times (optional: only used for granule layers)
   *    * @param {number} granuleCount - number of granules in layer group
   * @returns {object} OpenLayers layer
   */
  self.createLayer = (def, options, granuleLayerParam) => {
    const state = store.getState();

    let granuleCount = (granuleLayerParam && granuleLayerParam.granuleCount) || 20;
    let updatedGranules;
    if (granuleLayerParam && granuleLayerParam.granuleDates && granuleLayerParam.granuleDates.length) {
      if (granuleLayerParam.granuleDates.length !== granuleLayerParam.granuleCount) {
        updatedGranules = false;
      } else {
        updatedGranules = granuleLayerParam.granuleDates;
      }
    } else {
      updatedGranules = false;
    }

    let geometry = granuleLayerParam && granuleLayerParam.geometry;
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    options = options || {};
    const group = options.group || 'active';
    const isActive = group === 'active';
    const activeKey = isActive ? 'active' : 'activeB';
    let date = self.closestDate(def, options);
    const key = self.layerKey(def, options, state);
    const proj = state.proj.selected;

    const isGranule = !!(def.tags && def.tags.contains('granule'));
    let layer = cache.getItem(key);
    let granuleDayTimes = updatedGranules || [];
    if (!layer || isGranule) {
      // layer is not in the cache OR is a granule layer
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

      if (isGranule) {
        // createLayers for trailing date range using granuleCount based on interval from dateRanges[0].dateInterval
        const dateInterval = Number(def.dateRanges[0].dateInterval);
        if (!updatedGranules) {
          if (state.layers.granuleLayers[activeKey][proj.id][def.id]) {
            granuleCount = state.layers.granuleLayers[activeKey][proj.id][def.id].count;
          }
          granuleDayTimes = processGranuleLayer(def, date, proj, isActive, activeKey, dateInterval, granuleCount);
        }
        layer = createGranuleDayLayers(granuleDayTimes, def, proj, state, attributes);
      } else {
        layer.wv = attributes;
        cache.setItem(key, layer, cacheOptions);
        layer.setVisible(false);
      }
    }

    // build layer group
    if (isGranule) {
      const sortedDateCollection = updatedGranules ? updatedGranules.reverse() : granuleDayTimes;
      const includedDates = [];
      const layerGroupEntries = [];
      for (const granuleDate of sortedDateCollection) {
        // check for layer in granuleCache
        const layerCacheKey = self.granuleLayers[def.id][proj.id][activeKey].dates[granuleDate];
        const layerCache = cache.getItem(layerCacheKey);
        if (layerCache) {
          layerGroupEntries.push(layerCache);
        } else {
          layerGroupEntries.push(layer);
        }
        includedDates.unshift(granuleDate);
      }
      layer = new OlLayerGroup({
        layers: layerGroupEntries
      });

      layer.set('granule', true);
      layer.set('layerId', `${def.id}-${activeKey}`);
      self.granuleLayers[def.id][proj.id][activeKey].order = includedDates;
      // make available for layer settings
      const storedLayer = state.layers.granuleLayers[activeKey][proj.id][def.id];
      if (storedLayer && storedLayer.geometry) {
        geometry = geometry || storedLayer.geometry;
      }
      store.dispatch({
        type: ADD_GRANULE_LAYER_DATES,
        dates: includedDates,
        id: def.id,
        activeKey: activeKey,
        proj: proj.id,
        count: granuleCount,
        geometry: geometry
      });
      self.proj = proj.id;
    }
    layer.setOpacity(def.opacity || 1.0);
    return layer; // TileLayer or LayerGroup
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
    const dateArray = def.availableDates || [];
    let date = options.date || new Date(state.date[activeDateStr]);
    const zoomGreaterThanEqPeriod = (def.period === 'daily' && state.date.selectedZoom >= 3) ||
                                  (def.period === 'monthly' && state.date.selectedZoom >= 2) ||
                                  (def.period === 'yearly' && state.date.selectedZoom >= 1);

    if (def.period === 'subdaily') {
      date = nearestInterval(def, date);
    } else {
      date = options.date
        ? util.clearTimeUTC(new Date(date.getTime()))
        : util.clearTimeUTC(date);
    }

    if (
      !options.precache &&
      state.animation.isPlaying === false &&
      state.date.selectedZoom !== 0 &&
      zoomGreaterThanEqPeriod
    ) {
      date = prevDateInDateRange(def, date, dateArray);
      // Is current "rounded" previous date in the array of available dates
      const dateInArray = dateArray.some((arrDate) => date.getTime() === arrDate.getTime());

      if (date && !dateInArray) {
        // Then, update layer object with new array of dates
        def.availableDates = datesinDateRanges(def, date);
        date = prevDateInDateRange(def, date, def.availableDates);
      }
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
    const sourceWMTS = new OlSourceWMTS(sourceOptions);
    // ! conditionally set extent for tile here if granule and cmr data is available
    // const isGranule = !!(def.tags && def.tags.contains('granule'));
    // if (isGranule) {
    // extent = [-4194304, -4194304, -2216892, 4194304]
    // }

    return new OlLayerTile({
      preload: Infinity,
      extent: extent,
      source: sourceWMTS
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
   * @method createLayerWMS
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
