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
import Cache from 'cachai';
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

// number of granules to request in the past including current time
const GRANULE_COUNT = 20;

export function mapLayerBuilder(models, config, cache, ui, store) {
  var self = {};

  self.init = function() {
    self.extentLayers = [];
    self.granuleLayers = {
      isInitGranuleLoaded: {
        active: false,
        activeB: false
      }
    };
    // granule cache since clearingLayers/reordering layers may require many granule requests
    // and the parent 'cache' is cleared on reload/reorder
    self.granuleCache = new Cache(400);
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

  // TODO: need to fix blocking of app while requesting layer tiles
  // TODO: is entire day the best strategy or just 20,50,100 last granules?
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
    // console.log(attributes.group, state.compare.activeDateStr)
    const granuleLayers = granuleDayTimes.map(function(granuleDateISO) {
      const group = attributes.group || state.compare.activeDateStr;
      const granuleISOKey = `${def.id}:${proj.id}:${granuleDateISO}::${group}`;
      self.granuleLayers[def.id][group].dates[granuleDateISO] = granuleISOKey;

      const granuleISODateType = new Date(granuleDateISO);
      const dateOption = { date: granuleISODateType };
      const layerPromise = new Promise((resolve) => {
        const createdLayer = createLayerWMTS(def, dateOption, null, state);

        // update attributes
        attributes.key = granuleISOKey;
        attributes.date = granuleISODateType;
        createdLayer.wv = attributes;
        // save to cache and push
        // console.log(granuleISOKey)
        self.granuleCache.setItem(granuleISOKey, createdLayer);
        createdLayer.setVisible(false);
        // can set opacity for individual granules here and still control group opacity
        // from the sidebar
        // createdLayer.setOpacity(0.2);
        resolve(createdLayer);
      });
      return layerPromise;
    });
    // console.log(granuleLayers);
    return new Promise(resolve => {
      return Promise.all(granuleLayers).then((results) => {
        resolve(results);
      });
    });
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
  self.createLayer = (def, options) => {
    const state = store.getState();
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    var date, key, group, proj, layer, layerNext, layerPrior, attributes;
    options = options || {};
    group = options.group || 'active';
    const isActive = group === 'active';
    const activeKey = isActive ? 'active' : 'activeB';
    date = self.closestDate(def, options);
    key = self.layerKey(def, options, state);
    proj = state.proj.selected;
    const isGranule = !!(def.tags && def.tags.contains('granule'));
    if (isGranule) {
      layer = self.granuleCache.getItem(key);
    } else {
      layer = cache.getItem(key);
    }

    if (!layer) {
      // layer is not in the cache
      if (!date) date = options.date || state.date[activeDateStr];
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
        let createdLayer = createLayerWMTS(def, options, null, state);
        if (isGranule) {
          const dateISO = date.toISOString().split('.')[0] + 'Z';
          // add to granule layer date table
          // TODO: second part of conditional necessary for comparison mode granule loading last 20
          // TODO: or whatever GRANULE_COUNT is set at. May want to optimize this logic

          // ! activeB not getting hit since past dates are already in self.granuleLayers[def.id]
          if (self.granuleLayers[def.id] === undefined || self.granuleLayers.isInitGranuleLoaded[group] === false) {
            // flag initial load of granule
            self.granuleLayers.isInitGranuleLoaded[group] = true;
            // get start date based on 00:00 UTC or defined start date
            const startDate = def.startDate;
            const zeroStartDate = new Date(startDate).setUTCHours(0, 0, 0, 0);
            const zeroedStartDate = new Date(zeroStartDate);
            // const startDateForGranuleDay = zeroedStartDate < new Date(startDate)
            //   ? zeroedStartDate
            //   : new Date(startDate);

            // createLayers for entire date based on dateRanges[0].dateInterval
            const dateInterval = Number(def.dateRanges[0].dateInterval);
            const granuleDayTimes = [];

            // ! TEST USING 20 FOR INIT LOAD SEEMS UI FRIENDLY
            // ! 100 + and it's noticeably slower to blocking
            const startDateForGranuleDay = new Date(date.getTime() - (60000 * (dateInterval * GRANULE_COUNT)));
            // console.log(date, startDateForGranuleDay)

            // add dates to granuleDayTimes array
            const minuteDifference = util.minuteDiff(startDateForGranuleDay, date);
            for (let i = 0; i <= minuteDifference; i += dateInterval) {
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
            // console.log(granuleDayTimes)
            if (self.granuleLayers[def.id] === undefined) {
              const activeGranuleDayTimes = isActive ? granuleDayTimes : [];
              const activeBGranuleDayTimes = !isActive ? granuleDayTimes : [];
              self.granuleLayers[def.id] = {
                active: {
                  sortedDates: activeGranuleDayTimes,
                  dates: {}
                },
                activeB: {
                  sortedDates: activeBGranuleDayTimes,
                  dates: {}
                }
              };
            } else {
              // add sorted dates to granule layer store
              const dateArray = [...self.granuleLayers[def.id][activeKey].sortedDates];
              lodashEach(granuleDayTimes, function(granuleDayTime) {
                dateArray.splice(getIndexForSortedInsert(dateArray, granuleDayTime), 0, granuleDayTime);
              });
              self.granuleLayers[def.id][activeKey].sortedDates = dateArray;
            }

            createdLayer = createGranuleDayLayers(granuleDayTimes, def, proj, state, attributes);
          } else {
            if (self.granuleLayers[def.id][activeKey].dates[dateISO] === undefined) {
              // add new dateISO to granule layer object and to sorted array by finding insert index O(n)
              const dateArray = [...self.granuleLayers[def.id][activeKey].sortedDates];
              self.granuleLayers[def.id][activeKey].sortedDates.splice(getIndexForSortedInsert(dateArray, dateISO), 0, dateISO);
              self.granuleLayers[def.id][activeKey].dates[dateISO] = key;
            }
          }
        }
        layer = createdLayer;

        if (
          proj.id === 'geographic' &&
          (def.wrapadjacentdays === true || def.wrapX)
        ) {
          layerNext = createLayerWMTS(def, options, 1, state);
          layerPrior = createLayerWMTS(def, options, -1, state);

          layer.wv = attributes;
          layerPrior.wv = attributes;
          layerNext.wv = attributes;

          layer = new OlLayerGroup({
            layers: [layer, layerNext, layerPrior]
          });
        }
      } else if (def.type === 'vector') {
        layer = createLayerVector(def, options, null, state);
        if (
          proj.id === 'geographic' &&
          (def.wrapadjacentdays === true || def.wrapX)
        ) {
          layerNext = createLayerVector(def, options, 1, state);
          layerPrior = createLayerVector(def, options, -1, state);

          layer.wv = attributes;
          layerPrior.wv = attributes;
          layerNext.wv = attributes;

          layer = new OlLayerGroup({
            layers: [layer, layerNext, layerPrior]
          });
        }
      } else if (def.type === 'wms') {
        layer = createLayerWMS(def, options, null, state);
        if (
          proj.id === 'geographic' &&
          (def.wrapadjacentdays === true || def.wrapX)
        ) {
          layerNext = createLayerWMS(def, options, 1, state);
          layerPrior = createLayerWMS(def, options, -1, state);

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
      if (isGranule) {
        // console.log(key, layer)
        const inCache = self.granuleCache.getItem(key);
        if (!inCache) {
          layer.wv = attributes;
          self.granuleCache.setItem(key, layer);
          layer.setVisible(false);
        }
      } else {
        layer.wv = attributes;
        cache.setItem(key, layer);
        layer.setVisible(false);
      }
    }
    // ? assuming full day coverage at 6 minutes, 240 layer tiles per layer group day
    // ? is this acceptable? how to test max? is there a max? (not documented at least)

    // ! granule dates may become too large a collection for multiple days,
    // ! an early optimization would be to set a higher key of UTC date (2019-05-02)
    // ! and add dates to each respective date
    if (isGranule) {
      const sortedDateCollection = self.granuleLayers[def.id][activeKey].sortedDates;
      const includedDates = [];
      self.granuleLayers[def.id][activeKey].order = sortedDateCollection;
      // console.log(layer)
      console.log(sortedDateCollection)
      if (sortedDateCollection.length > 1) {
        const layerGroupEntries = [];
        for (const granuleDate of sortedDateCollection) {
          // don't show future granule dates
          const isPastDate = new Date(granuleDate) < date;
          const dateInterval = Number(def.dateRanges[0].dateInterval);
          const startDateForGranuleDay = new Date(date.getTime() - (60000 * (dateInterval * GRANULE_COUNT)));
          const isGreaterThanTwentyPrevious = startDateForGranuleDay > new Date(granuleDate);

          // if granule for current date time
          if (granuleDate === date.toISOString().split('.')[0] + 'Z') {
            // check for layer in granuleCache
            const layerCacheKey = self.granuleLayers[def.id][activeKey].dates[granuleDate];
            const layerCache = self.granuleCache.getItem(layerCacheKey);
            if (layerCache) {
              layerGroupEntries.push(layerCache);
              includedDates.unshift(granuleDate);
            } else {
              layerGroupEntries.push(layer);
              includedDates.unshift(granuleDate);
            }
          } else {
            if (isPastDate && !isGreaterThanTwentyPrevious) {
              // add to layer group
              const layerCacheKey = self.granuleLayers[def.id][activeKey].dates[granuleDate];
              const layer = self.granuleCache.getItem(layerCacheKey);
              layerGroupEntries.push(layer);
              includedDates.unshift(granuleDate);
            }
          }
        }
        // console.log(layerGroupEntries, layerGroupEntries.length);
        layer = new OlLayerGroup({
          layers: layerGroupEntries
        });
        layer.set('granule', true);
        layer.set('layerId', `${def.id}-${activeKey}`);
      } else {
        // initial single layer in layer group
        layer = new OlLayerGroup({
          layers: [layer]
        });
        // TODO: need to set group for granules
        // name to include 1) def.id 2) active or activeB 3) granule specific prefix
        // rough example: 'granule-active-VIIRS_SNPP_CorrectedReflectance_BandsM3-I3-M11_Granule_v1_NRT'
        layer.set('granule', true);
        layer.set('layerId', `${def.id}-${activeKey}`);
      }
      self.granuleLayers[def.id][activeKey].order = includedDates;
      console.log(includedDates)
    }
    layer.setOpacity(def.opacity || 1.0);
    // TileLayer or LayerGroup
    // console.log(layer);
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
   * Create a new WMTS Layer
   * @method createLayerWMTS
   * @static
   * @param {object} def - Layer Specs
   * @param {object} options - Layer options
   * @returns {object} OpenLayers WMTS layer
   */
  var createLayerWMTS = function(def, options, day, state) {
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    var proj, source, matrixSet, matrixIds, urlParameters, date, extent, start;
    proj = state.proj.selected;
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

    date = options.date || state.date[activeDateStr];
    if (def.period === 'subdaily') {
      date = self.closestDate(def, options);
      date = new Date(date.getTime());
    }
    if (day && def.period !== 'subdaily') {
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
    if (isPaletteActive(def.id, options.group, state)) {
      var lookup = getPaletteLookup(def.id, options.group, state);
      sourceOptions.tileClass = lookupFactory(lookup, sourceOptions);
    }
    const sourceWMTS = new OlSourceWMTS(sourceOptions);
    sourceWMTS.on('tileloadend', function() {
      console.log('tileloadend');
      return 'tileloadend';
    });

    // ! conditionally set extent for tile here if granule and cmr data is available
    // const isGranule = !!(def.tags && def.tags.contains('granule'));
    // if (isGranule) {
    // extent = [-4194304, -4194304, -2216892, 4194304]
    // }

    return new OlLayerTile({
      preload: Infinity,
      extent: extent,
      // source: new OlSourceWMTS(sourceOptions)
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
  var createLayerVector = function(def, options, day, state) {
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
  var createLayerWMS = function(def, options, day, state) {
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
