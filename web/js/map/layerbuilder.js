/* eslint-disable import/no-duplicates */
/* eslint-disable no-multi-assign */
import OlTileGridWMTS from 'ol/tilegrid/WMTS';
import OlSourceWMTS from 'ol/source/WMTS';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceXYZ from 'ol/source/XYZ';
import OlLayerGroup from 'ol/layer/Group';
import OlLayerTile from 'ol/layer/Tile';
import { get } from 'ol/proj';
import OlTileGridTileGrid from 'ol/tilegrid/TileGrid';
import MVT from 'ol/format/MVT';
import GeoJSON from 'ol/format/GeoJSON';
import axios from 'axios';
import qs from 'qs';
import SourceVectorTile from 'ol/source/VectorTile';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import LayerVectorTile from 'ol/layer/VectorTile';
import {
  Circle, Fill, Stroke, Style,
} from 'ol/style';
import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import lodashMerge from 'lodash/merge';
import lodashEach from 'lodash/each';
import lodashGet from 'lodash/get';
import lodashCloneDeep from 'lodash/cloneDeep';
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

const componentToHex = (c) => {
  const hex = c.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
};

export default function mapLayerBuilder(config, cache, store) {
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

  /**
   *
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
    if (date && !options.date) {
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
    */
  const createLayerVectorAeronet = function(def, options, day, state, attributes) {
    const { proj, animation } = state;
    let date;
    let gridExtent;
    let layerExtent;
    const selectedProj = proj.selected;
    const source = config.sources[def.source];
    const animationIsPlaying = animation.isPlaying;
    const isSubdaily = def.period === 'subdaily';
    gridExtent = selectedProj.maxExtent;
    layerExtent = gridExtent;

    if (!source) {
      throw new Error(`${def.id}: Invalid source: ${def.source}`);
    }

    if (day) {
      if (day === 1) {
        layerExtent = LEFT_WING_EXTENT;
        gridExtent = [110, -90, 180, 90];
      } else {
        gridExtent = [-180, -90, -110, 90];
        layerExtent = RIGHT_WING_EXTENT;
      }
    }

    date = getSelectedDate(state);

    if (isSubdaily && !date) {
      date = getRequestDates(def, options).closestDate;
      date = new Date(date.getTime());
    }
    if (day && def.wrapadjacentdays) date = util.dateAdd(date, 'day', day);
    const breakPointLayerDef = def.breakPointLayer;
    const breakPointResolution = lodashGet(def, `breakPointLayer.projections.${proj.id}.resolutionBreakPoint`);

    const vectorSource = new OlSourceVector({
      format: new GeoJSON(),
      loader: async () => {
        const getAllData = async () => {
          const url = `https://aeronet.gsfc.nasa.gov/Site_Lists_V3/aeronet_locations_v3_${date.getFullYear()}_lev15.txt`;
          const res = await fetch(url);
          const data = await res.text();
          return data;
        };

        const getActiveData = async () => {
          const avg = def.id.includes('DAILY') ? 20 : 10;
          const date2 = new Date(date.toString());
          date2.setHours(date.getHours() + 1);
          const urlParameters = `?year=${date.getUTCFullYear()}&month=${date.getUTCMonth() + 1}&day=${date.getUTCDate()}&year2=${date2.getUTCFullYear()}&month2=${date2.getUTCMonth() + 1}&day2=${date2.getUTCDate()}${isSubdaily ? `&hour=${date.getUTCHours()}&hour2=${date2.getUTCHours()}` : ''}&AOD15=1&AVG=${avg}&if_no_html=1`;
          const res = await fetch(source.url + urlParameters);
          const data = await res.text();
          return data;
        };

        const allData = await getAllData();
        const activeData = await getActiveData();

        const featuresObj = [];
        const takenNamesActive = {};
        const splitActive = activeData.split('\n');
        if (splitActive.length > 6) {
          const key = splitActive[5].split(',');
          for (let i = 6; i < splitActive.length; i += 1) {
            const split2 = splitActive[i].split(',');
            const rowObj = {};
            for (let j = 0; j < split2.length; j += 1) {
              rowObj[key[j]] = split2[j];
            }
            if (!!rowObj.AERONET_Site_Name && rowObj.AERONET_Site_Name !== '' && !takenNamesActive[rowObj.AERONET_Site_Name]) {
              featuresObj[rowObj.AERONET_Site_Name] = {};
              featuresObj[rowObj.AERONET_Site_Name].type = 'Feature';
              featuresObj[rowObj.AERONET_Site_Name].geometry = { type: 'Point' };
              featuresObj[rowObj.AERONET_Site_Name].geometry.coordinates = [parseFloat(rowObj['Site_Longitude(Degrees)']), parseFloat(rowObj['Site_Latitude(Degrees)'])];
              featuresObj[rowObj.AERONET_Site_Name].properties = {
                name: rowObj.AERONET_Site_Name,
                value: def.id.includes('ANGSTROM') ? rowObj['440-870_Angstrom_Exponent'] : rowObj.AOD_500nm,
                date: new Date(Date.UTC(rowObj['Date(dd:mm:yyyy)'].split(':')[2], rowObj['Date(dd:mm:yyyy)'].split(':')[1] - 1, rowObj['Date(dd:mm:yyyy)'].split(':')[0], rowObj['Time(hh:mm:ss)'].split(':')[0], rowObj['Time(hh:mm:ss)'].split(':')[1], rowObj['Time(hh:mm:ss)'].split(':')[2])),
              };
              if (featuresObj[rowObj.AERONET_Site_Name].properties.value < 0) {
                delete featuresObj[rowObj.AERONET_Site_Name];
              } else {
                takenNamesActive[rowObj.AERONET_Site_Name] = true;
              }
            }
          }
        }

        const takenNamesAll = {};
        const splitAll = allData.split('\n');
        if (splitAll.length > 2) {
          const key = splitAll[1].split(',');
          for (let i = 2; i < splitAll.length; i += 1) {
            const split2 = splitAll[i].split(',');
            const rowObj = {};
            for (let j = 0; j < split2.length; j += 1) {
              rowObj[key[j]] = split2[j];
            }
            if (!!rowObj.Site_Name && rowObj.Site_Name !== '' && !takenNamesAll[rowObj.Site_Name]) {
              if (!featuresObj[rowObj.Site_Name]) {
                featuresObj[rowObj.Site_Name] = {};
              }
              featuresObj[rowObj.Site_Name].type = 'Feature';
              featuresObj[rowObj.Site_Name].geometry = { type: 'Point' };
              featuresObj[rowObj.Site_Name].geometry.coordinates = [parseFloat(rowObj['Longitude(decimal_degrees)']), parseFloat(rowObj['Latitude(decimal_degrees)'])];
              featuresObj[rowObj.Site_Name].properties = {
                ...featuresObj[rowObj.Site_Name].properties,
                name: rowObj.Site_Name,
                active: !!takenNamesActive[rowObj.Site_Name],
                coordinates: [parseFloat(rowObj['Longitude(decimal_degrees)']), parseFloat(rowObj['Latitude(decimal_degrees)'])],
                MAIN_USE: featuresObj[rowObj.Site_Name].properties ? featuresObj[rowObj.Site_Name].properties.value : 'inactivesite',
                date: featuresObj[rowObj.Site_Name].properties ? featuresObj[rowObj.Site_Name].properties.date : new Date(date.toUTCString()),
              };
              takenNamesAll[rowObj.Site_Name] = true;
            }
          }
        }

        const geoJson = {
          type: 'FeatureCollection',
          features: Object.values(featuresObj).sort((a, b) => a.properties.active > b.properties.active),
        };
        const formattedFeatures = vectorSource.getFormat().readFeatures(geoJson);
        vectorSource.addFeatures(formattedFeatures);
      },
    });

    const requestDate = util.toISOStringSeconds(util.roundTimeOneMinute(date)).slice(0, 10);
    const className = `${def.id} ${requestDate}`;

    const layer = new OlLayerVector({
      extent: layerExtent,
      className,
      source: vectorSource,
      // Use a style function to dynamically style the points based on features
      style (feature, resolution) {
        const customStyle = !def.custom || typeof def.custom[0] === 'undefined' ? 'default' : def.custom[0];
        // Access the properties of the feature
        const featureProperties = feature.getProperties();
        // Extract the feature name
        const { active, value } = featureProperties;
        // Define styles based on the feature properties
        const radius = 7;
        let fillColor;
        const strokeColor = 'white';
        let colors = [];
        if (isPaletteActive(def.id, options.group, state)) {
          const lookup = getPaletteLookup(def.id, options.group, state);
          colors = Object.values(lookup).map((rgbaObj) => `${componentToHex(rgbaObj.r)}${componentToHex(rgbaObj.g)}${componentToHex(rgbaObj.b)}ff`);
        } else if (customStyle !== 'default') {
          colors = state.palettes.custom[customStyle].colors;
        } else {
          colors = [
            'fffdcdff',
            'fffcc7ff',
            'fffbc1ff',
            'fffabcff',
            'fff9b7ff',
            'fff8b2ff',
            'fff7adff',
            'fff6a7ff',
            'fff5a2ff',
            'fff49dff',
            'fff398ff',
            'fff293ff',
            'fff090ff',
            'ffef8dff',
            'ffee8aff',
            'ffec87ff',
            'ffeb84ff',
            'ffea81ff',
            'ffe87eff',
            'ffe77bff',
            'ffe678ff',
            'ffe576ff',
            'ffe373ff',
            'ffe271ff',
            'ffe16eff',
            'ffdf6cff',
            'ffde6aff',
            'ffdd67ff',
            'ffdb65ff',
            'ffda62ff',
            'ffd960ff',
            'ffd85eff',
            'ffd65bff',
            'ffd459ff',
            'ffd257ff',
            'ffd055ff',
            'ffcf53ff',
            'ffcd50ff',
            'ffcb4eff',
            'ffc94cff',
            'ffc74aff',
            'ffc648ff',
            'ffc346ff',
            'ffc144ff',
            'ffbe42ff',
            'ffbc40ff',
            'ffb93eff',
            'ffb73cff',
            'ffb43aff',
            'ffb238ff',
            'ffaf36ff',
            'ffad35ff',
            'ffaa33ff',
            'ffa832ff',
            'ffa531ff',
            'ffa32fff',
            'ffa12eff',
            'ff9e2dff',
            'ff9c2bff',
            'ff992aff',
            'ff9729ff',
            'ff9528ff',
            'ff9227ff',
            'ff9026ff',
            'ff8e25ff',
            'ff8c25ff',
            'ff8a24ff',
            'ff8723ff',
            'ff8523ff',
            'ff8322ff',
            'ff8121ff',
            'ff7f21ff',
            'ff7c20ff',
            'ff791fff',
            'ff761fff',
            'ff731eff',
            'ff701eff',
            'ff6d1dff',
            'ff6a1cff',
            'ff671cff',
            'ff641bff',
            'ff621bff',
            'ff5e1aff',
            'ff5b19ff',
            'ff5818ff',
            'ff5518ff',
            'ff5217ff',
            'ff4e16ff',
            'ff4b16ff',
            'ff4815ff',
            'ff4514ff',
            'ff4214ff',
            'fe3f13ff',
            'fd3c13ff',
            'fc3a12ff',
            'fb3712ff',
            'fa3512ff',
            'f93211ff',
            'f82f11ff',
            'f72d10ff',
            'f62a10ff',
            'f52810ff',
            'f3260fff',
            'f2240fff',
            'f0220eff',
            'ef200eff',
            'ee1e0dff',
            'ec1c0dff',
            'eb1a0cff',
            'e9180cff',
            'e8160bff',
            'e7140bff',
            'e5120bff',
            'e3110bff',
            'e1100bff',
            'df0e0bff',
            'dd0d0bff',
            'db0c0bff',
            'd90a0bff',
            'd7090bff',
            'd5080bff',
            'd3070cff',
            'd0060cff',
            'ce050cff',
            'cc040cff',
            'c9040cff',
            'c7030dff',
            'c5020dff',
            'c2020dff',
            'c0010dff',
            'be000dff',
            'bc000eff',
            'b8000eff',
            'b5000eff',
            'b2000eff',
            'ae000eff',
            'ab000eff',
            'a8000eff',
            'a4000eff',
            'a1000eff',
            '9e000eff',
            '9b000eff',
            '98000eff',
            '95000eff',
            '92000eff',
            '8f000eff',
            '8c000eff',
            '89000eff',
            '86000eff',
            '83000eff',
            '80000eff',
            '7d000eff',
          ];
        }
        const values = [
          [-1, 0],
          [0, 0.005],
          [0.005, 0.01],
          [0.01, 0.015],
          [0.015, 0.02],
          [0.02, 0.025],
          [0.025, 0.03],
          [0.03, 0.035],
          [0.035, 0.04],
          [0.04, 0.045],
          [0.045, 0.05],
          [0.05, 0.055],
          [0.055, 0.06],
          [0.06, 0.065],
          [0.065, 0.07],
          [0.07, 0.075],
          [0.075, 0.08],
          [0.08, 0.085],
          [0.085, 0.09],
          [0.09, 0.095],
          [0.095, 0.1],
          [0.1, 0.105],
          [0.105, 0.11],
          [0.11, 0.115],
          [0.115, 0.12],
          [0.12, 0.125],
          [0.125, 0.13],
          [0.13, 0.135],
          [0.135, 0.14],
          [0.14, 0.145],
          [0.145, 0.15],
          [0.15, 0.155],
          [0.155, 0.16],
          [0.16, 0.165],
          [0.165, 0.17],
          [0.17, 0.175],
          [0.175, 0.18],
          [0.18, 0.185],
          [0.185, 0.19],
          [0.19, 0.195],
          [0.195, 0.2],
          [0.2, 0.205],
          [0.205, 0.21],
          [0.21, 0.215],
          [0.215, 0.22],
          [0.22, 0.225],
          [0.225, 0.23],
          [0.23, 0.235],
          [0.235, 0.24],
          [0.24, 0.245],
          [0.245, 0.25],
          [0.25, 0.255],
          [0.255, 0.26],
          [0.26, 0.265],
          [0.265, 0.27],
          [0.27, 0.275],
          [0.275, 0.28],
          [0.28, 0.285],
          [0.285, 0.29],
          [0.29, 0.295],
          [0.295, 0.3],
          [0.3, 0.305],
          [0.305, 0.31],
          [0.31, 0.315],
          [0.315, 0.32],
          [0.32, 0.325],
          [0.325, 0.33],
          [0.33, 0.335],
          [0.335, 0.34],
          [0.34, 0.345],
          [0.345, 0.35],
          [0.35, 0.355],
          [0.355, 0.36],
          [0.36, 0.365],
          [0.365, 0.37],
          [0.37, 0.375],
          [0.375, 0.38],
          [0.38, 0.385],
          [0.385, 0.39],
          [0.39, 0.395],
          [0.395, 0.4],
          [0.4, 0.405],
          [0.405, 0.41],
          [0.41, 0.415],
          [0.415, 0.42],
          [0.42, 0.425],
          [0.425, 0.43],
          [0.43, 0.435],
          [0.435, 0.44],
          [0.44, 0.445],
          [0.445, 0.45],
          [0.45, 0.455],
          [0.455, 0.46],
          [0.46, 0.465],
          [0.465, 0.47],
          [0.47, 0.475],
          [0.475, 0.48],
          [0.48, 0.485],
          [0.485, 0.49],
          [0.49, 0.495],
          [0.495, 0.5],
          [0.5, 0.505],
          [0.505, 0.51],
          [0.51, 0.515],
          [0.515, 0.52],
          [0.52, 0.525],
          [0.525, 0.53],
          [0.53, 0.535],
          [0.535, 0.54],
          [0.54, 0.545],
          [0.545, 0.55],
          [0.55, 0.555],
          [0.555, 0.56],
          [0.56, 0.565],
          [0.565, 0.57],
          [0.57, 0.575],
          [0.575, 0.58],
          [0.58, 0.585],
          [0.585, 0.59],
          [0.59, 0.595],
          [0.595, 0.6],
          [0.6, 0.605],
          [0.605, 0.61],
          [0.61, 0.615],
          [0.615, 0.62],
          [0.62, 0.625],
          [0.625, 0.63],
          [0.63, 0.635],
          [0.635, 0.64],
          [0.64, 0.645],
          [0.645, 0.65],
          [0.65, 0.655],
          [0.655, 0.66],
          [0.66, 0.665],
          [0.665, 0.67],
          [0.67, 0.675],
          [0.675, 0.68],
          [0.68, 0.685],
          [0.685, 0.69],
          [0.69, 0.695],
          [0.695, 0.7],
          [0.7, 1.13],
          [1.13, 1.56],
          [1.56, 1.99],
          [1.99, 2.42],
          [2.42, 2.85],
          [2.85, 3.28],
          [3.28, 3.71],
          [3.71, 4.14],
          [4.14, 4.57],
          [4.57, 5],
          [5],
        ];

        let valueIndex;
        if (active) {
          valueIndex = values.findIndex((range) => value >= range[0] && (range.length < 2 || value < range[1]));
          fillColor = `#${colors[valueIndex]}`;
          fillColor = fillColor.substring(0, fillColor.length - 2);
        } else {
          if (def.disabled) {
            return null;
          }
          valueIndex = -1;
          fillColor = '#808080';
        }
        if (fillColor === '#000000'
          || (def.min && Array.isArray(def.min) && def.min[0] > parseFloat(value))
          || (def.max && Array.isArray(def.max) && def.max[0] < parseFloat(value))
          || (def.min && !Array.isArray(def.min) && def.min > valueIndex)
          || (def.max && !Array.isArray(def.max) && def.max < valueIndex)) {
          return null;
        }
        // Return the style for the current feature
        return new Style({
          image: new Circle({
            radius,
            fill: new Fill({
              color: fillColor,
            }),
            stroke: new Stroke({
              color: strokeColor,
            }),
          }),
        });
      },
    });

    layer.vectorData = {
      id: def.id,
    };

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
    }

    if (breakPointResolution && animationIsPlaying) {
      delete breakPointLayerDef.projections[proj.id].resolutionBreakPoint;
      const newDef = { ...def, ...breakPointLayerDef };
      const wmsLayer = createLayerWMS(newDef, options, day, state);
      wmsLayer.wv = attributes;
      return wmsLayer;
    }

    return layer;
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
    if (def.source === 'AERONET') {
      return createLayerVectorAeronet(def, options, day, state, attributes);
    }
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
        layerExtent = LEFT_WING_EXTENT;
        start = CENTER_MAP_ORIGIN;
        gridExtent = [110, -90, 180, 90];
      } else {
        gridExtent = [-180, -90, -110, 90];
        layerExtent = RIGHT_WING_EXTENT;
        start = CENTER_MAP_ORIGIN;
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

    const layer = new LayerVectorTile({
      extent: layerExtent,
      source: tileSource,
      renderMode: 'vector',
      preload: 0,
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
    }

    if (breakPointResolution && animationIsPlaying) {
      delete breakPointLayerDef.projections[proj.id].resolutionBreakPoint;
      const newDef = { ...def, ...breakPointLayerDef };
      const wmsLayer = createLayerWMS(newDef, options, day, state);
      wmsLayer.wv = attributes;
      return wmsLayer;
    }

    return layer;
  };

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
      minZoom: def.minZoom,
      extent: maxExtent,
    });

    return layer;
  };

  const createXYZLayer = (def, options, day, state) => {
    const { proj: { selected }, date } = state;
    const { maxExtent, crs } = selected;

    const source = config.sources[def.source];

    const tileUrlFunction = (tileCoord) => {
      const z = tileCoord[0] - 1;
      const x = tileCoord[1];
      const y = tileCoord[2];

      const urlParams = `${def.layerName}/${z}/${y}/${x}`;

      return `${source?.url}/${urlParams}.png`;
    };

    const xyzSourceOptions = {
      crossOrigin: 'anonymous',
      projection: get(crs),
      tileUrlFunction,
      maxZoom: def.maxZoom,
    };

    const xyzSource = new OlSourceXYZ(xyzSourceOptions);

    const requestDate = util.toISOStringSeconds(util.roundTimeOneMinute(date.selected)).slice(0, 10);
    const className = `${def.id} ${requestDate}`;

    const layer = new OlLayerTile({
      source: xyzSource,
      className,
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
            layer = await getLayer(createLayerVector, def, options, attributes, wrapLayer);
            break;
          case 'wms':
            layer = getLayer(createLayerWMS, def, options, attributes, wrapLayer);
            break;
          case 'ttiler':
            layer = await getLayer(createTtilerLayer, def, options, attributes, wrapLayer);
            break;
          case 'xyz':
            layer = getLayer(createXYZLayer, def, options, attributes, wrapLayer);
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
