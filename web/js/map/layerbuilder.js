/* eslint-disable import/no-duplicates */
import util from '../util/util';
import OlTileGridWMTS from 'ol/tilegrid/WMTS';
import OlSourceWMTS from 'ol/source/WMTS';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlLayerGroup from 'ol/layer/Group';
import OlLayerTile from 'ol/layer/Tile';
import OlTileGridTileGrid from 'ol/tilegrid/TileGrid';
import * as olProj from 'ol/proj';
import MVT from 'ol/format/MVT';
import LayerVectorTile from 'ol/layer/VectorTile';
import SourceVectorTile from 'ol/source/VectorTile';
import lodashCloneDeep from 'lodash/cloneDeep';
import lodashMerge from 'lodash/merge';
import lodashEach from 'lodash/each';
import { lookupFactory } from '../ol/lookupimagetile';
import { datesinDateRanges, prevDateInDateRange } from '../modules/layers/util';
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
  nearestInterval
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
   * Query CMR to get dates filtered by day_night_flag
   *
   * @method getDayNightFilteredDates
   * @static
   * @param {object} def - Layer specs
   * @param {object} selectedDate - current selected date (Note: may not return this date, but this date will be the max returned)
   * @param {number} dateInterval - interval for granules
   * @param {number} granuleCount - number of granules to add to collection
   * @param {string} filterTarget - day_night_flag to filter out
   * @returns {array} collection of granule objects with filtered granuleDayTimes to select from
      * @param {string} granuleDayTime - UTC date string
      * @param {array} polygon - CMR granule polygon geometry
   */
  const getDayNightFilteredDates = (def, selectedDate, dateInterval, granuleCount, filterTarget) => {
    const layerId = 'VJ102MOD';
    // TODO: add product layer ID to config
    // const layerId = def.product;
    // console.log(def)

    var ajaxOptions = {
      url: 'https://cmr.earthdata.nasa.gov/search/',
      headers: {
        'Client-Id': 'Worldview'
      },
      traditional: true,
      dataType: 'json',
      timeout: 45 * 1000
    };

    // granuleCount * 3 buffer for dates that will be filtered out - TODO: IS THIS ENOUGH?
    const startQueryDate = new Date(selectedDate.getTime() - (60000 * (dateInterval * granuleCount * 3))).toISOString();
    const endQueryDate = selectedDate.toISOString();

    const granuleDateList = [];
    // https://cmr.earthdata.nasa.gov/search/granules.json?shortName=VJ102MOD&temporal=2019-07-21T00:36:00.000Z,2019-07-24T23:36:00.000Z&pageSize=1000
    const query = 'https://cmr.earthdata.nasa.gov/search/granules.json?shortName=' + layerId + '&temporal=' + startQueryDate + ',' + endQueryDate + '&pageSize=1000';
    return fetch(query, ajaxOptions)
      .then(response => response.json())
      .then(data => {
        // console.log(data);
        data.feed.entry.map(entry => {
          const date = entry.time_start.split('.')[0] + 'Z';
          const polygons = entry.polygons[0][0].split(' ');
          // const matchesFilterFlag = entry.day_night_flag === filterTarget;

          // TODO: most recent CMR update has NIGHT granules that were previously DAY ?!?
          // if (!matchesFilterFlag) {
          // TODO: polygons for extent filtering
          // reorder polygons and create granuleDateList object
          // const polygons = [];
          // const polys = entry.polygons[0][0].split(' ');
          // for (let i = 0; i < polys.length; i += 2) {
          //   const tuple = [];
          //   tuple.unshift(polys[i]);
          //   tuple.unshift(polys[i + 1]);

          //   const coordinates = olProj.transform(tuple, 'EPSG:4326', 'EPSG:3031');
          //   polygons.push(coordinates);
          const polygonReorder = [];
          for (let i = 0; i < polygons.length; i += 2) {
            const tuple = [];
            tuple.unshift(polygons[i]);
            tuple.unshift(polygons[i + 1]);
            polygonReorder.push(tuple);
          }
          // }

          // console.log(polygonReorder)

          granuleDateList.push({
            date,
            polygons: polygonReorder
          });
          // }
        });
        return granuleDateList.slice(-granuleCount);
      })
      .catch(error => console.log(error));
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
    // console.log(granuleDayTimes)
    const granuleLayers = granuleDayTimes.map(granuleDateISO => {
      const group = attributes.group || state.compare.activeDateStr;
      const granuleISOKey = `${def.id}:${proj.id}:${granuleDateISO.date}::${group}`;

      // return cached layer if available
      const layerCache = cache.getItem(granuleISOKey);
      if (layerCache) {
        return layerCache;
      }

      self.granuleLayers[def.id][proj.id][group].dates[granuleDateISO.date] = granuleISOKey;
      const granuleISODateType = new Date(granuleDateISO.date);
      const dateOption = { date: granuleISODateType, polygons: granuleDateISO.polygons };
      const layerPromise = new Promise(resolve => {
        const createdLayer = createLayerWMTS(def, dateOption, null, state);
        // update attributes
        attributes.key = granuleISOKey;
        attributes.date = granuleISODateType;
        createdLayer.wv = attributes;
        // save to cache and push
        cache.setItem(granuleISOKey, createdLayer, getCacheOptions(def.period, new Date(granuleDateISO.date)));
        createdLayer.setVisible(false);
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
   * @param {array} granuleDayTimes - objects with granule date string and polygons
   * @param {object} proj - Layer projection
   * @param {boolean} isActive - is active group?
   * @param {boolean} activeKey - active or activeB group
   * @returns {array} collection of granuleDayTimes
   */
  const processGranuleLayer = (def, granuleDayTimes, proj, isActive, activeKey) => {
    // reduce granuleDayTimes object to get an array of date strings
    const granuleDayTimesDates = granuleDayTimes.reduce((granuleDates, granuleObject) => {
      const granuleDate = granuleObject.date;
      granuleDates.push(granuleDate);
      return granuleDates;
    }, []);

    // init group/projection specific granule day storage
    if (self.granuleLayers[def.id] === undefined || proj.id !== self.proj) {
      const activeGranuleDayTimes = isActive ? granuleDayTimesDates : [];
      const activeBGranuleDayTimes = !isActive ? granuleDayTimesDates : [];

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
      lodashEach(granuleDayTimesDates, (granuleDayTime) => {
        dateArray.splice(getIndexForSortedInsert(dateArray, granuleDayTime), 0, granuleDayTime);
      });
      self.granuleLayers[def.id][proj.id][activeKey].sortedDates = [...new Set(dateArray)];
    }
    return granuleDayTimesDates;
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
    const proj = state.proj.selected;

    let granuleCount;
    let updatedGranules;

    let geometry = granuleLayerParam && granuleLayerParam.geometry;
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    options = options || {};
    const group = options.group || 'active';

    console.log(state.layers.granuleLayers[group][proj.id][def.id]);
    const isActive = group === 'active';
    const activeKey = isActive ? 'active' : 'activeB';
    const { closestDate, nextDate, previousDate } = self.getRequestDates(def, options);
    // let date = self.closestDate(def, options);
    console.log(closestDate, nextDate, previousDate);
    let date = closestDate;
    const key = self.layerKey(def, options, state);

    let getFilteredDates;
    const isGranule = !!(def.tags && def.tags.contains('granule'));
    if (isGranule) {
      granuleCount = (granuleLayerParam && granuleLayerParam.granuleCount) || 20;
      if (granuleLayerParam && granuleLayerParam.granuleDates && granuleLayerParam.granuleDates.length) {
        if (granuleLayerParam.granuleDates.length !== granuleLayerParam.granuleCount) {
          updatedGranules = false;
        } else {
          updatedGranules = granuleLayerParam.granuleDates;
        }
      } else {
        updatedGranules = false;
      }

      if (!updatedGranules) {
        if (state.layers.granuleLayers[activeKey][proj.id][def.id]) {
          granuleCount = state.layers.granuleLayers[activeKey][proj.id][def.id].count;
        }
      }

      const dateInterval = Number(def.dateRanges[0].dateInterval);
      getFilteredDates = new Promise((resolve) => {
        resolve(getDayNightFilteredDates(null, date, dateInterval, granuleCount, 'NIGHT'));
      });
    } else {
      // resolve non granule layers
      getFilteredDates = new Promise((resolve) => {
        resolve([]);
      });
    }

    const createLayer = (filteredGranules) => {
      console.log(filteredGranules);
      return new Promise((resolve) => {
        let layer = cache.getItem(key);
        let granuleDayTimes = updatedGranules || [];
        console.log(layer, granuleDayTimes);
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
            group,
            nextDate,
            previousDate
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
            if (!updatedGranules) {
              granuleDayTimes = processGranuleLayer(def, filteredGranules, proj, isActive, activeKey);
              layer = createGranuleDayLayers(filteredGranules, def, proj, state, attributes);
              // console.log(granuleDayTimes)
              // console.log(filteredGranules)
            } else {
              // console.log(filteredGranules, granuleDayTimes)
              // const granuleDayTimesDates = filteredGranules.reduce((granuleDates, granuleObject) => {
              //   const granuleDate = granuleObject.date;
              //   granuleDates.push(granuleDate);
              //   return granuleDates;
              // }, []);

              layer = createGranuleDayLayers(filteredGranules, def, proj, state, attributes);
            }
          } else {
            layer.wv = attributes;
            cache.setItem(key, layer, cacheOptions);
            layer.setVisible(false);
          }
        }

        // build layer group
        if (isGranule) {
          const sortedDateCollection = updatedGranules
            ? updatedGranules.reverse()
            : granuleDayTimes;
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
          console.log(filteredGranules, includedDates, granuleCount, geometry);

          const granuleGeometry = filteredGranules.reduce((granuleDates, granuleObject) => {
            const granuleDate = granuleObject.date;
            const granulePolygon = granuleObject.polygons;
            granuleDates[granuleDate] = granulePolygon;
            return granuleDates;
          }, {});

          console.log(granuleGeometry);

          // includedDates - array of date strings
          // geometry - object of date: array of polygon coordinates
          store.dispatch({
            type: ADD_GRANULE_LAYER_DATES,
            dates: includedDates,
            id: def.id,
            activeKey: activeKey,
            proj: proj.id,
            count: granuleCount,
            geometry: granuleGeometry
          });
          self.proj = proj.id;
        }
        layer.setOpacity(def.opacity || 1.0);
        console.log(layer, def.id);
        resolve(layer); // TileLayer or LayerGroup
      });
    };

    return getFilteredDates
      .then(filteredGranules => {
        return createLayer(filteredGranules);
      }).then(layer => {
        return layer;
      }).catch(error => {
        console.log(error);
      });
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
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    const stateCurrentDate = new Date(state.date[activeDateStr]);
    const previousLayer = options.previousLayer || {};
    let date = options.date || stateCurrentDate;
    let previousDateFromRange;
    let previousLayerDate = previousLayer.previousDate;
    let nextLayerDate = previousLayer.nextDate;
    if (!state.animation.isPlaying) {
      // need to get previous available date to prevent unecessary requests
      let dateRange;
      if (previousLayer.previousDate && previousLayer.nextDate) {
        const dateTime = date.getTime();
        const previousDateTime = previousLayer.previousDate.getTime();
        const nextDateTime = previousLayer.nextDate.getTime();
        // if current date is outside previous and next dates avaiable, recheck range
        if (dateTime <= previousDateTime || dateTime >= nextDateTime) {
          dateRange = datesinDateRanges(def, date);
          const { next, previous } = prevDateInDateRange(def, date, dateRange);
          previousDateFromRange = previous;
          previousLayerDate = previous;
          nextLayerDate = next;
        } else {
          previousDateFromRange = previousLayer.previousDate;
        }
      } else {
        dateRange = datesinDateRanges(def, date);
        const { next, previous } = prevDateInDateRange(def, date, dateRange);
        previousDateFromRange = previous;
        previousLayerDate = previous;
        nextLayerDate = next;
      }
    }

    if (def.period === 'subdaily') {
      date = nearestInterval(def, date);
    } else {
      if (previousDateFromRange) {
        date = util.clearTimeUTC(previousDateFromRange);
      } else {
        date = options.date
          ? util.clearTimeUTC(new Date(date.getTime()))
          : util.clearTimeUTC(date);
      }
    }

    return { closestDate: date, previousDate: previousLayerDate, nextDate: nextLayerDate };
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
        util.roundTimeOneMinute(self.getRequestDates(def, options).closestDate)
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
    // "-70.980484 -77.975807 -60.606678 -146.4841 -67.016853 166.223099 -84.129013 18.650831 -70.980484 -77.975807"

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
    var date, urlParameters, gridExtent, source, matrixSet, matrixIds, start, layerExtent;
    const selectedProj = proj.selected;
    const activeDateStr = compare.isCompareA ? 'selected' : 'selectedB';
    const activeGroupStr = options.group ? options.group : compare.activeString;

    source = config.sources[def.source];
    gridExtent = selectedProj.maxExtent;
    layerExtent = gridExtent;
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
        layerExtent = [-250, -90, -180, 90];
        start = [-180, 90];
        gridExtent = [110, -90, 180, 90];
      } else {
        gridExtent = [-180, -90, -110, 90];
        layerExtent = [180, -90, 250, 90];
        start = [-180, 90];
      }
    }

    var layerName = def.layer || def.id;
    var tms = def.matrixSet;

    date = options.date || state.date[activeDateStr];
    if (day && def.wrapadjacentdays) {
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
    const wrapX = !!(day === 1 || day === -1);
    var sourceOptions = new SourceVectorTile({
      url: source.url + urlParameters,
      layer: layerName,
      day: day,
      format: new MVT(),
      matrixSet: tms,
      wrapX: wrapX,
      tileGrid: new OlTileGridTileGrid({
        extent: gridExtent,
        resolutions: matrixSet.resolutions,
        tileSize: matrixSet.tileSize,
        origin: start
      })
    });

    var layer = new LayerVectorTile({
      extent: layerExtent,
      source: sourceOptions,
      renderMode: wrapX ? 'image' : 'hybrid' // Todo: revert to just 'image' when styles are updated
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
    layer.wrap = day;
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
    if (day && def.wrapadjacentdays) {
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
