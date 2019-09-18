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

export function mapLayerBuilder(models, config, cache, ui, store) {
  var self = {};

  self.init = function() {
    self.extentLayers = [];
    self.granuleLayers = {};
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
   * Create collection of granule TileLayers for entire day
   *
   * @method getIndexForSortedInsert
   * @static
   * @param {object} array - array of dates (already sorted)
   * @param {string} date - date string ISO format
   * @returns {number} index
   */
  const createGranuleDayLayers = (granuleDayTimes, def, proj, state, attributes) => {
    const granuleLayers = [];
    for (let i = 0; i < granuleDayTimes.length; i++) {
      const granuleDateISO = granuleDayTimes[i];
      const tempGroup = 'granule';
      // let group = options.group || state.compare.activeDateStr;
      const granuleISOKey = `${def.id}:${proj.id}:${granuleDateISO}::${tempGroup}`;
      self.granuleLayers[def.id].dates[granuleDateISO] = granuleISOKey;

      const granuleISODateType = new Date(granuleDateISO);
      const dateOption = { date: granuleISODateType };
      const layerPromise = new Promise((resolve) => {
        const createdLayer = createLayerWMTS(def, dateOption, null, state);
        // update attributes
        attributes.key = granuleISOKey;
        attributes.date = granuleISODateType;
        createdLayer.wv = attributes;
        // save to cache and push
        self.granuleCache.setItem(granuleISOKey, createdLayer);
        createdLayer.setVisible(false);
        resolve(createdLayer);
      });
      granuleLayers.push(layerPromise);
    }
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
    group = options.group || null;
    date = self.closestDate(def, options);
    key = self.layerKey(def, options, state);
    proj = state.proj.selected;
    const isGranule = !!(def.tags && def.tags.contains('granule'));
    let isInitGranuleLoad = false;
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
          if (self.granuleLayers[def.id] === undefined) {
            // flag initial load of granule
            // TODO: is this necessary for every day?
            isInitGranuleLoad = true;
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
            const startDateForGranuleDay = new Date(date.getTime() - (60000 * (dateInterval * 2)))
            // console.log(date, startDateForGranuleDay2)

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

            self.granuleLayers[def.id] = {
              sortedDates: granuleDayTimes,
              dates: {}
            };

            createdLayer = createGranuleDayLayers(granuleDayTimes, def, proj, state, attributes);
            // console.log(createdLayer)
          } else {
            if (self.granuleLayers[def.id].dates[dateISO] === undefined) {
              // add new dateISO to granule layer object and to sorted array by finding insert index O(n)
              const dateArray = [...self.granuleLayers[def.id].sortedDates];
              self.granuleLayers[def.id].sortedDates.splice(getIndexForSortedInsert(dateArray, dateISO), 0, dateISO);
              self.granuleLayers[def.id].dates[dateISO] = key;
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
      if (!isInitGranuleLoad) {
        layer.wv = attributes;
        if (isGranule) {
          self.granuleCache.setItem(key, layer);
        } else {
          cache.setItem(key, layer);
        }
        layer.setVisible(false);
      }
    }
    // ? assuming full day coverage at 6 minutes, 240 layer tiles per layer group day
    // ? is this acceptable? how to test max? is there a max? (not documented at least)

    // ! granule dates may become too large a collection for multiple days,
    // ! an early optimization would be to set a higher key of UTC date (2019-05-02)
    // ! and add dates to each respective date
    if (isGranule) {
      const sortedDateCollection = self.granuleLayers[def.id].sortedDates;
      // console.log(layer)
      // console.log(sortedDateCollection)
      if (sortedDateCollection.length > 1) {
        const layerGroupEntries = [];
        for (const granuleDate of sortedDateCollection) {
          // console.log(granuleDate)
          // don't show future granule dates
          const isPastDate = new Date(granuleDate) < date;
          const startDateForGranuleDay = new Date(date.getTime() - (60000 * (6 * 2)));
          const isGreaterThanTwentyPrevious = startDateForGranuleDay > new Date(granuleDate);
          // if granule for current date time
          if (granuleDate === date.toISOString().split('.')[0] + 'Z') {
            // check for layer in granuleCache
            const layerCacheKey = self.granuleLayers[def.id].dates[granuleDate];
            const layerCache = self.granuleCache.getItem(layerCacheKey);
            if (layerCache) {
              layerGroupEntries.push(layerCache);
            } else {
              layerGroupEntries.push(layer);
            }
          } else {
            if (isPastDate && !isGreaterThanTwentyPrevious) {
              // add to layer group
              const layerCacheKey = self.granuleLayers[def.id].dates[granuleDate];
              const layer = self.granuleCache.getItem(layerCacheKey);
              layerGroupEntries.push(layer);
            }
          }
        }
        console.log(layerGroupEntries.length)
        layer = new OlLayerGroup({
          layers: layerGroupEntries
        });
        layer.set('group', 'granule');
        layer.set('layerId', def.id);
      } else {
        // initial single layer in layer group
        layer = new OlLayerGroup({
          layers: [layer]
        });
        // TODO: need to set group for granules
        // name to include 1) def.id 2) active or activeB 3) granule specific prefix
        // rough example: 'granule-active-VIIRS_SNPP_CorrectedReflectance_BandsM3-I3-M11_Granule_v1_NRT'
        layer.set('group', 'granule');
        layer.set('layerId', def.id);
      }
    }
    layer.setOpacity(def.opacity || 1.0);
    // TileLayer or LayerGroup
    console.log(layer)
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
    var date;
    var dateArray = def.availableDates || [];
    if (options.date) {
      if (def.period !== 'subdaily') {
        date = util.clearTimeUTC(new Date(options.date.getTime()));
      } else {
        date = options.date;
        date = util.prevDateInDateRange(
          def,
          date,
          util.datesinDateRanges(def, date, true)
        );
      }
    } else {
      date = new Date(state.date[activeDateStr]);
      // If this not a subdaily layer, truncate the selected time to
      // UTC midnight
      if (def.period !== 'subdaily') {
        date = util.clearTimeUTC(date);
      } else {
        date = util.prevDateInDateRange(
          def,
          date,
          util.datesinDateRanges(def, date, true)
        );
      }
    }
    // Perform extensive checks before finding closest date
    if (
      !options.precache &&
      state.animation.playing === false &&
      state.date.selectedZoom !== 0 &&
      ((def.period === 'daily' && state.date.selectedZoom < 3) ||
        (def.period === 'monthly' && state.date.selectedZoom <= 2) ||
        (def.period === 'yearly' && state.date.selectedZoom === 1))
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
