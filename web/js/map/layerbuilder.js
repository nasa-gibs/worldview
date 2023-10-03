/* eslint-disable import/no-duplicates */
/* eslint-disable no-multi-assign */
import OlTileGridWMTS from 'ol/tilegrid/WMTS';
import OlSourceWMTS from 'ol/source/WMTS';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceXYZ from 'ol/source/XYZ';
import OlLayerGroup from 'ol/layer/Group';
import OlLayerTile from 'ol/layer/Tile';
import TileState from 'ol/TileState';
import { get } from 'ol/proj';
import OlTileGridTileGrid from 'ol/tilegrid/TileGrid';
import MVT from 'ol/format/MVT';

import LayerVectorTile from 'ol/layer/VectorTile';
import SourceVectorTile from 'ol/source/VectorTile';
import WebGLPointsLayer from 'ol/layer/WebGLPoints';
import lodashCloneDeep from 'lodash/cloneDeep';
import lodashMerge from 'lodash/merge';
import lodashEach from 'lodash/each';
import lodashGet from 'lodash/get';
import { Style, RegularShape } from 'ol/style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import * as dat from 'dat.gui';
import axios from 'axios';
import qs from 'qs';
import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import { throttle } from '../vectorflow/util';
import WindTile from '../vectorflow/renderer.js';
import { colorGradient } from '../vectorflow/util';
import util from '../util/util';
import lookupFactory from '../ol/lookupimagetile';
import granuleLayerBuilder from './granule/granule-layer-builder';
import { getGranuleTileLayerExtent } from './granule/util';
import {
  createVectorUrl,
  getGeographicResolutionWMS,
  mergeBreakpointLayerAttributes,
} from './util';
import { datesInDateRanges, prevDateInDateRange } from '../modules/layers/util';
import { updateLayerDateCollection, updateLayerCollection } from '../modules/layers/actions';
import { getCollections } from '../modules/layers/selectors';
import { getSelectedDate } from '../modules/date/selectors';
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
import { nearestInterval } from '../modules/layers/util';
import {
  LEFT_WING_EXTENT, RIGHT_WING_EXTENT, LEFT_WING_ORIGIN, RIGHT_WING_ORIGIN, CENTER_MAP_ORIGIN,
} from '../modules/map/constants';

export default function mapLayerBuilder(config, cache, store) {
  const { getGranuleLayer } = granuleLayerBuilder(cache, store, createLayerWMTS);
  const renderParticleFlow = true;
  const vectorLayers = ['ASCAT_Ocean_Surface_Wind_Speed', 'MISR_Cloud_Motion_Vector', 'OSCAR_Sea_Surface_Currents_Final'];

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
    layer.wv = attributes;
    if (!wrapLayer) {
      return layer;
    }
    const layerNext = createLayerFunc(def, options, 1, state, attributes);
    const layerPrior = createLayerFunc(def, options, -1, state, attributes);

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

  const updateStoreCollectionDates = (id, version, type, date) => {
    store.dispatch(updateLayerDateCollection({
      id,
      date,
      collection: {
        version,
        type,
      },
    }));
  };

  const updateStoreCollections = (id) => {
    store.dispatch(updateLayerCollection(id));
  };

  /**
   * We define our own tile loading function in order to capture custom header values
   *
   * @param {*} tile
   * @param {*} src
   */
  const tileLoadFunction = (layer, layerDate) => async function(tile, src) {
    const state = store.getState();

    const date = layerDate.toISOString().split('T')[0];

    const updateCollections = (headers) => {
      const actualId = headers.get('layer-identifier-actual');
      if (!actualId) return;

      const { layers } = state;
      const collectionCheck = getCollections(layers, date, layer);
      // check if the collection & dates already exist for layer so we don't dispatch actions
      if (!collectionCheck) {
        updateStoreCollections(layer.id);
        const parts = actualId.split('_');
        const version = parts[parts.length - 2];
        const type = parts[parts.length - 1];
        updateStoreCollectionDates(layer.id, version, type, date);
      }
    };

    try {
      const response = await fetch(src);
      const data = await response.blob();
      updateCollections(response.headers);

      if (data !== undefined) {
        tile.getImage().src = URL.createObjectURL(data);
      } else {
        tile.setState(TileState.ERROR);
      }
    } catch (e) {
      tile.setState(TileState.ERROR);
    }
  };

  /**
   * Create a new OpenLayers Layer
   * @function layerKey
   * @static
   * @param {Object} def - Layer properties
   * @param {number} options - Layer options
   * @param {boolean} precache
   * @returns {object} layer key Object
   */
  const layerKey = (def, options, state) => {
    const { compare } = state;
    let date;
    const layerId = def.id;
    const projId = state.proj.id;
    let style = '';
    const activeGroupStr = options.group ? options.group : compare.activeString;

    // Don't key by time if this is a static layer
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
   * Returns the closest date, from the layer's array of availableDates
   *
   * @param  {object} def     Layer definition
   * @param  {object} options Layer options
   * @return {object}         Closest date
   */
  const getRequestDates = function(def, options) {
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
      const { dateRanges, ongoing, period } = def;
      let dateRange;
      if (!ongoing) {
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
   * @param {boolean} precache // This does not align with the parameters of the layerKey function
   * @returns {object} layer key Object
   */
  //   const layerKey = (def, options, state) => {
  //     const { compare } = state;
  //     let date;
  //     const layerId = def.id;
  //     const projId = state.proj.id;
  //     let style = '';
  //     const activeGroupStr = options.group ? options.group : compare.activeString;
  // =======
  const createStaticImageLayer = async() => {
    const state = store.getState();
    const { proj: { selected: { id, crs, maxExtent } } } = state;
    const projectionURL = `images/map/bluemarble-${id}.jpg`;

    const layer = new ImageLayer({
      source: new Static({
        url: projectionURL,
        projection: crs,
        imageExtent: maxExtent,
      }),
    });

    return layer;
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
  const createLayer = async (def, options = {}) => {
    const state = store.getState();
    const { compare: { activeString } } = state;
    const { ui: { isKioskModeActive, displayStaticMap } } = state;

    options.group = options.group || activeString;

    // if gibs/dns failure, display static image layer
    if (displayStaticMap && isKioskModeActive) {
      const layer = await createStaticImageLayer();
      return layer;
    }

    const {
      closestDate,
      nextDate,
      previousDate,
    } = getRequestDates(def, options);
    const date = closestDate;
    if (date) {
      options.date = date;
    }
    const dateOptions = { date, nextDate, previousDate };
    const key = layerKey(def, options, state);
    // eslint-disable-next-line no-use-before-define
    const layer = await createLayerWrapper(def, key, options, dateOptions);

    return layer;
  };

  /**
   * Determine the extent based on TileMatrixSetLimits defined in GetCapabilities response
   * @param {*} matrixSet - from GetCapabilities
   * @param {*} matrixSetLimits - from GetCapabilities
   * @param {*} day
   * @param {*} proj - current projection
   */
  const calcExtentsFromLimits = (matrixSet, matrixSetLimits, day, proj) => {
    let extent;
    let origin;

    switch (day) {
      case 1:
        extent = LEFT_WING_EXTENT;
        origin = LEFT_WING_ORIGIN;
        break;
      case -1:
        extent = RIGHT_WING_EXTENT;
        origin = RIGHT_WING_ORIGIN;
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
   * @param {number/null} day
   * @param {object} state
   * @returns {object} OpenLayers WMTS layer
   */
  function createLayerWMTS (def, options, day, state) {
    const { proj } = state;
    const {
      id, layer, format, matrixIds, matrixSet, matrixSetLimits, period, source, style, wrapadjacentdays, type,
    } = def;
    const configSource = config.sources[source];
    const { date, polygon, shifted } = options;
    const isSubdaily = period === 'subdaily';
    const isGranule = type === 'granule';

    if (!source) {
      throw new Error(`${id}: Invalid source: ${source}`);
    }
    const configMatrixSet = configSource.matrixSets[matrixSet];
    if (!configMatrixSet) {
      throw new Error(`${id}: Undefined matrix set: ${matrixSet}`);
    }

    let layerDate = date || getSelectedDate(state);
    if (isSubdaily && !layerDate) {
      layerDate = getRequestDates(def, options).closestDate;
      layerDate = new Date(layerDate.getTime());
    }
    if (day && wrapadjacentdays && !isSubdaily) {
      layerDate = util.dateAdd(layerDate, 'day', day);
    }

    const { tileMatrices, resolutions, tileSize } = configMatrixSet;
    const { origin, extent } = calcExtentsFromLimits(configMatrixSet, matrixSetLimits, day, proj.selected);
    const sizes = !tileMatrices ? [] : tileMatrices.map(({ matrixWidth, matrixHeight }) => [matrixWidth, matrixHeight]);

    // Also need to shift this if granule is shifted
    const tileGridOptions = {
      origin: shifted ? RIGHT_WING_ORIGIN : origin,
      extent: shifted ? RIGHT_WING_EXTENT : extent,
      sizes,
      resolutions,
      matrixIds: matrixIds || resolutions.map((set, index) => index),
      tileSize: tileSize[0],
    };

    const urlParameters = `?TIME=${util.toISOStringSeconds(util.roundTimeOneMinute(layerDate))}`;
    const sourceURL = def.sourceOverride || configSource.url;
    const sourceOptions = {
      url: sourceURL + urlParameters,
      layer: layer || id,
      cacheSize: 4096,
      crossOrigin: 'anonymous',
      format,
      transition: isGranule ? 350 : 0,
      matrixSet: configMatrixSet.id,
      tileGrid: new OlTileGridWMTS(tileGridOptions),
      wrapX: false,
      style: typeof style === 'undefined' ? 'default' : style,
      tileLoadFunction: tileLoadFunction(def, layerDate),
    };
    if (isPaletteActive(id, options.group, state)) {
      const lookup = getPaletteLookup(id, options.group, state);
      sourceOptions.tileClass = lookupFactory(lookup, sourceOptions);
    }
    const tileSource = new OlSourceWMTS(sourceOptions);

    const granuleExtent = polygon && getGranuleTileLayerExtent(polygon, extent);

    return new OlLayerTile({
      extent: polygon ? granuleExtent : extent,
      preload: 0,
      source: tileSource,
    });
  }

  /**
   * Create a WindTile
   *
   * @method createWindtile
   * @static
   * @param {object} tilesource
   * @param {object} selected - OL map
   * @param {object} layer
   * @returns {object} OpenLayers WMS layer -- INCORRECT~!
   */
  const createWindtile = function(tileSource, selected, layer) {
    // Vars to generate the animation & support the mini-GUI to play with the animation settings
    let i = 0;
    let moving = false;
    let initiatedGUI = false;
    let currentFeatures;
    let zoom;
    let extent;
    let options;
    let windRender;
    const gui = new dat.GUI();

    tileSource.on('tileloadstart', (e) => {
      i += 1;
    });
    tileSource.on('tileloadend', (e) => {
      if (!windRender) {
        const mapSize = selected.getSize();
        const tileOptions = {
          olmap: selected,
          uMin: -76.57695007324219,
          uMax: 44.30181884765625,
          vMin: -76.57695007324219,
          vMax: 44.30181884765625,
          width: mapSize[0],
          height: mapSize[1],
        };
        windRender = new WindTile(tileOptions);
      }

      i -= 1;
      if (i === 1 && !windRender.stopped && windRender) {
        windRender.stop();
      }
      if (i === 0 && !moving && windRender) {
        if (!initiatedGUI) {
          setTimeout(() => { updateRenderer(); }, 1);
        } else {
          updateRendererThrottled();
        }
      }
    });

    // These listen for changes to position/zoom/other properties & re-render the animation canvas to compensate
    selected.getView().on('change:center', () => {
      if (windRender !== undefined) {
        windRender.stop();
        moving = true;
      }
    });
    selected.getView().on('propertychange', (e) => {
      if (e.key === 'resolution' && windRender) {
        windRender.stop();
        moving = true;
      }
    });

    const updateRenderer = () => {
      const view = selected.getView();
      const mapSize = selected.getSize();
      extent = view.calculateExtent(mapSize);
      currentFeatures = layer.getSource().getFeaturesInExtent(extent);
      zoom = view.getZoom();
      options = {
        uMin: -55.806217193603516,
        uMax: 45.42329406738281,
        vMin: -5.684286117553711,
        vMax: 44.30181884765625,
        width: mapSize[0],
        height: mapSize[1],
        ts: Date.now(),
      };
      windRender.updateData(currentFeatures, extent, zoom, options);
      if (!initiatedGUI) initGUI();
    };

    const updateRendererThrottled = throttle(updateRenderer, 150);

    // when the user stops moving the map, we need to re-render the windtiles in the new position
    selected.on('moveend', (e) => {
      moving = false;
      if (i === 0 && windRender) updateRendererThrottled();
    });

    const updateTexture = function() {
      windRender.updateData(currentFeatures, extent, zoom, options);
    };
    const initGUI = function() {
      const { wind } = windRender;
      gui.add(wind, 'numParticles', 144, 248832).setValue(11025);
      gui.add(wind, 'fadeOpacity', 0.96, 0.999).setValue(0.996).step(0.001).updateDisplay();
      gui.add(wind, 'speedFactor', 0.05, 1.0).setValue(0.25);
      gui.add(wind, 'dropRate', 0, 0.1).setValue(0.003);
      gui.add(wind, 'dropRateBump', 0, 0.2).setValue(0.01);
      gui.add(windRender, 'dataGridWidth', 18, 360).setValue(200).step(2).onChange(updateTexture);
      initiatedGUI = true;
      updateRenderer();
    };
  };

  const animateVectors = function(layerName, tileSource, selected, layer) {
    const animationAllowed = vectorLayers.indexOf(layerName) > -1;

    if (animationAllowed && renderParticleFlow) {
      const canvasElem = document.querySelectorAll('canvas');
      if (canvasElem.length > 0) {
        // Add z-index property to existing OL canvas. This ensures that the visualization is on the top layer.
        // The z-index should be applied with CSS on map generation to avoid this code entirely.
        canvasElem[0].style.zIndex = -1;
      }
      createWindtile(tileSource, selected, layer);
    }
  };


  /** Create a new Vector Layer
  const { getGranuleLayer } = granuleLayerBuilder(cache, store, createLayerWMTS);

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
        extent = LEFT_WING_EXTENT;
        start = LEFT_WING_ORIGIN;
      } else {
        extent = RIGHT_WING_EXTENT;
        start = RIGHT_WING_ORIGIN;
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
    const tileSource = new OlSourceTileWMS(sourceOptions);

    const layer = new OlLayerTile({
      preload: 0,
      extent,
      ...!!resolutionBreakPoint && { minResolution: resolutionBreakPoint },
      source: tileSource,
    });
    layer.isWMS = true;
    return layer;
  };

  /**
    *
    * @param {object} def - Layer Specs
    * @param {object} options - Layer options
    * @param {number} day
    * @param {object} state
    * @param {object} attributes
    * @returns {object} OpenLayers Vector layer
    */
  const createLayerVector = function(def, layeroptions, day, state, attributes) {
    const { proj, animation, map: { ui: { selected } } } = state;
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


    // These checks are for the misr_cloud_motion_vector layer
    // this is just to visualize the dataset from the demo instance so we can compare the demo to WV
    if (!source.matrixSets) {
      source.matrixSets = {
        '2km': {
          id: '2km',
          maxResolution: 0.5625,
          resolutions: [
            0.5625,
            0.28125,
            0.140625,
            0.0703125,
            0.03515625,
            0.017578125,
          ],
          tileSize: [
            512,
            512,
          ],
          tileMatrices: [
            {
              matrixWidth: 2,
              matrixHeight: 1,
            },
            {
              matrixWidth: 3,
              matrixHeight: 2,
            },
            {
              matrixWidth: 5,
              matrixHeight: 3,
            },
            {
              matrixWidth: 10,
              matrixHeight: 5,
            },
            {
              matrixWidth: 20,
              matrixHeight: 10,
            },
            {
              matrixWidth: 40,
              matrixHeight: 20,
            },
          ],
        },
      };
    }

    if (!def.matrixSet) {
      def.matrixSet = '2km';
    }
    // end of misr_cloud_motion_vector code

    const matrixSet = source.matrixSets[def.matrixSet];
    if (!matrixSet) {
      throw new Error(`${def.id}: Undefined matrix set: ${def.matrixSet}`);
    }

    // ASCAT does not have def.matrixIds data
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
        layerExtent = LEFT_WING_EXTENT;
        start = CENTER_MAP_ORIGIN;
        gridExtent = [110, -90, 180, 90];
      } else {
        gridExtent = [-180, -90, -110, 90];
        layerExtent = RIGHT_WING_EXTENT;
        start = CENTER_MAP_ORIGIN;
      }
    }

    let layerName = def.layer || def.id;
    if (layerName === 'OSCAR_Sea_Surface_Currents_Final') {
      layerName = 'OSCAR_Sea_Surface_Currents';
    }
    const tileMatrixSet = def.matrixSet;
    date = layeroptions.date || getSelectedDate(state);

    if (day && def.wrapadjacentdays) date = util.dateAdd(date, 'day', day);
    let urlParameters = createVectorUrl(date, layerName, tileMatrixSet);
    if (layerName === 'OSCAR_Sea_Surface_Currents') {
      urlParameters = urlParameters.replace('OSCAR_Sea_Surface_Currents', 'OSCAR_Sea_Surface_Currents_Final');
    }
    const wrapX = !!(day === 1 || day === -1);
    const breakPointLayerDef = def.breakPointLayer;
    const breakPointResolution = lodashGet(def, `breakPointLayer.projections.${proj.id}.resolutionBreakPoint`);
    const breakPointType = lodashGet(def, 'breakPointLayer.breakPointType');
    const isMaxBreakPoint = breakPointType === 'max';
    const isMinBreakPoint = breakPointType === 'min';

    const tileSource = new SourceVectorTile({
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

    // Attempting to create a layer utilizing WebGL to improve performance
    const webGLlayer = new WebGLPointsLayer({
      source: tileSource,
      style: {
        symbol: {
          symbolType: 'triangle',
          size: 18,
          color: 'green',
        },
      },
      // extent: layerExtent,
      // renderMode: 'vector',
      // preload: 0,
      // ...isMaxBreakPoint && { maxResolution: breakPointResolution },
      // ...isMinBreakPoint && { minResolution: breakPointResolution },
      // style (feature, resolution) {
      //   return new Style({
      //     image: new RegularShape({
      //       size: 2,
      //     //       points: 2,
      //     //       radius: 10,
      //     //       stroke: new Stroke({
      //     //         width: 2,
      //     //         color: 'red',
      //     //       }),
      //     //       angle: 53,
      //     }),
      //   });
      // },
    });

    let counter = 0;

    const layer = new LayerVectorTile({
      extent: layerExtent,
      source: tileSource,
      renderMode: 'vector',
      preload: 0,
      ...isMaxBreakPoint && { maxResolution: breakPointResolution },
      ...isMinBreakPoint && { minResolution: breakPointResolution },
      style (feature, resolution) {
        counter += 1;

        // Due to the large number of points to render for OSCAR, I am only rendering every 25th feature
        if (counter % 25 !== 0) return [];

        let arrowSizeMultiplier;
        const radianDirection = feature.get('direction'); // was "dir"
        const magnitude = feature.get('magnitude'); // was "speed"
        const arrowColor = colorGradient(magnitude);

        // Adjust color & arrow length based on magnitude
        if (magnitude < 0.08) {
          arrowSizeMultiplier = 1;
        } else if (magnitude < 0.17) {
          arrowSizeMultiplier = 1.25;
        } else {
          arrowSizeMultiplier = 1.5;
        }

        // https://openlayers.org/en/latest/examples/wind-arrows.html
        const shaft = new RegularShape({
          points: 2,
          radius: 5,
          stroke: new Stroke({
            width: 2,
            color: arrowColor,
          }),
          rotateWithView: true,
        });

        const head = new RegularShape({
          points: 3,
          radius: 8,
          fill: new Fill({
            color: arrowColor,
          }),
          rotateWithView: true,
        });

        const styles = [new Style({ image: shaft }), new Style({ image: head })];
        const angle = ((radianDirection - 180) * Math.PI) / 180;
        const scale = (magnitude + 1) * arrowSizeMultiplier;
        shaft.setScale([1, scale]);
        shaft.setRotation(angle);
        head.setDisplacement([
          0,
          head.getRadius() / 2 + shaft.getRadius() * scale,
        ]);
        head.setRotation(angle);
        return styles;
      },
    });

    applyStyle(def, layer, state, layeroptions);
    console.log(layer);
    layer.wrap = day;
    layer.wv = attributes;
    layer.isVector = true;

    const animationAllowed = vectorLayers.indexOf(layerName) > -1;
    if (animationAllowed && renderParticleFlow) {
      animateVectors(layerName, tileSource, selected, layer);
    }

    if (breakPointLayerDef && !animationIsPlaying) {
      const newDef = { ...def, ...breakPointLayerDef };
      const wmsLayer = createLayerWMS(newDef, layeroptions, day, state);
      const layerGroup = new OlLayerGroup({
        layers: [layer, wmsLayer],
      });
      wmsLayer.wv = attributes;
      return layerGroup;
    }

    if (breakPointResolution && animationIsPlaying) {
      delete breakPointLayerDef.projections[proj.id].resolutionBreakPoint;
      const newDef = { ...def, ...breakPointLayerDef };
      const wmsLayer = createLayerWMS(newDef, layeroptions, day, state);
      wmsLayer.wv = attributes;
      return wmsLayer;
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
   * @param {number} day
   * @param {object} state
   * @returns {object} OpenLayers WMS layer
   */
  //   const createLayerWMS = function(def, options, day, state) {
  //     const { proj } = state;
  //     const selectedProj = proj.selected;
  //     let urlParameters;
  //     let date;
  //     let extent;
  //     let start;
  //     let res;
  // =======
  const registerSearch = async (def, options, state) => {
    const { date } = state;
    let requestDate;
    if (options.group === 'activeB') {
      requestDate = date.selectedB;
    } else {
      requestDate = date.selected;
    }

    const formattedDate = util.toISOStringSeconds(requestDate).slice(0, 10);
    const layerID = def.id;
    const BASE_URL = 'https://d1nzvsko7rbono.cloudfront.net';
    const {
      r,
      g,
      b,
      expression,
      assets = [],
    } = def.bandCombo;
    const bandCombo = [r, g, b, ...assets].filter((band) => band);

    const landsatLayers = [
      'HLS_Customizable_Landsat',
      'HLS_False_Color_Landsat',
      'HLS_False_Color_Urban_Landsat',
      'HLS_False_Color_Vegetation_Landsat',
      'HLS_Shortwave_Infrared_Landsat',
      'HLS_NDVI_Landsat',
      'HLS_NDWI_Landsat',
      'HLS_NDSI_Landsat',
      'HLS_Moisture_Index_Landsat',
    ];

    const collectionID = landsatLayers.includes(layerID) ? 'HLSL30' : 'HLSS30';

    const temporalRange = [`${formattedDate}T00:00:00Z`, `${formattedDate}T23:59:59Z`];

    const collectionsFilter = {
      op: '=',
      args: [{ property: 'collection' }, collectionID],
    };

    const temporalFilter = {
      op: 't_intersects',
      args: [{ property: 'datetime' }, { interval: temporalRange }],
    };

    const searchBody = {
      'filter-lang': 'cql2-json',
      context: 'on',
      filter: {
        op: 'and',
        args: [
          collectionsFilter,
          temporalFilter,
        ],
      },
    };

    const mosaicResponse = await axios
      .post(`${BASE_URL}/mosaic/register`, searchBody)
      .then((res) => res.data);

    const tilesHref = mosaicResponse.links.find(
      (link) => link.rel === 'tilejson',
    ).href;

    const params = {
      post_process: 'swir',
      assets: bandCombo,
      expression,
    };

    const queryString = qs.stringify(params, { arrayFormat: 'repeat' });

    const tilejsonResponse = await axios
      .get(tilesHref, {
        params: new URLSearchParams(queryString),
      })
      .then((res) => res.data);

    const { name } = tilejsonResponse;

    return name;
  };

  const createTtilerLayer = async (def, options, day, state) => {
    const { proj: { selected }, date } = state;
    const { maxExtent, crs } = selected;
    const { r, g, b } = def.bandCombo;
    const source = config.sources[def.source];

    const searchID = await registerSearch(def, options, state);

    const tileUrlFunction = (tileCoord) => {
      const z = tileCoord[0] - 1;
      const x = tileCoord[1];
      const y = tileCoord[2];

      const assets = [r, g, b, ...def.bandCombo.assets || []].filter((b) => b);

      const params = assets.map((asset) => `assets=${asset}`);
      params.push(`expression=${encodeURIComponent(def?.bandCombo?.expression)}`);
      params.push(`rescale=${encodeURIComponent(def?.bandCombo?.rescale)}`);
      params.push(`colormap_name=${def?.bandCombo?.colormap_name}`);
      params.push(`asset_as_band=${def?.bandCombo?.asset_as_band}`);

      const urlParams = `mosaic/tiles/${searchID}/WGS1984Quad/${z}/${x}/${y}@1x?post_process=swir&${params.filter((p) => !p.split('=').includes('undefined')).join('&')}`;

      return source.url + urlParams;
    };

    const xyzSourceOptions = {
      crossOrigin: 'anonymous',
      projection: get(crs),
      tileUrlFunction,
    };

    const xyzSource = new OlSourceXYZ(xyzSourceOptions);

    const requestDate = util.toISOStringSeconds(util.roundTimeOneMinute(date.selected)).slice(0, 10);
    const className = `${def.id} ${requestDate}`;

    const layer = new OlLayerTile({
      source: xyzSource,
      className,
      minZoom: 7,
      extent: maxExtent,
    });

    return layer;
  };

  /**
   * Create a new OpenLayers Layer
   * @param {object} def
   * @param {object} key
   * @param {object} options
   * @param {object} dateOptions
   * @param {object} granuleAttributes
   * @returns {object} Openlayers TileLayer or LayerGroup
   */
  const createLayerWrapper = async (def, key, options, dateOptions) => {
    const state = store.getState();
    const { sidebar: { activeTab } } = state;
    const proj = state.proj.selected;
    const {
      breakPointLayer,
      id,
      opacity,
      period,
      projections,
      type,
      wrapadjacentdays,
      wrapX,
    } = def;
    const { nextDate, previousDate } = dateOptions;
    let { date } = dateOptions;
    let layer = cache.getItem(key);
    const isGranule = type === 'granule';

    if (!layer || isGranule || def.type === 'ttiler') {
      if (!date) date = options.date || getSelectedDate(state);
      const cacheOptions = getCacheOptions(period, date);
      const attributes = {
        id,
        key,
        date,
        proj: proj.id,
        def,
        group: options.group,
        nextDate,
        previousDate,
      };
      def = lodashCloneDeep(def);
      lodashMerge(def, projections[proj.id]);
      if (breakPointLayer) def = mergeBreakpointLayerAttributes(def, proj.id);
      const isDataDownloadTabActive = activeTab === 'download';
      const wrapDefined = wrapadjacentdays === true || wrapX;
      const wrapLayer = proj.id === 'geographic' && !isDataDownloadTabActive && wrapDefined;

      if (!isGranule) {
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
          case 'ttiler':
            layer = await getLayer(createTtilerLayer, def, options, attributes, wrapLayer);
            break;
          default:
            throw new Error(`Unknown layer type: ${type}`);
        }
        layer.wv = attributes;
        cache.setItem(key, layer, cacheOptions);
        if (def.type !== 'ttiler') layer.setVisible(false);
      } else {
        layer = await getGranuleLayer(def, attributes, options);
      }
    }
    layer.setOpacity(opacity || 1.0);
    if (breakPointLayer) {
      layer.getLayersArray().forEach((l) => {
        l.setOpacity(opacity || 1.0);
      });
    }
    return layer;
  };

  return {
    layerKey,
    createLayer,
    createLayerWMTS,
  };
}
