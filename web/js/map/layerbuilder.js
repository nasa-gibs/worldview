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
    self.proj = null;
    self.granuleLayers = {};
    self.queriedCMRDateRanges = {};
    self.granuleCMRData = {};
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
   * Add granule cmr data to granule cmr object with date as key
   *
   * @method addGranuleCMRDateData
   * @static
   * @param {data} CMR data
   * @param {id} layerId
   * @returns {Void}
   */
  const addGranuleCMRDateData = (data, id) => {
    // init id object if first time loading cmr data
    if (!self.granuleCMRData[id]) {
      self.granuleCMRData[id] = {};
    };
    data.feed.entry.map(entry => {
      const date = entry.time_start.split('.')[0] + 'Z';
      const polygons = entry.polygons[0][0].split(' ');
      const dayNight = entry.day_night_flag;

      const polygonReorder = [];
      for (let i = 0; i < polygons.length; i += 2) {
        const tuple = [];
        tuple.unshift(polygons[i]);
        tuple.unshift(polygons[i + 1]);
        polygonReorder.push(tuple);
      }

      self.granuleCMRData[id][date] = {
        date,
        polygons: polygonReorder,
        dayNight: dayNight
      };
    });
  };

  /**
   * Query CMR to get dates filtered by day_night_flag
   *
   * @method getQueriedGranuleDates
   * @static
   * @param {object} def - Layer specs
   * @param {object} selectedDate - current selected date (Note: may not return this date, but this date will be the max returned)
   * @returns {array} collection of granule objects with filtered granuleDayTimes to select from
      * @param {string} granuleDayTime - UTC date string
      * @param {array} polygon - CMR granule polygon geometry
   */
  const getQueriedGranuleDates = (def, selectedDate) => {
    // TODO: USE GRANULE LAYER ID
    const layerId = 'VJ102MOD';
    var ajaxOptions = {
      url: 'https://cmr.earthdata.nasa.gov/search/',
      headers: {
        'Client-Id': 'Worldview'
      },
      traditional: true,
      dataType: 'json',
      timeout: 45 * 1000
    };

    // note:
    // https://cmr.earthdata.nasa.gov/search/granules.json?shortName=VJ102MOD&temporal=2019-09-24T00:00:00.000Z,2019-09-25T00:00:00.000Z&pageSize=1000
    // 2019-09-24T00:00:00.000Z  to   2019-09-25T00:00:00.000Z
    // first date returned -  time_start: "2019-09-23T23:54:00.000Z",    time_end: "2019-09-24T00:00:00.000Z",
    // last date returned  -  time_start: "2019-09-25T00:00:00.000Z",    time_end: "2019-09-25T00:06:00.000Z",
    // seems to rely on START date relies on matching time_end   and   END date relies on matching time_start?
    // curious

    // check if selectedDate is before or after 12 to determine date request range
    const selectedDateTemp = new Date(selectedDate);
    const isSelectedDateAfterNoon = selectedDateTemp.getUTCHours() > 12;

    const zeroedSelectedDate = util.clearTimeUTC(selectedDateTemp);

    const dayBeforeSelectedDate = util.dateAdd(zeroedSelectedDate, 'day', -1);
    const dayAfterSelectedDate = util.dateAdd(zeroedSelectedDate, 'day', 1);
    const twoDayAfterSelectedDate = util.dateAdd(zeroedSelectedDate, 'day', 2);

    const startQueryDate = isSelectedDateAfterNoon
      ? zeroedSelectedDate
      : dayBeforeSelectedDate;
    const endQueryDate = isSelectedDateAfterNoon
      ? twoDayAfterSelectedDate
      : dayAfterSelectedDate;

    const queryPrefix = 'https://cmr.earthdata.nasa.gov/search/granules.json?shortName=';
    const queryDateRange = startQueryDate.toISOString() + ',' + endQueryDate.toISOString();
    const query = queryPrefix + layerId + '&temporal=' + queryDateRange + '&pageSize=1000';

    // IF QUERY DATE RANGE NOT PREVIOUSLY REQUESTED, FETCH, PROCESS, AND ADD TO CMR QUERY OBJECT
    if (!self.queriedCMRDateRanges[queryDateRange]) {
      self.queriedCMRDateRanges[queryDateRange] = true;
      return fetch(query, ajaxOptions)
        .then(response => response.json())
        .then(data => {
          addGranuleCMRDateData(data, layerId);
          return processGranuleDateObject(layerId, selectedDate, startQueryDate, endQueryDate);
        })
        .catch(error => console.log(error));
    } else {
      // USE PREVIOUSLY QUERIED CMR GRANULE DATES
      return processGranuleDateObject(layerId, selectedDate, startQueryDate, endQueryDate);
    }
  };

  const processGranuleDateObject = (layerId, selectedDate, startQueryDate, endQueryDate) => {
    const selected = new Date(selectedDate).toISOString().split('.')[0] + 'Z';
    // const queryStart = new Date(startQueryDate).toISOString().split('.')[0] + 'Z';
    // const queryEnd = new Date(endQueryDate);

    const granuleDates = self.granuleCMRData[layerId];
    const granuleDateKeys = granuleDates
      ? Object.keys(granuleDates)
      : [];

    // TODO: hitquerystartdate to limit larger arrays when many dates are in cache object
    // const hitQueryStartDate = false;
    let hitSelectedDate = false;
    const reducedGranuleDates = granuleDateKeys.reduce((acc, item) => {
      // if (item === queryStart) {
      //   hitQueryStartDate = true;
      // }
      // if (hitQueryStartDate && !hitSelectedDate) {
      if (!hitSelectedDate) {
        const granuleObj = {
          date: item,
          polygons: granuleDates[item].polygons,
          dayNight: granuleDates[item].dayNight
        };
        acc.push(granuleObj);
      }
      // selected date will be last possible date in reuturned collection
      if (item === selected) {
        hitSelectedDate = true;
      }
      return acc;
    }, []);

    return reducedGranuleDates;
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
    const { period, id } = def;
    const granuleLayers = granuleDayTimes.map(granuleDateISO => {
      const group = attributes.group || state.compare.activeDateStr;
      const { date, polygons } = granuleDateISO;
      const granuleISOKey = `${id}:${proj.id}:${date}::${group}`;

      // return cached layer if available
      const layerCache = cache.getItem(granuleISOKey);
      if (layerCache) {
        return layerCache;
      }

      self.granuleLayers[id][group].dates[date] = granuleISOKey;
      const granuleISODateObject = new Date(date);
      const dateOption = { date: granuleISODateObject, polygons: polygons };
      const layerPromise = new Promise(resolve => {
        const createdLayer = createLayerWMTS(def, dateOption, null, state);
        // update attributes
        attributes.key = granuleISOKey;
        attributes.date = granuleISODateObject;
        createdLayer.wv = attributes;

        // save to cache and push
        cache.setItem(granuleISOKey, createdLayer, getCacheOptions(period, granuleISODateObject));
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
   * @returns {Void}
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

      self.granuleLayers[def.id] = {
        active: {
          sortedDates: activeGranuleDayTimes || [],
          dates: {}
        },
        activeB: {
          sortedDates: activeBGranuleDayTimes || [],
          dates: {}
        }
      };
    } else {
      // add sorted dates to granule layer store
      let dateArray = [...self.granuleLayers[def.id][activeKey].sortedDates];
      dateArray = [...new Set(dateArray)];
      lodashEach(granuleDayTimesDates, (granuleDayTime) => {
        dateArray.splice(getIndexForSortedInsert(dateArray, granuleDayTime), 0, granuleDayTime);
      });
      // ! IS THERE ARE REASONABLE LIMIT ON SORTEDDATES? THEORETICALLY CAN GET TOO LARGE AND SLOW DOWN
      self.granuleLayers[def.id][activeKey].sortedDates = [...new Set(dateArray)];
    }
  };

  /**
   * Filter date objects by day_night_flag
   *
   * @method filterGranuleDates
   * @static
   * @param {Array} granuleDates
   * @param {string} filterTarget - day_night_flag to filter out
   * @param {number} granuleCount - number of granules to add to collection
   * @returns {array} collection of granule objects with filtered granuleDayTimes
   */
  const filterGranuleDates = (granuleDates, filterTarget, granuleCount) => {
    // granuleDates is full array of granule date objects
    const filteredDates = [];
    for (let i = granuleDates.length - 1; i >= 0; i--) {
      const item = granuleDates[i];
      const { dayNight } = item;
      const areGranulesStillNeeded = filteredDates.length < granuleCount;
      if (areGranulesStillNeeded) {
        if (dayNight === filterTarget) {
          filteredDates.unshift(item);
        }
      }
    }
    return filteredDates;
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
    const dayNightFilter = 'DAY'; // 'DAY' 'NIGHT' 'BOTH'

    let granuleCount;
    let updatedGranules;

    let geometry = granuleLayerParam && granuleLayerParam.geometry;
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    options = options || {};
    const group = options.group || 'active';
    const isActive = group === 'active';
    const activeKey = isActive ? 'active' : 'activeB';
    const { closestDate, nextDate, previousDate } = self.getRequestDates(def, options);
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
        if (state.layers.granuleLayers[activeKey][def.id]) {
          granuleCount = state.layers.granuleLayers[activeKey][def.id].count;
        }
      }

      // get granule dates
      getFilteredDates = new Promise((resolve) => {
        resolve(getQueriedGranuleDates(null, date));
      }).then(availableGranuleDates => {
        const filteredOutDates = filterGranuleDates(availableGranuleDates, dayNightFilter, granuleCount);
        return filteredOutDates;
      });
    } else {
      // resolve non granule layers
      getFilteredDates = new Promise((resolve) => {
        resolve([]);
      });
    }

    const createLayer = (filteredGranules, updatedGranules) => {
      return new Promise((resolve) => {
        let layer = cache.getItem(key);
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
              processGranuleLayer(def, filteredGranules, proj, isActive, activeKey);
            }
            layer = createGranuleDayLayers(filteredGranules, def, proj, state, attributes);
          } else {
            layer.wv = attributes;
            cache.setItem(key, layer, cacheOptions);
            layer.setVisible(false);
          }
        }

        // build layer group
        if (isGranule) {
          const filteredGranulesCollection = filteredGranules.reduce((granuleDates, granuleObject) => {
            const granuleDate = granuleObject.date;
            granuleDates.push(granuleDate);
            return granuleDates;
          }, []);

          let sortedDateCollection;
          if (updatedGranules) {
            sortedDateCollection = updatedGranules;
          } else {
            sortedDateCollection = filteredGranulesCollection;
          }

          const includedDates = [];
          const layerGroupEntries = [];
          for (const granuleDate of sortedDateCollection) {
            // check for layer in granuleCache
            const layerCacheKey = self.granuleLayers[def.id][activeKey].dates[granuleDate];
            const layerCache = cache.getItem(layerCacheKey);
            if (layerCache) {
              layerGroupEntries.push(layerCache);
            } else {
              console.log(granuleDate, 'NOT IN LAYER CACHE');
              layerGroupEntries.push(layer);
            }
            includedDates.unshift(granuleDate);
          }

          // create new layergroup with granules
          layer = new OlLayerGroup({
            layers: layerGroupEntries
          });
          layer.set('granule', true);
          layer.set('layerId', `${def.id}-${activeKey}`);

          // make available for layer settings
          const storedLayer = state.layers.granuleLayers[activeKey][def.id];
          if (storedLayer && storedLayer.geometry) {
            geometry = geometry || storedLayer.geometry;
          }

          const granuleGeometry = filteredGranules.reduce((granuleDates, granuleObject) => {
            const granuleDate = granuleObject.date;
            const granulePolygon = granuleObject.polygons;
            granuleDates[granuleDate] = granulePolygon;
            return granuleDates;
          }, {});

          // includedDates - array of date strings
          // geometry - object of date: array of polygon coordinates
          store.dispatch({
            type: ADD_GRANULE_LAYER_DATES,
            dates: includedDates.reverse(),
            id: def.id,
            activeKey: activeKey,
            count: granuleCount,
            geometry: granuleGeometry
          });
          self.proj = proj.id;
        }
        layer.setOpacity(def.opacity || 1.0);
        resolve(layer); // TileLayer or LayerGroup
      });
    };

    return getFilteredDates
      .then(filteredGranules => {
        return createLayer(filteredGranules, updatedGranules);
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
    } else if (previousDateFromRange) {
      date = previousDateFromRange;
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
